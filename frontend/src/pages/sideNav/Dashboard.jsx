import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputBase,
  IconButton,
  Tooltip,
  Button
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { styled } from "@mui/system";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DashboardOnboardingPopup from "./DashboardOnboardingPopup";
import CalendarIcon from '@mui/icons-material/CalendarMonth';
import CustomDatePickerSelector from "./CustomDatePickerSelector";
import { getAllUserEvents, getEventStats, exportEventContacts } from "../../services/api";
import { toast } from "react-toastify";

const CustomSelectInput = styled(InputBase)(() => ({
  border: "1px solid #ddd",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  fontWeight: 500,
  backgroundColor: "#fff",
}));

const CustomMenuItem = styled(MenuItem)(() => ({
  padding: "12px 16px",
  fontSize: "14px",
  fontWeight: 500,
  borderBottom: "1px solid #D9D9D9",
  "&:last-child": {
    borderBottom: "none",
  },
}));

const CustomMenuPaper = {
  sx: {
    borderRadius: "12px",
    border: "1px solid #ddd",
    boxShadow: "none",
    mt: 1,
    overflow: "visible",
  },
};

const DropdownIcon = ({ open }) =>
  open ? (
    <KeyboardArrowUpIcon sx={{ color: "#4B4453", fontSize: 20 }} />
  ) : (
    <KeyboardArrowDownIcon sx={{ color: "#4B4453", fontSize: 20 }} />
  );

const Dashboard = () => {
  const [event, setEvent] = useState("");
  const [events, setEvents] = useState([]);
  const [selectedEventDate, setSelectedEventDate] = useState(null);
  const [channel, setChannel] = useState("All");
  const [date, setDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openSelect, setOpenSelect] = useState({
    event: false,
    channel: false,
    date: false,
  });
  const anchorRef = useRef(null);
  const [stats, setStats] = useState(null);

  // Export CSV function
  const exportDashboardCsv = async () => {
    if (!event) {
      toast.error("Please select an event first");
      return;
    }

    try {
      // Show loading toast
      const loadingToastId = toast.loading("Exporting dashboard data...");
      
      const json = await exportEventContacts(event);

      if (!json.success || !json.data) {
        toast.dismiss(loadingToastId);
        toast.error("No data found for this event");
        return;
      }

      const contacts = json.data.contacts;

      if (!contacts || contacts.length === 0) {
        toast.dismiss(loadingToastId);
        toast.warning("No contacts found for this event");
        return;
      }

      // Get event title for filename
      const selectedEvent = events.find(ev => ev._id === event);
      const eventTitle = selectedEvent?.title || "event";

      // Enhanced CSV headers
      const headers = [
        "Name", 
        "Phone Number", 
        "Email",
        "Message Status", 
         "Message Error", 

      ];

      // Convert contacts to CSV rows with additional data
      const csvRows = [
        headers.join(","), // header row
        ...contacts.map(c => [
          c.name || "N/A",
          c.number || "N/A",
          c.email || "N/A", 
          c.messageStatus || "N/A",
          c.messageError || "N/A",
        ].map(v => `"${v}"`).join(","))
      ].join("\n");

      // Create a blob and download
      const blob = new Blob([csvRows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      // Success feedback
      toast.dismiss(loadingToastId);
      toast.success(`✅ Exported ${contacts.length} contacts from dashboard!`);
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
      console.error("Dashboard export failed:", error.message);
    }
  };


  // Load events on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await getAllUserEvents();
        console.log("Events API response:", res);

        // normalize response
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.events)
            ? res.events
            : [];

        setEvents(list);

        if (list.length > 0) {
          const firstEvent = list[0];
          setEvent(firstEvent._id);

          if (firstEvent.eventDateTime) {
            const formattedDate = new Date(firstEvent.eventDateTime).toLocaleDateString("en-GB");
            setDate(formattedDate);
            setSelectedEventDate(firstEvent.eventDateTime);
          }
        }

      } catch (error) {
        console.error("Error fetching events:", error);
        setEvents([]); // fallback
      }
    })();
  }, []);

  // Search filter on event titles and ids
  const filteredEvents = Array.isArray(events)
    ? events.filter((ev) => {
      const text = `${ev._id} ${ev.title || ""}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    })
    : [];

  useEffect(() => {
    const storedDate = localStorage.getItem("selectedDate");
    if (storedDate) {
      const onlyDate = storedDate.includes(":") ? storedDate.split(":")[1].trim() : storedDate;
      setDate(onlyDate);
      if (onlyDate !== storedDate) localStorage.setItem("selectedDate", onlyDate);
    }
  }, []);

  const handleApply = (value) => {
    // Accepts either 'Range: DD/MM/YYYY' or just 'DD/MM/YYYY'
    const onlyDate = typeof value === 'string' && value.includes(':')
      ? value.split(':')[1].trim()
      : value;
    setDate(onlyDate);
    localStorage.setItem("selectedDate", onlyDate);
    setOpenSelect((prev) => ({ ...prev, date: false }));
  };

  const handleOpen = (key) => {
    setOpenSelect((prev) => ({ ...prev, [key]: true }));
  };

  const handleClose = (key) => {
    setOpenSelect((prev) => ({ ...prev, [key]: false }));
  };

  const cardData = stats
    ? [
      {
        img: "/assets/images/contact.svg",
        title: "Total Contacts Invited",
        subtitle: stats.invited || 0,
      },
      {
        img: "/assets/images/link.svg",
        title: "RSVP Link Accepted",
        subtitle: stats.rsvpAccepted || 0,
      },
      {
        img: "/assets/images/event.svg",
        title: "QR Code Scanned",
        subtitle: stats.scanned || 0,
      },
    ]
    : [];

const dataset = stats?.chartDateNew?.map((date, i) => ({
  date,
  invited: stats.chartInvited?.[i] ?? 0,
  accepted: stats.chartRSVP?.[i] ?? 0,
  scanned: stats.chartAttendees?.[i] ?? 0,
})) || [];

  // when user selects an event
  const onSelectEvent = (selectedEventId) => {
    setEvent(selectedEventId);

    const found = events.find(ev => ev._id === selectedEventId);
    if (found?.eventDateTime) {
      // ✅ parse backend ISO date
      const formattedDate = new Date(found.eventDateTime).toLocaleDateString("en-GB");
      setDate(formattedDate);
      setSelectedEventDate(found.eventDateTime);
    }

    handleClose("event");
  };

  useEffect(() => {
    (async () => {
      if (!event) return;
      try {
        const res = await getEventStats(event, channel, date);
        console.log("Stats received:", res);
        setStats(res);
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    })();
  }, [event, channel, date]);

  return (
    <Box className="dashboard">
      <Box className="dashboard-header">
        <Typography className="dashboard-title">Dashboard</Typography>
        
        {/* Export Button */}
        <Tooltip title="Export event contacts to CSV" arrow>
          {/* <Button
            variant="contained"
            startIcon={<FileDownloadIcon />}
            onClick={exportDashboardCsv}
            disabled={!event}
            sx={{
              backgroundColor: "#5829cf",
              color: "white",
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 500,
              fontSize: "14px",
              padding: "8px 16px",
              "&:hover": {
                backgroundColor: "#4a1fb8",
              },
              "&:disabled": {
                backgroundColor: "#ccc",
                color: "#666",
              }
            }}
          >
            Export CSV
          </Button> */}
          <a  style={{cursor:"pointer"}} onClick={() => exportDashboardCsv()}>Export CSV</a>
        </Tooltip>

        <Box className="dashboard-filters">
          <Typography className="filter-label">Filter by</Typography>

          <FormControl
            sx={{
              width: {
                lg: 200,
                md: 160,
                sm: "auto",
                xs: "100%",
              },
            }}
          >
            <Select
              sx={{
                width: "100%",
                ".MuiSelect-select": {
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  paddingRight: "5px !important",
                },
              }}
              open={openSelect.event}
              onOpen={() => handleOpen("event")}
              onClose={() => handleClose("event")}
              value={event}
              onChange={(e) => onSelectEvent(e.target.value)}
              displayEmpty
              input={<CustomSelectInput />}
              renderValue={(selected) => {
                if (!selected) return "Select Event";
                const found = filteredEvents.find(ev => ev._id === selected);
                if (!found) return selected;
                return (
                  <Tooltip title={found.title} arrow>
                    <Box
                      sx={{
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {found.title}
                    </Box>
                  </Tooltip>
                );
              }}
              IconComponent={() => (
                <Box
                  sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openSelect.event ? handleClose("event") : handleOpen("event");
                  }}
                >
                  <DropdownIcon open={openSelect.event} />
                </Box>
              )}
              MenuProps={{
                PaperProps: CustomMenuPaper,
                MenuListProps: { disablePadding: true },
                disableScrollLock: true,
                disableAutoFocusItem: true,
              }}
            >
              <Box sx={{ p: 1, position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1, borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}>
                <input
                  type="text"
                  placeholder="Search event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                    outline: "none",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </Box>

              <Box
                sx={{
                  maxHeight: 136,
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  scrollbarWidth: "thin",
                }}
              >
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((ev) => (
                    <CustomMenuItem
                      key={ev._id}
                      value={ev._id}
                      selected={event === ev._id}
                      onClick={() => onSelectEvent(ev._id)}
                    >
                      <Tooltip title={ev.title} arrow>
                        <Box
                          sx={{
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            display: "inline-block",
                            verticalAlign: "middle",
                          }}
                        >
                          {ev.title}
                        </Box>
                      </Tooltip>
                    </CustomMenuItem>
                  ))
                ) : (
                  <CustomMenuItem disabled>No results found</CustomMenuItem>
                )}
              </Box>
            </Select>
          </FormControl>

          <FormControl
            sx={{
              width: {
                lg: 200,
                md: 160,
                sm: "auto",
                xs: "100%",
              },
            }}
          >
            <Select
              sx={{
                width: "100%",
                ".MuiSelect-select": {
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  paddingRight: "5px !important",
                },
              }}
              open={openSelect.channel}
              onOpen={() => handleOpen("channel")}
              onClose={() => handleClose("channel")}
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              displayEmpty
              input={<CustomSelectInput />}
              renderValue={(selected) => selected || "Select Channel"}
              IconComponent={() => (
                <Box
                  sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openSelect.channel ? handleClose("channel") : handleOpen("channel");
                  }}
                >
                  <DropdownIcon open={openSelect.channel} />
                </Box>
              )}
              MenuProps={{
                PaperProps: CustomMenuPaper,
                MenuListProps: { disablePadding: true },
                disableScrollLock: true,
                disableAutoFocusItem: true,
              }}
            >
              <CustomMenuItem value="All">All</CustomMenuItem>
              <CustomMenuItem value="Email">Email</CustomMenuItem>
              <CustomMenuItem value="WhatsApp">WhatsApp</CustomMenuItem>
            </Select>
          </FormControl>

          <FormControl
            sx={{
              width: {
                lg: 200,
                md: 160,
                sm: "auto",
                xs: "100%",
              },
            }}
            ref={anchorRef}
          >
            <Select
              displayEmpty
              value={date || ""}
              open={openSelect.date}
              onOpen={() => handleOpen("date")}
              onClose={() => handleClose("date")}
              renderValue={() => date || "Select Date"}
              input={<CustomSelectInput />}
              IconComponent={() => (
                <Box
                  sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openSelect.date ? handleClose("date") : handleOpen("date");
                  }}
                >
                  <CalendarIcon style={{ color: "#3A3644" }} />
                </Box>
              )}
            >
              <MenuItem value="">Select Date</MenuItem>
              <MenuItem value="Today">Today</MenuItem>
              <MenuItem value="Tomorrow">Tomorrow</MenuItem>
            </Select>

          </FormControl>

          <CustomDatePickerSelector
            anchorEl={anchorRef.current}
            open={openSelect.date}
            onClose={() => handleClose("date")}
            onApply={handleApply}
            initialDate={selectedEventDate}
            onChangeDate={(dStr) => setDate(dStr)}
          />

        </Box>
      </Box>

      {/* Cards */}
      <Box className="dashboard-cards">
        {cardData.map((card, index) => (
          <Box key={index} className="dashboard-card card-horizontal">
            <Box className="card-icon">
              <img src={card.img} alt={card.title} />
            </Box>
            <Box className="card-content">
              <Typography className="card-title">{card.title}</Typography>
              <Typography className="card-subtitle">{card.subtitle}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Bar Chart */}
      <Box className="dashboard-bar-chart">
        <Typography className="bar-chart-title">Contact Engagement</Typography>

        <Box className="dashboard-chart-wrapper">
          {/* Custom Legend */}
          <Box className="custom-legend">
            {[
              { label: "Total Contacts Invited", color: "#7954D9" },
              { label: "RSVP Link Accepted", color: "#FF92AE" },
              { label: "Event Attendees", color: "#FFC831" },
            ].map((item, index) => (
              <Box key={index} className="legend-item">
                <Box
                  className="legend-color"
                  style={{ backgroundColor: item.color }}
                />
                <Typography className="legend-label">{item.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Scrollable wrapper */}
          <Box className="barchart-scroll-wrapper" >
            <Box className="barchart-inner" >
              <BarChart
                className="barchart"
                height={400}
                dataset={dataset}
                xAxis={[
                  {
                    scaleType: "band",
                    dataKey: "date",
                    tickLabelStyle: { fill: "#000", fontSize: 12 },
                    axisLine: { stroke: "transparent" },
                    tickLine: { stroke: "transparent" },
                  },
                ]}
                yAxis={[
                  {
                    scaleType: "linear",
                    min: 0,
                    // Let BarChart auto-calculate max and ticks
                  },
                ]}
                series={[
                  {
                    dataKey: "invited",
                    label: "Total Contacts Invited",
                    color: "#7954D9",
                  },
                  {
                    dataKey: "accepted",
                    label: "RSVP Link Accepted",
                    color: "#FF92AE",
                  },
                  {
                    dataKey: "scanned",
                    label: "Event Attendees",
                    color: "#FFC831",
                  },
                ]}
                barCategoryGap="40%" 
                sx={{
                  "& .MuiBarElement-root": {
                    width: "12px",
                    margin: "0 !important",
                    clipPath: "inset(0 round 19px)",
                  },
                  "& .MuiChartsLegend-root": { display: "none" },
                  "& .MuiChartsAxis-line, & .MuiChartsAxis-tick": {
                    stroke: "transparent !important",
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

    </Box>
  );
};

export default Dashboard;

