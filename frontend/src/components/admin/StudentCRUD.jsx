

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../utilities/Button";

function StudentCRUD({notifyUser}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    section: "",
    semester: "",
    roll_number: "",
  });
  const [editingStudentId, setEditingStudentId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchSectionsByProgram(selectedProgram);
    } else {
      resetFormAndLists();
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedSection) {
      fetchSemestersBySection(selectedSection);
    } else {
      setSemesters([]);
      setSelectedSemester("");
      setStudents([]);
      setFormData({ ...formData, semester: "" });
    }
  }, [selectedSection]);

  useEffect(() => {
    if (selectedSection && selectedSemester) {
      fetchStudentsBySectionAndSemester(selectedSection, selectedSemester);
    } else {
      setStudents([]);
    }
  }, [selectedSection, selectedSemester]);

  const resetFormAndLists = () => {
    setSections([]);
    setSemesters([]);
    setSelectedSection("");
    setSelectedSemester("");
    setStudents([]);
    setFormData({ first_name: "", last_name: "", email: "", phone: "", section: "", semester: "", roll_number: "" });
    setEditingStudentId(null);
  };

  const fetchPrograms = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Please log in first");
      navigate("/");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/api/admin/programs/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrograms(response.data);
      // console.log("Programs fetched:", response.data);
    } catch (err) {
      setError(`Failed to load programs: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionsByProgram = async (programId) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get(`http://localhost:8000/api/admin/sections/?program=${programId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections(response.data);
      // console.log(`Sections for program ${programId}:`, response.data);
    } catch (err) {
      setError(`Failed to load sections: ${err.response?.data?.detail || err.message}`);
    }
  };

  const fetchSemestersBySection = async (sectionId) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get(`http://localhost:8000/api/admin/semesters/?section_id=${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSemesters(response.data.semesters);
      // console.log(`Semesters for section ${sectionId}:`, response.data.semesters);
    } catch (err) {
      notifyUser(`Failed to load semester : ${err.message || err?.response?.data?.detail}`, "error")
      setError(`Failed to load semesters: ${err.response?.data?.detail || err.message}`);
      setSemesters([]);
    }
  };

  const fetchStudentsBySectionAndSemester = async (sectionId, semester) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get(
        `http://localhost:8000/api/admin/students/?section=${sectionId}&semester=${semester}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(response.data);
      if(response.status === 200){
        notifyUser(`${response.data.length} records found successfully for the semester ${semester}` , 'info')
      }
    } catch (err) {
      setError(`Failed to load students: ${err.response?.data?.detail || err.message}`);
      notifyUser(`Failed to load students: ${err.response?.data?.detail || err.message}` , 'error');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "section") setSelectedSection(value);
    if (name === "semester") setSelectedSemester(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    if (!formData.section || !formData.semester || !formData.first_name ) {
      setError("Please fill all required fields: First Name, Section, and Semester");
      return;
    }
    try {
      const payload = { ...formData };
      console.log(payload)
      if (editingStudentId) {
        const response = await axios.put(
          `http://localhost:8000/api/admin/students/${editingStudentId}/`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if(response.status >= 200 && response.status <= 300){
          notifyUser(response.data.message || 'User record has been updated' , 'info')
        }

      } else {
        const response = await axios.post("http://localhost:8000/api/admin/students/", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if(response.status >= 200 && response.status <= 300){
        notifyUser("Student created with roll_number succesfully:" +  response.data.roll_number , 'success');
        }

      }
      resetFormAndLists();
      setFormData({ ...formData, first_name: "", last_name: "", email: "", phone: "", roll_number: "", section: formData.section, semester: formData.semester });
      setEditingStudentId(null);
      fetchStudentsBySectionAndSemester(selectedSection, selectedSemester);
      setError("");
    } catch (err) {
      notifyUser(`Failed to ${editingStudentId ? "update" : "add"} student: ${err.message || err.response?.data?.detail}`, "error")
      setError(`Failed to ${editingStudentId ? "update" : "add"} student: ${err.response?.data?.detail || err.message}`);
      console.error("Student operation error:", err.response?.data);
    }
  };

  const handleEdit = (student) => {
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || "",
      section: student.section.id,
      semester: student.semester,
      roll_number: student.roll_number,
    });
    setSelectedSection(student.section.id);
    setSelectedSemester(student.semester);
    setEditingStudentId(student.id);
  };

  const handleDelete = async (studentId) => {
    const token = localStorage.getItem("access_token");
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      const response = await axios.delete(`http://localhost:8000/api/admin/students/${studentId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if(response.status == 204){
        notifyUser(`Student ${studentId} deleted Successfully.`,'warning')
      }
      else if (response.status < 300  && response.status > 199){
        notifyUser(`${response?.statusText}`, "warning")
      }
      fetchStudentsBySectionAndSemester(selectedSection, selectedSemester);
      setError("");
    } catch (err) {
      setError(`Failed to delete student: ${err.response?.data?.detail || err.message}`);
    }
  };

  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    return (
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(query) ||
      student.roll_number.toLowerCase().includes(query)
    );
  });

  if (loading) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 flex items-center justify-center min-h-screen text-indigo-600 dark:text-indigo-300 font-medium"
    >
      Loading...
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
           Manage Students
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

      <motion.h3
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-4"
      >
        {editingStudentId ? "Edit Student" : "Add New Student"}
      </motion.h3>
      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="mb-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-indigo-100 dark:border-gray-700"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Program:</label>
            <motion.select
              whileHover={{ scale: 1.02 }}
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
            >
              <option value="">-- Select a Program --</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.duration_years} Years)
                </option>
              ))}
            </motion.select>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Section:</label>
            <motion.select
              whileHover={{ scale: 1.02 }}
              name="section"
              value={formData.section}
              onChange={handleFormChange}
              disabled={!selectedProgram}
              className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
            >
              <option value="">-- Select a Section --</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  Year {section.year} - {section.name}
                </option>
              ))}
            </motion.select>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Semester:</label>
            <motion.select
              whileHover={{ scale: 1.02 }}
              name="semester"
              value={formData.semester}
              onChange={handleFormChange}
              disabled={!formData.section}
              className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
            >
              <option value="">-- Select a Semester --</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </motion.select>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
            <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Roll Number (optional):</label>
            <motion.input
              whileHover={{ scale: 1.02 }}
              type="text"
              name="roll_number"
              value={formData.roll_number}
              onChange={handleFormChange}
              className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
              placeholder="Auto-generated if blank"
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.5 }}>
            <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">First Name:</label>
            <motion.input
              whileHover={{ scale: 1.02 }}
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleFormChange}
              className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
              required
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.6 }}>
            <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Last Name:</label>
            <motion.input
              whileHover={{ scale: 1.02 }}
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleFormChange}
              className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"

            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.7 }}>
            <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Email:</label>
            <motion.input
              whileHover={{ scale: 1.02 }}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"

            />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.8 }}>
            <label className="block text-indigo-700 dark:text-indigo-300 font-medium mb-1">Phone:</label>
            <motion.input
              whileHover={{ scale: 1.02 }}
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
            />
          </motion.div>
        </div>
        <div className="mt-6 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 text-white py-2 px-6 rounded-full shadow-md hover:shadow-xl transition-all duration-300"
          >
            {editingStudentId ? "Update Student" : "Add Student"}
          </motion.button>
          {editingStudentId && (
            <motion.button
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => resetFormAndLists()}
              className="bg-gradient-to-r from-gray-500 to-gray-600 dark:from-gray-600 dark:to-gray-700 text-white py-2 px-6 rounded-full shadow-md hover:shadow-xl transition-all duration-300"
            >
              Cancel
            </motion.button>
          )}
        </div>
      </motion.form>

      {selectedSemester && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.h3
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-4"
          >
            Students
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <motion.input
              whileHover={{ scale: 1.02 }}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or roll number..."
              className="w-full p-3 border border-indigo-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-all duration-200"
            />
          </motion.div>
          {filteredStudents.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-600 dark:text-gray-400"
            >
              No students found
            </motion.p>
          ) : (
            <motion.table
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-indigo-100 dark:border-gray-700 overflow-hidden"
            >
              <thead>
                <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700">
                  <th className="p-3 text-left text-white font-semibold">Roll Number</th>
                  <th className="p-3 text-left text-white font-semibold">Name</th>
                  <th className="p-3 text-left text-white font-semibold">Email</th>
                  <th className="p-3 text-left text-white font-semibold">Phone</th>
                  <th className="p-3 text-left text-white font-semibold">Subjects</th>
                  <th className="p-3 text-left text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-t border-indigo-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <td className="p-3 text-gray-700 dark:text-gray-200">{student.roll_number}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-200">{student.first_name} {student.last_name}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-200">{student.email}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-200">{student.phone}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-200">
                      {student.subjects.length > 0 ? student.subjects.map(s => s.name).join(", ") : "None"}
                    </td>
                    <td className="p-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(student)}
                        className="bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 text-white py-1 px-3 rounded-full shadow-md hover:shadow-xl transition-all duration-200 mr-2"
                      >
                        Edit
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(student.id)}
                        className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white py-1 px-3 rounded-full shadow-md hover:shadow-xl transition-all duration-200"
                      >
                        Delete
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </motion.table>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default StudentCRUD;



/*

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function StudentCRUD() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState([]);
  const [sections, setSections] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    section: "",
    semester: "",
    roll_number: "", // Optional for update
  });
  const [editingStudentId, setEditingStudentId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchSectionsByProgram(selectedProgram);
    } else {
      resetFormAndLists();
    }
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedSection) {
      fetchSemestersBySection(selectedSection);
    } else {
      setSemesters([]);
      setSelectedSemester("");
      setStudents([]);
      setFormData({ ...formData, semester: "" });
    }
  }, [selectedSection]);

  useEffect(() => {
    if (selectedSection && selectedSemester) {
      fetchStudentsBySectionAndSemester(selectedSection, selectedSemester);
    } else {
      setStudents([]);
    }
  }, [selectedSection, selectedSemester]);

  const resetFormAndLists = () => {
    setSections([]);
    setSemesters([]);
    setSelectedSection("");
    setSelectedSemester("");
    setStudents([]);
    setFormData({ first_name: "", last_name: "", email: "", phone: "", section: "", semester: "", roll_number: "" });
    setEditingStudentId(null);
  };

  const fetchPrograms = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Please log in first");
      navigate("/");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8000/api/admin/programs/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrograms(response.data);
      console.log("Programs fetched:", response.data);
    } catch (err) {
      setError(`Failed to load programs: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectionsByProgram = async (programId) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get(`http://localhost:8000/api/admin/sections/?program=${programId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSections(response.data);
      console.log(`Sections for program ${programId}:`, response.data);
    } catch (err) {
      setError(`Failed to load sections: ${err.response?.data?.detail || err.message}`);
    }
  };

  const fetchSemestersBySection = async (sectionId) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get(`http://localhost:8000/api/admin/semesters/?section_id=${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSemesters(response.data.semesters);
      console.log(`Semesters for section ${sectionId}:`, response.data.semesters);
    } catch (err) {
      setError(`Failed to load semesters: ${err.response?.data?.detail || err.message}`);
      setSemesters([]);
    }
  };

  const fetchStudentsBySectionAndSemester = async (sectionId, semester) => {
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.get(
        `http://localhost:8000/api/admin/students/?section=${sectionId}&semester=${semester}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStudents(response.data);
      console.log(`Students for section ${sectionId}, semester ${semester}:`, response.data);
    } catch (err) {
      setError(`Failed to load students: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "section") setSelectedSection(value);
    if (name === "semester") setSelectedSemester(value);
  };






 const handleSubmit = async (e) => {
  e.preventDefault();
  const token = localStorage.getItem("access_token");
  if (!formData.section || !formData.semester || !formData.first_name || !formData.last_name || !formData.email) {
    setError("Please fill all required fields: First Name, Last Name, Email, Section, and Semester");
    return;
  }
  try {
    const payload = { ...formData };
    console.log("Submitting payload:", payload);
    if (editingStudentId) {
      const response = await axios.put(
        `http://localhost:8000/api/admin/students/${editingStudentId}/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Student updated:", response.data);
    } else {
      const response = await axios.post("http://localhost:8000/api/admin/students/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Student created with roll_number:", response.data.roll_number);
    }
    resetFormAndLists();
    setFormData({ ...formData, first_name: "", last_name: "", email: "", phone: "", roll_number: "", section: formData.section, semester: formData.semester });
    setEditingStudentId(null);
    fetchStudentsBySectionAndSemester(selectedSection, selectedSemester);
    setError("");
  } catch (err) {
    setError(`Failed to ${editingStudentId ? "update" : "add"} student: ${err.response?.data?.detail || err.message}`);
    console.error("Student operation error:", err.response?.data); // Log full error
  }
};











  const handleEdit = (student) => {
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || "",
      section: student.section.id,
      semester: student.semester,
      roll_number: student.roll_number,
    });
    setSelectedSection(student.section.id);
    setSelectedSemester(student.semester);
    setEditingStudentId(student.id);
  };

  const handleDelete = async (studentId) => {
    const token = localStorage.getItem("access_token");
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/admin/students/${studentId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchStudentsBySectionAndSemester(selectedSection, selectedSemester);
      setError("");
      console.log(`Student ${studentId} deleted`);
    } catch (err) {
      setError(`Failed to delete student: ${err.response?.data?.detail || err.message}`);
    }
  };

  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    return (
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(query) ||
      student.roll_number.toLowerCase().includes(query)
    );
  });

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Manage Students</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <h3 className="text-xl font-semibold mb-2">{editingStudentId ? "Edit Student" : "Add New Student"}</h3>
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-800">Program:</label>
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="w-full p-2 border rounded-md text-gray-800"
            >
              <option value="">-- Select a Program --</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.duration_years} Years)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-800">Section:</label>
            <select
              name="section"
              value={formData.section}
              onChange={handleFormChange}
              className="w-full p-2 border rounded-md text-gray-800"
              disabled={!selectedProgram}
            >
              <option value="">-- Select a Section --</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  Year {section.year} - {section.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-800">Semester:</label>
            <select
              name="semester"
              value={formData.semester}
              onChange={handleFormChange}
              className="w-full p-2 border rounded-md text-gray-800"
              disabled={!formData.section}
            >
              <option value="">-- Select a Semester --</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-800">Roll Number (optional):</label>
            <input
              type="text"
              name="roll_number"
              value={formData.roll_number}
              onChange={handleFormChange}
              className="w-full p-2 border rounded-md text-gray-800"
              placeholder="Auto-generated if blank"
            />
          </div>
          <div>
            <label className="block text-gray-800">First Name:</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleFormChange}
              className="w-full p-2 border rounded-md text-gray-800"
              required
            />
          </div>
          <div>
            <label className="block text-gray-800">Last Name:</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleFormChange}
              className="w-full p-2 border rounded-md text-gray-800"
              required
            />
          </div>
          <div>
            <label className="block text-gray-800">Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              className="w-full p-2 border rounded-md text-gray-800"
              required
            />
          </div>
          <div>
            <label className="block text-gray-800">Phone:</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleFormChange}
              className="w-full p-2 border rounded-md text-gray-800"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          {editingStudentId ? "Update Student" : "Add Student"}
        </button>
        {editingStudentId && (
          <button
            type="button"
            onClick={() => resetFormAndLists()}
            className="mt-4 ml-2 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
          >
            Cancel
          </button>
        )}
      </form>

      {selectedSemester && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Students</h3>
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or roll number..."
              className="w-full p-2 border rounded-md text-gray-800"
            />
          </div>
          {filteredStudents.length === 0 ? (
            <p>No students found</p>
          ) : (
            <table className="w-full bg-white rounded-lg shadow-md">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-2 text-left">Roll Number</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2 text-left">Phone</th>
                  <th className="p-2 text-left">Subjects</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-t">
                    <td className="p-2">{student.roll_number}</td>
                    <td className="p-2">{student.first_name} {student.last_name}</td>
                    <td className="p-2">{student.email}</td>
                    <td className="p-2">{student.phone}</td>
                    <td className="p-2">
                      {student.subjects.length > 0 ? student.subjects.map(s => s.name).join(", ") : "None"}
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => handleEdit(student)}
                        className="bg-yellow-500 text-white py-1 px-2 rounded-md hover:bg-yellow-600 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="bg-red-500 text-white py-1 px-2 rounded-md hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentCRUD;

*/



