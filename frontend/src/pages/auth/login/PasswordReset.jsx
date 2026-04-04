import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Link,
  TextField,
  Typography,
  Paper,
  InputAdornment,
  IconButton
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { resetpassword } from "../../../services/auth";
import { useLocation, useNavigate } from "react-router-dom";

const PasswordReset = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [token,setToken] = useState('');
  const [parentid,setParentId] = useState('');
  const navigate = useNavigate();
  const location  = useLocation();
  useEffect(() => {
   const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get("token");
    const parentFromUrl = queryParams.get("parentId");
    localStorage.setItem('token',tokenFromUrl);
    localStorage.setItem('parentId',parentFromUrl);
    setParentId(parentFromUrl)
     const tok = localStorage.getItem('token');
     setToken(tok);
  }, [location.search])
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
   
    resetpassword({password,token,parentid,navigate})
    setError("");
  };

  return (
    <Box
      sx={{
        background: "#faf8ff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          sx={{ fontWeight: 600, color: "#8347E7", mt: 2 }}
        >
          Invito
        </Typography>
        <Paper
          elevation={3}
          sx={{
            mt: 0,
            px: 4,
            py: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: 3,
            minWidth: 350,
            maxWidth: 400,
            width: "100%"
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            set new Password
          </Typography>
          <Box
            component="form"
            sx={{ width: "100%", mt: 1 }}
            onSubmit={handleSubmit}
          >
            <Typography
              variant="body2"
              sx={{ mt: 1, color: "grey.700", fontSize: 15 }}
            >
              Password
            </Typography>
            <TextField
              fullWidth
              required
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              margin="dense"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((show) => !show)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Typography
              variant="body2"
              sx={{ mt: 2, color: "grey.700", fontSize: 15 }}
            >
              Confirm Password
            </Typography>
            <TextField
              fullWidth
              required
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              margin="dense"
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 2, mt: 1 }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirm((show) => !show)}
                      edge="end"
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {error && (
              <Typography color="error" sx={{ fontSize: 14, mb: 2, mt: 1 }}>
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 2,
                background: "#8347E7",
                ":hover": { background: "#6f2fd5" },
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: 16,
                height: 40
              }}
            >
              SUBMIT
            </Button>
          </Box>
          <Typography variant="body2" sx={{ mt: 3 }}>
            Remember your password?{" "}
            <Link href="/login" underline="hover" sx={{ color: "#8347E7" }}>
              Login here
            </Link>
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default PasswordReset;
