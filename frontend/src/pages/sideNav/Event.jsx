import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Tooltip,
} from "@mui/material";
import { Add, Email, WhatsApp, MoreVert } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FileDownloadDoneIcon from "@mui/icons-material/FileDownloadDone";
import { getUser } from "../../services/auth.js";
dayjs.extend(utc);
import { toast } from "react-toastify";
// import { DataGridPremium, GridColDef, GridRowsProp } from '@mui/x-data-grid-premium';
dayjs.extend(timezone);
const cardImage =
  "https://res.cloudinary.com/dsu49fx2b/image/upload/v1754979646/card_ghq6pj.png";

import { getEventsByUserId, deleteEventById, exportEventContacts } from "../../services/api";
const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuEventId, setMenuEventId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [limit, setLimit] = useState('')
  const user = JSON.parse(localStorage.getItem("user"));
  const parentId = user?.userId;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEventsByUserId(parentId);
        setEvents(data);
      } catch (err) {
        console.error(err.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    if (parentId) {
      fetchEvents();
    } else {
      console.error("User ID not found");
      setLoading(false);
    }
  }, [parentId]);
  const addEvents = () => {
    try {
      console.log(limit?.EventTrial, limit?.EventTrial <= 0);
      if (limit?.EventTrial <= 0) {
        toast.error("Trial expired. Upgrade to premium to continue.");

        setTimeout(() => {
          navigate('/subscriptions')
        }, 1500);
      }
      else {
        navigate("/addevent")
      }
    } catch (error) {
      console.error(error)
    }
  }
  useEffect(() => {
    const getlimit = async () => {
      try {
        const limit = await getUser();
        setLimit(limit);
      } catch (error) {
        console.error(error)
      }
    }
    getlimit();
  }, [])

  const handleMenuOpen = (event, id) => {
    setAnchorEl(event.currentTarget);
    setMenuEventId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = (id) => {
    handleMenuClose();
    navigate(`/addevent/${id}/edit`);
  };

  const handleDeleteClick = async () => {
    try {
      if (!menuEventId) throw new Error("No event ID provided");
      await deleteEventById(menuEventId);
      setEvents((prev) => prev.filter((e) => e._id !== menuEventId));
    } catch (error) {
      console.error("Delete failed:", error.message);
    } finally {
      setConfirmOpen(false);
      setMenuEventId(null);
    }
  };


const exportCsvFile = async (eventId) => {
  try {
    const json = await exportEventContacts(eventId);

    if (!json.success || !json.data) return alert("No data found");

    const contacts = json.data.contacts;

    if (!contacts || contacts.length === 0) return alert("No contacts found");

    // CSV headers
    const headers = ["name", "number", "messageStatus", "messageError"];

    // Convert contacts to CSV rows
    const csvRows = [
      headers.join(","), // header row
      ...contacts.map(c =>
        [c.name, c.number, c.messageStatus,c.messageError ? c.messageError : 'N/A'].map(v => `"${v ?? ""}"`).join(",")
      )
    ].join("\n");

    // Create a blob and download
    const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `event_${eventId}_contacts.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    console.log("CSV exported successfully!");
  } catch (error) {
    console.error("Export failed:", error.message);
  }
};



  const handleCancelDelete = () => {
    setConfirmOpen(false);
  };

  return (
    <>

      <Box className="events-page">
        <Grid
          container
          className="events-header"
          justifyContent="space-between"
          alignItems="center"
        >
          <Grid item>
            <Typography variant="h5" className="events-title">
              Events
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<Add />}
              className="with-background-button"
              onClick={() => addEvents()}
            >
              Add Event
            </Button>
          </Grid>
        </Grid>

        <Grid container spacing={{ lg: 2, md: 2, sm: 3, xs: 2 }} mt={2}>
          {events.map((event) => {
            return (
              <Grid item size={{ sm: 6, md: 6, lg: 4, xs: 12 }} key={event._id}>
                <Card
                  className="event-card"
                  onClick={() => handleEdit(event._id)}
                  sx={{ cursor: "pointer" }}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    className="event-image"
                    image={event?.whatsapp?.imageUrl || cardImage}
                    alt={event.title}
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = cardImage;
                    }}
                  />
                  <CardContent>
                    <Box className="event-card-content">
                      <Box className="event-date-box">
                        <Typography className="event-time-text">
                          {dayjs(event.eventDateTime).isValid()
                            ? dayjs
                              .utc(event.eventDateTime)
                              .local()
                              .format("hh:mm A")
                            : "Invalid"}
                        </Typography>
                        <Typography className="event-month-text">
                          {dayjs.utc(event.eventDateTime).isValid()
                            ? dayjs
                              .utc(event.eventDateTime)
                              .local()
                              .format("MMM")  // full month name
                            : ""}
                        </Typography>
                        <Typography className="event-day-text">
                          {dayjs.utc(event.eventDateTime).isValid()
                            ? dayjs.utc(event.eventDateTime).local().format("DD")
                            : ""}
                        </Typography>
                        <IconButton
                          style={{
                            marginTop: "30px",
                            height: "32px",
                            width: "32px",
                          }}
                          aria-label={
                            dayjs.utc(event.eventDateTime).isAfter(dayjs())
                              ? "Time"
                              : "Expired"
                          }
                          sx={{
                            background:
                              "linear-gradient(135deg, #4e8fe466, #886bf2a3)",
                            color: "#fff",
                            cursor: "default",
                          }}
                        >
                          {event.status !== "completed" ? (
                            <Tooltip
                              title={`Schedule at : ` + event.scheduleTime}
                              arrow
                              placement="top"
                            >
                              <AccessTimeIcon />
                            </Tooltip>
                          ) : (
                            <Tooltip
                              title={`Completed at : ` + event.scheduleTime}
                              arrow
                              placement="top"
                            >
                              <FileDownloadDoneIcon />
                            </Tooltip>
                          )}
                        </IconButton>
                      </Box>
                      <Box flex={1}>
                        <Box className="title-menu">
                          <Tooltip title={event.title} arrow placement="bottom">
                            <Typography
                              variant="subtitle1"
                              className="event-title"
                              noWrap
                            >
                              {event.title}
                            </Typography>
                          </Tooltip>
                          <IconButton
                            aria-label="more"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, event._id);
                            }}
                            sx={{ color: "#090415", p: 0 }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                        <Tooltip
                          title={
                            <Box
                              sx={{
                                maxHeight: 182,
                                overflowY: "auto",
                                whiteSpace: "pre-wrap",
                                "&::-webkit-scrollbar": {
                                  display: "none",
                                },
                                scrollbarWidth: "none",
                              }}
                            >
                              {event.description.split("\n").map((line, i) => (
                                <React.Fragment key={i}>
                                  {line}
                                  <br />
                                </React.Fragment>
                              ))}
                            </Box>
                          }
                          arrow
                          placement="bottom"
                          componentsProps={{
                            tooltip: {
                              sx: {
                                color: "#fff",
                                fontSize: "0.75rem",
                              },
                            },
                          }}
                        >
                          <Typography
                            variant="body2"
                            className="event-description"
                            color="text.secondary"
                            mt={0.5}
                          >
                            {event.description?.slice(0, 50)}...
                          </Typography>
                        </Tooltip>
                        <Box className="event-contact-icons" mt={1.5}>
                          <Box className="icons">
                            {event.whatsappSent && (
                              <IconButton
                                aria-label="WhatsApp"
                                rel="noopener noreferrer"
                                sx={{
                                  background:
                                    "linear-gradient(135deg, #4e8fe466, #886bf2a3)",
                                  color: "#fff",
                                  cursor: "default",
                                }}
                              >
                                <WhatsApp />
                              </IconButton>
                            )}
                            {event.emailSent && (
                              <IconButton
                                aria-label="Email"
                                sx={{
                                  background:
                                    "linear-gradient(135deg, #4e8fe466, #886bf2a3)",
                                  color: "#fff",
                                  cursor: "default",
                                }}
                              >
                                <Email />
                              </IconButton>
                            )}
                          </Box>
                          {/* Conditional Icon Rendering Based on Event Time */}

                          <Typography
                            className="event-attendees-count"
                            variant="body2"
                            color="text.secondary"
                          >
                            {event.attendance} Invitees
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {!loading && events.length === 0 && (
          <Typography variant="body1" mt={4} textAlign="center">
            No events found.
          </Typography>
        )}

        {/* Edit/Delete Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              borderRadius: 2,
              mt: 1,
              minWidth: 160,
              backgroundColor: "#fff",
              border: "1px solid #DDDDDD",
              "& .MuiMenuItem-root": {
                fontSize: 14,
                color: "#3A3644",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
              },
            },
          }}
        >
          <MenuItem onClick={() => handleEdit(menuEventId)}>Edit</MenuItem>
          <Divider />

          <MenuItem
            onClick={() => {
              setConfirmOpen(true);
              handleMenuClose();
            }}
          >
            Delete
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              exportCsvFile(menuEventId);
            }}
          >
            Export
          </MenuItem>
        
        </Menu>

        {/* Confirm Delete Dialog */}
        <Dialog
          open={confirmOpen}
          onClose={handleCancelDelete}
          PaperProps={{
            sx: {
              width: "500px",
              maxWidth: "95vw",
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              fontSize: "1.25rem",
              color: "#5829cf",
              alignSelf: "center",
            }}
          >
            Confirm Delete
          </DialogTitle>

          <DialogContent>
            <DialogContentText
              sx={{
                fontSize: "1rem",
                color: "#090415",
                justifySelf: "center",
              }}
            >
              Are you sure you want to delete this item?
            </DialogContentText>
          </DialogContent>

          <DialogActions sx={{ display: "flex", p: 2, gap: 1 }}>
            <Button
              fullWidth
              onClick={handleCancelDelete}
              variant="outlined"
              color="primary"
              className="without-background-button"
            >
              Cancel
            </Button>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              className="with-background-button"
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>

  );
};

export default Events;
