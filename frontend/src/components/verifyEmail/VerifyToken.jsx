import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Container, Paper, Typography } from "@mui/material";
import { verifyEmail } from "../../services/auth";

const VerifyToken = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const token = searchParams.get("token");

    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const response = await verifyEmail(token);
        localStorage.setItem("authToken", response.authorizationToken);
        localStorage.setItem(
          "user",
          JSON.stringify({
            userId: response.userId,
            email: response.email,
          })
        );
        localStorage.setItem("userId", response.userId);
        setStatus("success");
        setMessage("Your email has been verified. Redirecting to dashboard...");
        setTimeout(() => navigate("/dashboard"), 1500);
      } catch (error) {
        setStatus("error");
        setMessage(error?.response?.data?.message || error?.message || "Verification failed.");
      }
    };

    verify();
  }, [navigate, searchParams]);

  return (
    <Box sx={{ minHeight: "100vh", background: "#faf8ff", display: "flex", alignItems: "center" }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 5, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "#8347E7", mb: 2 }}>
            Invito
          </Typography>

          {status === "loading" ? (
            <>
              <CircularProgress sx={{ mb: 3 }} />
              <Typography>{message}</Typography>
            </>
          ) : (
            <>
              <Alert severity={status === "success" ? "success" : "error"} sx={{ mb: 3 }}>
                {message}
              </Alert>
              <Button variant="contained" onClick={() => navigate(status === "success" ? "/dashboard" : "/")}>
                {status === "success" ? "Open Dashboard" : "Back to Login"}
              </Button>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default VerifyToken;
