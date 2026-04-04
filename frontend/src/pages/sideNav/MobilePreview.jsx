import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Button,
  IconButton,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  MoreVert, ArrowBack, Call, InsertEmoticon as InsertEmoticonIcon,
  AttachFile as AttachFileIcon,
  CameraAlt as CameraAltIcon,
  Mic as MicIcon,
} from '@mui/icons-material';
import Camera from "../../../public/assets/images/camera.svg";
import User from "../../../public/assets/images/wuUser.png";
import Correct from "../../../public/assets/images/correct.png";
import cardImage from "../../../public/assets/images/card.png";
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ReplyIcon from '@mui/icons-material/Reply';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MarkunreadOutlinedIcon from '@mui/icons-material/MarkunreadOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WifiIcon from '@mui/icons-material/Wifi';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MenuIcon from '@mui/icons-material/DensityMedium';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

const dummyEvent = {
  id: 101,
  title: 'Reverb 3.0',
  description: 'Your one-stop destination to plan, organize, and manage events',
  footer: 'Powered by Invito',
  date: '2025-07-25',
  time: '5:00 PM',
  attendeesCount: '20+',
  day: '12',
};

const MobilePreview = ({ image, title, description, footer }) => {
  const finalTitle = title?.trim() || dummyEvent.title;
  const finalDescription = description?.trim() || dummyEvent.description;
  const finalFooter = footer?.trim() || dummyEvent.footer;
  const [channel, setChannel] = useState('whatsapp');

  return (
    <Box className="mobile-section">
      <Box className="addevent-Toggle-button">
        <ToggleButtonGroup
          value={channel}
          exclusive
          onChange={(e, newChannel) => newChannel && setChannel(newChannel)}
          sx={{
            width: '100%',
            justifyContent: 'space-between',
            '& .MuiToggleButton-root': {
              flex: 1,
              textTransform: 'none',
              border: 'none',
              px: 3,
              fontWeight: 700,
              borderRadius: '12px !important',
              color: '#333',
              '&.Mui-selected': {
                backgroundColor: '#5829CF',
                color: '#fff',
              },
            },
          }}
        >
          <ToggleButton
            value="whatsapp"
            sx={{
              height: { xs: "36px", sm: "40px", md: "35px", lg: "43px" },
            }}
          >
            WhatsApp
          </ToggleButton>

          <ToggleButton
            value="email"
            sx={{
              height: { xs: "36px", sm: "40px", md: "35px", lg: "43px" },
            }}
          >
            Email
          </ToggleButton>

        </ToggleButtonGroup>
      </Box>
      <Box className="device-frame">
        <div className="notch-area">
          <div className="speaker"></div>
          <Avatar className="camera" src={Camera} ali="camera-icon" />
        </div>
        <Box className={`mobile-preview ${channel}`}>
          {channel === 'whatsapp' && (
            <Box className="whatsapp-header" display={'flex'} alignItems="center" justifyContent="space-between" flexDirection='column'>
              <Box
                className="status-bar"
              >
                <Box className="left-time" sx={{ padding: '0 10px' }}>1:42</Box>
                <Box className="right-icons">
                  <Box className="icon signal" />
                  <Box className="icon battery" />
                </Box>
              </Box>

              <Box className="second-header">
                <Box className="left-section">
                  <ArrowBack fontSize="small" className="icon" />
                  <Avatar src={User} className="avatar" />
                  <Typography className="business-name">
                    Business name <Avatar src={Correct} alt='Correct icon' sx={{ width: "13px", height: "13px", ml: "3px" }} />
                  </Typography>
                </Box>
                <Box className="right-section">
                  <Call fontSize="small" className="icon" />
                  <MoreVert fontSize="small" className="icon" />
                </Box>
              </Box>
            </Box>
          )}

          {channel === 'email' && (
            <Box className="email-preview">

              <Box className="mobile-status-bar" display="flex" justifyContent="space-between" alignItems="center" py={0.5}>
                <Typography fontSize="12px" color="#5D5C5D">2:29</Typography>

                <Box display="flex" alignItems="center" gap={0.5}>
                  <AccessTimeIcon sx={{ fontSize: 14, color: '#333333' }} />
                  <WifiIcon sx={{ fontSize: 16, color: '#333333' }} />
                  <SignalCellularAltIcon sx={{ fontSize: 16, color: '#333333' }} />
                  <BatteryFullIcon sx={{ fontSize: 18, color: '#333333' }} />
                </Box>
              </Box>

              <Box className="email-top-bar" display="flex" alignItems="center" justifyContent="space-between" py={1}>
                <ArrowBackIcon sx={{ fontSize: 24 }} />

                <Box display="flex" alignItems="center" gap={2}>
                  <ArchiveOutlinedIcon sx={{ fontSize: 20 }} />
                  <DeleteOutlineOutlinedIcon sx={{ fontSize: 20 }} />
                  <MarkunreadOutlinedIcon sx={{ fontSize: 20 }} />
                  <MoreVertIcon sx={{ fontSize: 20 }} />
                </Box>
              </Box>
              <Box className="email-header" display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="h6" fontWeight="semi-bold" fontSize="16px" color="#292929">
                  It’s HERE! NEW Deals new you! Come check out the excitement!
                  <Box component="span" className="inbox-badge" ml={1}>Inbox</Box>
                </Typography>
                <StarBorderIcon sx={{ color: '#9e9e9e', fontSize: 20 }} />
              </Box>


              <Box className="email-sender-info" display="flex" alignItems="center">
                <Avatar
                  src="/assets/images/senderImage.png"
                  alt="Sender"
                  sx={{ width: 40, height: 40 }}
                />
                <Box ml={1}>
                  <Typography fontSize="12px" color="#292929" fontWeight={600}>
                    invito.sa
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Typography variant="body2" color="#333333" fontSize="10px" fontWeight={500}>
                      to me
                    </Typography>
                    <ExpandMoreIcon sx={{ fontSize: 14, color: '#666', mx: 0.5 }} />
                  </Box>
                </Box>

                <Box flexGrow={1} />

                <Typography variant="body2" fontSize="10px" color="#333333" mr={0.5}>
                  May 6
                </Typography>

                <ReplyIcon sx={{ fontSize: 16, color: '#5f6368', mx: 0.2 }} />
                <MoreVertIcon sx={{ fontSize: 18, color: '#5f6368', }} />
              </Box>

            </Box>
          )}

          <Box
            sx={{
              position: 'absolute',
              top: 98,
              left: 1,
              width: 15,
              height: 16,
              backgroundColor: '#fff',
              clipPath: 'polygon(0 0, 0 100%, 100% 0)',
              transform: 'rotate(90deg)',
              zIndex: 9999,
              // maxHeight: "732px",
              // overflowY: "scroll",
            }}
          />
          <Card className="preview-card">
            <CardMedia
              component="img"
              image={image || cardImage}
              alt="Card Preview"
              height="160"
              sx={{
                objectFit: 'cover',
                borderRadius: 10,
              }}
              className="preview-image"
            />

            <CardContent className="custom-card-content" sx={{ p: 2, pt: 0 }}>
              <Box className="preview-card-content">
                <Box flex={1}>
                  <Box className="title-menu">
                    <Typography variant="subtitle1" className="preview-title">
                      {finalTitle}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    className="preview-description"
                    color="text.secondary"
                    mt={0.5}
                  >
                    {finalDescription.split('\n').map((line, index) => (
                      <React.Fragment key={index}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </Typography>


                  <Typography
                    variant="body2"
                    className="preview-footer"
                    color="text.secondary"
                    mt={0.5}
                  >
                    {finalFooter}
                  </Typography>
                </Box>
              </Box>
              {/* WhatsApp Timestamp & CTA  */}
              {/* {channel === 'whatsapp' && (
              <>
                <Divider sx={{ my: 1, borderColor: '#DDDDDD' }} />
                <Box className="view-details" >
                  <Button className='view-details-button'
                    variant="text"
                    startIcon={<OpenInNew />}
                  >
                    View Details
                  </Button>
                </Box>
              </>
            )}  */}
            </CardContent>
          </Card>

          {channel === 'whatsapp' && (
            <Box className="chat-input">
              <Box
                className="whatsapp-footer"
              >
                <Box className="whatsapp-input-box"
                  sx={{
                    padding: { xs: '6px 3px', sm: '10px', md: '4px 3px', lg: '8px' },
                    gap: { xs: '3px', sm: '4px', md: '2px', lg: '3px' }
                  }}
                >
                  <InsertEmoticonIcon sx={{ color: '#8a8a8a', fontSize: { lg: 18, md: 14, sm: 16, xs: 16 }, }} />
                  <input
                    type="text"
                    placeholder="Type a message"
                    disabled
                    className="custom-placeholder"
                  />

                  <AttachFileIcon sx={{ color: '#8a8a8a', fontSize: { lg: 18, md: 14, sm: 16, xs: 16 }, transform: 'rotate(45deg)' }} />
                  <CameraAltIcon sx={{ color: '#8a8a8a', fontSize: { lg: 18, md: 14, sm: 16, xs: 16 }, }} />
                </Box>

                <Box className="whatsapp-mic-icon"
                  sx={{
                    width: { lg: 35, md: 30, sm: 37, xs: 34 },
                    height: { lg: 34, md: 28, sm: 35, xs: 30 },
                  }}
                >
                  <MicIcon sx={{ color: 'white', fontSize: { lg: 18, md: 14, sm: 18, xs: 16 }, }} />
                </Box>
              </Box>
            </Box>
          )}

          {channel === 'email' && (
            <Box
              className="mobile-nav-footer"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              sx={{
                backgroundColor: '#F7F8FC',
                px: 4,
                py: 1.3,
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
              }}
            >
              <MenuIcon sx={{ fontSize: 18, color: '#949494' }} />
              <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: '#949494' }} />
              <ArrowBackIosNewIcon sx={{ fontSize: 18, color: '#949494' }} />
            </Box>
          )}

        </Box>
      </Box>
    </Box>
  );
};

export default MobilePreview;
