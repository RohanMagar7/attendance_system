

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../utilities/Button";

function TimetableCRUD({notifyUser}) {
  const [items, setItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    section: "",
    teacher: "",
    semester: "",
    daily_schedules: [{ day_of_week: "", subject: "", start_time: "" }],
    semester_start_date: "",
    semester_end_date: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const resource = "timetables";

  const timeSlots = ["08:30:00", "09:30:00", "10:30:00", "12:00:00", "13:00:00"];
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    fetchItems();
    fetchSections();
    fetchTeachers();
  }, []);

  const fetchItems = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Please log in first");
      navigate("/");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/admin/${resource}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log(response)
      setItems(response.data);
      setError("");
      if(response.status >= 200 && response.status <= 300){
        notifyUser(response.data?.message || response.data.length + ' Records found ✅', 'info')

      }
    } catch (err) {
      const message = err.response?.status === 404 ? "Resource not found" : err.response?.data?.detail || "Unknown error";
      setError(`Failed to load ${resource}: ${message}`);
      notifyUser(`Failed to load ${resource}: ${message}` , 'error')
      if (err.response?.status === 401 || err.response?.status === 403) navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get("http://localhost:8000/api/admin/sections/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections(response.data);



    } catch (err) {
      notifyUser("Sections fetch error:", err.response?.data || err.message , 'error');
    }
  };

  const fetchTeachers = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get("http://localhost:8000/api/admin/teachers/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeachers(response.data);
    } catch (err) {
      console.error("Teachers fetch error:", err.response?.data || err.message);
    }
  };

  const fetchSemesters = async (sectionId) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get(`http://localhost:8000/api/admin/semesters/?section_id=${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSemesters(response.data.semesters || []);
      console.log("Semesters fetched:", response.data.semesters);
    } catch (err) {
      setError(`Failed to fetch semesters: ${err.response?.status === 404 ? "Endpoint not found" : err.response?.data?.error || "Unknown error"}`);
      setSemesters([]);
      console.error("Semesters fetch error:", err.response?.data || err.message);
    }
  };

  const fetchSubjects = async (semester) => {
    const token = localStorage.getItem("access_token");
    try {
      console.log(`Fetching subjects for semester=${semester}`);
      const response = await axios.get(`http://localhost:8000/api/admin/subjects/?semester=${semester}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(response.data);
      console.log("Subjects fetched:", response.data);
    } catch (err) {
      setError("Failed to fetch subjects: " + (err.response?.data?.error || "Unknown error"));
      console.error("Subjects fetch error:", err.response?.data || err.message);
    }
  };

  const fetchDefaultDates = async (sectionId) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get(`http://localhost:8000/api/admin/timetables/?section_id=${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const timetables = response.data;
      if (timetables.length > 0) {
        const latest = timetables.sort((a, b) => new Date(b.semester_start_date) - new Date(a.semester_start_date))[0];
        console.log("Using latest timetable dates:", latest.semester_start_date, latest.semester_end_date);
        return {
          semester_start_date: latest.semester_start_date,
          semester_end_date: latest.semester_end_date,
        };
      }
      const defaultStart = new Date().toISOString().split("T")[0];
      const defaultEnd = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split("T")[0];
      console.log("No prior timetables, using defaults:", defaultStart, defaultEnd);
      return { semester_start_date: defaultStart, semester_end_date: defaultEnd };
    } catch (err) {
      console.error("Default dates fetch error:", err.response?.data || err.message);
      const defaultStart = new Date().toISOString().split("T")[0];
      const defaultEnd = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split("T")[0];
      return { semester_start_date: defaultStart, semester_end_date: defaultEnd };
    }
  };

  const handleSectionChange = async (e) => {
    const sectionId = e.target.value;
    const defaultDates = await fetchDefaultDates(sectionId);
    setFormData({
      ...formData,
      section: sectionId,
      semester: "",
      daily_schedules: [{ day_of_week: "", subject: "", start_time: "" }],
      semester_start_date: defaultDates.semester_start_date,
      semester_end_date: defaultDates.semester_end_date,
    });
    setSubjects([]);
    if (sectionId) fetchSemesters(sectionId);
  };

  const handleSemesterChange = (e) => {
    const semester = e.target.value;
    setFormData({
      ...formData,
      semester,
      daily_schedules: [{ day_of_week: "", subject: "", start_time: "" }],
    });
    if (semester) fetchSubjects(semester);
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedules = [...formData.daily_schedules];
    updatedSchedules[index][field] = value;
    setFormData({ ...formData, daily_schedules: updatedSchedules });
  };

  const addSchedule = () => {
    setFormData({
      ...formData,
      daily_schedules: [...formData.daily_schedules, { day_of_week: "", subject: "", start_time: "" }],
    });
  };

  const removeSchedule = (index) => {
    const updatedSchedules = formData.daily_schedules.filter((_, i) => i !== index);
    setFormData({ ...formData, daily_schedules: updatedSchedules });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    try {
      const payload = {
        section: formData.section,
        teacher: formData.teacher,
        semester: parseInt(formData.semester),
        daily_schedules: formData.daily_schedules,
        semester_start_date: formData.semester_start_date,
        semester_end_date: formData.semester_end_date,
      };
      console.log("Submitting payload:", payload);
      if (editingId) {
        const response = await axios.put(`http://localhost:8000/api/admin/${resource}/${editingId}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });


      if( response.status >= 200 && response.status <= 300 ){
        notifyUser(response.data.message || 'Record has been updated successfully ✅','success')
      }
      } else {
        const response = await axios.post(`http://localhost:8000/api/admin/${resource}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });


      if( response.status >= 200 && response.status <= 300 ){
        notifyUser(response.data.message || `Record has been saved successfully ✅`,'success')
      }
      }
      resetForm();
      fetchItems();
    } catch (err) {
      setError("Failed to save timetable: " + JSON.stringify(err.response?.data || "Unknown error"));
      console.error("Submit error:", err.response?.data || err.message);
    }
  };

  const handleEdit = (item) => {
    fetchSemesters(item.section.id);
    fetchSubjects(item.subject.semester);
    setFormData({
      section: item.section.id,
      teacher: item.teacher.id,
      semester: item.subject.semester.toString(),
      daily_schedules: [{
        day_of_week: item.day_of_week,
        subject: item.subject.id,
        start_time: item.start_time,
      }],
      semester_start_date: item.semester_start_date,
      semester_end_date: item.semester_end_date,
    });
    setEditingId(item.id);
    notifyUser('Record has been fetched successfully ✅' , 'info')
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("access_token");
    if (window.confirm("Are you sure you want to delete this timetable?")) {
      try {
        const response = await axios.delete(`http://localhost:8000/api/admin/${resource}/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

      if( response.status >= 200 && response.status <= 300 ){
        notifyUser(response.data.message || 'Record has been deleted succssfully ⚠ ','warning')
      }
        fetchItems();
      } catch (err) {
        setError("Failed to delete: " + (err.response?.data?.detail || "Unknown error"));
        notifyUser("Failed to delete: " + (err.response?.data?.detail || "Unknown error") , 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      section: "",
      teacher: "",
      semester: "",
      daily_schedules: [{ day_of_week: "", subject: "", start_time: "" }],
      semester_start_date: "",
      semester_end_date: "",
    });
    setEditingId(null);
    setSemesters([]);
    setSubjects([]);
  };

  if (loading) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 flex items-center justify-center min-h-screen text-indigo-600 dark:text-indigo-300 font-medium"
    >
      Loading {resource}...
    </motion.div>
  );

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 min-h-screen">

      <Button  onClick={() => navigate('/admin')}>Dashboard</Button>
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-extrabold text-transparent text-center bg-clip-text bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-100 mb-6"
           >
              Manage Timetable
            </motion.h2>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-red-500 bg-red-100 dark:bg-red-900/30 dark:text-red-300 p-3 rounded-lg mb-6 shadow-md"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-indigo-100 dark:border-gray-700"
      >
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="mb-4">
          <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Section:</label>
          <motion.select
            whileHover={{ scale: 1.02 }}
            value={formData.section}
            onChange={handleSectionChange}
            className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
          >
            <option value="">Select Section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name} - Year {section.year} ({section.program.name})
              </option>
            ))}
          </motion.select>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }} className="mb-4">
          <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Semester:</label>
          <motion.select
            whileHover={{ scale: 1.02 }}
            value={formData.semester}
            onChange={handleSemesterChange}
            disabled={!formData.section}
            className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
          >
            <option value="">Select Semester</option>
            {semesters.map((semester) => (
              <option key={semester} value={semester}>
                Semester {semester}
              </option>
            ))}
          </motion.select>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }} className="mb-4">
          <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Teacher:</label>
          <motion.select
            whileHover={{ scale: 1.02 }}
            value={formData.teacher}
            onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
            className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
          >
            <option value="">Select Teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.first_name} {teacher.last_name}
              </option>
            ))}
          </motion.select>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }} className="mb-4">
          <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-2">Daily Schedules:</label>
          <AnimatePresence>
            {formData.daily_schedules.map((schedule, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex space-x-4 mb-4 items-center"
              >
                <motion.select
                  whileHover={{ scale: 1.02 }}
                  value={schedule.day_of_week}
                  onChange={(e) => handleScheduleChange(index, "day_of_week", e.target.value)}
                  className="w-1/3 p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
                >
                  <option value="">Day</option>
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </motion.select>
                <motion.select
                  whileHover={{ scale: 1.02 }}
                  value={schedule.subject}
                  onChange={(e) => handleScheduleChange(index, "subject", e.target.value)}
                  disabled={!formData.semester}
                  className="w-1/3 p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
                >
                  <option value="">Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </motion.select>
                <motion.select
                  whileHover={{ scale: 1.02 }}
                  value={schedule.start_time}
                  onChange={(e) => handleScheduleChange(index, "start_time", e.target.value)}
                  className="w-1/3 p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
                >
                  <option value="">Time Slot</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </motion.select>
                {index > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => removeSchedule(index)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium transition-colors duration-200"
                  >
                    Remove
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.05 }}
            type="button"
            onClick={addSchedule}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium transition-colors duration-200"
          >
            Add Schedule
          </motion.button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }} className="mb-4">
          <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Semester Start Date:</label>
          <motion.input
            whileHover={{ scale: 1.02 }}
            type="date"
            value={formData.semester_start_date}
            onChange={(e) => setFormData({ ...formData, semester_start_date: e.target.value })}
            className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }} className="mb-4">
          <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Semester End Date:</label>
          <motion.input
            whileHover={{ scale: 1.02 }}
            type="date"
            value={formData.semester_end_date}
            onChange={(e) => setFormData({ ...formData, semester_end_date: e.target.value })}
            className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
          />
        </motion.div>

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 text-white py-2 px-6 rounded-full shadow-md hover:shadow-xl transition-all duration-300"
          >
            {editingId ? "Update" : "Create"}
          </motion.button>
          {editingId && (
            <motion.button
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={resetForm}
              className="bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 text-white py-2 px-6 rounded-full shadow-md hover:shadow-xl transition-all duration-300"
            >
              Cancel
            </motion.button>
          )}
        </div>
      </motion.form>

      <motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-indigo-100 dark:border-gray-700 overflow-hidden"
      >
        <thead>
          <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700">
            <th className="p-3 text-left text-white font-semibold">Section</th>
            <th className="p-3 text-left text-white font-semibold">Teacher</th>
            <th className="p-3 text-left text-white font-semibold">Subject</th>
            <th className="p-3 text-left text-white font-semibold">Day</th>
            <th className="p-3 text-left text-white font-semibold">Time</th>
            <th className="p-3 text-left text-white font-semibold">Start Date</th>
            <th className="p-3 text-left text-white font-semibold">End Date</th>
            <th className="p-3 text-left text-white font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <motion.tr
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-indigo-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <td className="p-3 text-gray-700 dark:text-gray-200">{item.section.name}</td>
              <td className="p-3 text-gray-700 dark:text-gray-200">{item.teacher.first_name} {item.teacher.last_name}</td>
              <td className="p-3 text-gray-700 dark:text-gray-200">{item.subject.name}</td>
              <td className="p-3 text-gray-700 dark:text-gray-200">{item.day_of_week}</td>
              <td className="p-3 text-gray-700 dark:text-gray-200">{item.start_time}</td>
              <td className="p-3 text-gray-700 dark:text-gray-200">{item.semester_start_date}</td>
              <td className="p-3 text-gray-700 dark:text-gray-200">{item.semester_end_date}</td>
              <td className="p-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleEdit(item)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 font-medium mr-4 transition-colors duration-200"
                >
                  Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 font-medium transition-colors duration-200"
                >
                  Delete
                </motion.button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </motion.table>
    </div>
  );
}

export default TimetableCRUD;




/*

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function TimetableCRUD() {
  const [items, setItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    section: "",
    teacher: "",
    semester: "",
    daily_schedules: [{ day_of_week: "", subject: "", start_time: "" }],
    semester_start_date: "",
    semester_end_date: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const resource = "timetables";

  const timeSlots = ["08:30:00", "09:30:00", "10:30:00", "12:00:00", "13:00:00"];
  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    fetchItems();
    fetchSections();
    fetchTeachers();
  }, []);

  const fetchItems = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Please log in first");
      navigate("/");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8000/api/admin/${resource}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(response.data);
      setError("");
    } catch (err) {
      const message = err.response?.status === 404 ? "Resource not found" : err.response?.data?.detail || "Unknown error";
      setError(`Failed to load ${resource}: ${message}`);
      if (err.response?.status === 401 || err.response?.status === 403) navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get("http://localhost:8000/api/admin/sections/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections(response.data);
    } catch (err) {
      console.error("Sections fetch error:", err.response?.data || err.message);
    }
  };

  const fetchTeachers = async () => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get("http://localhost:8000/api/admin/teachers/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeachers(response.data);
    } catch (err) {
      console.error("Teachers fetch error:", err.response?.data || err.message);
    }
  };




  const fetchSemesters = async (sectionId) => {
    const token = localStorage.getItem("access_token");
    try {
      console.log(`Fetching semesters for section_id=${sectionId}`);
      const response = await axios.get(`http://localhost:8000/api/semesters-for-section/?section_id=${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSemesters(response.data.semesters || []);
      console.log("Semesters fetched:", response.data.semesters);
    } catch (err) {
      setError(`Failed to fetch semesters: ${err.response?.status === 404 ? "Endpoint not found" : err.response?.data?.error || "Unknown error"}`);
      setSemesters([]);
      console.error("Semesters fetch error:", err.response?.data || err.message);
    }
  };




  const fetchSubjects = async (semester) => {
    const token = localStorage.getItem("access_token");
    try {
      console.log(`Fetching subjects for semester=${semester}`);
      const response = await axios.get(`http://localhost:8000/api/admin/subjects/?semester=${semester}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(response.data);
      console.log("Subjects fetched:", response.data);
    } catch (err) {
      setError("Failed to fetch subjects: " + (err.response?.data?.error || "Unknown error"));
      console.error("Subjects fetch error:", err.response?.data || err.message);
    }
  };

  const fetchDefaultDates = async (sectionId) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get(`http://localhost:8000/api/admin/timetables/?section_id=${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const timetables = response.data;
      if (timetables.length > 0) {
        const latest = timetables.sort((a, b) => new Date(b.semester_start_date) - new Date(a.semester_start_date))[0];
        console.log("Using latest timetable dates:", latest.semester_start_date, latest.semester_end_date);
        return {
          semester_start_date: latest.semester_start_date,
          semester_end_date: latest.semester_end_date,
        };
      }
      const defaultStart = new Date().toISOString().split("T")[0];
      const defaultEnd = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split("T")[0];
      console.log("No prior timetables, using defaults:", defaultStart, defaultEnd);
      return { semester_start_date: defaultStart, semester_end_date: defaultEnd };
    } catch (err) {
      console.error("Default dates fetch error:", err.response?.data || err.message);
      const defaultStart = new Date().toISOString().split("T")[0];
      const defaultEnd = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split("T")[0];
      return { semester_start_date: defaultStart, semester_end_date: defaultEnd };
    }
  };

  const handleSectionChange = async (e) => {
    const sectionId = e.target.value;
    const defaultDates = await fetchDefaultDates(sectionId);
    setFormData({
      ...formData,
      section: sectionId,
      semester: "",
      daily_schedules: [{ day_of_week: "", subject: "", start_time: "" }],
      semester_start_date: defaultDates.semester_start_date,
      semester_end_date: defaultDates.semester_end_date,
    });
    setSubjects([]);
    if (sectionId) fetchSemesters(sectionId);
  };

  const handleSemesterChange = (e) => {
    const semester = e.target.value;
    setFormData({
      ...formData,
      semester,
      daily_schedules: [{ day_of_week: "", subject: "", start_time: "" }],
    });
    if (semester) fetchSubjects(semester);
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedules = [...formData.daily_schedules];
    updatedSchedules[index][field] = value;
    setFormData({ ...formData, daily_schedules: updatedSchedules });
  };

  const addSchedule = () => {
    setFormData({
      ...formData,
      daily_schedules: [...formData.daily_schedules, { day_of_week: "", subject: "", start_time: "" }],
    });
  };

  const removeSchedule = (index) => {
    const updatedSchedules = formData.daily_schedules.filter((_, i) => i !== index);
    setFormData({ ...formData, daily_schedules: updatedSchedules });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    try {
      const payload = {
        section: formData.section,
        teacher: formData.teacher,
        semester: parseInt(formData.semester),
        daily_schedules: formData.daily_schedules,
        semester_start_date: formData.semester_start_date,
        semester_end_date: formData.semester_end_date,
      };
      console.log("Submitting payload:", payload);
      if (editingId) {
        await axios.put(`http://localhost:8000/api/admin/${resource}/${editingId}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(`http://localhost:8000/api/admin/${resource}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      resetForm();
      fetchItems();
    } catch (err) {
      setError("Failed to save timetable: " + JSON.stringify(err.response?.data || "Unknown error"));
      console.error("Submit error:", err.response?.data || err.message);
    }
  };

  const handleEdit = (item) => {
    fetchSemesters(item.section.id);
    fetchSubjects(item.subject.semester);
    setFormData({
      section: item.section.id,
      teacher: item.teacher.id,
      semester: item.subject.semester.toString(),
      daily_schedules: [{
        day_of_week: item.day_of_week,
        subject: item.subject.id,
        start_time: item.start_time,
      }],
      semester_start_date: item.semester_start_date,
      semester_end_date: item.semester_end_date,
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("access_token");
    if (window.confirm("Are you sure you want to delete this timetable?")) {
      try {
        await axios.delete(`http://localhost:8000/api/admin/${resource}/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchItems();
      } catch (err) {
        setError("Failed to delete: " + (err.response?.data?.detail || "Unknown error"));
        console.error("Delete error:", err.response?.data || err.message);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      section: "",
      teacher: "",
      semester: "",
      daily_schedules: [{ day_of_week: "", subject: "", start_time: "" }],
      semester_start_date: "",
      semester_end_date: "",
    });
    setEditingId(null);
    setSemesters([]);
    setSubjects([]);
  };

  if (loading) return <div className="p-6">Loading {resource}...</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Timetables</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="mb-2">
          <label className="block text-gray-800">Section:</label>
          <select
            value={formData.section}
            onChange={handleSectionChange}
            className="w-full p-2 border rounded-md text-gray-800"
          >
            <option value="">Select Section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name} - Year {section.year} ({section.program.name})
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="block text-gray-800">Semester:</label>
          <select
            value={formData.semester}
            onChange={handleSemesterChange}
            className="w-full p-2 border rounded-md text-gray-800"
            disabled={!formData.section}
          >
            <option value="">Select Semester</option>
            {semesters.map((semester) => (
              <option key={semester} value={semester}>
                Semester {semester}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="block text-gray-800">Teacher:</label>
          <select
            value={formData.teacher}
            onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
            className="w-full p-2 border rounded-md text-gray-800"
          >
            <option value="">Select Teacher</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.first_name} {teacher.last_name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="block text-gray-800">Daily Schedules:</label>
          {formData.daily_schedules.map((schedule, index) => (
            <div key={index} className="flex space-x-2 mb-2">
              <select
                value={schedule.day_of_week}
                onChange={(e) => handleScheduleChange(index, "day_of_week", e.target.value)}
                className="w-1/3 p-2 border rounded-md text-gray-800"
              >
                <option value="">Day</option>
                {daysOfWeek.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <select
                value={schedule.subject}
                onChange={(e) => handleScheduleChange(index, "subject", e.target.value)}
                className="w-1/3 p-2 border rounded-md text-gray-800"
                disabled={!formData.semester}
              >
                <option value="">Subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
              <select
                value={schedule.start_time}
                onChange={(e) => handleScheduleChange(index, "start_time", e.target.value)}
                className="w-1/3 p-2 border rounded-md text-gray-800"
              >
                <option value="">Time Slot</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => removeSchedule(index)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addSchedule}
            className="text-blue-600 hover:underline"
          >
            Add Schedule
          </button>
        </div>

        <div className="mb-2">
          <label className="block text-gray-800">Semester Start Date:</label>
          <input
            type="date"
            value={formData.semester_start_date}
            onChange={(e) => setFormData({ ...formData, semester_start_date: e.target.value })}
            className="w-full p-2 border rounded-md text-gray-800"
          />
        </div>

        <div className="mb-2">
          <label className="block text-gray-800">Semester End Date:</label>
          <input
            type="date"
            value={formData.semester_end_date}
            onChange={(e) => setFormData({ ...formData, semester_end_date: e.target.value })}
            className="w-full p-2 border rounded-md text-gray-800"
          />
        </div>

        <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
          {editingId ? "Update" : "Create"}
        </button>
        {editingId && (
          <button
            type="button"
            onClick={resetForm}
            className="ml-2 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
        )}
      </form>

      <table className="w-full bg-white rounded-lg shadow-md">
        <thead>
          <tr className="bg-blue-600 text-white">
            <th className="p-2 text-left">Section</th>
            <th className="p-2 text-left">Teacher</th>
            <th className="p-2 text-left">Subject</th>
            <th className="p-2 text-left">Day</th>
            <th className="p-2 text-left">Time</th>
            <th className="p-2 text-left">Start Date</th>
            <th className="p-2 text-left">End Date</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
              <td className="p-2 text-gray-800">{item.section.name}</td>
              <td className="p-2 text-gray-800">{item.teacher.first_name} {item.teacher.last_name}</td>
              <td className="p-2 text-gray-800">{item.subject.name}</td>
              <td className="p-2 text-gray-800">{item.day_of_week}</td>
              <td className="p-2 text-gray-800">{item.start_time}</td>
              <td className="p-2 text-gray-800">{item.semester_start_date}</td>
              <td className="p-2 text-gray-800">{item.semester_end_date}</td>
              <td className="p-2">
                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:underline mr-2">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TimetableCRUD;


*/


