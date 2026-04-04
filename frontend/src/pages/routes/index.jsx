import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import PrivateRoute from "../../components/PrivateRoute";
const MainLayout = lazy(() => import("../layout/MainLayout"));
const Dashboard = lazy(() => import("../sideNav/Dashboard"));
const Event = lazy(() => import("../sideNav/Event"));
const AddEvent = lazy(() => import("../sideNav/AddEvent"));
const TeamMember = lazy(() => import("../sideNav/TeamMember"));
const Setting = lazy(() => import("../sideNav/Setting"));
const Login = lazy(() => import("../auth/login/Login"));
const SignUp = lazy(() => import("../auth/signup/SignUp"));
const ResetPassword = lazy(() => import("../auth/resetpassword/ResetPassword"));
const ForgotPassword = lazy(() => import("../auth/forgotpassword/ForgotPassword"));
const VerifyEmail = lazy(() => import("../auth/VerifyEmail"));
const VerifyToken = lazy(() => import("../../components/verifyEmail/VerifyToken"));
const PasswordReset = lazy(() => import("../auth/login/PasswordReset"));
const EventDetails = lazy(() => import("../EventDetails"));
const UnsubscribePage = lazy(() => import("../UnsubscribePage"));
const EventTemplate = lazy(() => import("../EventTemplate.jsx"));
const Subscriptions = lazy(() => import("../../pages/sideNav/Subscriptions.jsx"));
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
const PaymentSuccess = lazy(() => import("../PaymentSuccess.jsx"));
const PaymentFailed = lazy(() => import("../PaymentFailed.jsx"));
const Transcition = lazy(() => import("../../pages/sideNav/Transcition.jsx"));

const RouteFallback = () => <div style={{ padding: "2rem" }}>Loading...</div>;

const AppRoutes = () => (
  <>
    <ToastContainer/>
    <Suspense fallback={<RouteFallback />}>
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
    </Suspense>
  </>
);

export default AppRoutes;
