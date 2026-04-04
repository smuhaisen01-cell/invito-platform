import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import {
  CalendarMonth,
  CheckCircleOutline,
  MailOutline,
  PersonOutline,
  ReceiptLong,
  WhatsApp,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { countTotalUsers, getUser } from "../../services/auth";

const cardSx = {
  borderRadius: 4,
  border: "1px solid #ece8fb",
  boxShadow: "0 12px 32px rgba(26, 14, 61, 0.06)",
};

const labelSx = {
  color: "#655b86",
  fontSize: "0.875rem",
};

const valueSx = {
  color: "#160d2f",
  fontWeight: 700,
  fontSize: "1rem",
};

const Setting = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const [currentUser, totalUsers] = await Promise.all([
          getUser(),
          countTotalUsers(),
        ]);
        setUser(currentUser);
        setMemberCount(totalUsers);
      } catch (err) {
        setError(err?.message || "Failed to load account settings.");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const subscriptionStatus = useMemo(() => {
    if (!user?.subscription || !user.subscription.planName) {
      return {
        label: "No active plan",
        color: "default",
        detail: "Upgrade to unlock full event and messaging capacity.",
      };
    }

    if (user.subscription.iscancelled || !user.subscription.isActive) {
      return {
        label: "Cancelled",
        color: "warning",
        detail: "The plan exists but is not currently active.",
      };
    }

    return {
      label: user.subscription.planName,
      color: "success",
      detail: "Your subscription is active.",
    };
  }, [user]);

  const integrations = [
    {
      label: "Email verification",
      active: Boolean(user?.emailVerify),
      helper: user?.emailVerify ? "Verified and ready for login flows." : "Email still needs verification.",
      icon: <MailOutline fontSize="small" />,
    },
    {
      label: "WhatsApp campaigns",
      active: Boolean(user?.whatsapp?.phoneNumberId || user?.whatsapp?.businessAccountId),
      helper: "Connect Meta WhatsApp credentials on the backend to activate campaigns.",
      icon: <WhatsApp fontSize="small" />,
    },
    {
      label: "Billing setup",
      active: Boolean(user?.subscription?.source?.last4 || user?.subscription?.source?.token),
      helper: "Moyasar payment method powers recurring plan upgrades.",
      icon: <ReceiptLong fontSize="small" />,
    },
  ];

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography color="text.secondary">Loading account settings...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, background: "#f8f7fd", minHeight: "100%" }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#160d2f" }}>
            Settings
          </Typography>
          <Typography sx={{ color: "#655b86", mt: 1, maxWidth: 680 }}>
            Manage your Invito workspace, see plan readiness, and check the integrations
            this account depends on.
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card sx={cardSx}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: "#160d2f" }}>
                      Workspace Overview
                    </Typography>
                    <Typography sx={{ color: "#655b86", mt: 0.5 }}>
                      A quick snapshot of the account currently signed in.
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={labelSx}>Name</Typography>
                      <Typography sx={valueSx}>{user?.name || "Not set"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={labelSx}>Email</Typography>
                      <Typography sx={valueSx}>{user?.email || "Not set"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={labelSx}>Role</Typography>
                      <Typography sx={valueSx}>{user?.role || "Owner"}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={labelSx}>Team members</Typography>
                      <Typography sx={valueSx}>{memberCount || 1}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={labelSx}>Remaining event trial</Typography>
                      <Typography sx={valueSx}>{user?.EventTrial ?? 0}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography sx={labelSx}>Subscription</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip
                          label={subscriptionStatus.label}
                          color={subscriptionStatus.color}
                          variant={subscriptionStatus.color === "default" ? "outlined" : "filled"}
                          size="small"
                        />
                        <Typography sx={{ color: "#655b86" }}>
                          {subscriptionStatus.detail}
                        </Typography>
                      </Stack>
                    </Grid>
                  </Grid>

                  <Divider />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Button variant="contained" onClick={() => navigate("/subscriptions")}>
                      Manage Subscription
                    </Button>
                    <Button variant="outlined" onClick={() => navigate("/team")}>
                      Manage Team
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card sx={{ ...cardSx, height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#160d2f" }}>
                    Workspace Health
                  </Typography>

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <PersonOutline sx={{ color: "#5829cf" }} />
                    <Box>
                      <Typography sx={labelSx}>Account owner</Typography>
                      <Typography sx={valueSx}>{user?.parentId ? "Team member" : "Primary workspace owner"}</Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CalendarMonth sx={{ color: "#5829cf" }} />
                    <Box>
                      <Typography sx={labelSx}>Event capacity</Typography>
                      <Typography sx={valueSx}>
                        {user?.EventTrial > 0 ? "You can still create trial events." : "Upgrade required for more events."}
                      </Typography>
                    </Box>
                  </Stack>

                  <Alert severity="info">
                    Messaging features depend on server-side credentials. Use the integration
                    checks below to see what still needs configuration.
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={cardSx}>
          <CardContent sx={{ p: 3 }}>
            <Stack spacing={2.5}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: "#160d2f" }}>
                Integrations
              </Typography>

              <Grid container spacing={2}>
                {integrations.map((item) => (
                  <Grid item xs={12} md={4} key={item.label}>
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: "1px solid #ece8fb",
                        background: item.active ? "#f2fcf5" : "#fbf9ff",
                        height: "100%",
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
                        {item.icon}
                        <Typography sx={{ fontWeight: 700, color: "#160d2f" }}>
                          {item.label}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                        <CheckCircleOutline
                          color={item.active ? "success" : "disabled"}
                          fontSize="small"
                        />
                        <Typography sx={{ color: item.active ? "#1f7a38" : "#655b86", fontWeight: 600 }}>
                          {item.active ? "Configured" : "Needs attention"}
                        </Typography>
                      </Stack>
                      <Typography sx={{ color: "#655b86" }}>{item.helper}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default Setting;
