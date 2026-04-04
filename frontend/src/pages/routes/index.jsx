import React from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../../components/PrivateRoute";
import MainLayout from "../layout/MainLayout";
import Dashboard from "../sideNav/Dashboard";
import Event from "../sideNav/Event";
import AddEvent from "../sideNav/AddEvent";
import TeamMember from "../sideNav/TeamMember";
import Setting from "../sideNav/Setting";
import Login from "../auth/login/Login";
import SignUp from "../auth/signup/SignUp";
import ResetPassword from "../auth/resetpassword/ResetPassword";
import ForgotPassword from "../auth/forgotpassword/ForgotPassword";
import VerifyEmail from "../auth/VerifyEmail";
import VerifyToken from "../../components/verifyEmail/VerifyToken";
import PasswordReset from "../auth/login/PasswordReset";
import EventDetails from "../EventDetails";
import UnsubscribePage from "../UnsubscribePage";
import EventTemplate from "../EventTemplate.jsx";
import Subscriptions from "../../pages/sideNav/Subscriptions.jsx"; // ✅ Correct
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import PaymentSuccess from "../PaymentSuccess.jsx";
import PaymentFailed from "../PaymentFailed.jsx";
import Transcition from "../../pages/sideNav/Transcition.jsx"
const AppRoutes = () => (
  <>
    <ToastContainer/>
    <Routes>
    {/* Public routes */}
    <Route path="/" element={<Login />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/resetpassword" element={<ResetPassword />} />
    <Route path="/verifyemail" element={<VerifyEmail />} />
    <Route path="/verifyToken" element={<VerifyToken />} />
    <Route path="/forgotpassword" element={<ForgotPassword />} />
    <Route path="/EventTemplate" element={<EventTemplate />} />
    <Route path="/setnewpassword" element={<PasswordReset />} />
    <Route path="/EventDetails" element={<EventDetails />} />
    <Route path="/unsubscribe/:contectId" element={<UnsubscribePage />} />
    <Route path="/PaymentSuccess" element={<PaymentSuccess />} />
    <Route path="/PaymentFailed" element={<PaymentFailed />} />

    {/* Private routes */}
    <Route
      path="/*"
      element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }
    >
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="events" element={<Event />} />
      <Route path="addevent" element={<AddEvent />} />
      <Route path="addevent/:id" element={<AddEvent />} />
      <Route path="addevent/:id/edit" element={<AddEvent />} />
      <Route path="team" element={<TeamMember />} />
      <Route path="setting" element={<Setting />} />
      <Route path="subscriptions" element={<Subscriptions />} />
      <Route path="transactions" element={<Transcition />} />
      <Route path="*" element={<div>Page Not Found</div>} />
    </Route>
  </Routes>
  </>
);

export default AppRoutes;
