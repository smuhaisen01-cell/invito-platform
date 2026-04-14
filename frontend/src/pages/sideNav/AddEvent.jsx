import React, { useRef, useState, useEffect } from 'react';
import {
    Box, Button, Checkbox, FormControlLabel, Grid, Card, IconButton,
    TextField, Typography, InputLabel, InputBase, InputAdornment, Avatar
} from '@mui/material';
import { styled } from "@mui/system";
import { AddCircleOutline, ArrowBack, DeleteOutline } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import  { toast } from 'react-toastify';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import MobilePreview from './MobilePreview';
import { createEvent, updateEventById, getEventById } from '../../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import Media from "../../../public/assets/images/mediaIcon.svg";
import LocationIcon from "../../../public/assets/images/locationIcon.svg";

// Styled input
const CustomSelectInput = styled(InputBase)(() => ({
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#fff",
}));

const createEmptyInvitee = () => ({
    name: '',
    number: '',
    email: '',
});

const AddEvent = () => {
    const { id } = useParams();
    const isEditMode = !!(id);
    const navigate = useNavigate();
    const inputRef = useRef();

    // States
    const [addMedia, setAddMedia] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [footer, setFooter] = useState('Powered by Invito');
    const [location, setLocation] = useState('');
    const [sendWhatsApp, setSendWhatsApp] = useState(false);
    const [sendEmail, setSendEmail] = useState(false);
    const [mediaFile, setMediaFile] = useState(null);
    const [csvFile, setCsvFile] = useState(null);
    const [csvError, setCsvError] = useState('');
    const [mediaError, setMediaError] = useState('');
    const [eventStatus, setEventStatus] = useState('');
    const [validationErrors, setValidationErrors] = useState({});
    const [dateTime, setDateTime] = useState('');
    const [eDateTime, setEDateTime] = useState('');
    const [scheduleValue, setScheduleValue] = useState(null);
    const [eventValue, setEventValue] = useState(null);
    const [open, setOpen] = useState(false);
    const [eventOpen, setEventOpen] = useState(false);
    const [manualInvitees, setManualInvitees] = useState([createEmptyInvitee()]);
    const [manualInviteesError, setManualInviteesError] = useState('');

    useEffect(() => {
        const fetchEventData = async () => {
            if (isEditMode) {
                try {
                    const token = localStorage.getItem("authToken");
                    const res = await getEventById(id, token);
                    const eventData = res?.event || res?.data?.event || res;

                    if (eventData) {
                        setAddMedia(
                            eventData?.whatsapp?.imageUrl ||
                            eventData?.email?.imageUrl ||
                            eventData?.addMedia || ''
                        );
                        setTitle(eventData?.title || '');
                        setDescription(eventData?.description || '');
                        setFooter(eventData?.footerText || '');
                        setLocation(eventData?.location || '');
                        setSendWhatsApp(eventData?.whatsappSent || false);
                        setSendEmail(eventData?.emailSent || false);
                        setEventStatus(eventData?.status || '');

                        if (eventData?.scheduleTime) {
                            setScheduleValue(dayjs(eventData.scheduleTime).local());
                        }
                        if (eventData?.eventDateTime) {
                            setEventValue(dayjs(eventData.eventDateTime).local());
                        }
                    }
                } catch (err) {
                    console.error("Failed to fetch event for editing:", err);
                }
            }
        };
        fetchEventData();
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const value = e.target.value;
        setTitle(value);
        // setError(value.length > 0 && value.length < 3);
        if (value.trim()) {
            setValidationErrors((prev) => ({ ...prev, title: '' }));
        }
    };

    const expectedHeaders = ['name', 'number', 'email'];

    const handleCSVChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCsvError('');
        setCsvFile(null);

        const allowedExts = ['csv', 'xls', 'xlsx'];
        const allowedTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        const ext = file.name.split('.').pop().toLowerCase();

        const isValidFile = allowedExts.includes(ext) && allowedTypes.includes(file.type);
        if (!isValidFile) {
            setCsvError('Only CSV or Excel files are allowed.');
            return;
        }

        if (ext === 'csv') {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    const uploadedHeaders = results.meta.fields?.map(h => h?.trim()) || [];

                    const headersMatch =
                        uploadedHeaders.length === expectedHeaders.length &&
                        expectedHeaders.every((expectedHeader, idx) => expectedHeader === uploadedHeaders[idx]);

                    if (!headersMatch) {
                        setCsvError('Invalid format of CSV file. Please check the sample template to see format.');
                        return;
                    }

                    setCsvError('');
                    setCsvFile(file);
                },
                error: function () {
                    setCsvError('Failed to parse CSV file.');
                },
            });
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });

                    const uploadedHeaders = json[0]?.map((h) => h?.toString().trim()) || [];

                    const headersMatch =
                        uploadedHeaders.length === expectedHeaders.length &&
                        expectedHeaders.every((expectedHeader, idx) => expectedHeader === uploadedHeaders[idx]);

                    if (!headersMatch) {
                        setCsvError('Invalid format of Excel file. Please check the sample template to see format.');
                        return;
                    }

                    setCsvError('');
                    setCsvFile(file);
                } catch {
                    setCsvError('Failed to parse Excel file.');
                }
            };

            reader.readAsArrayBuffer(file);
        }

        e.target.value = '';
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setDescription(value);
        if (value.trim()) {
            setValidationErrors((prev) => ({ ...prev, description: '' }));
        }
        // setErrorDescription(value.length > 0 && value.length < 5);

    };

    const handleLocationChange = (e) => {
        const value = e.target.value;
        setLocation(value);
        if (value.trim()) {
            setValidationErrors((prev) => ({ ...prev, location: '' }));
        }
    };

    const handleFooterChange = (e) => {
        const value = e.target.value;
        setFooter(value);
        if (value.trim()) {
            setValidationErrors((prev) => ({ ...prev, footer: '' }));
        }
    }

    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();
        const allowedExtensions = ['jpg', 'png', 'jpeg'];

        if (!allowedExtensions.includes(extension)) {
            setMediaError("Only JPG, PNG & JPEG files are allowed");
            setMediaFile(null);
            setAddMedia('');
            return;
        }

        setMediaError('');
        setMediaFile(file);

        const previewURL = URL.createObjectURL(file);
        setAddMedia(previewURL);
        setValidationErrors((prev) => ({ ...prev, media: '' }));
    };

    const handleInviteeChange = (index, field, value) => {
        setManualInvitees((prev) =>
            prev.map((invitee, inviteeIndex) =>
                inviteeIndex === index
                    ? { ...invitee, [field]: value }
                    : invitee
            )
        );

        if (manualInviteesError) {
            setManualInviteesError('');
        }
    };

    const handleAddInviteeRow = () => {
        setManualInvitees((prev) => [...prev, createEmptyInvitee()]);
        if (manualInviteesError) {
            setManualInviteesError('');
        }
    };

    const handleRemoveInviteeRow = (index) => {
        setManualInvitees((prev) => {
            if (prev.length === 1) {
                return [createEmptyInvitee()];
            }

            return prev.filter((_, inviteeIndex) => inviteeIndex !== index);
        });

        if (manualInviteesError) {
            setManualInviteesError('');
        }
    };

    const getFilledInvitees = () =>
        manualInvitees
            .map((invitee) => ({
                name: invitee.name.trim(),
                number: invitee.number.trim(),
                email: invitee.email.trim(),
            }))
            .filter((invitee) => invitee.name || invitee.number || invitee.email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = {};
        const filledInvitees = getFilledInvitees();

        const invalidInviteeIndex = filledInvitees.findIndex((invitee) => {
            if (!invitee.name) return true;
            if (sendWhatsApp && !invitee.number) return true;
            if (sendEmail && !invitee.email) return true;

            return false;
        });

        if (invalidInviteeIndex !== -1) {
            setManualInviteesError(
                `Invitee row ${invalidInviteeIndex + 1} must include name${sendWhatsApp ? ', phone number' : ''}${sendEmail ? `${sendWhatsApp ? ',' : ''} email` : ''}.`
            );
        } else {
            setManualInviteesError('');
        }

        if (!isEditMode) {
            if (!title.trim()) errors.title = "Title is required";
            if (!description.trim()) errors.description = "Description is required";
            if (!footer.trim()) errors.footer = "Footer is required";
            if (!location.trim()) errors.location = "Location is required";
            if (!sendEmail && !sendWhatsApp) errors.sendOn = "Select WhatsApp or Email";
            if (!mediaFile) errors.media = "Media file is required";
            if (!dateTime) errors.dateTime = "Date & Time is required";
            if (!eDateTime) errors.eDateTime = "Event Date & Time is required";
            if (csvError) errors.csvError = csvError;
            if (invalidInviteeIndex !== -1) errors.manualInvitees = "Please complete the invitee rows";
        } else {
            if (!location.trim()) errors.location = "Location is required";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        const scheduleTime = scheduleValue ? dayjs(scheduleValue).toISOString() : '';
        const eventDateTime = eventValue ? dayjs(eventValue).toISOString() : '';

        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.userId;
        const token = localStorage.getItem('authToken');

        if (!userId || !token) {
            toast.error("User session expired. Please login again.");
            return;
        }

        try {
            if (isEditMode) {
                if (eventStatus.toLowerCase() !== 'scheduled') {
                    toast.error("Updates are allowed for scheduled events only.");
                    return;
                }
                await updateEventById(id, {
                    scheduleTime, eventDateTime, location,
                    emailSent: sendEmail,
                    whatsappSent: sendWhatsApp
                }, token);
                toast.success("Event updated successfully");
                navigate('/events');
                return;
            }

            const formData = new FormData();
            formData.append("parentId", userId);
            formData.append("title", title);
            formData.append("description", description);
            formData.append("footerText", footer);
            formData.append("location", location);
            formData.append("emailSent", sendEmail);
            formData.append("whatsappSent", sendWhatsApp);
            formData.append("scheduleTime", scheduleTime);
            formData.append("eventDateTime", eventDateTime);
            if (mediaFile) formData.append("image", mediaFile);
            if (csvFile) formData.append("file", csvFile);
            if (filledInvitees.length > 0) {
                formData.append("invitees", JSON.stringify(filledInvitees));
            }

            await createEvent(formData, token);
            toast.success("Event added successfully");
            navigate('/events');
        } catch (error) {
            console.error("Submission Error:", error);
            toast.error(error?.message || "Something went wrong!");
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box className="add-event-container">
                <Box className="form-header">
                    <IconButton onClick={() => navigate(-1)} sx={{ p: 0 }}>
                        <ArrowBack sx={{ width: "32px", height: "32px", color: '#333' }} />
                    </IconButton>
                    <Typography variant="h5" className="add-event-title">
                        {isEditMode ? 'Edit Event' : 'Add Event'}
                    </Typography>
                </Box>

                <Grid container spacing={{ xs: 0, sm: 0, md: 2, lg: 3 }}>
                    <Grid item size={{ xs: 12, sm: 12, md: 7.6, lg: 7.9 }}>
                        <Card className='event-form-card'>

                            <InputLabel className='media-label' sx={{ mt: 0, display: "flex", gap: 1, alignItems: "center" }}>
                                Add Media
                                <Typography sx={{ fontSize: "0.75rem", color: "#888" }}>
                                    (jpg / png / jpeg)
                                </Typography>
                            </InputLabel>

                            <input
                                type="file"
                                accept="image/png, image/jpg, image/jpeg"
                                id="media-upload"
                                disabled={isEditMode}
                                style={{ display: 'none' }}
                                onChange={handleMediaChange}
                            />

                            <label htmlFor="media-upload" className="media-upload-label">
                                <Box className="media-upload-box">
                                    <Avatar src={Media} alt="media icon" className="media-upload-avatar" />
                                    <Typography className="media-upload-text">
                                        {mediaFile
                                            ? mediaFile.name
                                            : addMedia
                                                ? addMedia.split('/').pop()
                                                : 'Upload Media'}
                                    </Typography>
                                </Box>
                            </label>

                            {(validationErrors.media || mediaError) && (
                                <Typography sx={{ fontSize: "0.75rem", color: "#d32f2f", margin: "4px 14px 0" }}>
                                    {validationErrors.media || mediaError}
                                </Typography>
                            )}

                            <InputLabel className='title-label'>Title</InputLabel>

                            <TextField
                                fullWidth
                                value={title}
                                onChange={handleChange}
                                disabled={isEditMode}
                                // error={error}
                                error={!!validationErrors.title}
                                helperText={validationErrors.title}
                                // helperText={error ? "Title must be at least 3 characters long" : ""}
                                placeholder="Enter Title"
                                InputProps={{
                                    classes: { root: 'custom-input' },
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            border: '1px solid #000',
                                        },
                                    },
                                }}
                            />

                            <InputLabel className="description-label">Description</InputLabel>
                            <TextField
                                fullWidth
                                multiline
                                minRows={7}
                                value={description}
                                disabled={isEditMode}
                                onChange={handleDescriptionChange}
                                // error={errorDescription}
                                error={!!validationErrors.description}
                                // helperText={
                                //     errorDescription ? "Description must be at least 5 characters long" : ""
                                // }
                                helperText={validationErrors.description}
                                placeholder="Enter Description"
                                InputProps={{
                                    classes: { root: 'custom-input' },
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            border: '1px solid #000',
                                        },
                                    },
                                }}
                            />
                            <Typography sx={{ mt: 1, fontSize: '13px', color: '#6B7280' }}>
                                When WhatsApp is enabled, the full description is sent as written and the template language is detected automatically from the event content.
                            </Typography>

                            <InputLabel className='footer-label'>Footer</InputLabel>
                            <TextField
                                fullWidth
                                value={footer}
                                onChange={handleFooterChange}
                                disabled={isEditMode}
                                error={!!validationErrors.footer}
                                helperText={validationErrors.footer}
                                placeholder="Powered by Invito"
                                InputProps={{
                                    classes: { root: 'custom-input' }
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                            border: '1px solid #000',
                                        },
                                    },
                                }}
                            />

                            <InputLabel className="footer-label"> Schedule Date & Time</InputLabel>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DemoContainer components={['DateTimePicker']}>
                                    <DateTimePicker
                                        value={scheduleValue}
                                        onChange={(newValue) => {
                                            setScheduleValue(newValue);
                                            if (newValue && dayjs(newValue).isValid()) {
                                                const formatted = dayjs(newValue).format('DD-MM-YYYY hh:mm A');
                                                setDateTime(formatted);
                                                setValidationErrors((prev) => ({ ...prev, dateTime: '' }));
                                            } else {
                                                setDateTime('');
                                            }
                                        }}
                                        open={open}
                                        onOpen={() => setOpen(true)}
                                        onClose={() => setOpen(false)}
                                        slotProps={{
                                            textField: {
                                                inputRef: inputRef,
                                                fullWidth: true,
                                                placeholder: 'Select date & time',
                                                error: !!validationErrors.dateTime,
                                                helperText: validationErrors.dateTime,
                                                InputLabelProps: { shrink: false },
                                                onClick: () => setOpen(true),
                                                inputProps: {
                                                    readOnly: true,
                                                },
                                                InputProps: {
                                                    sx: {
                                                        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                            borderColor: 'black',
                                                        },
                                                        cursor: 'pointer',
                                                        '& .MuiInputBase-root': {
                                                            cursor: 'pointer',
                                                        },
                                                        '& input': {
                                                            cursor: 'pointer',
                                                        },
                                                        '& .MuiInputAdornment-root': {
                                                            cursor: 'pointer',
                                                        },
                                                    },
                                                },
                                            },
                                            actionBar: {
                                                actions: ['cancel', 'accept'],
                                                sx: {
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    gap: 1,
                                                    '& .MuiButtonBase-root': {
                                                        fontWeight: 'bold',
                                                        textTransform: 'none',
                                                        borderRadius: '6px',
                                                        minWidth: '80px',
                                                    },
                                                    '& .MuiButtonBase-root:nth-of-type(1)': {
                                                        color: '#5829CF',
                                                        border: '1px solid #5829CF',
                                                        borderRadius: '12px',
                                                    },
                                                    '& .MuiButtonBase-root:nth-of-type(2)': {
                                                        backgroundColor: '#5829CF',
                                                        color: '#fff',
                                                        borderRadius: '12px',
                                                        '&:hover': {
                                                            backgroundColor: '#4a1fb2',
                                                        },
                                                    },
                                                },
                                            },
                                        }}
                                    />

                                </DemoContainer>
                            </LocalizationProvider>

                            <InputLabel className="footer-label"> Event Date & Time</InputLabel>

                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DemoContainer components={['DateTimePicker']}>
                                    <DateTimePicker
                                        value={eventValue}
                                        onChange={(newValue) => {
                                            setEventValue(newValue);
                                            if (newValue && dayjs(newValue).isValid()) {
                                                const formatted = dayjs(newValue).format('DD-MM-YYYY hh:mm A');
                                                setEDateTime(formatted);
                                                setValidationErrors((prev) => ({ ...prev, eDateTime: '' }));
                                            } else {
                                                setEDateTime('');
                                            }
                                        }}
                                        open={eventOpen}
                                        onOpen={() => setEventOpen(true)}
                                        onClose={() => setEventOpen(false)}
                                        slotProps={{
                                            textField: {
                                                inputRef: inputRef,
                                                fullWidth: true,
                                                placeholder: 'Select date & time',
                                                error: !!validationErrors.eDateTime,
                                                helperText: validationErrors.eDateTime,
                                                InputLabelProps: { shrink: false },
                                                inputProps: {
                                                    readOnly: true,
                                                },
                                                onClick: () => setEventOpen(true),
                                                InputProps: {
                                                    sx: {
                                                        cursor: 'pointer',
                                                        '& .MuiInputBase-root': {
                                                            cursor: 'pointer',
                                                        },
                                                        '& input': {
                                                            cursor: 'pointer',
                                                        },
                                                        '& .MuiInputAdornment-root': {
                                                            cursor: 'pointer',
                                                        },
                                                    },
                                                }
                                            },
                                            actionBar: {
                                                actions: ['cancel', 'accept'],
                                                sx: {
                                                    display: 'flex',
                                                    justifyContent: 'flex-end',
                                                    gap: 1,
                                                    '& .MuiButtonBase-root': {
                                                        fontWeight: 'bold',
                                                        textTransform: 'none',
                                                        borderRadius: '6px',
                                                        minWidth: '80px',
                                                    },
                                                    '& .MuiButtonBase-root:nth-of-type(1)': {
                                                        color: '#5829CF',
                                                        border: '1px solid #5829CF',
                                                        borderRadius: '12px',
                                                    },
                                                    '& .MuiButtonBase-root:nth-of-type(2)': {
                                                        backgroundColor: '#5829CF',
                                                        color: '#fff',
                                                        borderRadius: '12px',
                                                        '&:hover': {
                                                            backgroundColor: '#4a1fb2',
                                                        },
                                                    },
                                                },
                                            },
                                        }}
                                    />
                                </DemoContainer>
                            </LocalizationProvider>

                            <Grid container spacing={{ lg: 2, md: 0, sm: 0, xs: 0 }} alignItems={"center"}>
                                <Grid item size={{ xs: 12, md: 12, lg: 6 }}>
                                    <InputLabel className='location-label'>Location</InputLabel>

                                    <TextField
                                        fullWidth
                                        value={location}
                                        onChange={handleLocationChange}
                                        error={!!validationErrors.location}
                                        helperText={validationErrors.location}
                                        placeholder="Enter Location"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Avatar src={LocationIcon} alt="location-icon" className="custom-icon" />
                                                </InputAdornment>
                                            ),
                                            classes: {
                                                input: 'custom-input-element',
                                            },
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                    border: '1px solid #000',
                                                },
                                            },
                                        }}
                                        className="custom-textfield"
                                    />

                                </Grid>
                                <Grid item size={{ xs: 12, md: 12, lg: 6 }} className="send-on-wrapper">
                                    <InputLabel className="send-on-label">Send On</InputLabel>
                                    <Box className="send-on-options">
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={sendWhatsApp}
                                                    onChange={(e) => {
                                                        const value = e.target.checked;
                                                        setSendWhatsApp(value);
                                                        if (value || sendEmail) {
                                                            setValidationErrors((prev) => ({ ...prev, sendOn: '' }));
                                                        }
                                                    }}
                                                    className="custom-checkbox"
                                                />
                                            }
                                            label="WhatsApp"
                                            sx={{
                                                '& .MuiFormControlLabel-label': {
                                                    fontSize: {
                                                        xs: '14px',
                                                        sm: '16px',
                                                    },
                                                },
                                            }}
                                        />

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={sendEmail}
                                                    onChange={(e) => {
                                                        const value = e.target.checked;
                                                        setSendEmail(value);
                                                        if (value || sendWhatsApp) {
                                                            setValidationErrors((prev) => ({ ...prev, sendOn: '' }));
                                                        }
                                                    }}
                                                    className="custom-checkbox"
                                                />
                                            }
                                            label="Email"
                                            sx={{
                                                '& .MuiFormControlLabel-label': {
                                                    fontSize: {
                                                        xs: '14px',
                                                        sm: '16px',
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>

                                    {validationErrors.sendOn && (
                                        <Typography sx={{ fontSize: "0.75rem", color: "#d32f2f", mt: 0.5 }}>
                                            {validationErrors.sendOn}
                                        </Typography>
                                    )}
                                </Grid>
                            </Grid>

                            <Box>
                                <Box className="form-flex">
                                    <InputLabel className='invite-label'>Invite People</InputLabel>
                                    <Typography
                                        component="a"
                                        href="/sample_file.csv"
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        disabled={isEditMode}
                                        className="download-sample-link"
                                    >
                                        Download Sample File
                                    </Typography>
                                </Box>
                                <input
                                    type="file"
                                    accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                    id="csv-upload"
                                    style={{ display: 'none' }}
                                    disabled={isEditMode}
                                    onChange={handleCSVChange}
                                />
                                <label htmlFor="csv-upload" className="media-upload-label">
                                    <Box className="media-upload-box">
                                        <Avatar src={Media} alt="media icon" className="media-upload-avatar" />
                                        <Typography className="media-upload-text">
                                            {csvFile ? csvFile.name : 'Upload CSV or Excel'}
                                        </Typography>
                                    </Box>
                                </label>
                                {csvError && <Typography sx={{ color: "#d32f2f", fontSize: '14px', margin: "4px 14px 0" }}>{csvError}</Typography>}

                                {!isEditMode && (
                                    <Box sx={{ mt: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 1.5, flexWrap: 'wrap' }}>
                                            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>
                                                Add invitees directly
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                startIcon={<AddCircleOutline />}
                                                onClick={handleAddInviteeRow}
                                                sx={{
                                                    borderRadius: '12px',
                                                    textTransform: 'none',
                                                    color: '#5829CF',
                                                    borderColor: '#5829CF',
                                                }}
                                            >
                                                Add Row
                                            </Button>
                                        </Box>

                                        <Grid container spacing={1.5}>
                                            {manualInvitees.map((invitee, index) => (
                                                <React.Fragment key={`invitee-${index}`}>
                                                    <Grid item size={{ xs: 12, md: 4 }}>
                                                        <TextField
                                                            fullWidth
                                                            placeholder="Invitee name"
                                                            value={invitee.name}
                                                            onChange={(e) => handleInviteeChange(index, 'name', e.target.value)}
                                                            InputProps={{
                                                                classes: { root: 'custom-input' },
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item size={{ xs: 12, md: 3.5 }}>
                                                        <TextField
                                                            fullWidth
                                                            placeholder="Phone number"
                                                            value={invitee.number}
                                                            onChange={(e) => handleInviteeChange(index, 'number', e.target.value)}
                                                            InputProps={{
                                                                classes: { root: 'custom-input' },
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item size={{ xs: 12, md: 3.5 }}>
                                                        <TextField
                                                            fullWidth
                                                            placeholder="Email address"
                                                            value={invitee.email}
                                                            onChange={(e) => handleInviteeChange(index, 'email', e.target.value)}
                                                            InputProps={{
                                                                classes: { root: 'custom-input' },
                                                            }}
                                                        />
                                                    </Grid>
                                                    <Grid item size={{ xs: 12, md: 1 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <IconButton
                                                            onClick={() => handleRemoveInviteeRow(index)}
                                                            disabled={manualInvitees.length === 1 && !invitee.name && !invitee.number && !invitee.email}
                                                            sx={{ color: '#D32F2F' }}
                                                        >
                                                            <DeleteOutline />
                                                        </IconButton>
                                                    </Grid>
                                                </React.Fragment>
                                            ))}
                                        </Grid>

                                        <Typography sx={{ mt: 1.5, fontSize: '13px', color: '#6B7280' }}>
                                            You can upload a file, type invitees here, or use both together.
                                        </Typography>

                                        {(manualInviteesError || validationErrors.manualInvitees) && (
                                            <Typography sx={{ color: "#d32f2f", fontSize: '14px', mt: 1 }}>
                                                {manualInviteesError || validationErrors.manualInvitees}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        </Card >
                    </Grid>
                    <Grid item size={{ xs: 12, sm: 7, md: 4.4, lg: 4.1 }} sx={{
                        margin: {
                            margin: 'auto',
                        },
                    }}>
                        <Box className="mobile-view">
                            <MobilePreview
                                image={addMedia}
                                title={title}
                                description={description}
                                footer={footer}
                            />
                        </Box>
                    </Grid>

                    <Box className="form-actions">
                        <Button className='without-background-button' sx={{ minWidth: "100px" }} variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button className='with-background-button' sx={{ minWidth: "100px" }} variant="contained" onClick={handleSubmit}>{isEditMode ? 'Update' : 'Add'}</Button>
                    </Box>
                </Grid>
            </Box>
        </LocalizationProvider >
    );
};

export default AddEvent;
