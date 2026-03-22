"use client";

import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  useTheme,
  alpha,
} from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const theme = useTheme();

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar sx={{ gap: 2, minHeight: { xs: 56, sm: 64 } }}>
        <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              <QrCodeScannerIcon
                sx={{ fontSize: 20, color: theme.palette.primary.main }}
              />
            </Box>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.01em",
              }}
            >
              PasteQR
            </Typography>
          </Box>
        </Link>

        <Box sx={{ flex: 1 }} />

        <ThemeToggle />
      </Toolbar>
    </AppBar>
  );
}
