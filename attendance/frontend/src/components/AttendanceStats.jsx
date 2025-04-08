import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AttendanceStats() {
  const [stats, setStats] = useState([]);
  const [filteredStats, setFilteredStats] = useState([]);
  const [period, setPeriod] = useState('semester');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customRange, setCustomRange] = useState(false);
  const [error, setError] = useState('');
  const [responseStartDate, setResponseStartDate] = useState('');
  const [responseEndDate, setResponseEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Please log in first');
        return;
      }

      let url = `http://localhost:8000/api/teacher-attendance-stats/?period=${period}`;
      if (customRange && startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }

      try {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(response.data.stats);
        setFilteredStats(response.data.stats);
        setResponseStartDate(response.data.start_date);
        setResponseEndDate(response.data.end_date);
        setError('');
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError(err.response?.data?.error || 'Failed to load attendance stats');
      }
    };
    fetchStats();
  }, [period, startDate, endDate, customRange]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    const lowerCaseQuery = query.toLowerCase();
    const filtered = stats.filter(
      (stat) =>
        stat.name.toLowerCase().includes(lowerCaseQuery) ||
        stat.roll_number.toString().includes(lowerCaseQuery)
    );
    setFilteredStats(filtered);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Attendance Statistics</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="mb-4 flex flex-col space-y-4">
        <div className="flex space-x-4">
          <label className="mr-2 text-gray-800">View by:</label>
          <select
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setCustomRange(false); // Reset custom range when changing period
            }}
            className="p-2 border rounded-md bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="semester">Semester</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        {period === 'custom' && (
          <div className="flex space-x-4">
            <div>
              <label className="mr-2 text-gray-800">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCustomRange(true);
                }}
                className="p-2 border rounded-md text-gray-800"
              />
            </div>
            <div>
              <label className="mr-2 text-gray-800">End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCustomRange(true);
                }}
                className="p-2 border rounded-md text-gray-800"
              />
            </div>
          </div>
        )}
      </div>
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or roll number"
          className="w-full p-2 border rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <p className="text-gray-800 mb-4">Period: {responseStartDate} to {responseEndDate}</p>
      {filteredStats.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="p-2 text-left">Student Name</th>
                <th className="p-2 text-left">Roll Number</th>
                <th className="p-2 text-left">Total Sessions</th>
                <th className="p-2 text-left">Present</th>
                <th className="p-2 text-left">Absent</th>
                <th className="p-2 text-left">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {filteredStats.map((stat) => (
                <tr key={stat.student_id} className="border-t">
                  <td className="p-2 text-gray-800">{stat.name}</td>
                  <td className="p-2 text-gray-800">{stat.roll_number}</td>
                  <td className="p-2 text-gray-800">{stat.total_sessions}</td>
                  <td className="p-2 text-gray-800">{stat.present}</td>
                  <td className="p-2 text-gray-800">{stat.absent}</td>
                  <td className="p-2 text-gray-800">{stat.attendance_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600">No attendance stats available for this period.</p>
      )}
    </div>
  );
}

export default AttendanceStats;