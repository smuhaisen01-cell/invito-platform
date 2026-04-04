import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRoutes from "./pages/routes";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { LoadingProvider, useLoading } from "./context/LoadingContext";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import 'bootstrap/dist/css/bootstrap.min.css';


const theme = createTheme({
  // You can customize your MUI theme here
});

// Global loading overlay component
const GlobalLoadingOverlay = () => {
  const { loading } = useLoading();
  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 9999 }}
      open={loading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
};

const App = () => {
  return ( 
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LoadingProvider>
        <GlobalLoadingOverlay />
        <Router>
          <AppRoutes />
        </Router>
      </LoadingProvider>
    </ThemeProvider>
  );
};

export default App;
