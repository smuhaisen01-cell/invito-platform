import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  Avatar,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { toast } from "react-toastify";

// Static fallback image URL
const STATIC_IMAGE_URL =
  "https://res.cloudinary.com/dsu49fx2b/image/upload/v1754460585/WhatsApp_Image_2025-08-06_at_10.42.11_AM_mvx3c4.jpg";
const API_BASE_URL = import.meta.env.VITE_MAIN_URL;

function EventDetails() {
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [source, setSource] = useState("");
  const [contactId, setContactId] = useState("");
  const [contactData, setContactData] = useState(null);
  const authToken = localStorage.getItem("authToken");

  // Extract URL parameters and fetch event data
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get("eventId") || "";
    const contactId = urlParams.get("contactId") || "";
    const source = urlParams.get("source") || "";

    setContactId(contactId);
    setSource(source);

    const fetchEvent = async () => {
      if (!eventId) {
        setError("Missing eventId in URL.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/event/get/${eventId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          params: { contactId },
        });


        setEventData(res.data.event);
      } catch (err) {
        toast.error(" "+err.response?.data?.message ||err.message );

        setError(
          err.response?.data?.message ||
          err.message ||
          "Could not fetch event details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [authToken]);

  // Fetch user data
  useEffect(() => {
    if (!contactId) return;

    const getUser = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/event/getUserById/${contactId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        setContactData(response.data.data);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to fetch user details."
        );
        toast.error(" "+error.response?.data?.message ||error.message );
      }
    };

    getUser();
  }, [contactId, authToken]);

  const handleAcceptInvitation = async () => {
    if (!contactId) {
      setError("contactId missing in URL");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/event/updatedUserInvition`,
        { contactId, approved: true },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (res.status === 200) {
        setAccepted(true);
        setDeclined(false);
      } else {
        throw new Error("Failed to update contact");

      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Error updating contact."
      );
      toast.error("Error updating contact"+err.response?.data?.message ||err.message );
    }
  };

  const handleAskMeLaterInvitation = async () => {
    if (!contactId) {
      setError("contactId missing in URL");
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/event/updateEmailUnsubscribe`,
        { contactId, isSubscribed: true, source },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (res.status === 200) {
        setDeclined(true);
        setAccepted(false);
      } else {
        throw new Error("Failed to update email subscription");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Error updating contact."
      );
      toast.error("Error updating contact"+err.response?.data?.message ||err.message );
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #f5f0ff 0%, #e8f0ff 100%)",
        }}
      >
        <CircularProgress sx={{ color: "#7b5bf2" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #f5f0ff 0%, #e8f0ff 100%)",
        }}
      >
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f0ff 0%, #e8f0ff 100%)",
        position: "relative",
        overflow: "hidden",
        p: 2,
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {/* Decorative elements */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(123, 91, 242, 0.1) 0%, transparent 50%)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "-100px",
          right: "-100px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(123, 91, 242, 0.15) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: "-50px",
          left: "-50px",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(123, 91, 242, 0.1) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />

      <Card
        sx={{
          width: { xs: "100%", sm: "90%", md: "500px" },
          maxWidth: "500px",
          boxShadow: "0 10px 30px rgba(123, 91, 242, 0.2)",
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
          position: "relative",
          zIndex: 1,
          border: "1px solid rgba(255, 255, 255, 0.3)",
          overflow: "hidden",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Box sx={{ position: "relative", height: "250px", overflow: "hidden" }}>
          <CardMedia
            component="img"
            height="100%"
            image={eventData?.whatsapp?.imageUrl || STATIC_IMAGE_URL}
            alt={eventData?.title || "Event Image"}
            sx={{
              objectFit: "cover",
              transition: "transform 0.5s ease",
              "&:hover": { transform: "scale(1.05)" },
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60px",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
              display: "flex",
              alignItems: "flex-end",
              p: 2,
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: "white",
                fontWeight: 700,
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              }}
            >
              {eventData?.title || "Event"}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <Grid container spacing={2} my={2} justifyContent="center">
            <Grid item>
              <Chip
                icon={<span style={{ marginRight: "5px" }}>📅</span>}
                label={
                  eventData?.eventDateTime
                    ? new Date(eventData.eventDateTime).toLocaleDateString(
                        "en-GB",
                        { timeZone: "Asia/Riyadh" }
                      )
                    : "-"
                }
                variant="outlined"
                sx={{
                  borderColor: "#7b5bf2",
                  color: "#7b5bf2",
                  background: "rgba(123, 91, 242, 0.1)",
                }}
              />
            </Grid>
            <Grid item>
              <Chip
                icon={<span style={{ marginRight: "5px" }}>🕒</span>}
                label={
                  eventData?.eventDateTime
                    ? new Date(eventData.eventDateTime).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Riyadh",
                        }
                      )
                    : "-"
                }
                variant="outlined"
                sx={{
                  borderColor: "#7b5bf2",
                  color: "#7b5bf2",
                  background: "rgba(123, 91, 242, 0.1)",
                }}
              />
            </Grid>
            <Grid item>
              {eventData?.locationLink ? (
                <a
                  href={eventData.locationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <Chip
                    icon={<span style={{ marginRight: "5px" }}>📍</span>}
                    label={eventData?.location || "-"}
                    variant="outlined"
                    sx={{
                      borderColor: "#7b5bf2",
                      color: "#7b5bf2",
                      background: "rgba(123, 91, 242, 0.1)",
                      cursor: "pointer",
                    }}
                  />
                </a>
              ) : (
                <Chip
                  icon={<span style={{ marginRight: "5px" }}>📍</span>}
                  label={eventData?.location || "-"}
                  variant="outlined"
                  sx={{
                    borderColor: "#7b5bf2",
                    color: "#7b5bf2",
                    background: "rgba(123, 91, 242, 0.1)",
                  }}
                />
              )}
            </Grid>
          </Grid>

          <Typography
            variant="body1"
            sx={{ color: "#555", mt: 3, textAlign: "center", lineHeight: 1.6 }}
          >
            {(eventData?.description || "No description available.").split(/\\n|\n/).map((line, idx) => (
              <span key={idx}>
                {line}
                <br />
              </span>
            ))}
          </Typography>

          {eventData?.footerText && (
            <Typography
              variant="caption"
              sx={{
                color: "#888",
                display: "block",
                mt: 2,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              {eventData.footerText}
            </Typography>
          )}

          <Box my={3} textAlign="center">
            <Typography
              variant="subtitle1"
              sx={{ color: "#7b5bf2", fontWeight: 600, mb: 2 }}
            >
              Attending
            </Typography>
            <Box display="flex" justifyContent="center" alignItems="center">
              <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                {(eventData?.attendees || []).slice(0, 3).map((att, idx) => (
                  <Avatar
                    key={att.id || idx}
                    src={att.avatar}
                    alt={att.name || "Attendee"}
                    sx={{
                      ml: idx === 0 ? 0 : -1.5,
                      border: "2px solid white",
                      width: 40,
                      height: 40,
                    }}
                  />
                ))}
                {(eventData?.attendees || []).length > 3 && (
                  <Avatar
                    sx={{
                      ml: -1.5,
                      bgcolor: "#7b5bf2",
                      width: 40,
                      height: 40,
                      border: "2px solid white",
                    }}
                  >
                    +{(eventData?.attendees || []).length - 3}
                  </Avatar>
                )}
              </Box>
              <Chip
                label={`${eventData?.attendance || 0} attending`}
                size="small"
                sx={{
                  background: "#7b5bf2",
                  color: "#fff",
                  fontWeight: 500,
                }}
              />
            </Box>
          </Box>

          {(declined || contactData?.EmailUnsubscribe) && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                background: "rgba(123, 91, 242, 0.1)",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <Typography
                variant="body1"
                sx={{ color: "#7b5bf2", fontWeight: 500 }}
              >
                🙅 You've declined this event!
              </Typography>
            </Box>
          )}

          {(accepted || contactData?.isEmailApproved) && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                background: "rgba(123, 91, 242, 0.1)",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <Typography
                variant="body1"
                sx={{ color: "#7b5bf2", fontWeight: 500 }}
              >
                🎉 You're invited to this event!
              </Typography>
            </Box>
          )}

          {!(accepted || contactData?.isEmailApproved || declined || contactData?.EmailUnsubscribe) && (
            <Box
              mt={4}
              display="flex"
              gap={2}
              justifyContent="center"
              flexDirection={{ xs: "column", sm: "row" }}
            >
              <Button
                variant="contained"
                onClick={handleAcceptInvitation}
                sx={{
                  background:
                    "linear-gradient(135deg, #7b5bf2 0%, #5a3dc8 100%)",
                  color: "white",
                  borderRadius: "50px",
                  px: 4,
                  py: 1,
                  boxShadow: "0 4px 10px rgba(123, 91, 242, 0.3)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #6a4bd9 0%, #4a2cb7 100%)",
                    boxShadow: "0 6px 15px rgba(123, 91, 242, 0.4)",
                  },
                }}
              >
                Accept Invitation
              </Button>
              <Button
                variant="outlined"
                onClick={handleAskMeLaterInvitation}
                sx={{
                  borderColor: "#7b5bf2",
                  color: "#7b5bf2",
                  borderRadius: "50px",
                  px: 4,
                  py: 1,
                  "&:hover": {
                    borderColor: "#6a4bd9",
                    color: "#6a4bd9",
                    background: "rgba(123, 91, 242, 0.05)",
                  },
                }}
              >
                Ask Me Later
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default EventDetails;