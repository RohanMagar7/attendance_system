from rest_framework import serializers
from .models import Teacher,Student, Subject , Program , Timetable , Session, Attendance , Section , CalendarException

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ['id' , 'first_name' , 'last_name' , 'email','phone' , 'is_admin']

class StudentSerializer(serializers.ModelSerializer):
    section = serializers.StringRelatedField()
    subjects = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    class Meta:
        model = Student
        fields = ['id', 'roll_number', 'first_name', 'last_name', 'email', 'phone', 'section', 'subjects', 'semester']

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ['id' , 'name' , 'duration_years']

class SubjectSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only = True)
    class Meta:
        model = Subject
        fields = ['id' , 'name' ,'is_law_subject', 'semester','teacher']

class DailyScheduleSerializer(serializers.Serializer):
    day_of_week = serializers.ChoiceField(choices= Timetable.DAY_CHOICES)
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    start_time = serializers.ChoiceField(choices=Timetable.LECTURE_SLOTS)

class CalendarExceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarException
        fields = ['id','date','description']

class SectionSerializer(serializers.ModelSerializer):
    program = serializers.SlugRelatedField(slug_field='name', read_only=True)
    available_semesters = serializers.SerializerMethodField()
    def get_available_semesters(self, obj):
        program_duration = obj.program.duration_years * 2  # Max semesters
        start_semester = (obj.year - 1) * 2 + 1
        end_semester = min(obj.year * 2, program_duration)
        subjects = Subject.objects.filter(semester__gte=start_semester, semester__lte=end_semester)
        return sorted(set(subject.semester for subject in subjects))
    class Meta:
        model = Section
        fields = ['id', 'name', 'year', 'program', 'available_semesters']

class TimetableSerializer(serializers.ModelSerializer):
    section = SectionSerializer()
    subject = SubjectSerializer()
    teacher = TeacherSerializer()
    semester = serializers.IntegerField(source='subject.semester', read_only=True)
    class Meta:
        model = Timetable
        fields = ['id', 'section', 'teacher', 'subject', 'semester', 'day_of_week', 'start_time', 'semester_start_date', 'semester_end_date']

class SessionSerializer(serializers.ModelSerializer):
    timetable = TimetableSerializer(read_only=True)
    class Meta:
        model = Session
        fields = ['id','timetable','date','status']

# class AttendanceSerializer(serializers.ModelSerializer):
#     student = StudentSerializer(read_only=True)
#     session = SessionSerializer(read_only=True)
#     recorded_by = TeacherSerializer(read_only=True)

#     # Add a custom status field to override the boolean
#     status = serializers.SerializerMethodField()

#     class Meta:
#         model = Attendance
#         fields = ['id', 'student', 'session', 'status', 'timestamp', 'recorded_by']
#         read_only_fields = ['timestamp', 'recorded_by']

#     def get_status(self, obj):
#         return "Present" if obj.status else "Absent"

#     def to_internal_value(self, data):
#         internal = super().to_internal_value(data)

#         # map incoming status string to boolean
#         status = data.get('status')
#         if status == "Present":
#             internal['status'] = True
#         elif status == "Absent":
#             internal['status'] = False
#         else:
#             raise serializers.ValidationError({
#                 'status': 'Status must be either "Present" or "Absent".'
#             })

#         return internal

class AttendanceSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    session = SessionSerializer(read_only=True)
    recorded_by = TeacherSerializer(read_only=True)
    status = serializers.SerializerMethodField()
    class Meta:
        model = Attendance
        fields = ['id', 'student', 'session', 'status', 'timestamp', 'recorded_by']
        read_only_fields = ['timestamp', 'recorded_by']
    def get_status(self, obj):
        return "Present" if obj.status else "Absent"
    def to_internal_value(self, data):
        internal = super().to_internal_value(data)
        status = data.get('status')
        if status == "Present":
            internal['status'] = True
        elif status == "Absent":
            internal['status'] = False
        else:
            raise serializers.ValidationError({'status': 'Status must be either "Present" or "Absent".'})
        return internal

class AttendanceSummarySerializer(serializers.Serializer):
    subject_id = serializers.IntegerField(source='session__timetable__subject__id')
    subject_name = serializers.CharField(source='session__timetable__subject__name')
    classes_attended = serializers.IntegerField()
    total_classes = serializers.IntegerField()
    class Meta:
        fields = ['subject_id', 'subject_name', 'classes_attended', 'total_classes']

class StudentDetailSerializer(serializers.ModelSerializer):
    section_name = serializers.CharField(source='section.name')
    year = serializers.IntegerField(source='section.year')
    program_name = serializers.CharField(source='section.program.name')
    attendance = AttendanceSerializer(many=True, read_only=True)
    class Meta:
        model = Student
        fields = ['id', 'roll_number', 'first_name', 'last_name', 'email', 'phone', 'section_id', 'section_name', 'year', 'semester', 'program_name', 'attendance']

class TimetableCreateSerializer(serializers.Serializer):
    section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all())
    teacher = serializers.PrimaryKeyRelatedField(queryset=Teacher.objects.all())
    semester = serializers.IntegerField()
    daily_schedules = serializers.ListField(child=serializers.DictField(child=serializers.CharField()))
    semester_start_date = serializers.DateField()
    semester_end_date = serializers.DateField()
    def validate_daily_schedules(self, value):
        LECTURE_SLOTS = Timetable.LECTURE_SLOTS
        for schedule in value:
            required_fields = ['day_of_week', 'subject', 'start_time']
            if not all(field in schedule for field in required_fields):
                raise serializers.ValidationError(f"Each schedule must include {required_fields}")
            if schedule['day_of_week'] not in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
                raise serializers.ValidationError("Invalid day of week")
            if schedule['start_time'] not in [slot[0] for slot in LECTURE_SLOTS]:
                raise serializers.ValidationError(f"Start time must be one of {[slot[0] for slot in LECTURE_SLOTS]}")
        return value

    def validate(self, data):
        section = data['section']
        semester = data['semester']
        program_duration = section.program.duration_years * 2
        start_semester = (section.year - 1) * 2 + 1
        end_semester = min(section.year * 2, program_duration)

        if semester < start_semester or semester > end_semester:
            raise serializers.ValidationError(f"Semester {semester} is not valid for {section} (valid range: {start_semester}-{end_semester})")

        for schedule in data['daily_schedules']:
            subject = Subject.objects.get(id=schedule['subject'])
            if subject.semester != semester:
                raise serializers.ValidationError(f"Subject {subject.name} (Semester {subject.semester}) does not match selected semester {semester}")
        return data

class SingleSessionTimetableSerializer(serializers.Serializer):
    section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all())
    subject = serializers.PrimaryKeyRelatedField(queryset=Subject.objects.all())
    day_of_week = serializers.ChoiceField(choices=Timetable.DAY_CHOICES)
    start_time = serializers.ChoiceField(choices=Timetable.LECTURE_SLOTS)
    session_date = serializers.DateField()

class AdminTeacherSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only = True ,
    required = False ,
    allow_blank = True , # allow empty string,
    default = None)
    class Meta:
        model = Teacher
        fields = ['id','first_name' , 'last_name','email' ,'phone' , 'is_admin', 'password']
        read_only_fields = ['id']

class AdminSectionSerializer(serializers.ModelSerializer):
    program = ProgramSerializer()
    class Meta:
        model = Section
        fields = ['id','program','name','year']

class AdminStudentSerializer(serializers.ModelSerializer):
    section = AdminSectionSerializer()
    subjects = SubjectSerializer(many = True , read_only = True )
    print(section)
    class Meta:
        model = Student
        fields = ['id', 'roll_number', 'first_name', 'last_name', 'email', 'phone', 'section','semester', 'subjects']
        read_only_fields = ['id', 'subjects']
        extra_kwargs = {'roll_number' : {'required' : False , 'allow_blank' : True , 'default' : ''}}



# class AdminTimetableSerializer(serializers.ModelSerializer):
#     section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all())
#     teacher = serializers.PrimaryKeyRelatedField(queryset=Teacher.objects.all())
#     semester = serializers.IntegerField(write_only=True)
#     daily_schedules = DailyScheduleSerializer(many=True, write_only=True)  # Write-only
#     semester_start_date = serializers.DateField()
#     semester_end_date = serializers.DateField()
#     class Meta:
#         model = Timetable
#         fields = ['id', 'section', 'teacher', 'semester', 'daily_schedules', 'semester_start_date', 'semester_end_date']
#     def validate(self, data):
#         section = data['section']
#         semester = data['semester']
#         program_duration = section.program.duration_years * 2
#         start_semester = (section.year - 1) * 2 + 1
#         end_semester = min(section.year * 2, program_duration)
#         if semester < start_semester or semester > end_semester:
#             raise serializers.ValidationError(f"Semester {semester} is not valid for {section} (valid range: {start_semester}-{end_semester})")
#         for schedule in data['daily_schedules']:
#             subject = schedule['subject']
#             if subject.semester != semester:
#                 raise serializers.ValidationError(f"Subject {subject.name} (Semester {subject.semester}) does not match selected semester {semester}")
#         return data

#     def update(self, instance, validated_data):
#         section = validated_data.get('section', instance.section)
#         teacher = validated_data.get('teacher', instance.teacher)
#         semester_start_date = validated_data.get('semester_start_date', instance.semester_start_date)
#         semester_end_date = validated_data.get('semester_end_date', instance.semester_end_date)
#         Timetable.objects.filter(section=section, teacher=teacher, semester_start_date=semester_start_date,
#                                  semester_end_date=semester_end_date).delete()
#         daily_schedules = validated_data.get('daily_schedules', [])
#         created_timetables = []
#         for schedule in daily_schedules:
#             timetable = Timetable.objects.create(section=section, teacher=teacher, subject=schedule['subject'],
#                 day_of_week=schedule['day_of_week'], start_time=schedule['start_time'],
#                 semester_start_date=semester_start_date, semester_end_date=semester_end_date)
#             created_timetables.append(timetable)
#         self.context['created_timetables'] = created_timetables
#         return created_timetables[0] if created_timetables else instance

class AdminTimetableSerializer(serializers.ModelSerializer):
    section = serializers.PrimaryKeyRelatedField(queryset=Section.objects.all())
    teacher = serializers.PrimaryKeyRelatedField(queryset=Teacher.objects.all())
    semester = serializers.IntegerField(write_only=True)
    semester_start_date = serializers.DateField()
    semester_end_date = serializers.DateField()

    class Meta:
        model = Timetable
        fields = ['id', 'section', 'teacher', 'semester', 'semester_start_date', 'semester_end_date']

    def validate(self, data):
        section = data.get('section', self.instance.section if self.instance else None)
        semester = data['semester']
        program_duration = section.program.duration_years * 2
        start_semester = (section.year - 1) * 2 + 1
        end_semester = min(section.year * 2, program_duration)

        if semester < start_semester or semester > end_semester:
            raise serializers.ValidationError(
                f"Semester {semester} is not valid for {section} (valid range: {start_semester}-{end_semester})"
            )
        return data

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class AttendanceStatsSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    name = serializers.CharField()
    roll_number = serializers.CharField()
    subject_name = serializers.CharField()
    program = serializers.CharField()
    year = serializers.IntegerField()
    semester = serializers.IntegerField()
    total_sessions = serializers.IntegerField()
    present = serializers.IntegerField()
    absent = serializers.IntegerField()
    attendance_percentage = serializers.FloatField()
    recorded_by_name = serializers.CharField()
