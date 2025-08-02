from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator


class Semester(models.Model):
    semester = models.PositiveIntegerField(unique=True)
    subject = models.CharField(max_length=50)

class Program(models.Model):
    name = models.CharField(max_length=50, unique=True)
    duration_years = models.PositiveIntegerField()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Program"
        verbose_name_plural = "Programs"

class Section(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name="sections")
    name = models.CharField(max_length=10)
    year = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.program} - Year {self.year} - {self.name}"

    class Meta:
        unique_together = ('program', 'year', 'name')
        verbose_name = "Section"
        verbose_name_plural = "Sections"

class Subject(models.Model):
    name = models.CharField(max_length=100 , unique=True,null= False , blank=False )
    is_law_subject = models.BooleanField(default=True , blank=False)
    semester = models.PositiveIntegerField()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Subject"
        verbose_name_plural = "Subjects"

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    is_admin = models.BooleanField(default = False)
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    class Meta:
        verbose_name = "Teacher"
        verbose_name_plural = "Teachers"

class Student(models.Model):
    # id = models.PositiveIntegerField(primary_key=True)
    roll_number = models.CharField(max_length=20, unique=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=50,null=True, blank=True)
    email = models.EmailField(null=True, blank=True, unique=False)
    phone = models.CharField(max_length = 15,null=True, blank=True, unique=False)
    semester = models.PositiveIntegerField(null= False)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="students")
    subjects = models.ManyToManyField(Subject, related_name="students", blank=True)
    def __str__(self):
        return f"{self.roll_number} - {self.first_name} {self.last_name}"
    class Meta:
        verbose_name = "Student"
        verbose_name_plural = "Students"
        indexes = [
            models.Index(fields=['roll_number']),
            models.Index(fields=['first_name', 'last_name']),
        ]
        ordering = ['roll_number']

class LectureSlot(models.Model):
    start_time = models.TimeField()
    end_time = models.TimeField()

    def clean(self):
        if self.end_time <= self.start_time:
            raise ValidationError("End time must be after start time")

    def __str__(self):
        return f"{self.start_time.strftime('%I:%M %p')} - {self.end_time.strftime('%I:%M %p')}"

    class Meta:
        verbose_name = "Lecture Slot"
        verbose_name_plural = "Lecture Slots"
        ordering = ['start_time']

class Timetable(models.Model):
    DAY_CHOICES = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', "Sunday")
    ]
    # LECTURE_SLOTS = [
    # ('08:30:00', '08:30 AM - 09:30 AM'),
    # ('09:30:00', '09:30 AM - 10:30 AM'),
    # ('10:30:00', '10:30 AM - 11:30 AM'),
    # ('12:00:00', '12:00 PM - 01:00 PM'),
    # ('01:00:00', '01:00 PM - 02:00 PM'),
    # ]
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name="timetable")
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name="timetable")
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True, related_name="timetable")
    day_of_week = models.CharField(max_length=9, choices=DAY_CHOICES)
    # start_time = models.TimeField(choices=LECTURE_SLOTS)
    start_time = models.ForeignKey(LectureSlot, on_delete=models.PROTECT, related_name="timetables")
    semester_start_date = models.DateField()
    semester_end_date = models.DateField()
    def __str__(self):
        return f"{self.section} - {self.subject} ({self.day_of_week} {self.start_time})"
    class Meta:
        unique_together = ('section', 'subject', 'day_of_week', 'start_time')
        verbose_name = "Timetable"
        verbose_name_plural = "Timetables"

class Session(models.Model):
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    timetable = models.ForeignKey(Timetable, on_delete=models.CASCADE, related_name="sessions")
    date = models.DateField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Scheduled')

    def __str__(self):
        return f"{self.timetable} on {self.date} ({self.status})"

    class Meta:
        unique_together = ('timetable', 'date')
        verbose_name = "Session"
        verbose_name_plural = "Sessions"

class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="attendance", db_index=True)
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="attendance", db_index=True)
    status = models.BooleanField(default=False, db_index=True)  # False = Absent, True = Present
    timestamp = models.DateTimeField(db_index=True)
    recorded_by = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True,db_index= True ,  related_name="attendance_records")

    def __str__(self):
        return f"{self.student} - {self.session} - {'Present' if self.status else 'Absent'}"

    class Meta:
        unique_together = ('student', 'session')
        verbose_name = "Attendance"
        verbose_name_plural = "Attendance"

class CalendarException(models.Model):
    date = models.DateField(unique=True)
    description = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.date} - {self.description}"

    class Meta:
        verbose_name = "Calendar Exception"
        verbose_name_plural = "Calendar Exceptions"


