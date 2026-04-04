import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ children }) => {
  const location = useLocation();
  const authToken = localStorage.getItem("authToken");
  const user = localStorage.getItem("user");

  if (!authToken || !user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  try {
    const decoded = jwtDecode(authToken);
    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      return <Navigate to="/" replace state={{ from: location }} />;
    }
  } catch {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default PrivateRoute; 
