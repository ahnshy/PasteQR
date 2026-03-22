"use client";

import React from "react";
import {
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  useTheme,
  alpha,
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import NightsStayIcon from "@mui/icons-material/NightsStay";
import { useThemeMode } from "./ThemeProvider";
import { ThemeMode } from "@/theme";

export function ThemeToggle() {
  const { mode, setMode } = useThemeMode();
  const theme = useTheme();

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={(_, val) => val && setMode(val as ThemeMode)}
      size="small"
      sx={{
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
        borderRadius: 2,
        "& .MuiToggleButton-root": {
          border: "none",
          borderRadius: "8px !important",
          px: 1.2,
          py: 0.6,
          color: theme.palette.text.secondary,
          transition: "all 0.2s ease",
          "&.Mui-selected": {
            color: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
          },
          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
        },
      }}
    >
      <Tooltip title="라이트 모드" arrow>
        <ToggleButton value="light">
          <LightModeIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="다크 모드" arrow>
        <ToggleButton value="dark">
          <DarkModeIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
      <Tooltip title="나이트 모드" arrow>
        <ToggleButton value="night">
          <NightsStayIcon fontSize="small" />
        </ToggleButton>
      </Tooltip>
    </ToggleButtonGroup>
  );
}
