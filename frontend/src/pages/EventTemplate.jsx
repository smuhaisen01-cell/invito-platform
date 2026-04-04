import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Stack,
  Avatar,
  Chip,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  Grow
} from "@mui/material";
import {
  CheckCircleOutline as CheckCircleOutlineIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Event as EventIcon
} from '@mui/icons-material';
import axios from "axios";
import { styled } from '@mui/material/styles';
const API_BASE_URL = import.meta.env.VITE_MAIN_URL;


const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  background: 'linear-gradient(to bottom right, #ffffff, #f5f7fa)',
  position: 'relative',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '8px',
    background: 'linear-gradient(to right, #3f51b5, #2196f3)'
  }
}));

const EventHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  '& .MuiAvatar-root': {
    backgroundColor: theme.palette.primary.main,
    marginRight: theme.spacing(2),
    width: 60,
    height: 60
  }
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2),
  '& .MuiSvgIcon-root': {
    color: theme.palette.primary.main,
    marginRight: theme.spacing(1.5),
    marginTop: theme.spacing(0.5)
  }
}));

const SuccessBadge = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: theme.spacing(2, 4),
  borderRadius: '20px',
  backgroundColor: 'rgba(46, 125, 50, 0.1)',
  marginTop: theme.spacing(2)
}));

const EventTemplate = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const queryParams = new URLSearchParams(location.search);
  const contactId = queryParams.get("contactId");
  const eventId = queryParams.get("eventId");
  const source = queryParams.get("source");

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setError("Missing eventId parameter in URL");
      setLoading(false);
      return;
    }

    const fetchEventAndMarkScan = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `${API_BASE_URL}/event/get/${eventId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        setEvent(response.data.event);

        await axios.post(
          `${API_BASE_URL}/event/markScanned`,
          { contactId, eventId,source },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setScanSuccess(true);
      } catch (err) {
        setError("Failed to load event data or update scan status: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndMarkScan();
  }, [eventId, contactId, source]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Fade in={true}>
          <CircularProgress size={60} thickness={4} color="primary" />
        </Fade>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Slide direction="down" in={true}>
          <StyledPaper>
            <Typography color="error" variant="h6" align="center">
              {error}
            </Typography>
          </StyledPaper>
        </Slide>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Slide direction="down" in={true}>
          <StyledPaper>
            <Typography variant="h6" align="center">
              No event data found.
            </Typography>
          </StyledPaper>
        </Slide>
      </Container>
    );
  }

  const formattedDate = event.eventDateTime 
    ? new Date(event.eventDateTime).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : "To be determined";

  return (
    <Container
      maxWidth="sm"
      sx={{
        mt: isMobile ? `calc(2 * 8px + 40px)` : 6, // 2*8px (theme spacing) + 20px extra for mobile
        mb: 6,
      }}
    >
      <Grow in={true}>
        <StyledPaper sx={{ position: "relative", overflow: "visible", pb: 4 }}>
          {/* Top Center Tick and "Scanned" */}
          {scanSuccess && (
            <Box
              sx={{
                position: "absolute",
                top: -48,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 2,
                width: "100%",
              }}
            >
              <Avatar
                sx={{
                  bgcolor: "#43a047",
                  width: 72,
                  height: 72,
                  boxShadow: 3,
                  mb: 1,
                }}
              >
                <CheckCircleOutlineIcon sx={{ fontSize: 48, color: "#fff" }} />
              </Avatar>
              <Typography
                variant="h6"
                fontWeight="bold"
                color="success.main"
                sx={{
                  letterSpacing: 1,
                  textShadow: "0 2px 8px rgba(67,160,71,0.12)",
                  mb: 1,
                }}
              >
                Scan Successfully
              </Typography>
            </Box>
          )}

          {/* Title and Time with Good UI */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mt: scanSuccess ? 8 : 2,
              mb: 3,
            }}
          >
            <Typography
              variant="h4"
              component="h1"
              fontWeight={700}
              sx={{
                color: theme.palette.primary.main,
                textAlign: "center",
                mb: 1,
                letterSpacing: 0.5,
              }}
            >
              {event.title || "Event"}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 1,
              }}
            >
              <CalendarIcon sx={{ color: theme.palette.primary.light, mr: 0.5 }} />
              <Typography
                variant="subtitle1"
                fontWeight={500}
                sx={{
                  color: theme.palette.text.secondary,
                  letterSpacing: 0.2,
                }}
              >
                {formattedDate}
              </Typography>
            </Box>
            {event.category && (
              <Chip
                label={event.category}
                size="small"
                sx={{
                  backgroundColor: theme.palette.primary.light,
                  color: "white",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  mt: 0.5,
                }}
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Location */}
          <Box mt={2}>
            <InfoItem>
              <LocationIcon />
              <Box>
                <Typography variant="subtitle1" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {event.location || "To be determined"}
                </Typography>
              </Box>
            </InfoItem>
          </Box>

          {/* Remove Description Section */}

          {/* Scan Success Message (bottom, if needed) */}
          {scanSuccess && (
            <Box mt={4} textAlign="center">
              <Typography
                variant="body1"
                color="success.main"
                fontWeight="bold"
                sx={{ mb: 1 }}
              >
                You're checked in!
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Please present this confirmation at the event for entry.
              </Typography>
            </Box>
          )}

          <Box mt={4} textAlign="center">
            <Typography variant="caption" color="text.secondary">
              Event ID: {eventId}
            </Typography>
          </Box>
        </StyledPaper>
      </Grow>
    </Container>
  );
};

export default EventTemplate;
