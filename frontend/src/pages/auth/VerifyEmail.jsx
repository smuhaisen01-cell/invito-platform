import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { verifyEmail } from '../../services/auth';

const VerifyEmail = () => {
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  // The token must be present in the URL as a query param: /verifyemail?token=...
  // If you visit /verifyemail without a token, the API will not be called.
  // If you visit /verifyemail?token=XYZ, the API will be called.
  const token = new URLSearchParams(location.search).get("token");

  // For debugging: log the token and status
  console.log("VerifyEmail token:", token);
  console.log("status", status);

  useEffect(() => {
    let isMounted = true;
    setStatus("verifying");
    setMessage("");

    // If token is missing, do not call the API
    if (!token) {
      setStatus("error");
      setMessage("Token missing.");
      setTimeout(() => navigate("/"), 5000);
      return;
    }

    // Call the verification API
    const verify = async () => {
      try {
        const data = await verifyEmail(token);
        if (isMounted) {
          setStatus("success");
          setMessage("Verification successful! Redirecting to dashboard...");
          localStorage.setItem("authToken", data.authorizationToken);
          localStorage.setItem("user", JSON.stringify({ userId: data.userId, email: data.email }));
          setTimeout(() => navigate("/dashboard"), 5000);
        }
      } catch (err) {
        if (isMounted) {
          const backendMsg = err.response?.data?.message;
          setStatus("error");
          setMessage(backendMsg || err.message || "Verification failed.");
          setTimeout(() => navigate("/"), 5000);
        }
      }
    };

    verify();

    return () => { isMounted = false; };
  }, [token, navigate]);

  return (
    <Box textAlign="center" mt={8}>
      <Typography variant="h5" gutterBottom>
        Email Verification
      </Typography>

      {status === "verifying" && (
        <>
          <CircularProgress />
          <Typography mt={2}>Verifying your email...</Typography>
        </>
      )}

      {status === "success" && (
        <Typography
          variant="subtitle1"
          align="center"
          sx={{ mt: 2, mb: 2, color: '#388e3c', fontWeight: 500 }}
        >
          {message}
        </Typography>
      )}

      {status === "error" && (
        <Box>
          <Typography
            variant="subtitle1"
            align="center"
            sx={{ mt: 2, mb: 2, color: '#d32f2f', fontWeight: 500 }}
          >
            {message}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default VerifyEmail;
