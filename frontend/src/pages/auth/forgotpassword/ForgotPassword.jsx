import React, { useState } from "react";
import { Typography, Box, Button, Alert } from "@mui/material";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../../services/auth";
import BottomLeft from "../../../../public/assets/images/bgcircle.png";
import TopRight from "../../../../public/assets/images/bgtopcircle.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingVerificationEmail, setAwaitingVerificationEmail] = useState(false);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    setLoading(true);

    try {
      const response = await requestPasswordReset(email);
      setLoading(false);

      setSuccessMessage(
        "A reset link has been sent to your email. Please check your inbox."
      );
      setAwaitingVerificationEmail(true);
      console.log("Request Successfully send to your email:", response);

    } catch (error) {
      setLoading(false);
      setError(error);
    }
  };

  return (
    <Box className="container">
      <Box className="forgot-password-page">
        <Typography variant="h5" className="forgot-password-logo">
          Invito
        </Typography>

        <Box className="background-img">
          <img
            className="bg-right-img"
            src={TopRight}
            alt="Top-right decorative circle"
          />
          <img
            className="bg-left-img"
            src={BottomLeft}
            alt="Bottom-left decorative circle"
          />
        </Box>

        <Box className="forgot-password-card">
          <Typography variant="h6" className="forgot-password-title">
            Forgot Password
          </Typography>

          <Box
            component="form"
            className="form-container"
            onSubmit={handlePasswordReset}
          >
            {error && <Alert severity="error" className="error-message">{error}</Alert>}
            {successMessage && <Alert severity="success" className="success-message">{successMessage}</Alert>}

            {!awaitingVerificationEmail && (
              <>
                <Box className="input-container">
                  <label htmlFor="email" className="input-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    className="input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  className="full-width-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>

                <Typography variant="body2" className="forgot-password-footer">
                  Remember your password?{" "}
                  <Link to="/" className="try-login-link">
                    Login here
                  </Link>
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
