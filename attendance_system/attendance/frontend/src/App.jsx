import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import axios from "axios";
import Login from "./components/Login";
import Calendar from "./components/Calendar";
import AttendanceForm from "./components/AttendanceForm";
import TimetableForm from "./components/TimetableForm";
import AttendanceStats from "./components/AttendanceStats";
import AdminDashboard from "./components/AdminDashboard";
import AdminCRUD from "./components/AdminCRUD";
import AdminAttendanceStats from "./components/AdminAttendanceStats";
import ProfileIcon from "./components/ProfileIcon";
import Footer from "./components/pages/Footer";
import TeacherCRUD from "./components/admin/TeacherCRUD";
import StudentCRUD from "./components/admin/StudentCRUD";
import ProgramCRUD from "./components/admin/ProgramCRUD";
import SubjectCRUD from "./components/admin/SubjectCRUD";
import TimetableCRUD from "./components/admin/TimetableCRUD";
import SessionCRUD from "./components/admin/SessionCRUD";
import { motion, AnimatePresence } from "framer-motion";
import { FaChalkboardTeacher } from "react-icons/fa";
import LandingPage from "./components/pages/LandingPage";
import { Switch } from "@headlessui/react";
import { Bounce, toast, ToastContainer } from "react-toastify";
import Lottie from "react-lottie-player"; //! for lottie animation
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles"; //! particles engine
// Sample Lottie animation (law-themed scales of justice)
// import lawAnimationData from "https://lottie.host/9c9f6f1d-3b3e-4b7e-9e1a-3f3d6b8e7f2a/justice-scales.json";

// Placeholder: Replace with actual Lottie URL

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLanding, setIsLanding] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState("");

  const notifyUser = (msg, type) => {
    const toastConfigOptions = {
      position: "bottom-left",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
      transition: Bounce,
    };

    switch (type) {
      case "success":
        const notifySuccess = (msg) => toast.success(msg, toastConfigOptions);
        notifySuccess(msg);
        break;
      case "warning":
        const warnUser = (msg) => toast.warning(msg, toastConfigOptions);
        warnUser(msg);
        break;
      case "error":
        const notifyError = (msg) => toast.error(msg, toastConfigOptions);
        notifyError(msg);
        break;
      case "default":
        const notify = (msg) => toast(msg, toastConfigOptions);
        notify(msg);
      case "info":
        const informUser = (msg) => toast.info(msg, toastConfigOptions);
        informUser(msg);
    }


  };

  const particlesInit = async (main) => {
    await loadFull(main);
  };

  // Animation variants for staggered effects
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };


  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(
          "http://localhost:8000/api/teacher-info/",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setIsAdmin(response.data.is_admin);
      } catch (err) {
        console.error("Failed to verify admin status:", err);
      } finally {
        setLoading(false);
      }
    };
    checkAdmin();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
          className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 animate-pulse flex items-center gap-2"
        >
          <FaChalkboardTeacher className="text-3xl" />
          Loading Attendance System...
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={
        darkMode
          ? "dark bg-gray-900 text-white"
          : "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-gray-800"
      }
    >
      <AnimatePresence mode="wait">

        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Router>
            <div className="min-h-screen transition-all duration-300 ease-in-out">
              <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 p-4 shadow-lg flex justify-between items-center">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-white text-xl font-extrabold flex items-center gap-2"
                >
                  <FaChalkboardTeacher className="text-white text-2xl" />
                  Attendance System
                </motion.div>

                <div className="flex items-center gap-4">


                  <ProfileIcon notifyUser={notifyUser} />
                </div>
              </nav>

              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick={false}
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
                transition={Bounce}
              />

              <AnimatePresence mode="wait">
                <Routes>
                  <Route
                    path="/"
                    element={<Login notifyUser={notifyUser} />}
                  />
                  <Route
                    path="/calendar"
                    element={
                      <Calendar admin={isAdmin} notifyUser={notifyUser} />
                    }
                  />
                  <Route
                    path="/attendance/:sessionId"
                    element={
                      <AttendanceForm
                        notifyUser={notifyUser}
                        onClose={() => window.history.back()}
                      />
                    }
                  />
                  <Route
                    path="/timetable"
                    element={
                      <TimetableForm
                        notifyUser={notifyUser}
                        onClose={() => window.history.back()}
                      />
                    }
                  />
                  <Route
                    path="/attendance-stats"
                    element={<AttendanceStats notifyUser={notifyUser} />}
                  />
                  {isAdmin && (
                    <>
                      <Route
                        path="/admin"
                        element={<AdminDashboard notifyUser={notifyUser} />}
                      />
                      <Route
                        path="/admin/teachers"
                        element={
                          <TeacherCRUD
                            resource="teachers"
                            notifyUser={notifyUser}
                          />
                        }
                      />
                      <Route
                        path="/admin/students"
                        element={
                          <StudentCRUD
                            notifyUser={notifyUser}
                            resource="students"
                          />
                        }
                      />
                      <Route
                        path="/admin/programs"
                        element={
                          <ProgramCRUD
                            notifyUser={notifyUser}
                            resource="programs"
                          />
                        }
                      />
                      <Route
                        path="/admin/subjects"
                        element={
                          <SubjectCRUD
                            notifyUser={notifyUser}
                            resource="subjects"
                          />
                        }
                      />
                      <Route
                        path="/admin/timetables"
                        element={
                          <TimetableCRUD
                            notifyUser={notifyUser}
                            resource="timetables"
                          />
                        }
                      />
                      <Route
                        path="/admin/sessions"
                        element={
                          <SessionCRUD
                            notifyUser={notifyUser}
                            resource="sessions"
                          />
                        }
                      />
                      <Route
                        path="/admin/attendance-stats"
                        element={
                          <AdminAttendanceStats notifyUser={notifyUser} />
                        }
                      />
                    </>
                  )}
                </Routes>
              </AnimatePresence>
            </div>
          </Router>

          {/* <Footer /> */}
        </motion.div>

      </AnimatePresence>
    </div>
  );
}

export default App;
