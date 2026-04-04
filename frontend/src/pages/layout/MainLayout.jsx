import React from "react";
import { Outlet } from 'react-router-dom';
import { Grid, Box } from '@mui/material';
import Sidebar from "../../components/layout/sidebar/Sidebar";
import Header from "../../components/layout/header/Header";

const MainLayout = () => {
  return (
    <Grid container sx={{ height: '100vh' }}>
      <Grid item className="sidebar-section" size={{ lg: 2.4, md: 2.4, sm: 0 }}>
        <Sidebar />
      </Grid>
      <Grid className="header-section" size={{ lg: 9.6, md: 9.6, sm: 12 }} item>
        {/* Header */}
        <Box className="sub-section-1">
          <Header />
        </Box>

        {/* Page Content */}
        <Box className="sub-section-2"
        >
          <Outlet />
        </Box>
      </Grid>
    </Grid>
  );
};

export default MainLayout;
