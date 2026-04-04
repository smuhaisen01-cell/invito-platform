import React, { useEffect, useState, useRef } from "react";
import {
  Toolbar,
  Typography,
  Avatar,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { useLocation } from "react-router-dom";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
// import CircularProgress from "@mui/material/CircularProgress";
import DashboardOnboardingPopup from "../../../pages/sideNav/DashboardOnboardingPopup";

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    return localStorage.getItem("showOnboarding") === "true";
  });
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, [user]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && savedUser !== "undefined") {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        console.error("Invalid user data in localStorage:", err);
        localStorage.removeItem("user");
      }
    }
  }, [location]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEditProfileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Update user object in state and localStorage
        const updatedUser = { ...user, avatar: reader.result };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        // Optionally, upload to backend here
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true); // Show loader
    await localStorage.clear();
    setLogoutDialogOpen(false);
    setTimeout(() => {
      setIsLoggingOut(false);
      window.location.href = "/";
    }, 2000);
  };

  return (
    <header className="header">
      <Toolbar className="header-toolbar">
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight="bold"></Typography>
        </Box>

        <Box className="header-user-section">
          <Box display="flex" alignItems="center" gap={1}>
            <div className="header-avatar-container">
              <Avatar
                onClick={handleMenuOpen}
                src={user?.avatar || ""}
                alt={user?.name || user?.email || "User"}
                className="header-avatar"
              >
                {(user?.name || user?.email)?.charAt(0)?.toUpperCase() || "U"}
              </Avatar>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden-file-input"
                onChange={handleFileChange}
              />
            </div>
            <Typography className="header-username">
              {user?.name?.split(" ")[0] ||
                user?.email?.split("@")[0] ||
                "User"}
            </Typography>
          </Box>

          <IconButton onClick={handleMenuOpen} className="header-icon-button">
            {anchorEl ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              elevation: 0,
              sx: {
                border: "1px solid #ddd",
                borderRadius: "12px",
                mt: 1,
                overflow: "hidden",
                minWidth: 180,
              },
            }}
          >
            <MenuItem
              className="header-menu-item"
              onClick={() => {
                handleMenuClose();
                setOnboardingOpen(true);
                localStorage.setItem("showOnboarding", "true");
              }}
              sx={{
                p: "8px 16px 12px 16px",
                color: "#081418",
                fontSize: "14px",
                borderBottom: "1px solid #D9D9D9",
              }}
            >
              How it works ?
            </MenuItem>

            <MenuItem
              className="header-menu-item"
              onClick={() => {
                handleMenuClose();
                handleEditProfileClick();
              }}
              sx={{
                p: "12px 16px 12px 16px",
                color: "#081418",
                fontSize: "14px",
                borderBottom: "1px solid #D9D9D9",
              }}
            >
              Edit Profile
            </MenuItem>

            <MenuItem
              className="header-menu-item"
              onClick={() => {
                handleMenuClose();
                setLogoutDialogOpen(true);
              }}
              sx={{
                p: "12px 16px 6px 16px",
                color: "#081418",
                fontSize: "14px",
              }}
            >
              Logout
            </MenuItem>
          </Menu>

           <DashboardOnboardingPopup
            open={onboardingOpen}
            onClose={() => {
              setOnboardingOpen(false);
              localStorage.setItem("showOnboarding", "false");
            }}
          />

          <Dialog
            open={logoutDialogOpen}
            onClose={() => setLogoutDialogOpen(false)}
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-description"
            maxWidth={false}
            PaperProps={{
              sx: {
                width: "500px",
                maxWidth: "95vw",
                borderRadius: 3,
              },
            }}
          >
            <DialogTitle
              id="logout-dialog-title"
              sx={{
                fontWeight: 700,
                fontSize: "1.25rem",
                color: "#5829cf",
                alignSelf: "center",
              }}
            >
              Confirm Logout
            </DialogTitle>
            <DialogContent>
              <DialogContentText
                id="logout-dialog-description"
                sx={{
                  fontSize: "1rem",
                  color: "#090415",
                  justifySelf: "center",
                }}
              >
                Are you sure you want to logout?
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ display: "flex", p: 2, gap: 1 }}>
              <Button
                fullWidth
                onClick={() => setLogoutDialogOpen(false)}
                variant="outlined"
                color="primary"
                className='without-background-button'
              >
                Cancel
              </Button>

              <Button
                fullWidth
                onClick={handleLogout}
                variant="contained"
                color="primary"
                className='with-background-button'
              >
                Logout
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Toolbar>
      {isLoggingOut && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(255,255,255,0.7)", zIndex: 9999, display: "flex",
          alignItems: "center", justifyContent: "center"
        }}>
          <div className="loader"></div>
          {/* Or use a spinner from MUI: */}
          {/* <CircularProgress color="primary" size={60} /> */}
          <span style={{ marginLeft: 16, fontSize: 18 }}>Logging out...</span>
        </div>
      )}
    </header>
  );
};

export default Header;

