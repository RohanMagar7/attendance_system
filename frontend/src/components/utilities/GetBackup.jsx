import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { toast } from 'react-toastify';

const StyledCard = styled(motion(Card))(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: theme.shadows[6],
  marginBottom: theme.spacing(3),
  width: '100%',
  maxWidth: 450,
  margin: theme.spacing(2),
  textAlign: 'center',
  padding: theme.spacing(3),
}));


import Button from './Button';

function GetBackup({ notifyUser }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();
  const handleBackupClick = async () => {
    setLoading(true);
    setMessage('Initiating database backup...');
    setMessageType('info');
    notifyUser('Initiating database backup...', 'info');

    try {
      const token = localStorage.getItem('access_token');

      if (!token) {
        const errorMessage = 'Authentication token is missing. Please log in as an admin user.';
        setMessage(errorMessage);
        setMessageType('error');
        notifyUser(errorMessage, 'error');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        'http://localhost:8000/api/backup/',
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setMessage(response.data.message || 'Database backup successfully initiated!');
      setMessageType('success');
      notifyUser(response.data.message || 'Database backup successfully initiated!', 'success');

    } catch (error) {
      console.error('Error during backup request:', error.response || error);
      const errorMessage = error.response?.data?.error || `Network error or unexpected issue: ${error.message}`;
      setMessage(errorMessage);
      setMessageType('error');
      notifyUser(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>


    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>

    <Button onClick={() => navigate('/admin')}>Dashboard</Button>


    <Box sx={{ p: 3, bgcolor: 'background.default',display: "flex" , justifyContent: 'center', alignItems: 'center' }}>


      <StyledCard>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
            Get Database Backup
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Click the button below to generate a full backup of your MySQL database, including all tables and records.
          </Typography>

          <form onSubmit={(e) => e.preventDefault()}> {/* Prevent default form submission */}
            <Button
              variant="contained"
              onClick={handleBackupClick}
              disabled={loading}
              sx={{
                mt: 2,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                borderRadius: '0.75rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                transition: 'background-color 0.3s ease',
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.primary.dark,
                },
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Retrieve Backup'
              )}
            </Button>
          </form>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                sx={{ mt: 3 }}
              >
                <Box
                  className={`message-box ${messageType === 'success' ? 'message-success' : messageType === 'error' ? 'message-error' : 'message-info'}`}
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: messageType === 'success' ? '#34d399' : messageType === 'error' ? '#ef4444' : '#38b2ac',
                    backgroundColor: messageType === 'success' ? '#d1fae5' : messageType === 'error' ? '#fee2e2' : '#e0f2fe',
                    color: messageType === 'success' ? '#065f46' : messageType === 'error' ? '#991b1b' : '#0369a1',
                    wordBreak: 'break-word',
                    textAlign: 'left',
                  }}
                >
                  <Typography variant="body2">{message}</Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </StyledCard>
    </Box>
    </Box>
    </>
  );
}

export default GetBackup;
