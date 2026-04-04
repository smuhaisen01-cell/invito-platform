import React from "react";
import { Box, Avatar, Typography } from "@mui/material";
import Button from '@mui/material/Button';

import EmailIcon from "@mui/icons-material/Email";
import { Stack, styled } from "@mui/system";
import "./TeamMemberCard.css";
// Styled Components
const TeamCard = styled(Box)(({ theme }) => ({
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: 267.5,
  height: 114,
  background: "#FFFFFF",
  border: "1px solid #DDDDDD",
  boxShadow: "0px 3px 12px rgba(0, 0, 0, 0.08)",
  borderRadius: 12,
  marginBottom: 24,
  flexShrink: 0, // Prevent shrinking inside flex/grid containers
  [theme.breakpoints.down("md")]: {
    width: 220,
  },
  [theme.breakpoints.down("sm")]: {
    // Instead of 100%, keep fixed small width for consistency
    width: 267.5,
    height: 114, // or "auto" if you prefer flexible height
  },
}));

const CardHeader = styled(Box)({
  borderTopRightRadius: 12,
  borderTopLeftRadius: 12,
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  padding: "12px",
  gap: 12,
  width: "100%",
  background: "#F8F7FD",
});

const CardAvatar = styled(Avatar)({
  width: 50,
  height: 50,
});

const NameRoleWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  gap: 4,
});

const NameText = styled(Typography)({
  fontFamily: "'Manrope', sans-serif",
  fontWeight: 700,
  fontSize: 16,
  color: "#090415",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const RoleText = styled(Typography)({
  fontFamily: "'Manrope', sans-serif",
  fontWeight: 400,
  fontSize: 14,
  color: "#3A3644",
});

const EmailSection = styled(Box)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  padding: "12px",
  gap: 12,
  width: "100%",
  boxSizing: "border-box",
});

const EmailText = styled(Typography)({
  fontFamily: "'Manrope', sans-serif",
  fontWeight: 400,
  fontSize: 12,
  color: "#3A3644",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
});

const EmailIconStyled = styled(EmailIcon)({
  width: 16,
  height: 16,
  color: "#3A3644",
});

const TeamMemberCard = ({ name, role, email, emailVerify }) => {
  return (
    <TeamCard>
      <CardHeader>
        <CardAvatar
          alt={name}
          src={`https://www.svgrepo.com/show/9907/male-avatar.svg`}
        />
        <NameRoleWrapper>
          <NameText title={name} style={{display: "flex",gap: "20px"}}>
            {name.substring(0,10)}
          {!emailVerify &&
              <Stack direction="row" spacing={2}>

            <Button variant="contained" size="small" disabled sx={{
    fontSize: { xs: "10px", sm: "11px", md: "12px" },
    padding: { xs: "2px 6px", sm: "3px 8px" },
    minWidth: "unset",
    textTransform: "none",
    borderRadius: "6px",
    height: "fit-content",
    alignSelf: "center"
  }}
>
              { "Invited"}
            </Button>
              </Stack>
}
          </NameText>

          <RoleText>
            {role || "Admin"}

          </RoleText>
        </NameRoleWrapper>
      </CardHeader>
      <EmailSection>
        <EmailIconStyled />
        <EmailText title={email}>{email}</EmailText>
      </EmailSection>
    </TeamCard>
  );
};

export default TeamMemberCard;
