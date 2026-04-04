import React from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Typography, Box, Button, Paper, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTheme } from '@mui/material/styles';

const PaymentSuccess = () => {
  const theme = useTheme();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  // Extract payment details from URL parameters
  const planTitle = searchParams.get('planTitle');
  const amount = searchParams.get('amount')
    ? `${searchParams.get('amount')} SAR`
    : '20.00 SAR';
  const paymentId = searchParams.get('paymentId') || 'N/A';
  const date = searchParams.get('date') || new Date().toLocaleString();

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f4f4',
        padding: 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          borderRadius: 2,
          textAlign: 'center',
          backgroundColor: '#fff',
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 60, color: theme.palette.success.main, mb: 2 }} />
        <Typography variant="h4" color="success.main" gutterBottom>
          Payment Successful!
        </Typography>
        <Typography variant="body1" color="text.primary" sx={{ mb: 3 }}>
          Your subscription has been activated successfully. Thank you for your purchase!
        </Typography>
        <Box sx={{ textAlign: 'left', mb: 3, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Plan:</strong> {planTitle}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Amount:</strong> {amount}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Payment ID:</strong> {paymentId}
          </Typography>
          <Typography variant="body2">
            <strong>Date:</strong> {date}
          </Typography>
        </Box>
       
        <Divider sx={{ mb: 3 }} />
        <Button
          variant="contained"
          color="success"
          size="large"
          href="/subscriptions"
          sx={{ textTransform: 'none', fontWeight: 'bold' }}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default PaymentSuccess;
