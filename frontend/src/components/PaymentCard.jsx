import React from 'react';
import { styled } from '@mui/material/styles';
import '../styles/scss/pages/sideNav/Subscription.scss'; // Ensure global styles are imported

import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import StarIcon from '@mui/icons-material/Star';

const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'highlighted',
})(({ theme, highlighted }) => ({
  borderRadius: 16,
  background: 'rgba(255, 255, 255, 0.95)',
  boxShadow: highlighted
    ? `0 12px 24px ${theme.palette.primary.main}33`
    : '0 6px 12px rgba(0, 0, 0, 0.1)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  maxWidth: 320,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: highlighted
      ? `0 16px 32px ${theme.palette.primary.main}55`
      : '0 8px 16px rgba(0, 0, 0, 0.15)',
  },
}));

const Ribbon = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 12,
  right: -12,
  background: theme.palette.warning.light,
  color: theme.palette.warning.contrastText,
  padding: '4px 16px',
  borderRadius: '0 12px 12px 0',
  fontWeight: 600,
  fontSize: '0.85rem',
  letterSpacing: '0.05em',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
}));

const PriceContainer = styled(Box)({
  background: 'linear-gradient(90deg, #6B46C1, #A0AEC0)',
  borderRadius: 12,
  padding: '16px',
  margin: '16px 0',
  color: '#fff',
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'center',
  gap: 6,
  boxShadow: '0 4px 12px rgba(107, 70, 193, 0.3)',
});

const PriceAmount = styled(Typography)({
  fontWeight: 700,
  fontSize: '2.5rem',
  lineHeight: 1,
});

const PricePeriod = styled(Typography)({
  fontWeight: 500,
  fontSize: '1rem',
  opacity: 0.9,
});

const FeatureList = styled(List)({
  padding: 0,
  margin: '12px 0',
  flexGrow: 1,
});

const FeatureListItem = styled(ListItem)({
  padding: '6px 0',
  gap: 8,
});

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: '12px 0',
  fontWeight: 600,
  textTransform: 'none',
  marginTop: 'auto',
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    background: theme.palette.primary.dark,
    boxShadow: `0 4px 12px ${theme.palette.primary.main}44`,
  },
  '&:focus': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
}));

const PaymentCard = ({
  title,
  price,
  period,
  features = [],
  disabledFeatures = [],
  isBestValue = false,
  buttonText = 'Get Started',
  width = 320,
  height = 'auto',
  sx = {},
}) => {
  return (
    <StyledCard
      highlighted={isBestValue}
      sx={{ width, height, ...sx }}
      elevation={0}
      role="article"
    >
      {isBestValue && (
        <Ribbon aria-label="Best Value">
          <StarIcon sx={{ fontSize: '1rem' }} />
          Best value
        </Ribbon>
      )}
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
        <Typography
          variant="h6"
          fontWeight={700}
          color={isBestValue ? 'primary.main' : 'text.primary'}
          sx={{ mb: 2, letterSpacing: '0.02em' }}
        >
          {title}
        </Typography>

        <PriceContainer>
          <PriceAmount>{price}</PriceAmount>
          <PricePeriod>{period}</PricePeriod>
        </PriceContainer>

        <FeatureList disablePadding>
          {features.map((item, idx) => (
            <FeatureListItem key={`feature-${idx}`}>
              <ListItemIcon sx={{ minWidth: 32, color: 'success.main' }}>
                <CheckCircleOutlineIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
              />
            </FeatureListItem>
          ))}
          {disabledFeatures.map((item, idx) => (
            <FeatureListItem key={`disabled-${idx}`} sx={{ opacity: 0.6 }}>
              <ListItemIcon sx={{ minWidth: 32, color: 'text.disabled' }}>
                <HighlightOffIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item}
                primaryTypographyProps={{ variant: 'body2', color: 'text.disabled' }}
              />
            </FeatureListItem>
          ))}
        </FeatureList>

        <ActionButton
          variant="contained"
          fullWidth
          size="large"
          aria-label={`${buttonText} for ${title}`}
        >
          {buttonText}
        </ActionButton>
      </CardContent>
    </StyledCard>
  );
};

export default PaymentCard;
