// PaymentFailed.jsx
import React from 'react';
import { 
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  Stack,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { ErrorOutline, Home, CreditCard } from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentFailed = () => {
  const theme = useTheme();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get failure reason from URL params
  const reason = searchParams.get('reason') || 'Payment processing failed';
  const paymentId = searchParams.get('paymentId');
  const amount = searchParams.get('amount');
  const planTitle = searchParams.get('planTitle');

  const handleRetry = () => {
    navigate('/subscriptions'); // Or your plans page route
  };

  const handleHome = () => {
    navigate('/'); // Your home page route
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Card sx={{ 
        borderRadius: 3,
        boxShadow: theme.shadows[10],
        overflow: 'visible'
      }}>
        <CardContent sx={{ p: 6, position: 'relative' }}>
          {/* Error icon badge */}
          <Box sx={{
            position: 'absolute',
            top: -30,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
            width: 60,
            height: 60,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme.shadows[4]
          }}>
            <ErrorOutline sx={{ fontSize: 36 }} />
          </Box>

          <Typography 
            variant="h4" 
            align="center" 
            sx={{ 
              mt: 4,
              mb: 2,
              fontWeight: 700,
              color: theme.palette.error.main
            }}
          >
            Payment Failed
          </Typography>

          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              border: `1px solid ${theme.palette.error.main}`,
              bgcolor: alpha(theme.palette.error.main, 0.1)
            }}
          >
            {reason}
          </Alert>

          {paymentId && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Transaction Details:
              </Typography>
              <Stack spacing={1} sx={{ mt: 1, pl: 2 }}>
                {paymentId && (
                  <Typography variant="body2">
                    <strong>Transaction ID:</strong> {paymentId}
                  </Typography>
                )}
                {planTitle && (
                  <Typography variant="body2">
                    <strong>Plan:</strong> {planTitle}
                  </Typography>
                )}
                {amount && (
                  <Typography variant="body2">
                    <strong>Amount:</strong> SAR {amount}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            We couldn't process your payment. This could be due to:
          </Typography>

          <List sx={{ mb: 4 }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36, color: theme.palette.error.main }}>
                <ErrorOutline />
              </ListItemIcon>
              <ListItemText 
                primary="Insufficient funds or card declined" 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36, color: theme.palette.error.main }}>
                <ErrorOutline />
              </ListItemIcon>
              <ListItemText 
                primary="Invalid card details entered" 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36, color: theme.palette.error.main }}>
                <ErrorOutline />
              </ListItemIcon>
              <ListItemText 
                primary="BLOCKED: Country card not supported" 
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          </List>

          <Typography variant="body1" paragraph sx={{ mb: 4 }}>
            Please try again or contact support if the problem persists.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<CreditCard />}
              onClick={handleRetry} 
              sx={{
                px: 4,
                fontWeight: 600,
                borderRadius: 2
              }}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<Home />}
              onClick={handleHome}
              sx={{
                px: 4,
                fontWeight: 600,
                borderRadius: 2
              }}
            >
              Return Home
            </Button>
          </Stack>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Need help? Contact our support team at info@nexplat.sa
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PaymentFailed;