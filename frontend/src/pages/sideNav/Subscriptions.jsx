import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Button,
  Grid,
  Chip,
  Container,
  Fade,
  Zoom,
  useTheme,
  Stack,
  Avatar,
  Alert,
} from "@mui/material";
import {
  CalendarToday as CalendarTodayIcon,
  People as PeopleIcon,
  CreditCard as CreditCardIcon,
  StarBorder as StarBorderIcon,
  Star as StarIcon,
  Payment as PaymentIcon,
} from "@mui/icons-material";
import {
  cancelSubscribe,
  getAllPlan,
  getAllUsers,
  getUser,
} from "../../services/auth";
import axios from "axios";

const SubscriptionPlans = () => {
  const theme = useTheme();
  const currentPlanRef = useRef(null);
  const [showCurrentPlan, setShowCurrentPlan] = useState(false);
  const [scriptError, setScriptError] = useState(null);
  const [user, setUser] = useState(null);
  const [userCurrent, setUserCurrent] = useState(null);
  const [users, setUsers] = useState([]);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(null);
  const [plans, setAllPlans] = useState([]);

  // Fixed function to check if user should see plan selection
  const shouldShowPlanSelection = () => {
    // Show plans if:
    // 1. No subscription exists
    // 2. Subscription is cancelled
    // 3. Subscription is not active
    // 4. User clicked "Upgrade Plan" button
    return !user?.subscription || 
           !user.subscription.planName || 
           user.subscription.iscancelled ||
           !user.subscription.isActive ||
           Object.keys(user.subscription).length === 0 ||
           showCurrentPlan;
  };

  // Function to check if user has an active subscription (for showing current plan card)
  const hasActiveSubscription = () => {
    return user?.subscription && 
           user.subscription.planName && 
           !user.subscription.iscancelled &&
           user.subscription.isActive &&
           Object.keys(user.subscription).length > 0;
  };

  // Function to fetch user data
  const fetchUser = async () => {
    try {
      const currentUser = await getUser();
      setUser(currentUser);
      setUserCurrent(currentUser);
      return currentUser;
    } catch (error) {
      console.error("Error fetching user data:", error);
      setScriptError("Failed to fetch user data.");
      return null;
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers();
        if (response) {
          setUsers(response);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();

    const getAllPlans = async () => {
      try {
        const myplans = await getAllPlan();
        setAllPlans(myplans);
      } catch (error) {
        console.error(error);
      }
    };
    getAllPlans();

    const checkMoyasar = setInterval(() => {
      try {
        if (window.Moyasar) {
          setScriptError(null);
          clearInterval(checkMoyasar);
        } else if (attempts >= maxAttempts) {
          setScriptError("❌ Moyasar script failed to load within timeout");
          clearInterval(checkMoyasar);
        }
      } catch (err) {
        setScriptError(`Error loading Moyasar: ${err.message || err}`);
        clearInterval(checkMoyasar);
      }
      attempts += 1;
    }, 1000);
    return () => clearInterval(checkMoyasar);
  }, []);

  const currentPlan = {
    name: user?.subscription?.planName || "Free Plan",
    seats: 1,
    nextBillingDate: user?.subscription?.endDate
      ? new Date(user.subscription.endDate).toLocaleDateString()
      : "Not Active",
    billingCycle: "Monthly",
    cardEnding: user?.subscription?.source?.last4 || "N/A",
    status: user?.subscription?.iscancelled ? "Cancelled" : "Active",
  };

  const handleUpgradeClick = () => {
    setShowCurrentPlan(true);
    setTimeout(() => {
      if (currentPlanRef.current) {
        currentPlanRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 1000);
  };

const startMoyasarPayment = async (price, planTitle, planId) => {
  if (!window.Moyasar) {
    setScriptError("Moyasar script is not loaded. Please try again later.");
    return { success: false, error: "Moyasar script not loaded" };
  }

  const userId = localStorage.getItem("userId");
  if (!userId) {
    setScriptError("User ID not found. Please log in again.");
    return { success: false, error: "User ID not found" };
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    setScriptError("Authentication token not found. Please log in again.");
    return { success: false, error: "Authentication token not found" };
  }

  console.log(`planId: ${planId}`);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;


  try {
    if (userCurrent?.subscription?.source?.token && !userCurrent?.subscription?.iscancelled) {
      const response = await axios.post(
        `${BACKEND_URL}/api/moyasar/upgrade`,
        { planId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.requiresAction) {
        window.location.href = response.data.transactionUrl;
        return { success: false, requiresAction: true };
      } else if (response.data.requiresForm) {
        window.location.href = response.data.paymentFormUrl;
        return { success: false, requiresForm: true };
      } else if (response.data.success) {
        const successUrl = new URL(`${FRONTEND_URL}/PaymentSuccess`);
        successUrl.searchParams.append("status", "success");
        successUrl.searchParams.append("paymentId", response.data.payment.id);
        successUrl.searchParams.append("userId", response.data.userId);
        successUrl.searchParams.append("planTitle", planTitle);
        successUrl.searchParams.append(
          "amount",
          (response.data.payment.amount / 100).toFixed(2)
        );
        successUrl.searchParams.append("date", new Date().toISOString());
        if (response.data.cardToken) {
          successUrl.searchParams.append("token", response.data.cardToken);
        }
        window.location.href = successUrl.toString();
        return { success: true, data: response.data };
      } else {
        const failUrl = new URL(`${FRONTEND_URL}/PaymentFailed`);
        failUrl.searchParams.append(
          "reason",
          response.data.error || "Payment failed"
        );
        window.location.href = failUrl.toString();
        return { success: false, error: response.data.error };
      }
    } else {
      const response = await axios.get(
      `${BACKEND_URL}/api/moyasar/payment-form?planId=${planId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Render the HTML response returned by backend
    const newWindow = window.open("", "_blank");
    newWindow.document.write(response.data);
    newWindow.document.close();

    return { success: false, requiresForm: true };
    }
  } catch (error) {
    setScriptError("Something went wrong while starting payment.");
    const failUrl = new URL(`${FRONTEND_URL}/PaymentFailed`);
    failUrl.searchParams.append(
      "reason",
      error.response?.data?.error || error.message
    );
    window.location.href = failUrl.toString();
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};


  const handleCancelSubscription = async () => {
    setLoadingDelete(true);
    setDeleteError(null);
    setDeleteSuccess(null);
    try {
      console.log("Initiating cancelSubscribe API call...");
      const response = await cancelSubscribe();
      console.log("Cancel response:", response);

      if (response.status === 200) {
        // Re-fetch user data to ensure frontend state is in sync with backend
        const updatedUser = await fetchUser();
        if (updatedUser?.subscription?.iscancelled) {
          setDeleteSuccess("Subscription cancelled successfully.");
          // Don't automatically show plan selection, let user decide
        } else {
          throw new Error("Backend did not update cancellation status.");
        }
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      console.error(
        "Cancellation error:",
        error.response?.data || error.message
      );
      setDeleteError(
        `Failed to cancel subscription: ${error.message || "Unknown error"}`
      );
      // Re-fetch user data to check if cancellation was processed despite the error
      const updatedUser = await fetchUser();
      if (updatedUser?.subscription?.iscancelled) {
        setDeleteSuccess(
          "Subscription cancelled successfully (confirmed by backend)."
        );
        setDeleteError(null); // Clear error if cancellation was successful
      }
    } finally {
      setLoadingDelete(false);
    }
  };

  const details = [
    {
      title: "Total Seats",
      value: users.length,
      icon: <PeopleIcon />,
      color: theme.palette.primary.main,
    },
    {
      title: "Current Plan",
      value: user?.subscription?.planName || "Free Plan",
      subtext: "",
      icon: <CreditCardIcon />,
      color: theme.palette.secondary.main,
    },
    {
      title: "Next Billing",
      value: user?.subscription?.endDate
        ? new Date(user.subscription.endDate).toLocaleDateString()
        : "Not Active",
      subtext: "",
      icon: <CalendarTodayIcon />,
      color: theme.palette.info.main,
    },
    {
      title: "Billing Cycle",
      value: currentPlan.billingCycle,
      subtext: "",
      icon: <PaymentIcon />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4, bgcolor: "grey.100" }}>
      <Fade in timeout={1000}>
        <Box>
          {scriptError && (
            <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
              {scriptError}
            </Alert>
          )}
          {deleteError && (
            <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
              {deleteError}
            </Alert>
          )}
          {deleteSuccess && (
            <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
              {deleteSuccess}
            </Alert>
          )}
          
          <div>
            {/* Always show current plan card if user has subscription (active or cancelled) */}
            {user?.subscription?.planName && (
              <Card
                sx={{
                  width: "100%",
                  maxWidth: "1280px",
                  borderRadius: 4,
                  boxShadow: theme.shadows[4],
                  background: "white",
                  transition: "all 0.3s ease",
                  mb: 4,
                  "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    mb={4}
                  >
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: 1.2,
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      Plans & Billing
                    </Typography>
                    <Chip
                      label={user?.subscription?.iscancelled ? "Cancelled Plan" : "Active Plan"}
                      sx={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        px: 2,
                        py: 2.5,
                        borderRadius: 2,
                        bgcolor: user?.subscription?.iscancelled ? "error.main" : "success.main",
                        color: "white",
                      }}
                    />
                  </Stack>

                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 5, lineHeight: 1.7, fontSize: "1.1rem" }}
                  >
                    Manage your subscription, review billing details, and explore upgrade options tailored to your needs.
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      mb: 3,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      color: "text.primary",
                    }}
                  >
                    <StarIcon sx={{ fontSize: 25, color: theme.palette.warning.main }} />
                    Your Current Plan
                  </Typography>

                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {details.map((item, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Card
                          style={{ width: "100%", display: "flex", justifyContent: "center" }}
                          sx={{
                            height: "120px",
                            minWidth: "160px",
                            borderRadius: 3,
                            boxShadow: theme.shadows[3],
                            background: "white",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              boxShadow: theme.shadows[6],
                              transform: "translateY(-4px)",
                            },
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                              <Avatar
                                sx={{
                                  bgcolor: item.color,
                                  width: 38,
                                  height: 38,
                                  color: theme.palette.common.white,
                                }}
                              >
                                {item.icon}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  {item.title}
                                </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: "text.primary" }}>
                                  {item.value}
                                </Typography>
                              </Box>
                            </Stack>
                            {item.subtext && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                {item.subtext}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Divider sx={{ my: 4, borderColor: theme.palette.divider }} />

                  <Grid container spacing={3} alignItems="center">
                    <Grid
                      item
                      xs={12}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Stack direction="row" spacing={2}>
                        <div
                          style={{
                            width: "65vw",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "20px",
                          }}
                        >
                          {/* Show different buttons based on subscription status */}
                          {user?.subscription?.iscancelled ? (
                            // If cancelled, show reactivate/choose new plan button
                            <Button
                              variant="contained"
                              color="primary"
                              size="large"
                              onClick={handleUpgradeClick}
                              endIcon={<StarBorderIcon />}
                              sx={{
                                py: 1.5,
                                px: 4,
                                fontWeight: 600,
                                borderRadius: 2,
                                boxShadow: theme.shadows[3],
                                "&:hover": {
                                  boxShadow: theme.shadows[6],
                                  transform: "translateY(-2px)",
                                },
                              }}
                            >
                              Reactivate / Choose New Plan
                            </Button>
                          ) : (
                            // If active, show upgrade and cancel buttons
                            <>
                              <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                onClick={handleUpgradeClick}
                                endIcon={<StarBorderIcon />}
                                sx={{
                                  py: 1.5,
                                  px: 4,
                                  fontWeight: 600,
                                  borderRadius: 2,
                                  boxShadow: theme.shadows[3],
                                  "&:hover": {
                                    boxShadow: theme.shadows[6],
                                    transform: "translateY(-2px)",
                                  },
                                }}
                              >
                                Upgrade Plan
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="large"
                                onClick={handleCancelSubscription}
                                disabled={loadingDelete}
                                sx={{
                                  py: 1.5,
                                  px: 4,
                                  fontWeight: 600,
                                  borderRadius: 2,
                                  border: `2px solid ${theme.palette.error.main}`,
                                  color: theme.palette.error.main,
                                  backgroundColor: "white",
                                  boxShadow: theme.shadows[2],
                                  "&:hover": {
                                    backgroundColor: "#faebef",
                                    transform: "translateY(-2px)",
                                  },
                                }}
                              >
                                {loadingDelete ? "Cancelling..." : "Cancel Subscription"}
                              </Button>
                            </>
                          )}
                        </div>
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Show plan selection when appropriate */}
            {shouldShowPlanSelection() && (
              <>
                <Box ref={currentPlanRef} textAlign="center" mb={6} mt={8}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                      position: "relative",
                      display: "inline-block",
                      color: "text.primary",
                      "&:after": {
                        content: '""',
                        position: "absolute",
                        bottom: -8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 80,
                        height: 4,
                        borderRadius: 2,
                        bgcolor: theme.palette.primary.main,
                      },
                    }}
                  >
                    Choose Your Plan
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: "1.1rem" }}>
                    Select a plan that best fits your business needs
                  </Typography>
                </Box>

                <Grid container spacing={3} justifyContent="center">
                  {plans.map((plan, index) => (
                    <Zoom in timeout={800 + index * 200} key={plan._id || index}>
                      <Grid item xs={12} sm={6} lg={4}>
                        <Card
                          sx={{
                            boxSizing: "border-box",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            padding: "24px",
                            width: "320px",
                            height: "520px",
                            background: "white",
                            border: `2px solid ${theme.palette.grey[200]}`,
                            boxShadow: theme.shadows[4],
                            borderRadius: "16px",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              transform: "translateY(-6px)",
                              boxShadow: theme.shadows[8],
                              borderColor: theme.palette.primary.main,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "row",
                              alignItems: "center",
                              paddingBottom: "16px",
                              gap: "12px",
                              width: "100%",
                              borderBottom: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: "26px",
                                lineHeight: "36px",
                                color: theme.palette.text.primary,
                                flexGrow: 1,
                              }}
                            >
                              {plan.name}
                            </Typography>
                            <Chip
                              label={`${plan.price / 100} SAR`}
                              size="small"
                              sx={{
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                color: "white",
                                fontWeight: 600,
                                px: 2,
                              }}
                            />
                          </Box>

                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "24px",
                              width: "100%",
                              flexGrow: 1,
                              mt: 3,
                            }}
                          >
                            {plan.features.map((feature, i) => (
                              <Box
                                key={i}
                                sx={{
                                  display: "flex",
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    width: "16px",
                                    height: "14px",
                                    backgroundColor: theme.palette.primary.main,
                                    maskImage:
                                      "url('data:image/svg+xml;utf8,<svg fill=%22white%22 viewBox=%220 0 16 16%22 xmlns=%22http://www.w3.org/2000/svg%22><path d=%22M6 10l-3-3 1.4-1.4L6 7.2l5.6-5.6L13 3l-7 7z%22/></svg>')",
                                    WebkitMaskRepeat: "no-repeat",
                                    WebkitMaskSize: "contain",
                                  }}
                                />
                                <Typography
                                  sx={{
                                    fontFamily: "Manrope",
                                    fontWeight: 400,
                                    fontSize: "16px",
                                    lineHeight: "22px",
                                    color: theme.palette.text.primary,
                                  }}
                                >
                                  {feature}
                                </Typography>
                              </Box>
                            ))}
                          </Box>

                          <Box sx={{ width: "100%" }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "4px",
                                mb: 2,
                                whiteSpace: "nowrap",
                              }}
                            >
                              <Typography
                                sx={{
                                  fontFamily: "Manrope",
                                  fontWeight: 700,
                                  fontSize: "18px",
                                  lineHeight: "24px",
                                  color: theme.palette.primary.main,
                                }}
                              >
                                {plan.price / 100} SAR
                              </Typography>
                              <Typography
                                sx={{
                                  fontFamily: "Manrope",
                                  fontWeight: 600,
                                  fontSize: "16px",
                                  lineHeight: "22px",
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                {plan.durationInDays} days
                              </Typography>
                            </Box>

                            <Button
                              fullWidth
                              onClick={() =>
                                startMoyasarPayment(
                                  plan.price,
                                  plan.name,
                                  plan._id
                                )
                              }
                              disabled={hasActiveSubscription() && (user?.subscription?.planId === plan._id)}
                              sx={{
                                padding: "12px 16px",
                                borderRadius: "12px",
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: "16px",
                                lineHeight: "22px",
                                color: "white",
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                "&:hover": {
                                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                                  transform: "translateY(-2px)",
                                },
                                "&:disabled": {
                                  background: theme.palette.grey[400],
                                  color: theme.palette.grey[600],
                                },
                              }}
                            >
                              {hasActiveSubscription() && user?.subscription?.planId === plan._id
                                ? "Current Plan"
                                : user?.subscription?.iscancelled && user?.subscription?.planId === plan._id
                                ? "Reactivate Plan"
                                : "Choose Plan"}
                            </Button>
                          </Box>
                        </Card>
                      </Grid>
                    </Zoom>
                  ))}
                </Grid>
              </>
            )}
          </div>

          <div
            className="mysr-form"
            style={{ marginTop: "20px", minHeight: "100px" }}
          ></div>
        </Box>
      </Fade>
    </Container>
  );
};

export default SubscriptionPlans;
