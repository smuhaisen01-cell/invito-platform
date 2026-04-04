import React, { useState } from "react";
import { Button, Typography, Box, IconButton, Alert } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, googleSignup } from "../../../services/auth";
import BottomLeft from "../../../../public/assets/images/bgcircle.png";
import TopRight from "../../../../public/assets/images/bgtopcircle.png";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log(email, password);

      const response = await loginUser(email, password);
      console.log("Login Success:", response);

      const { token, userId, email: userEmail } = response;

      // Store auth token
      localStorage.setItem("authToken", token);

      // Store user info
      localStorage.setItem(
        "user",
        JSON.stringify({
          userId,
          email: userEmail,
        })
      );
      localStorage.setItem("userId", userId);

      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      setError(err.message || "Invalid Credentials");
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      // Extract email and token from credentialResponse
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
      localStorage.setItem(
        "user",
        JSON.stringify({ userId: data.userId, email: data.email })
      );
      localStorage.setItem("userId", data.userId);

      if (data.isNewUser) {
        localStorage.setItem("showOnboarding", "true");
      } else {
        localStorage.setItem("showOnboarding", "false");
      }

      navigate("/dashboard");
    } catch (error) {
      console.log(error || error?.message);

      setError(error.message || "Google signup failed. Please try again.");
    }
  };

  const handleGoogleLoginFailure = () => {
    setError("Google login failed. Please try again.");
  };

  return (
    <Box className="container" sx={{ minHeight: "100vh", position: "relative" }}>
      <Box className="login-page">
        <Typography variant="h5" className="logo">
          Invito
        </Typography>

        <Box className="background-img">
          <img className="bg-right-img" src={TopRight} alt="top-right image" />
          <img
            className="bg-left-img"
            src={BottomLeft}
            alt="bottom-left image"
          />
        </Box>

        <Box className="login-card">
          <Typography variant="h6" className="login-title">
            Login to Your Account
          </Typography>
          <Typography variant="body2" className="login-subtitle">
            Enter email address or username and password to access your account.
          </Typography>
          <Box
            className="form-container"
            component="form"
            onSubmit={handleLogin}
          >
            {error && (
              <Alert severity="error" className="error-message">
                {error}
              </Alert>
            )}
            <Box className="input-container">
              <label htmlFor="email" className="input-label">
                Email address
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

            <Box className="input-container">
              <label htmlFor="password" className="input-label">
                Password
              </label>
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
                <IconButton
                  className="password-icon-button"
                  onClick={handleTogglePasswordVisibility}
                >
                  {showPassword ? <Visibility /> : <VisibilityOff />}
                </IconButton>
              </div>
            </Box>

            <Box className="actions">
              <Link to="/forgotpassword" className="forgot-password">
                Forgot Password ?
              </Link>
            </Box>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              className="full-width-button"
              type="submit"
              disabled={loading}
              sx={{
                color: loading ? "white" : "inherit",
              }}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Typography variant="body2" className="login-footer">
              New Here?{" "}
              <Link to="/signup" className="create-account-link">
                Create Account
              </Link>
            </Typography>
          </Box>

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
        </Box>
      </Box>
      {/* Powered by nexplat.sa at the bottom center */}
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
    </Box>
  );
};

export default Login;
