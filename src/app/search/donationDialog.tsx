import CloseIcon from "@mui/icons-material/Close";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { setCookie } from "cookies-next";
import React from "react";

import { DonationInfo } from "@/app/search/types";
import { useTranslation } from "@/components/TranslationProvider";

export default function DonationModal({
  open,
  onClose,
  donationInfo,
}: {
  open: boolean;
  onClose: () => void;
  donationInfo: DonationInfo;
}) {
  const { t } = useTranslation();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  // Configuration
  const monthlyGoal = 50;

  const handleClose = () => {
    setCookie("donationModalSeen", "true", {
      maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
      path: "/",
    });
    localStorage.setItem("hasSeenDonationModal", "true");
    onClose();
  };

  // Calculate progress
  const progressPercentage = Math.min(
    (donationInfo.totalDonations / monthlyGoal) * 100,
    100,
  );

  return (
    <Dialog
      open={open}
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          borderRadius: 4,
          width: "100%", // Ensures it tries to fill space
          maxWidth: "min(90vw, 400px)", // The magic responsive syntax
          overflow: "hidden", // Keeps elements inside rounded corners
        },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, pb: 1, position: "relative" }}>
        <IconButton
          onClick={handleClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <DialogTitle sx={{ p: 0, fontWeight: 800, fontSize: "1.4rem" }}>
          {t("Server Fund")}
        </DialogTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t("Support the server costs")}
        </Typography>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Progress Bar Section (Padded) */}
        <Box sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold" color="primary">
              {t("$%d raised", { totalDonations: donationInfo.totalDonations })}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {t("Goal: %d this month", { donationGoal: monthlyGoal })}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: "grey.200",
              "& .MuiLinearProgress-bar": { bgcolor: "#FFDD00" },
            }}
          />
        </Box>

        <Divider />

        {/* Scrollable Donor List */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography
            variant="caption"
            sx={{
              px: 2,
              fontWeight: "bold",
              color: "text.secondary",
              textTransform: "uppercase",
            }}
          >
            {t("Recent Supporters (%d)", {
              numSupporters: donationInfo.supporters.length,
            })}
          </Typography>

          <List
            sx={{
              maxHeight: 200, // Limits height to prevent modal from getting too tall
              overflow: "auto",
              "&::-webkit-scrollbar": { width: "6px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "rgba(0,0,0,0.1)",
                borderRadius: "4px",
              },
            }}
          >
            {donationInfo.supporters.length > 0 ? (
              donationInfo.supporters.map((donor, index) => (
                <ListItem key={index} dense>
                  <ListItemAvatar sx={{ minWidth: "auto", mr: 1.5 }}>
                    <Avatar
                      sx={{
                        bgcolor: "#fff3e0",
                        color: "#ff9800",
                        width: 32,
                        height: 32,
                        fontSize: "0.9rem",
                      }}
                    >
                      {donor.supporter_name ? (
                        donor.supporter_name[0]
                      ) : (
                        <PersonIcon />
                      )}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={donor.supporter_name || "Anonymous"}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      fontSize: "0.95rem",
                    }}
                  />
                  &nbsp;&nbsp;
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="success.main"
                  >
                    +$
                    {donor.support_coffees *
                      parseFloat(donor.support_coffee_price)}
                  </Typography>
                </ListItem>
              ))
            ) : (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {t("Be the first to support this month!")}
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </DialogContent>

      {/* Footer / Action Button */}
      <Box
        sx={{ p: 3, pt: 1, display: "flex", flexDirection: "column", gap: 1 }}
      >
        <Button
          variant="contained"
          href="https://buymeacoffee.com/chomkwoy"
          target="_blank"
          fullWidth
          startIcon={<LocalCafeIcon />}
          sx={{
            fontWeight: 700,
            borderRadius: 50,
            py: 1.5,
            textTransform: "none",
            fontSize: "1rem",
          }}
        >
          {t("Donate")}
        </Button>
      </Box>
    </Dialog>
  );
}
