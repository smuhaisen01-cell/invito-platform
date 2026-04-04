import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import { CheckCircleOutline, ErrorOutline } from "@mui/icons-material";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_MAIN_URL 


const UnsubscribePage = () => {
  const { contectId } = useParams(); // Changed from token to contectId
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const processUnsubscribe = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.post(
          `${API_BASE_URL}/event/updateEmailUnsubscribe`,
          { contactId: contectId, isSubscribed: false },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        ); // Changed token to contectId
        setEmail(response.data.email);
        setStatus("success");
        setMessage("You have been successfully unsubscribed.");
      } 
      catch (error) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Failed to unsubscribe. Please try again later."
        );
      }
    };

    if (contectId) {
      processUnsubscribe();
    } else {
      setStatus("error");
      setMessage("Invalid unsubscribe link.");
    }
  }, [contectId]); // Updated dependency

  const handleResubscribe = async () => {
    try {
      await axios.post(`${API_BASE_URL}/resubscribe`, { contectId }); // Changed token to contactId
      navigate("/subscription-restored");
    } catch {
      setStatus("error");
      setMessage("Failed to resubscribe. Please contact support.");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
        {status === "loading" && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6">Processing your request...</Typography>
          </Box>
        )}

        {status === "success" && (
          <Box sx={{ color: "success.main" }}>
            <CheckCircleOutline sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Unsubscribe Successful
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              The email address <strong>{email}</strong> will no longer receive
              our communications.
            </Typography>
            <Typography variant="body2" sx={{ mb: 4 }}>
              We're sorry to see you go. If this was a mistake, you can
              resubscribe below.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleResubscribe}
              size="large"
              >
              Resubscribe
            </Button>
          </Box>
        )}

        {status === "error" && (
          <Box sx={{ color: "error.main" }}>
            <ErrorOutline sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Unsubscribe Failed
            </Typography>
            <Alert severity="error" sx={{ mb: 3 }}>
              {message}
            </Alert>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate("/contact")}
              sx={{ mt: 2 }}
              >
              Contact Support
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default UnsubscribePage;
