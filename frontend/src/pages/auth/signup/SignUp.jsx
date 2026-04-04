import React, { useState } from "react";
import {
  Button,
  Typography,
  Box,
  IconButton,
  Alert
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { createAccount, googleSignup } from "../../../services/auth";
import BottomLeft from "../../../../public/assets/images/bgcircle.png";
import TopRight from "../../../../public/assets/images/bgtopcircle.png";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from 'jwt-decode';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Powered by nexplat.sa at the bottom center (as per login.jsx)
export const PoweredByBox = () => (
  <Box
    sx={{
      position: "absolute",
      bottom: 16,
      left: 0,
      width: "100%",
      display: "flex",
      justifyContent: "center",
      pointerEvents: "none",
      zIndex: 10,
    }}
  >
    <Typography
      variant="body2"
      sx={{
        color: "#888",
        fontWeight: 500,
        letterSpacing: 0.5,
        pointerEvents: "auto",
      }}
    >
      Powered by{" "}
      <a
        href="https://nexplat.sa"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          textDecoration: "underline",
          color: "#888",
          fontWeight: 500,
          cursor: "pointer",
          pointerEvents: "auto",
        }}
      >
        nexplat.sa
      </a>
    </Typography>
  </Box>
);


const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const userData = await createAccount({ name, email, password });

      setSuccess("Account created! Please check your email and verify your account.");
      setAwaitingVerification(true);

      localStorage.setItem("user", JSON.stringify({
        id: userData._id,
        name: userData.name,
        email: userData.email,
        emailVerify: userData.emailVerify,
        onBoarding: userData.onBoarding,
        signupType: userData.signupType,
        verificationToken: userData.verificationToken
      }));

      if (userData.verificationToken) {
        setSuccess(
          <>
            Account created! Please check your email and verify your account.<br />
          </>
        );
      }

      // Always set onboarding for new email signups
      localStorage.setItem('showOnboarding', 'true');
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) {
        setError("Google login failed: No ID token received.");
        return;
      }

      const decoded = jwtDecode(idToken);
      const email = decoded.email;
      if (!email) {
        setError("Google login failed: No email found in token.");
        return;
      }

      const data = await googleSignup(email, idToken);
      localStorage.setItem("authToken", data.authorizationToken);
      localStorage.setItem("user", JSON.stringify({
        userId: data.userId,
        email: data.email,
      }));

      if (data.isNewUser) {
        localStorage.setItem("showOnboarding", "true");
      } else {
        localStorage.setItem("showOnboarding", "false");
      }

      navigate("/dashboard");
    } catch (error) {
      setError(error.message || "Google signup failed. Please try again.");
    }
  };

  const handleGoogleLoginFailure = () => {
    setError("Google login failed. Please try again.");
  };

  return (
    <Box className="container" sx={{ overflowY: "auto" }}>
      <Box className="signup-page">
        <Typography variant="h5" className="signup-logo">Invito</Typography>

        <Box className="background-img">
          <img className="bg-right-img" src={TopRight} alt="top-right" />
          <img className="bg-left-img" src={BottomLeft} alt="bottom-left" />
        </Box>

        <Box className="signup-card">
          <Typography variant="h5" className="signup-title">Create Account</Typography>
          <Typography variant="body2" className="signup-subtitle">Create an account to get started</Typography>

          <Box className="form-container" component="form" onSubmit={handleSignup}>
            {error && <Alert severity="error" className="error-message" sx={{ maxWidth: '400px' }}>{error}</Alert>}
            {success && <Alert severity="info" className="success-message">{success}</Alert>}

            {!awaitingVerification && (
              <>
                <Box className="input-container">
                  <label htmlFor="name" className="input-label">Name</label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    className="input-field"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Box>

                <Box className="input-container">
                  <label htmlFor="email" className="input-label">Email address</label>
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

                <Box className="input-container">
                  <label htmlFor="password" className="input-label">Password</label>
                  <div className="password-field">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      className="password-input-field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <IconButton className="password-icon-button" onClick={togglePasswordVisibility}>
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </div>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  className="full-width-button"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>

                <Typography variant="body2" className="signUp-footer">
                  Already Have an Account?{" "}
                  <Link to="/" className="login-Link">Login</Link>
                </Typography>

                {GOOGLE_CLIENT_ID && (
                  <Box className="google-login">
                    <GoogleLogin
                      onSuccess={handleGoogleLoginSuccess}
                      onError={handleGoogleLoginFailure}
                      theme="filled_tranparent"
                      size="medium"
                      text="signup_with"
                      shape="pill"
                      width="100%"
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Signup;
