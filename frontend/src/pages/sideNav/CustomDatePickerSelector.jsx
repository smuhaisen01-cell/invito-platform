import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Popover,
  Button,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

const CustomDatePickerSelector = ({ anchorEl, open, onClose, onApply, initialDate, onChangeDate }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [rangeOption, setRangeOption] = useState("Custom");

  useEffect(() => {
    if (initialDate) {
      const d = dayjs(initialDate);
      if (d.isValid()) {
        setSelectedDate(d);
        if (onChangeDate) onChangeDate(d.format("DD/MM/YYYY"));
      }
    }
  }, [initialDate, onChangeDate]);

  const options = [
    "Today",
    "Yesterday",
    "This week",
    "This month",
    "This quarter",
    "Custom",
  ];

  const emitChange = (d) => {
    setSelectedDate(d);
    if (onChangeDate) onChangeDate(d.format("DD/MM/YYYY"));
  };

  const handleOptionSelect = (option) => {
    setRangeOption(option);
    let d = dayjs();
    if (option === "Yesterday") d = dayjs().subtract(1, "day");
    // For week/month/quarter, default to today for now
    emitChange(d);
  };

  const handleApply = () => {
    onApply(`${rangeOption}: ${selectedDate.format("DD/MM/YYYY")}`);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Popover className="date-picker-popover"
        open={Boolean(open)}
        anchorEl={anchorEl}
        onClose={onClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box className="date-picker-section">
          <Box className="date-picker-sidebar" borderRight={1} borderColor="divider">
            <List className="date-picker-options-list">
              {options.map((option) => (
                <ListItem
                  key={option}
                  button
                  selected={rangeOption === option}
                  onClick={() => handleOptionSelect(option)}
                  className="date-picker-option-item"
                >
                  <ListItemText primary={option} />
                </ListItem>
              ))}
            </List>
          </Box>
          <Box className="date-picker-calendar-wrapper">
            <DateCalendar
              className="date-picker-calendar"
              value={selectedDate}
              onChange={(d) => { if (d) emitChange(d); }}
              sx={{
                "& .MuiPickersDay-root.Mui-selected": {
                  backgroundColor: "#5829CF !important",
                  color: "#fff",
                },
                "& .MuiYearCalendar-button.Mui-selected": {
                  backgroundColor: "#5829CF !important",
                  color: "#fff",
                },
                "& .MuiYearCalendar-button.Mui-selected:hover": {
                  backgroundColor: "#5829CF !important",
                }
              }}
            />
          </Box>
        </Box>

        <Box className="date-picker-actions" borderTop={1} borderColor="divider">
          <Button onClick={onClose} className="without-background-button">
            Cancel
          </Button>
          <Button variant="contained" className="with-background-button" onClick={handleApply}>
            Apply
          </Button>
        </Box>
      </Popover>
    </LocalizationProvider>
  );
};

export default CustomDatePickerSelector;
