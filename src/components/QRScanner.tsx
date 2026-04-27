"use client";

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  type DragEvent,
} from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  Fade,
  Zoom,
  CircularProgress,
  Divider,
  Stack,
  Paper,
  useTheme,
  alpha,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentPasteIcon from "@mui/icons-material/ContentPaste";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ImageIcon from "@mui/icons-material/Image";
import { useTranslations } from "next-intl";

type QRResult = {
  text: string;
  isUrl: boolean;
};

function isUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return text.startsWith("www.") || /^https?:\/\//i.test(text);
  }
}

type JsQR = typeof import("jsqr").default;

function getImageData(
  img: HTMLImageElement,
  scale: number,
  mode: "normal" | "grayscale" | "contrast" | "invert"
): ImageData | null {
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  if (w <= 0 || h <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);

  if (mode === "normal") return data;

  const pixels = data.data;
  for (let i = 0; i < pixels.length; i += 4) {
    let r = pixels[i];
    let g = pixels[i + 1];
    let b = pixels[i + 2];

    if (mode === "grayscale" || mode === "contrast") {
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      r = gray;
      g = gray;
      b = gray;
    }

    if (mode === "contrast") {
      const contrasted = r < 128 ? 0 : 255;
      r = contrasted;
      g = contrasted;
      b = contrasted;
    }

    if (mode === "invert") {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  }

  return data;
}

async function tryDecodeImage(img: HTMLImageElement): Promise<string | null> {
  const jsQR: JsQR = (await import("jsqr")).default;
  const strategies: Array<{
    scale: number;
    mode: "normal" | "grayscale" | "contrast" | "invert";
  }> = [
    { scale: 1, mode: "normal" },
    { scale: 2, mode: "normal" },
    { scale: 1, mode: "grayscale" },
    { scale: 2, mode: "grayscale" },
    { scale: 1, mode: "contrast" },
    { scale: 2, mode: "contrast" },
    { scale: 3, mode: "normal" },
    { scale: 0.5, mode: "normal" },
    { scale: 1, mode: "invert" },
    { scale: 2, mode: "invert" },
    { scale: 1.5, mode: "grayscale" },
    { scale: 3, mode: "contrast" },
  ];

  for (const { scale, mode } of strategies) {
    const imageData = getImageData(img, scale, mode);
    if (!imageData) continue;

    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (result?.data) return result.data;
  }

  return null;
}

async function processImageFile(file: File): Promise<QRResult | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);
      const text = await tryDecodeImage(img);
      if (!text) return resolve(null);
      resolve({ text, isUrl: isUrl(text) });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

export function QRScanner() {
  const t = useTranslations("Scanner");
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QRResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError(t("errors.invalidFileType"));
        return;
      }

      setLoading(true);
      setError(null);
      setResult(null);

      const blobUrl = URL.createObjectURL(file);
      setPreviewUrl(blobUrl);

      const qrResult = await processImageFile(file);

      setLoading(false);
      if (!qrResult) {
        setError(t("errors.unreadableQr"));
      } else {
        setResult(qrResult);
      }
    },
    [t]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handlePaste = useCallback(
    async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            await handleFile(file);
            return;
          }
        }
      }
    },
    [handleFile]
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handlePasteButton = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const file = new File([blob], "pasted.png", { type });
            await handleFile(file);
            return;
          }
        }
      }
      setError(t("errors.emptyClipboard"));
    } catch {
      setError(t("errors.clipboardPermission"));
    }
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = result.text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setLoading(false);
  };

  const dropZoneColor = dragOver
    ? alpha(theme.palette.primary.main, 0.15)
    : alpha(theme.palette.background.paper, 0.5);

  return (
    <Box sx={{ width: "100%", maxWidth: 760, mx: "auto" }}>
      <Box sx={{ textAlign: "center", mb: 5 }}>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: 4,
            mb: 2.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)}, ${alpha(theme.palette.secondary.main, 0.2)})`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        >
          <QrCode2Icon sx={{ fontSize: 38, color: theme.palette.primary.main }} />
        </Box>
        <Typography
          variant="h4"
          fontWeight={800}
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            mb: 1,
            letterSpacing: "-0.02em",
          }}
        >
          PasteQR
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t("heroDescription")}
        </Typography>
      </Box>

      {!previewUrl && (
        <Card
          elevation={0}
          sx={{
            mb: 3,
            border: `2px dashed ${
              dragOver
                ? theme.palette.primary.main
                : alpha(theme.palette.primary.main, 0.25)
            }`,
            bgcolor: dropZoneColor,
            transition: "all 0.25s ease",
            cursor: "pointer",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent sx={{ py: 6, textAlign: "center" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />

            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
                transition: "transform 0.2s",
                transform: dragOver ? "scale(1.1)" : "scale(1)",
              }}
            >
              <CloudUploadIcon
                sx={{ fontSize: 32, color: theme.palette.primary.main }}
              />
            </Box>

            <Typography variant="h6" fontWeight={600} gutterBottom>
              {t("uploadTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t("uploadDescription")}
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              justifyContent="center"
              flexWrap="wrap"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="contained"
                startIcon={<ImageIcon />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ minWidth: 160 }}
              >
                {t("chooseFile")}
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentPasteIcon />}
                onClick={handlePasteButton}
                sx={{ minWidth: 160 }}
              >
                {t("pasteImage")}
              </Button>
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 2 }}
            >
              <kbd
                style={{
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  fontSize: "0.75rem",
                  fontFamily: "monospace",
                  color: theme.palette.primary.main,
                }}
              >
                Ctrl + V
              </kbd>{" "}
              {t("pasteShortcut")}
            </Typography>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Fade in>
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress size={48} thickness={3} />
            <Typography sx={{ mt: 2 }} color="text.secondary">
              {t("loading")}
            </Typography>
          </Box>
        </Fade>
      )}

      {previewUrl && !loading && (
        <Fade in>
          <Box>
            <Card
              elevation={0}
              sx={{
                mb: 3,
                overflow: "hidden",
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 3,
                  py: 1.5,
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                  gap: 1,
                }}
              >
                <ImageIcon
                  sx={{ fontSize: 18, color: theme.palette.text.secondary }}
                />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {t("previewLabel")}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Tooltip title={t("reset")} arrow>
                  <IconButton size="small" onClick={handleReset} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  p: 2,
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  maxHeight: 320,
                  overflow: "hidden",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={t("previewAlt")}
                  style={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
              </Box>
            </Card>

            {error && (
              <Fade in>
                <Alert
                  severity="error"
                  sx={{ mb: 3, borderRadius: 3 }}
                  action={
                    <Button size="small" onClick={handleReset} color="inherit">
                      {t("retry")}
                    </Button>
                  }
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {result && (
              <Zoom in>
                <Card
                  elevation={0}
                  sx={{
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    background: alpha(theme.palette.primary.main, 0.04),
                    overflow: "visible",
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        mb: 2.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.15),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CheckCircleIcon
                          sx={{
                            fontSize: 18,
                            color: theme.palette.success.main,
                          }}
                        />
                      </Box>
                      <Typography variant="h6" fontWeight={700}>
                        {t("resultTitle")}
                      </Typography>
                      <Chip
                        size="small"
                        icon={result.isUrl ? <LinkIcon /> : <TextFieldsIcon />}
                        label={result.isUrl ? t("urlType") : t("textType")}
                        color={result.isUrl ? "primary" : "secondary"}
                        variant="outlined"
                        sx={{ ml: "auto", fontWeight: 600 }}
                      />
                    </Box>

                    <Divider sx={{ mb: 2.5, opacity: 0.4 }} />

                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                        borderRadius: 3,
                        wordBreak: "break-all",
                        mb: 2.5,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: result.isUrl ? "inherit" : "monospace",
                          color: result.isUrl
                            ? theme.palette.primary.main
                            : theme.palette.text.primary,
                          lineHeight: 1.6,
                          fontWeight: result.isUrl ? 500 : 400,
                        }}
                      >
                        {result.isUrl && (
                          <LinkIcon
                            sx={{
                              fontSize: 16,
                              mr: 0.5,
                              verticalAlign: "text-bottom",
                              opacity: 0.7,
                            }}
                          />
                        )}
                        {result.text}
                      </Typography>
                    </Paper>

                    <Stack direction="row" spacing={1.5} flexWrap="wrap">
                      <Tooltip
                        title={copied ? t("copied") : t("copyTooltip")}
                        arrow
                      >
                        <Button
                          variant="contained"
                          startIcon={
                            copied ? <CheckCircleIcon /> : <ContentCopyIcon />
                          }
                          onClick={handleCopy}
                          color={copied ? "success" : "primary"}
                          sx={{ minWidth: 140 }}
                        >
                          {copied ? t("copied") : t("copy")}
                        </Button>
                      </Tooltip>

                      {result.isUrl && (
                        <Button
                          variant="outlined"
                          startIcon={<OpenInNewIcon />}
                          component="a"
                          href={
                            result.text.startsWith("http")
                              ? result.text
                              : `https://${result.text}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ minWidth: 140 }}
                        >
                          {t("openLink")}
                        </Button>
                      )}

                      <Button
                        variant="text"
                        startIcon={<DeleteIcon />}
                        onClick={handleReset}
                        color="error"
                        sx={{ ml: "auto !important" }}
                      >
                        {t("reset")}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Zoom>
            )}
          </Box>
        </Fade>
      )}

      {error && !previewUrl && (
        <Fade in>
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        </Fade>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mb: 2, opacity: 0.7 }}
        >
          {t("tipsLabel")}
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          flexWrap="wrap"
          sx={{ gap: 1 }}
        >
          {[
            t("tips.cameraFree"),
            t("tips.screenshotPaste"),
            t("tips.dragAndDrop"),
            t("tips.urlOpen"),
          ].map((tip) => (
            <Chip
              key={tip}
              label={tip}
              size="small"
              variant="outlined"
              sx={{
                fontSize: "0.72rem",
                opacity: 0.65,
                borderColor: alpha(theme.palette.divider, 0.5),
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
