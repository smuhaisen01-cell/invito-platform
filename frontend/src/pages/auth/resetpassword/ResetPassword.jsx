import React, { useState, useEffect } from "react";
import { Typography, Box, IconButton, Button, Alert } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../../../services/auth";
import BottomLeft from "../../../../public/assets/images/bgcircle.png";
import TopRight from "../../../../public/assets/images/bgtopcircle.png";

const ResetPassword = () => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [jwt, setJwt] = useState("");
  const [showForm, setShowForm] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setJwt(queryParams.get("token") || "");
  }, [location.search]);

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setLoading(true);

    try {
      await resetPassword({
        token: jwt,
        password,
      });

      setLoading(false);
      setSuccessMessage("Password successfully reset! Redirecting to login...");
      setShowForm(false);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      setLoading(false);
      const msg = err?.message || "Password reset failed. Please try again.";
      setErrorMessage(msg);
      // Hide form if token expired/used
      if (msg.includes("Reset token has expired")) setShowForm(false);
    }
  };

  return (
    <Box className="container">
      <Box className="reset-password-page">
        <Typography variant="h5" className="reset-password-logo">
          Invito
        </Typography>

        <Box className="background-img">
          <img className="bg-right-img" src={TopRight} alt="Top-right decorative circle" />
          <img className="bg-left-img" src={BottomLeft} alt="Bottom-left decorative circle" />
        </Box>

        <Box className="reset-password-card">
          <Typography variant="h6" className="reset-password-title">
            Reset Password
          </Typography>

          {errorMessage && (
            <Alert severity="error" className="error-message" sx={{ mb: 2, fontSize: 16, textAlign: "center", maxWidth: "400px" }}>
              {errorMessage}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" className="success-message" sx={{ mb: 2, fontSize: 16 }}>
              {successMessage}
            </Alert>
          )}

          {showForm && (
            <Box component="form" className="form-container" onSubmit={handleSubmit}>
              <Box className="input-container">
                <label htmlFor="new-password" className="input-label">
                  New Password
                </label>
                <div className="password-field">
                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="********"
                    className="password-input-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <IconButton
                    id="toggle-new-password"
                    className="password-icon-button"
                    onClick={toggleNewPasswordVisibility}
                  >
                    {showNewPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </div>
              </Box>

              <Box className="input-container">
                <label htmlFor="confirm-password" className="input-label">
                  Confirm New Password
                </label>
                <div className="password-field">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    className="password-input-field"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <IconButton
                    id="toggle-confirm-password"
                    className="password-icon-button"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </div>
              </Box>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                className="full-width-button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Processing..." : "Submit"}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ResetPassword;
