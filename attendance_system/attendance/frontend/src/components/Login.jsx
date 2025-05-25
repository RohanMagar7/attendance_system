import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSignInAlt } from 'react-icons/fa';

function Login({ setNotification, notifyUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        username,
        password,
      });

      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      notifyUser('Logged in Successfully 👀', 'success');

      // After login tokens stored
const roleRes = await axios.get('http://localhost:8000/api/teacher-info/', {
  headers: {
    Authorization: `Bearer ${access}`,
  },
});

const isAdmin = roleRes.data?.is_admin;

if (isAdmin === true) {
  localStorage.setItem('role', 'admin');
  navigate('/admin');
} else {
  localStorage.setItem('role', 'teacher');
  navigate('/calendar');
}
    } catch (err) {
      console.error('Login or role check failed:', err);
      setError('Login failed or unable to fetch user role.');
    }
  };

  return (
    <div
      style={{
        backgroundImage: `url("bg.png")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      className="relative min-h-screen flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-black/10 backdrop-blur-lg rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-indigo-900 dark:border-gray-700"
      >
        <motion.img
          src="logo.jpeg"
          alt="College Logo"
          className="w-20 h-20 mx-auto mb-4 rounded-lg shadow-lg border-2 border-indigo-200 dark:border-indigo-600"
          initial={{ rotate: -10, scale: 0.8 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 150 }}
        />

        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-2 text-white"
        >
          Manikchand Pahade Law College
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-sm text-gray-600 dark:text-gray-300 mb-6"
        >
          Student Attendance Portal
        </motion.p>

        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-b-4 border-indigo-900 focus:border-sky-500 focus:outline-none focus:ring-0"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-b-4 border-indigo-900 focus:border-sky-500 focus:outline-none focus:ring-0"
            />
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-red-500 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-center font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-white text-black py-3 rounded-md font-semibold shadow-md hover:shadow-xl transition-all duration-300 "
          >
            <div className="flex items-center justify-center gap-2">
              <FaSignInAlt className="text-black" />
              Login
            </div>
          </motion.button>
        </form>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-6"
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            © 2025 MPLC Attendance System
          </p>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Developed by Pran
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Login;






// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FaSignInAlt } from 'react-icons/fa';


// function Login({setNotification , notifyUser}) {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
  

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post('http://127.0.0.1:8000/api/token/', {
//         username,
//         password,
//       });
      
//       console.log(response)
//       if ( response.status === 200){
//         notifyUser('Logged in Succcessfully 👀 ' , 'success')

//       }


//       localStorage.setItem('access_token', response.data.access);
//       localStorage.setItem('refresh_token', response.data.refresh);
//       setError('');
//       navigate('/calendar');
//     } catch (err) {
//       setError('Invalid credentials. Please try again.');
//       console.error(err);
//     }
//   };

//   return (
    
//     <div
//   style={{
//     backgroundImage: `url("bg.png")`,
//     backgroundSize: 'cover',
//     backgroundPosition: 'center',
//   }}
//   className="relative min-h-screen flex items-center justify-center p-4"
// >
    
    
    
     
//       <motion.div
//         initial={{ y: -40, opacity: 0 }}
//         animate={{ y: 0, opacity: 1 }}
//         transition={{ duration: 0.6 }}
//         className="bg-black/10 backdrop-blur-lg rounded-3xl shadow-2xl p-10 max-w-md w-full text-center border border-indigo-900 dark:border-gray-700"
//       >
//         {/* Logo */}
//         <motion.img
//           src="logo.jpeg" // Replace with your actual logo path
//           alt="College Logo"
//           className="w-20 h-20 mx-auto mb-4 rounded-lg shadow-lg border-2 border-indigo-200 dark:border-indigo-600"
//           initial={{ rotate: -10, scale: 0.8 }}
//           animate={{ rotate: 0, scale: 1 }}
//           transition={{ type: 'spring', stiffness: 150 }}
//         />

//         <motion.h2
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4, delay: 0.1 }}
//           className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 mb-2 text-white"
//         >
//           Manikchand Pahade Law College
//         </motion.h2>
//         <motion.p
//           initial={{ opacity: 0, y: -10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4, delay: 0.2 }}
//           className="text-sm text-gray-600 dark:text-gray-300 mb-6"
//         >
//         Student Attendance Portal
//         </motion.p>

//         <form onSubmit={handleLogin} className="space-y-5">
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.4, delay: 0.3 }}
//           >
//             <input
//               type="text"
//               placeholder="Username"
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//                className="w-full px-4 py-3 border-b-4 border-indigo-900 backdrop-blur- 
//              focus:border-sky-500 
//              focus:outline-none focus:ring-0"
//             />
//           </motion.div>
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             transition={{ duration: 0.4, delay: 0.4 }}
//           >
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//                className="w-full px-4 py-3 border-b-4 border-indigo-900 backdrop-blur- 
//              invalid:border-pink-500 invalid:text-pink-600 focus:border-sky-500 
//              focus:outline-none focus:ring-0"
              
//             />
//           </motion.div>

//           <AnimatePresence>
//             {error && (
//               <motion.p
//                 initial={{ opacity: 0, y: -10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 transition={{ duration: 0.3 }}
//                 className="text-red-500 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-center font-medium"
//               >
//                 {error}
//               </motion.p>
//             )}
//           </AnimatePresence>

//           <motion.button
//             whileHover={{ scale: 1.05, rotate: 2 }}
//             whileTap={{ scale: 0.95 }}
//             type="submit"
//             className="w-full bg-white text-black py-3 rounded-md font-semibold shadow-md hover:shadow-xl transition-all duration-300 "
//           >
//             <div className="flex items-center justify-center gap-2">
//               <FaSignInAlt className="text-black" />
//               Login
//             </div>
//           </motion.button>
//         </form>

//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4, delay: 0.5 }}
//           className="mt-6"
//         >
//           <p className="text-gray-500 dark:text-gray-400 text-sm">© 2025 MPLC Attendance System</p>
//           <span className="text-xs text-gray-400 dark:text-gray-500">Developed by Pran</span>
        
//         </motion.div>
        
//       </motion.div>
      
//     </div>
   
//   );
// }

// export default Login;
