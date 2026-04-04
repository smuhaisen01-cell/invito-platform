import React, { useState } from "react";
import {
    Modal,
    Box,
    Typography,
    Button,
    Stepper,
    Step,
    StepLabel,
    StepConnector,
} from "@mui/material";
import QrCode from "../../../public/assets/images/qrCode.png";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Steps list
const steps = [
    "Upload Contacts & Send Invitations",
    "RSVP Confirmation",
    "Share RSVP Link",
    "Track Event Performance",
];

//  Custom Connector (vertical line style)
const CustomConnector = (props) => (
    <StepConnector
        {...props}
        classes={{
            root: "custom-step-connector",
            line: "custom-step-line",
            active: "custom-step-active",
            completed: "custom-step-completed",
        }}
    />
);

const CustomStepIcon = ({ active, completed }) => {
    return (
        <Box className={`custom-step-icon ${active ? "active" : ""} ${completed ? "completed" : ""}`} />
    );
};

const DashboardOnboardingPopup = ({ open, onClose }) => {
    const [activeStep, setActiveStep] = useState(0);
    // const isOnBoarding = localStorage.getItem('showOnboarding') === 'true';

    const handleNext = () => {
        if (activeStep === steps.length - 1) {
            if (onClose) onClose();
        } else {
            setActiveStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (activeStep > 0) setActiveStep((prev) => prev - 1);
    };

    // Step content
    const stepContent = [
        {
            title: "1. Upload Contacts & Send Invitations",
            content: (
                <Box className="step-box" sx={{
                    py: { xs: 1, sm: 1, md: "2px" }
                }}>
                    <Box className="step-left">
                        <Typography className="step-description">
                            Import your guest list and send personalized invitation emails. Each email includes the event details and a unique RSVP link.
                        </Typography>
                        <ul className="step-list">
                            <li>Upload via CSV or manually</li>
                            <li>Custom RSVP message</li>
                            <li>Track delivery and open status</li>
                        </ul>
                    </Box>
                    <Box className="sample-email-box"
                    >
                        <Typography className="sample-email-heading">Sample Email</Typography>
                        <Typography variant="body2" className="sample-email-text">
                            You’re invited to{' '}
                            <Typography component="span" className="bold-text" variant="body2">
                                Tech Connect 2025
                            </Typography>
                        </Typography>
                        <Typography variant="body2" className="email-date" sx={{ pt: '12px' }}>
                            Date: July 15, 2025 | Time: 10:00 AM
                        </Typography>

                        <Button className="without-background-button"
                            variant="outlined"
                            size="small"
                            fullWidth
                            sx={{
                                mt: { xs: 2, sm: 2, md: 3 },
                                padding: "6px 16px"
                            }}
                        >
                            RSVP Now
                        </Button>
                    </Box>
                </Box>
            ),
        },
        {
            title: "2. RSVP Confirmation",
            content: (
                <Box
                    className="step-box"
                    sx={{
                        py: {
                            sm: "14px",
                            md: "18px"
                        }
                    }}
                >
                    <Box className="rsvp-confirm-box">
                        <Typography component="span" variant="body2" className="bold-text">
                            RSVP for: Tech Connect 2025
                        </Typography>
                        <Typography variant="body2" className="email-date">
                            July 15, 2025 | 10:00 AM | Bangalore
                        </Typography>
                        <Box className="action-buttons-container">
                            <Button className="without-background-button"
                                variant="outlined"
                                sx={{
                                    padding: {
                                        sm: "12px 20px !important",
                                        md: "12px 30px !important",
                                    }
                                }}
                            >
                                Decline
                            </Button>
                            <Button className="with-background-button"
                                variant="contained"
                                sx={{
                                    padding: {
                                        sm: "12px 20px !important",
                                        md: "12px 30px !important",
                                    }
                                }}
                            >
                                Accept
                            </Button>
                        </Box>
                    </Box>

                    <Box className="step-right">
                        <Typography className="step-description">
                            Clicking the RSVP link opens a page showing the event information along with response options.
                        </Typography>
                        <ul className="step-list">
                            <li>Event name, date, time, and location</li>
                            <li>Accept or Decline attendance</li>
                            <li>Instant response tracking</li>
                        </ul>
                    </Box>
                </Box>
            ),
        },
        {
            title: "3. Get Your QR Code",
            content: (
                <Box className="step-box" sx={{
                    py: {
                        sm: "14px",
                        md: "25px"
                    }
                }}>
                    <Box className="step-left-qrcode-section">
                        <Typography className="step-description">
                            After accepting, guests receive a digital ticket with their personal QR code and full event details.
                        </Typography>
                        <ul className="step-list">
                            <li>Personalized QR code (for check-in)</li>
                            <li>Event name, address, and timing</li>
                            <li>Add to calendar feature</li>
                        </ul>
                    </Box>
                    <Box>
                        <img className="qr-image"
                            src={QrCode}
                            alt="QR Code"
                        />
                    </Box>
                </Box>
            ),
        },
        {
            title: "4. Scan at Entry",
            content: (
                <Box className="step-box" sx={{
                    py: {
                        sm: "14px",
                        md: "26px",
                    }
                }}>
                    <Box className="scan-box">
                        <Box className="scan-content-left-section">
                            <Box className="scan-success">
                                <CheckCircleIcon className="success-icon" />
                                <Typography className="left-scan-section-heading" variant="subtitle1">
                                    Scan Successful!
                                </Typography>
                            </Box>
                            <Typography className="scan-description" variant="body2">Welcome, John Doe</Typography>
                            <Typography className="scan-description" variant="body2">Seat: A12</Typography>
                        </Box>
                    </Box>

                    <Box className="scan-content-right-section">
                        <Typography className="step-description">
                            Guests scan their QR code at the venue. The system validates the ticket and marks attendance instantly.
                        </Typography>
                        <ul className="step-list">
                            <li>Mobile scanning enabled</li>
                            <li>Real-time check-in status</li>
                            <li>Contactless & efficient entry</li>
                        </ul>
                    </Box>
                </Box>
            ),
        },
    ]

    return (
        <Modal
            open={open}
            onClose={(event, reason) => {
                if (reason === "backdropClick" || reason === "escapeKeyDown") {
                    return;
                }
                onClose();
            }}
        >
            <Box className="onboarding-modal" >
                {/*  Stepper */}
                <Stepper
                    activeStep={activeStep}
                    orientation="vertical"
                    connector={<CustomConnector />}
                    className="onboarding-stepper"
                    sx={{
                        ".MuiStepLabel-label": {
                            display: "none",
                        },
                    }}
                >
                    {steps.map((_, index) => (
                        <Step key={index}>
                            <StepLabel StepIconComponent={CustomStepIcon} />
                        </Step>
                    ))}
                </Stepper>

                {/* Step Content */}
                <Box className="onboarding-step-content"
                >
                    <Typography
                        variant="h6"
                        gutterBottom
                        className="onboarding-step-title"
                    >
                        {stepContent[activeStep].title}
                    </Typography>

                    <Box>{stepContent[activeStep].content}</Box>

                    {/* Navigation */}
                    <Box className="onboarding-navigation"
                        sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
                    >
                        {activeStep > 0 ? (
                            <Button onClick={handleBack} className="without-background-button" sx={{ p: "12px 16px" }}>
                                Back
                            </Button>
                        ) : (
                            <Box />
                        )}
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            className="with-background-button"
                            sx={{
                                p: "12px 16px",
                            }}
                        >
                            {activeStep === steps.length - 1 ? "Finish" : "Next"}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Modal>
    );
};

export default DashboardOnboardingPopup;
