"use client";

import { createTheme, ThemeOptions, alpha } from "@mui/material/styles";
import { Roboto } from "next/font/google";

export const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export type ThemeMode = "light" | "dark" | "night";

const sharedOptions: ThemeOptions = {
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#9c27b0",
      light: "#ba68c8",
      dark: "#7b1fa2",
    },
    background: {
      default: "#f5f7fa",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a1a2e",
      secondary: "#4a5568",
    },
  },
  components: {
    ...sharedOptions.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(12px)",
          color: "#1a1a2e",
          boxShadow: "0 1px 0 rgba(0,0,0,0.08)",
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "dark",
    primary: {
      main: "#60a5fa",
      light: "#93c5fd",
      dark: "#3b82f6",
    },
    secondary: {
      main: "#c084fc",
      light: "#d8b4fe",
      dark: "#a855f7",
    },
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
    },
  },
  components: {
    ...sharedOptions.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(15,23,42,0.85)",
          backdropFilter: "blur(12px)",
          color: "#f1f5f9",
          boxShadow: "0 1px 0 rgba(255,255,255,0.05)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "#1e293b",
          border: "1px solid rgba(255,255,255,0.06)",
        },
      },
    },
  },
});

export const nightTheme = createTheme({
  ...sharedOptions,
  palette: {
    mode: "dark",
    primary: {
      main: "#34d399",
      light: "#6ee7b7",
      dark: "#10b981",
    },
    secondary: {
      main: "#38bdf8",
      light: "#7dd3fc",
      dark: "#0ea5e9",
    },
    background: {
      default: "#020617",
      paper: "#0c1120",
    },
    text: {
      primary: "#e2e8f0",
      secondary: "#64748b",
    },
    success: {
      main: "#34d399",
    },
    info: {
      main: "#38bdf8",
    },
  },
  components: {
    ...sharedOptions.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(2,6,23,0.90)",
          backdropFilter: "blur(16px)",
          color: "#e2e8f0",
          boxShadow: "0 1px 0 rgba(52,211,153,0.1)",
          borderBottom: "1px solid rgba(52,211,153,0.08)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: "#0c1120",
          border: "1px solid rgba(52,211,153,0.1)",
          boxShadow: "0 0 20px rgba(52,211,153,0.03)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 10,
        },
        containedPrimary: {
          background: "linear-gradient(135deg, #10b981, #34d399)",
          color: "#020617",
          "&:hover": {
            background: "linear-gradient(135deg, #059669, #10b981)",
          },
        },
      },
    },
  },
});

export function getTheme(mode: ThemeMode) {
  switch (mode) {
    case "light":
      return lightTheme;
    case "dark":
      return darkTheme;
    case "night":
      return nightTheme;
  }
}
