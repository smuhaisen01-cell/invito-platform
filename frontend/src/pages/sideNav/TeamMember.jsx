import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { styled } from "@mui/system";
import TeamMemberCard from "../../components/TeamMemberCard/TeamMemberCard";
import { getAllUsers, sendInvite } from "../../services/auth";
import { toast } from "react-toastify";

// Styled Components
const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  padding: 24,
  maxWidth: 1190,
  margin: "0 auto",
  background: "#FFFFFF",
});

const Header = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
});

const Title = styled(Typography)({
  fontFamily: "'Lato', sans-serif",
  fontWeight: 700,
  fontSize: 28,
  color: "#090415",
});

const InviteButton = styled(Button)({
  backgroundColor: "#5829CF",
  color: "#FFFFFF",
  padding: "12px 16px",
  borderRadius: 12,
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#4d21b8",
  },
});

const TeamMembers = () => {
  const [teamMembers, setUsers] = useState([]);
  console.log("Team Members:", teamMembers);
  const [openModal, setOpenModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
  });

  const handleChange = (field) => (e) =>
    setFormData({ ...formData, [field]: e.target.value });

  const handleInvite = async () => {
    try {
      await sendInvite({ formData });
      toast.success("Invitation sent successfully.");
      setFormData({ name: "", role: "", email: "" });
      setOpenModal(false);
      setLoading((value) => !value);
    } catch (error) {
      console.error("Failed to invite team member:", error);
    }
  };

  useEffect(() => {
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
  }, [loading, setLoading]);

  const getShortName = (fullName) => {
    if (!fullName) return "";
    return fullName.trim().charAt(0).toUpperCase();
  };

  return (
    <Container>
      <Header>
        <Box>
          <Title>Team Members</Title>
        </Box>
        <InviteButton
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
        >
          Invite
        </InviteButton>
      </Header>

      <Grid container spacing={3}>
        {teamMembers
          .slice()
          .sort((a, b) => {
            const nameA = getShortName(a.name);
            const nameB = getShortName(b.name);
            return nameA.localeCompare(nameB);
          })
          .map((member, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <TeamMemberCard {...member} />
            </Grid>
          ))}
      </Grid>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth={false}
        PaperProps={{
          sx: {
            width: 540,
            height: 422,
            borderRadius: "12px",
            backgroundColor: "#fff",
            boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.08)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            height: 56,
            background: "#F8F7FD",
            borderBottom: "1px solid #DDDDDD",
            fontFamily: "'Lato', sans-serif",
            fontWeight: 700,
            fontSize: 20,
            color: "#090415",
            position: "relative",
            boxSizing: "border-box",
            paddingLeft: 3,
            paddingRight: 3,
          }}
        >
          Invite Team Member
          <IconButton
            onClick={() => setOpenModal(false)}
            sx={{
              position: "absolute",
              right: 20,
              top: "calc(50% - 12px)",
              color: "#090415",
            }}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 1,
            pb: 1.5,
            px: 3,
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 400,
              fontSize: 14,
              color: "#090415",
              mt: "10px",
            }}
          >
            Full Name
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter Full Name"
            size="small"
            value={formData.name}
            onChange={handleChange("name")}
            margin="normal"
            InputProps={{
              style: {
                borderRadius: 12,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 14,
                color: "#090415",
                height: 48,
                borderColor: "#DDDDDD",
              },
            }}
          />

          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 400,
              fontSize: 14,
              color: "#090415",
              mb: 0.5,
            }}
          >
            Role
          </Typography>
          <TextField
            fullWidth
            size="small"
            select
            value={formData.role}
            onChange={handleChange("role")}
            margin="normal"
            InputProps={{
              style: {
                borderRadius: 12,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 14,
                height: 48,
                color: "#090415",
                borderColor: "#DDDDDD",
              },
            }}
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Employee">Employee</MenuItem>  
          </TextField>

          <Typography
            sx={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 400,
              fontSize: 14,
              color: "#090415",
              mb: 0.5,
            }}
          >
            Email
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange("email")}
            margin="normal"
            type="email"
            InputProps={{
              style: {
                borderRadius: 12,
                height: 48,
                fontFamily: "'Manrope', sans-serif",
                fontSize: 14,
                color: "#090415",
                borderColor: "#DDDDDD",
              },
            }}
          />
        </DialogContent>

        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 2,
            px: 3,
            pb: 3,
            pt: 1,
            backgroundColor: "#fff",
          }}
        >
          <Button
            onClick={() => setOpenModal(false)}
            variant="outlined"
            sx={{
              borderRadius: 12,
              textTransform: "none",
              fontWeight: 700,
              fontSize: 14,
              color: "#5829CF",
              borderColor: "#5829CF",
              height: 43,
              width: 100,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={!formData.name || !formData.role || !formData.email}
            variant="contained"
            sx={{
              backgroundColor: "#5829CF",
              color: "#fff",
              borderRadius: 12,
              boxShadow: "none",
              textTransform: "none",
              fontWeight: 700,
              fontSize: 14,
              height: 43,
              width: 100,
              "&:hover": {
                backgroundColor: "#4d21b8",
              },
            }}
          >
            Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeamMembers;
