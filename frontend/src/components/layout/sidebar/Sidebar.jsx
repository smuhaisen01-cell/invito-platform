import React, { useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";

const Sidebar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navItems = [
    {
      text: "Dashboard",
      icon: <img src="/assets/images/dashboardIcon.svg" alt="Dashboard" />,
      link: "/dashboard",
    },
    {
      text: "Events",
      icon: <img src="/assets/images/eventIcon.svg" alt="Event" />,
      link: "/events",
    },
    {
      text: "Team Member",
      icon: <img src="/assets/images/teamIcon.svg" alt="Team-Member" />,
      link: "/team",
    },
    {
      text: "Subscription",
      icon: <img src="/assets/images/subscriptionIcon.svg" alt="Subscription" />,
      link: "/subscriptions",
    },
    {
      text: "Transaction",
      icon: <img src="/assets/images/receipt.svg" alt="receipt" />,
      link: "/transactions",
    },
    {
      text: "Setting",
      icon: <img src="/assets/images/settingIcon.svg" alt="Setting" />,
      link: "/setting",
    },
  ];

  const drawerContent = (
    <Box
      className="sidebar-content"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <Box>
        {/* Header with Title and Close Button */}
        <Box className="sidebar-header">
          <Typography
            variant="h5"
            className="sidebar-title"
          >
            Invito
          </Typography>
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(false)}>
              <CloseIcon sx={{ mb: 2, color: "#090415" }} />
            </IconButton>
          )}
        </Box>

        {/* Navigation Items */}
        <List className="sidebar-list">
          {navItems.map((item, index) => (
            <ListItem
              button
              key={index}
              className={`sidebar-item ${
                // Mark Events active if path starts with /events OR is add/edit event
                (item.link === "/events" &&
                  (location.pathname.startsWith("/events") ||
                    location.pathname.startsWith("/addevent"))) ||
                  // Normal exact match for others
                  location.pathname === item.link
                  ? "active"
                  : ""
                }`}
              component={Link}
              to={item.link}
              onClick={() => isMobile && setMobileOpen(false)}
            >
              <ListItemIcon className="sidebar-icon">{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                className="sidebar-menu-text"
              />
            </ListItem>
          ))}
        </List>
      </Box>
      {/* Powered By nexplat.sa at the bottom */}
      <Box
        sx={{
          width: "100%",
          textAlign: "center",
          pb: 4, // Increased bottom padding for more margin at the bottom
          pt: 1,
          //margin increase from bottom
          marginBottom: "10px",
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "#7954D9",
            fontWeight: 300, // Very light font weight
            fontSize: "0.95rem",
            letterSpacing: "0.02em",
            opacity: 0.7, // Lighter appearance
          }}
        >
          Powered by{" "}
          <a
            href="https://nexplat.sa"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#7954D9",
              fontWeight: 300,
              // underline
              textDecoration: "underline",
            }}
          >
            nexplat.sa
          </a>
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {isMobile ? (
        <>
          {!mobileOpen && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={() => setMobileOpen(true)}
              sx={{ m: 2, position: "fixed", top: 0, left: 0, zIndex: 2000 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Drawer
            anchor="left"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              "& .MuiDrawer-paper": {
                minWidth: 240,
                padding: 2,
                background: "#EEEAFA",
              },
            }}
          >
            {drawerContent}
          </Drawer>
        </>
      ) : (
        <Box
          className="sidebar"
          sx={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 240,
            background: "#EEEAFA",
            boxSizing: "border-box",
          }}
        >
          {drawerContent}
        </Box>
      )}
    </>
  );
};

export default Sidebar;
