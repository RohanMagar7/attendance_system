//                       ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
//                       █    DEVELOPED BY PRANAV SIRSUFALE   █
//                       ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                     DEVELOPED BY PRANAV SIRSUFALE                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './utilities/Button';
import LogoutButton from './utilities/LogOutButton'

function Calendar(admin, notifyUser) {
  const [sessions, setSessions] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [error, setError] = useState('');
  const [showTimetableForm, setShowTimetableForm] = useState(false);
  const [editTimetableId, setEditTimetableId] = useState(null);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [timetableData, setTimetableData] = useState({
    section: '',
    semester: '',
    daily_schedules: [{ day_of_week: 'Monday', subject: '', start_time: '08:30:00' }],
    semester_start_date: '',
    semester_end_date: '',
  });

  console.log('admin', admin)

  const navigate = useNavigate();

  useEffect(() => {
    fetchSessions();
    fetchTimetables();
    fetchOptions();
  }, [selectedSection]);

  const fetchSessions = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setError('Please log in first'); return; }
    try {
      const url = selectedSection ? `http://localhost:8000/api/calendar/?section_id=${selectedSection}` : 'http://localhost:8000/api/calendar/';
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setSessions(response.data);
      console.log(response)
      setError('');
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Failed to load sessions');
    }
  };

  const fetchTimetables = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setError('Please log in first'); return; }
    try {
      const response = await axios.get('http://localhost:8000/api/timetables/', { headers: { Authorization: `Bearer ${token}` } });
      setTimetables(response.data);
    } catch (err) {
      console.error('Failed to fetch timetables:', err);
      setError('Failed to load timetables');
    }
  };

  const fetchOptions = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setError('Please log in first'); return; }
    try {
      const [sectionsRes, timeSlotsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/sections/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8000/api/time-slots/', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setSections(sectionsRes.data);
      setTimeSlots(timeSlotsRes.data);
      if (timetableData.section && timetableData.semester) {
        fetchSubjects(timetableData.section, timetableData.semester, timetableData.semester_start_date);
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
      setError('Failed to load options: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  const fetchSubjects = async (sectionId, semester, semester_start_date = timetableData.semester_start_date) => {
    const token = localStorage.getItem('access_token');
    try {
      const response = await axios.get('http://localhost:8000/api/subjects-for-section/', {
        params: { section_id: sectionId, semester, semester_start_date },
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      setSubjects(data.filter(subject => subject.semester === parseInt(semester)));
      setError('');
    } catch (err) {
      console.error('Failed to fetch subjects:', err.response?.data || err.message);
      setError('Failed to load subjects: ' + (err.response?.data?.error || 'Unknown error'));
      setSubjects([]);
    }
  };

  const handleSectionSemesterChange = async (e) => {
    const [sectionId, semester] = e.target.value.split('-');
    setTimetableData({ ...timetableData, section: sectionId, semester });
    setSelectedSemester(semester);
    if (sectionId && semester) {
      try {
        const token = localStorage.getItem('access_token');
        const timetableRes = await axios.get(`http://localhost:8000/api/timetables/?section=${sectionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const existingTimetable = timetableRes.data[0];
        const startDate = existingTimetable?.semester_start_date || '2025-03-01';
        const endDate = existingTimetable?.semester_end_date || '2025-08-31';
        setTimetableData(prev => ({
          ...prev,
          section: sectionId,
          semester,
          semester_start_date: startDate,
          semester_end_date: endDate,
        }));
        fetchSubjects(sectionId, semester, startDate);
      } catch (err) {
        console.error('Failed to fetch timetable for section:', err);
        setTimetableData(prev => ({
          ...prev,
          section: sectionId,
          semester,
          semester_start_date: '2025-03-01',
          semester_end_date: '2025-08-31',
        }));
        fetchSubjects(sectionId, semester, '2025-03-01');
      }
    }
  };

  const handleDateChange = (field) => (e) => {
    setTimetableData({ ...timetableData, [field]: e.target.value });
  };

  const handleTimetableSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    try {
      const data = {
        section: timetableData.section,
        semester: parseInt(timetableData.semester),
        daily_schedules: timetableData.daily_schedules,
        semester_start_date: timetableData.semester_start_date || '2025-03-01',
        semester_end_date: timetableData.semester_end_date || '2025-08-31',
      };
      if (editTimetableId) {
        await axios.put(`http://localhost:8000/api/timetables/${editTimetableId}/`, {
          section: data.section,
          subject: data.daily_schedules[0].subject,
          day_of_week: data.daily_schedules[0].day_of_week,
          start_time: data.daily_schedules[0].start_time,
          semester_start_date: data.semester_start_date,
          semester_end_date: data.semester_end_date,
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('http://localhost:8000/api/timetables/', data, { headers: { Authorization: `Bearer ${token}` } });
      }
      setShowTimetableForm(false);
      setEditTimetableId(null);
      setTimetableData({
        section: '',
        semester: '',
        daily_schedules: [{ day_of_week: 'Monday', subject: '', start_time: '08:30:00' }],
        semester_start_date: '',
        semester_end_date: '',
      });
      setSubjects([]);
      fetchSessions();
      fetchTimetables();
      setError('');
    } catch (err) {
      console.error('Failed to save timetable:', err);
      setError(err.response?.data?.detail || 'Failed to save timetable');
    }
  };

  const addSchedule = () => {
    setTimetableData({
      ...timetableData,
      daily_schedules: [...timetableData.daily_schedules, { day_of_week: 'Monday', subject: '', start_time: '08:30:00' }],
    });
  };

  const updateSchedule = (index, field, value) => {
    const newSchedules = [...timetableData.daily_schedules];
    newSchedules[index][field] = value;
    setTimetableData({ ...timetableData, daily_schedules: newSchedules });
  };

  const handleEditTimetable = (timetable) => {
    setEditTimetableId(timetable.id);
    setTimetableData({
      section: timetable.section.id,
      semester: timetable.semester.toString(),
      daily_schedules: [{
        day_of_week: timetable.day_of_week,
        subject: timetable.subject.id,
        start_time: timetable.start_time,
      }],
      semester_start_date: timetable.semester_start_date,
      semester_end_date: timetable.semester_end_date,
    });
    fetchSubjects(timetable.section.id, timetable.semester, timetable.semester_start_date);
    setShowTimetableForm(true);
  };

  const handleDeleteTimetable = async (timetableId) => {
    const token = localStorage.getItem('access_token');
    if (window.confirm('Are you sure you want to delete this timetable?')) {
      try {
        await axios.delete(`http://localhost:8000/api/timetables/${timetableId}/`, { headers: { Authorization: `Bearer ${token}` } });
        fetchTimetables();
        fetchSessions();
        setError('');
      } catch (err) {
        console.error('Failed to delete timetable:', err);
        setError('Failed to delete timetable');
      }
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-100 min-h-screen">
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-extrabold mb-6 text-indigo-800"
      >
        Session Schedules
      </motion.h2>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-red-500 bg-red-100 p-3 rounded-lg mb-4 shadow-md"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6 flex flex-wrap gap-4"
      >



         <Button
        whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditTimetableId(null);
            setTimetableData({
              section: '',
              semester: '',
              daily_schedules: [{ day_of_week: 'Monday', subject: '', start_time: '08:30:00' }],
              semester_start_date: '',
              semester_end_date: '',
            });
            setShowTimetableForm(true);
          }}

        >
          Create TimeTable
        </Button>


        <Link
          to="/attendance-stats"
          // className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200 flex items-center gap-2"
        >

        <Button
          // to="/attendance-stats"

        whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View Statistics
        </Button>
          {/* View Attendance Statistics */}
        </Link>

        <Button
        onClick={() => navigate('/calendar')}
        >
          Calendar
        </Button>



        {/* <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditTimetableId(null);
            setTimetableData({
              section: '',
              semester: '',
              daily_schedules: [{ day_of_week: 'Monday', subject: '', start_time: '08:30:00' }],
              semester_start_date: '',
              semester_end_date: '',
            });
            setShowTimetableForm(true);
          }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-6 rounded-full hover:from-indigo-700 hover:to-purple-700 shadow-lg transition-all duration-200"
        >
          Create Timetable
        </motion.button> */}





      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-semibold mb-4 text-indigo-800"
      >
        Your Timetables
      </motion.h3>

      {timetables.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {timetables.map((timetable) => (
            <motion.div
              key={timetable.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-indigo-100"
              whileHover={{ y: -5 }}
            >
              <h4 className="text-xl font-semibold text-indigo-600 mb-3">{timetable.section.name}</h4>
              <div className="space-y-2 text-gray-600">
                <p><span className="font-medium text-indigo-700">Year:</span> {timetable.section.year}</p>
                <p><span className="font-medium text-indigo-700">Semester:</span> {timetable.semester}</p>
                <p><span className="font-medium text-indigo-700">Program:</span> {timetable.section.program}</p>
                <p><span className="font-medium text-indigo-700">Period:</span> {timetable.semester_start_date} to {timetable.semester_end_date}</p>
                <p><span className="font-medium text-indigo-700">Schedule:</span> {timetable.day_of_week}: {timetable.subject.name} at {timetable.start_time}</p>
              </div>
              <div className="mt-4 flex justify-between gap-3">

                {/* <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEditTimetable(timetable)}
                  className="flex-1 bg-yellow-400 text-white py-2 rounded-full hover:bg-yellow-500 shadow-md transition-colors duration-200"
                >
                  Edit
                </motion.button> */}

                {/* <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteTimetable(timetable.id)}
                  className="flex-1 bg-red-500 text-white py-2 rounded-full hover:bg-red-600 shadow-md transition-colors duration-200"
                >
                  Delete
                </motion.button> */}
                <LogoutButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteTimetable(timetable.id)}>
                  Delete
                  </LogoutButton>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 mb-8 italic"
        >
          No timetables found.
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <label className="block text-lg font-medium text-indigo-800 mb-2">Filter Sessions by Section:</label>
        <motion.select
          whileHover={{ scale: 1.02 }}
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="w-full p-3 border border-indigo-200 rounded-xl bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200"
        >
          <option value="">All Sections</option>
          {sections.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name} (Year: {section.year}, Program: {section.program})
            </option>
          ))}
        </motion.select>
      </motion.div>

      <AnimatePresence>
        {showTimetableForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold mb-6 text-indigo-800">
                {editTimetableId ? 'Edit Timetable' : 'Create Timetable'}
              </h3>
              <form onSubmit={handleTimetableSubmit}>
                <div className="mb-6">
                  <label className="block text-lg font-medium text-indigo-800 mb-2">Semester Period:</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <motion.input
                      whileHover={{ scale: 1.02 }}
                      type="date"
                      value={timetableData.semester_start_date}
                      onChange={handleDateChange('semester_start_date')}
                      className="w-full p-3 border border-indigo-200 rounded-xl text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      required
                    />
                    <span className="text-gray-800 self-center hidden sm:block">to</span>
                    <motion.input
                      whileHover={{ scale: 1.02 }}
                      type="date"
                      value={timetableData.semester_end_date}
                      onChange={handleDateChange('semester_end_date')}
                      className="w-full p-3 border border-indigo-200 rounded-xl text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      required
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-lg font-medium text-indigo-800 mb-2">Section and Semester:</label>
                  <motion.select
                    whileHover={{ scale: 1.02 }}
                    value={timetableData.section && timetableData.semester ? `${timetableData.section}-${timetableData.semester}` : ''}
                    onChange={handleSectionSemesterChange}
                    className="w-full p-3 border border-indigo-200 rounded-xl bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    required
                  >
                    <option value="">Select Section and Semester</option>
                    {sections.flatMap((section) =>
                      section.available_semesters.map((semester) => (
                        <option key={`${section.id}-${semester}`} value={`${section.id}-${semester}`}>
                          {section.name} (Year: {section.year}, Semester: {semester}, Program: {section.program})
                        </option>
                      ))
                    )}
                  </motion.select>
                </div>
                {timetableData.daily_schedules.map((schedule, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6 flex flex-col sm:flex-row gap-4"
                  >
                    <motion.select
                      whileHover={{ scale: 1.02 }}
                      value={schedule.day_of_week}
                      onChange={(e) => updateSchedule(index, 'day_of_week', e.target.value)}
                      className="p-3 border border-indigo-200 rounded-xl bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                    >
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </motion.select>
                    <motion.select
                      whileHover={{ scale: 1.02 }}
                      value={schedule.subject}
                      onChange={(e) => updateSchedule(index, 'subject', e.target.value)}
                      className="p-3 border border-indigo-200 rounded-xl bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} (Semester: {subject.semester})
                        </option>
                      ))}
                    </motion.select>
                    <motion.select
                      whileHover={{ scale: 1.02 }}
                      value={schedule.start_time}
                      onChange={(e) => updateSchedule(index, 'start_time', e.target.value)}
                      className="p-3 border border-indigo-200 rounded-xl bg-white text-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                      required
                    >
                      <option value="">Select Time</option>
                      {timeSlots.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </motion.select>
                  </motion.div>
                ))}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={addSchedule}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 rounded-full hover:from-green-600 hover:to-teal-600 shadow-md transition-all duration-200 mb-6"
                >
                  Add Another Schedule
                </motion.button>
                <div className="flex flex-col sm:flex-row justify-end gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setShowTimetableForm(false);
                      setEditTimetableId(null);
                      setTimetableData({
                        section: '',
                        semester: '',
                        daily_schedules: [{ day_of_week: 'Monday', subject: '', start_time: '08:30:00' }],
                        semester_start_date: '',
                        semester_end_date: '',
                      });
                      setError('');
                    }}
                    className="w-full sm:w-auto bg-gray-500 text-white py-2 px-6 rounded-full hover:bg-gray-600 shadow-md transition-colors duration-200"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 px-6 rounded-full hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all duration-200"
                  >
                    {editTimetableId ? 'Update Timetable' : 'Save Timetable'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {sessions.length > 0 ? (
        <motion.ul
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
        >
          {sessions.map((session) => (


            <motion.li
  key={session.id}
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -5 }}
  className="bg-gradient-to-br from-indigo-200 via-indigo-100 to-white rounded-3xl shadow-2xl hover:shadow-indigo-300 transition-all duration-300 p-6 border border-indigo-300/50"
>
  <div className="mb-4">
    <h3 className="text-2xl font-bold text-indigo-700 drop-shadow-sm">{session.timetable.subject.name}</h3>
    <p className="text-sm text-indigo-500">{session.timetable.section.name} • Year {session.timetable.section.year} • Semester {session.timetable.semester}</p>
  </div>

  <div className="space-y-2 text-indigo-700 text-sm">
    <p><span className="font-semibold">📅 Date:</span> {session.date}</p>
    <p><span className="font-semibold">📆 Day:</span> {session.timetable.day_of_week}</p>
    <p><span className="font-semibold">⏰ Time:</span> {session.timetable.start_time}</p>
    <p><span className="font-semibold">🎓 Program:</span> {session.timetable.section.program}</p>
    <p><span className="font-semibold">🗓️ Period:</span> {session.timetable.semester_start_date} → {session.timetable.semester_end_date}</p>
    <p>
      <span className="font-semibold">📌 Status:</span>
      <span className={`ml-1 font-bold ${session.status === 'Scheduled' ? 'text-yellow-600' : 'text-green-600'}`}>
        {session.status}
      </span>
    </p>
  </div>

  <motion.div
    className="mt-5"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <Link
      to={`/attendance/${session.id}`}
      className={`inline-block w-full text-center px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-md ${
        session.status === 'Scheduled'
          ? 'bg-yellow-400 text-white hover:bg-yellow-500'
          : 'bg-green-500 text-white hover:bg-green-600'
      }`}
    >
      {session.status === 'Scheduled' ? '📋 Mark Attendance' : '✏️ Update Attendance'}
    </Link>
  </motion.div>
</motion.li>

          ))}
        </motion.ul>



      ) : (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-500 italic"
        >
          No sessions found for this section.
        </motion.p>
      )}
    </div>
  );
}

export default Calendar;




//                       ▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
//                       █    DEVELOPED BY PRANAV SIRSUFALE   █
//                       ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║                     DEVELOPED BY PRANAV SIRSUFALE                         ║
// ╚═══════════════════════════════════════════════════════════════════════════╝