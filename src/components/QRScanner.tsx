"use client";

import React, {
  useCallback,
  useRef,
  useState,
  useEffect,
  DragEvent,
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

type QRResult = {
  text: string;
  isUrl: boolean;
  index: number;
};

function isUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return text.startsWith("www.") || /^https?:\/\//i.test(text);
  }
}

// ── QR 인식 핵심 함수 (전체 스캔 + 타일 분할 + 업스케일) ──────────────
type JsQR = typeof import("jsqr").default;
type JsQRResult = ReturnType<JsQR>;

type ScanRegion = { x: number; y: number; w: number; h: number };

// 캔버스에서 특정 영역을 잘라내고 업스케일하여 ImageData 반환
function applyModeFilter(
  d: Uint8ClampedArray,
  mode: "normal" | "grayscale" | "contrast" | "invert"
): void {
  if (mode === "normal") return;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    if (mode === "grayscale" || mode === "contrast") {
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      r = g = b = gray;
    }
    if (mode === "contrast") { r = g = b = r < 128 ? 0 : 255; }
    if (mode === "invert") { r = 255 - r; g = 255 - g; b = 255 - b; }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
}

// 타일 크롭 — 비율을 유지하며 targetSize 정사각형에 배치 (흰 여백 + quiet zone 추가)
// 왜곡 없이 업스케일하여 jsQR 인식률 극대화
function cropToImageData(
  img: HTMLImageElement,
  sx: number, sy: number, sw: number, sh: number,
  targetSize: number,
  mode: "normal" | "grayscale" | "contrast" | "invert"
): ImageData | null {
  if (sw <= 0 || sh <= 0) return null;
  const pad = Math.round(targetSize * 0.08); // 8% quiet zone 여백
  const inner = targetSize - pad * 2;
  const ratio = Math.min(inner / sw, inner / sh);
  const dw = Math.round(sw * ratio);
  const dh = Math.round(sh * ratio);
  const dx = pad + Math.round((inner - dw) / 2);
  const dy = pad + Math.round((inner - dh) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // 흰 배경 (quiet zone 확보)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetSize, targetSize);
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  const data = ctx.getImageData(0, 0, targetSize, targetSize);
  applyModeFilter(data.data, mode);
  return data;
}

// 마스크 영역을 흰색으로 칠한 full-image ImageData 반환
function getFullImageData(
  img: HTMLImageElement,
  scale: number,
  mode: "normal" | "grayscale" | "contrast" | "invert",
  masks: ScanRegion[] = []
): ImageData | null {
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  if (w <= 0 || h <= 0) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  for (const { x, y, w: mw, h: mh } of masks) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(Math.round(x * scale), Math.round(y * scale), Math.round(mw * scale), Math.round(mh * scale));
  }
  const data = ctx.getImageData(0, 0, w, h);
  applyModeFilter(data.data, mode);
  return data;
}

// 이미지에 여백(quiet zone)을 추가한 ImageData 반환 — 독립 QR 인식률 향상
function addQuietZone(
  img: HTMLImageElement,
  scale: number,
  mode: "normal" | "grayscale" | "contrast" | "invert",
  padPx = 40
): ImageData | null {
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  if (w <= 0 || h <= 0) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w + padPx * 2;
  canvas.height = h + padPx * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, padPx, padPx, w, h);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  applyModeFilter(data.data, mode);
  return data;
}

// 고정 크기로 리사이즈 (비율 유지, 중앙 배치)
function resizeToFixed(
  img: HTMLImageElement,
  targetSize: number,
  mode: "normal" | "grayscale" | "contrast" | "invert",
  masks: ScanRegion[] = []
): ImageData | null {
  const canvas = document.createElement("canvas");
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, targetSize, targetSize);
  const ratio = Math.min(targetSize / img.naturalWidth, targetSize / img.naturalHeight);
  const dw = Math.round(img.naturalWidth * ratio);
  const dh = Math.round(img.naturalHeight * ratio);
  const dx = Math.round((targetSize - dw) / 2);
  const dy = Math.round((targetSize - dh) / 2);
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh);
  for (const { x, y, w: mw, h: mh } of masks) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(Math.round(x * ratio + dx), Math.round(y * ratio + dy), Math.round(mw * ratio), Math.round(mh * ratio));
  }
  const data = ctx.getImageData(0, 0, targetSize, targetSize);
  applyModeFilter(data.data, mode);
  return data;
}

// UI를 블로킹하지 않도록 다음 프레임에 양보
function yieldToUI(): Promise<void> {
  return new Promise((r) => setTimeout(r, 0));
}

// 단일 ImageData에서 jsQR 시도
function scanImageData(jsQR: JsQR, imageData: ImageData): JsQRResult | null {
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "attemptBoth",
  });
  return result?.data ? result : null;
}

// 전체 이미지 다중 스케일/모드 스캔 (마스크 포함) + quiet zone + 고정 크기 정규화
function scanFullImage(
  jsQR: JsQR,
  img: HTMLImageElement,
  masks: ScanRegion[]
): JsQRResult | null {
  const strategies: Array<{ scale: number; mode: "normal" | "grayscale" | "contrast" | "invert" }> = [
    { scale: 1,    mode: "normal"    },
    { scale: 2,    mode: "normal"    },
    { scale: 1,    mode: "grayscale" },
    { scale: 2,    mode: "grayscale" },
    { scale: 1,    mode: "contrast"  },
    { scale: 2,    mode: "contrast"  },
    { scale: 3,    mode: "normal"    },
    { scale: 1,    mode: "invert"    },
    { scale: 2,    mode: "invert"    },
    { scale: 0.5,  mode: "normal"    },
    { scale: 1.5,  mode: "grayscale" },
    { scale: 3,    mode: "contrast"  },
  ];
  for (const { scale, mode } of strategies) {
    const imageData = getFullImageData(img, scale, mode, masks);
    if (!imageData) continue;
    const result = scanImageData(jsQR, imageData);
    if (result) return result;
  }

  // quiet zone 추가 전략 (여백 없는 QR 대응)
  const quietModes: Array<"normal" | "grayscale" | "contrast" | "invert"> = ["normal", "grayscale", "contrast", "invert"];
  for (const padPx of [20, 40, 60]) {
    for (const mode of quietModes) {
      const imageData = addQuietZone(img, 1, mode, padPx);
      if (!imageData) continue;
      const result = scanImageData(jsQR, imageData);
      if (result) return result;
    }
  }

  // 고정 크기 정규화 전략 (너무 크거나 너무 작은 QR 대응)
  for (const targetSize of [200, 300, 400, 500, 800]) {
    for (const mode of quietModes) {
      const imageData = resizeToFixed(img, targetSize, mode, masks);
      if (!imageData) continue;
      const result = scanImageData(jsQR, imageData);
      if (result) return result;
    }
  }

  return null;
}

// 타일 분할 스캔 — 이미지를 grid×grid 격자로 나누어 각각 업스케일 후 스캔
// overlap: 인접 타일 간 겹침 비율 (0~0.5)
// 슬라이딩 윈도우 타일 스캔
// 이미지를 stride 단위로 잘라내어 업스케일 후 스캔.
// 마지막 타일은 항상 우측/하단 끝에 붙여 가장자리 누락 방지.
function scanTiles(
  jsQR: JsQR,
  img: HTMLImageElement,
  cols: number,
  rows: number,
  overlap: number,
  targetSize: number,
  seen: Set<string>
): string[] {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const results: string[] = [];

  const modes: Array<"normal" | "grayscale" | "contrast" | "invert"> = [
    "normal", "grayscale", "contrast", "invert",
  ];

  // cols개의 x 시작 위치 생성 — 0부터 시작, 마지막은 반드시 우측 끝 포함
  function makePositions(total: number, count: number, tileSize: number): number[] {
    if (count <= 1) return [0];
    const positions: number[] = [];
    const stride = (total - tileSize) / (count - 1);
    for (let i = 0; i < count; i++) {
      positions.push(Math.max(0, Math.min(total - tileSize, Math.round(i * stride))));
    }
    // 마지막은 강제로 끝에 붙임
    positions[count - 1] = Math.max(0, total - tileSize);
    return [...new Set(positions)]; // 중복 제거
  }

  const tileW = Math.round(iw / cols * (1 + overlap));
  const tileH = Math.round(ih / rows * (1 + overlap));
  const xs = makePositions(iw, cols, Math.min(tileW, iw));
  const ys = makePositions(ih, rows, Math.min(tileH, ih));

  for (const sy of ys) {
    for (const sx of xs) {
      const sw = Math.min(tileW, iw - sx);
      const sh = Math.min(tileH, ih - sy);
      if (sw < 20 || sh < 20) continue;

      for (const mode of modes) {
        const imageData = cropToImageData(img, sx, sy, sw, sh, targetSize, mode);
        if (!imageData) continue;
        const result = scanImageData(jsQR, imageData);
        if (result?.data && !seen.has(result.data)) {
          seen.add(result.data);
          results.push(result.data);
        }
      }
    }
  }
  return results;
}

async function tryDecodeAllQRCodes(img: HTMLImageElement): Promise<string[]> {
  const jsQR: JsQR = (await import("jsqr")).default;
  const found: string[] = [];
  const masks: ScanRegion[] = [];
  const seen = new Set<string>();

  // ── 1단계: 단독 QR 전용 전체 이미지 스캔 ──
  // 단독 QR 이미지(QR이 프레임을 가득 채우는 경우) 빠르게 처리
  await yieldToUI();
  for (let attempt = 0; attempt < 10; attempt++) {
    const result = scanFullImage(jsQR, img, masks);
    if (!result?.data || seen.has(result.data)) break;
    seen.add(result.data);
    found.push(result.data);
    const loc = result.location;
    const xs = [loc.topLeftCorner.x, loc.topRightCorner.x, loc.bottomLeftCorner.x, loc.bottomRightCorner.x];
    const ys = [loc.topLeftCorner.y, loc.topRightCorner.y, loc.bottomLeftCorner.y, loc.bottomRightCorner.y];
    const pad = 24;
    masks.push({
      x: Math.max(0, Math.min(...xs) - pad),
      y: Math.max(0, Math.min(...ys) - pad),
      w: Math.max(...xs) - Math.min(...xs) + pad * 2,
      h: Math.max(...ys) - Math.min(...ys) + pad * 2,
    });
  }

  // ── 2단계: 슬라이딩 윈도우 타일 스캔 ──
  // 큰 이미지 안에 작은 QR이 박혀있는 경우 처리.
  // cols × rows 격자로 이미지를 분할하여 각 타일을 업스케일 후 스캔.
  // 마지막 타일이 항상 이미지 끝(우측·하단 가장자리)을 포함하도록 보장.
  const tileConfigs: Array<{ cols: number; rows: number; overlap: number; targetSize: number }> = [
    { cols: 2, rows: 2, overlap: 0.25, targetSize: 900 },
    { cols: 3, rows: 3, overlap: 0.30, targetSize: 800 },
    { cols: 4, rows: 4, overlap: 0.35, targetSize: 800 },
    { cols: 6, rows: 6, overlap: 0.40, targetSize: 700 },
    { cols: 8, rows: 8, overlap: 0.45, targetSize: 600 },
  ];

  for (const { cols, rows, overlap, targetSize } of tileConfigs) {
    await yieldToUI();
    const newResults = scanTiles(jsQR, img, cols, rows, overlap, targetSize, seen);
    found.push(...newResults);
  }

  return found;
}

async function processImageFile(file: File): Promise<QRResult[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const texts = await tryDecodeAllQRCodes(img);
      resolve(texts.map((text, index) => ({ text, isUrl: isUrl(text), index })));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve([]); };
    img.src = url;
  });
}


export function QRScanner() {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("QR 코드 분석 중...");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<QRResult[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setLoading(true);
    setLoadingMsg("QR 코드 분석 중...");
    setError(null);
    setResults([]);

    const blobUrl = URL.createObjectURL(file);
    setPreviewUrl(blobUrl);

    // 타일 스캔은 시간이 걸릴 수 있어 메시지 업데이트
    const msgTimer = setTimeout(() => setLoadingMsg("이미지를 타일로 분할하여 정밀 스캔 중..."), 1000);

    const qrResults = await processImageFile(file);
    clearTimeout(msgTimer);

    setLoading(false);
    if (qrResults.length === 0) {
      setError("QR 코드를 인식할 수 없습니다. 다른 이미지를 시도해 보세요.");
    } else {
      setResults(qrResults);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
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
  }, [handleFile]);

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
      setError("클립보드에 이미지가 없습니다. Ctrl+V로 직접 붙여넣기 해보세요.");
    } catch {
      setError(
        "클립보드 접근 권한이 필요합니다. Ctrl+V로 직접 붙여넣기 해보세요."
      );
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    const allText = results.map((r, i) => `[${i + 1}] ${r.text}`).join("\n");
    try {
      await navigator.clipboard.writeText(allText);
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = allText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handleReset = () => {
    setResults([]);
    setError(null);
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setLoading(false);
  };

  const isNight = theme.palette.mode === "dark" && theme.palette.primary.main.includes("34d399") ||
    theme.palette.primary.main === "#34d399";

  const dropZoneColor = dragOver
    ? alpha(theme.palette.primary.main, 0.15)
    : alpha(theme.palette.background.paper, 0.5);

  return (
    <Box sx={{ width: "100%", maxWidth: 760, mx: "auto" }}>
      {/* Header */}
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
          카메라 없이, 이미지만으로 — 붙여넣거나 올리면 QR 코드를 즉시 추출합니다
        </Typography>
      </Box>

      {/* Upload Zone */}
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
              이미지를 드래그하거나 클릭해서 업로드
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              카메라 불필요 — 스크린샷, 저장된 이미지, 어떤 것이든 바로 인식
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
                파일 선택
              </Button>
              <Button
                variant="outlined"
                startIcon={<ContentPasteIcon />}
                onClick={handlePasteButton}
                sx={{ minWidth: 160 }}
              >
                클립보드 붙여넣기
              </Button>
            </Stack>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 2 }}
            >
              또는 <kbd style={{
                padding: "2px 6px",
                borderRadius: 4,
                background: alpha(theme.palette.primary.main, 0.1),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                fontSize: "0.75rem",
                fontFamily: "monospace",
                color: theme.palette.primary.main,
              }}>Ctrl + V</kbd> 로 바로 붙여넣기
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Loading — 전체 너비 중앙 정렬 대기 화면 */}
      {loading && (
        <Fade in>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 8,
              gap: 3,
            }}
          >
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              {/* 외부 링 */}
              <CircularProgress
                size={80}
                thickness={2}
                sx={{
                  color: alpha(theme.palette.primary.main, 0.2),
                  position: "absolute",
                  top: 0,
                  left: 0,
                }}
                variant="determinate"
                value={100}
              />
              {/* 실제 스피너 */}
              <CircularProgress
                size={80}
                thickness={2.5}
                sx={{ color: theme.palette.primary.main }}
              />
              {/* 중앙 아이콘 */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <QrCode2Icon
                  sx={{
                    fontSize: 32,
                    color: theme.palette.primary.main,
                    opacity: 0.85,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{ mb: 0.5, color: theme.palette.text.primary }}
              >
                QR 인식 중입니다. 잠시 기다려주십시오.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {loadingMsg}
              </Typography>
            </Box>
          </Box>
        </Fade>
      )}

      {/* Preview + Result */}
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
                  업로드된 이미지
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="초기화">
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
                  alt="QR Code"
                  style={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
              </Box>
            </Card>

            {/* Error */}
            {error && (
              <Fade in>
                <Alert
                  severity="error"
                  sx={{ mb: 3, borderRadius: 3 }}
                  action={
                    <Button size="small" onClick={handleReset} color="inherit">
                      다시 시도
                    </Button>
                  }
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {/* Results */}
            {results.length > 0 && (
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
                    {/* Header */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
                      <Box
                        sx={{
                          width: 32, height: 32, borderRadius: 2,
                          bgcolor: alpha(theme.palette.success.main, 0.15),
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}
                      >
                        <CheckCircleIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                      </Box>
                      <Typography variant="h6" fontWeight={700}>
                        QR 코드 해석 완료
                      </Typography>
                      <Chip
                        size="small"
                        icon={<QrCode2Icon />}
                        label={`${results.length}개 발견`}
                        color="primary"
                        variant="outlined"
                        sx={{ ml: "auto", fontWeight: 600 }}
                      />
                    </Box>

                    <Divider sx={{ mb: 2.5, opacity: 0.4 }} />

                    {/* Result list */}
                    <Stack spacing={2} sx={{ mb: 2.5 }}>
                      {results.map((item) => (
                        <Paper
                          key={item.index}
                          elevation={0}
                          sx={{
                            p: 2,
                            bgcolor: alpha(theme.palette.background.paper, 0.85),
                            border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                            borderRadius: 3,
                          }}
                        >
                          {/* Item header */}
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              sx={{
                                px: 1, py: 0.25, borderRadius: 1,
                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                color: theme.palette.primary.main,
                                fontFamily: "monospace",
                                fontSize: "0.7rem",
                              }}
                            >
                              QR {item.index + 1}
                            </Typography>
                            <Chip
                              size="small"
                              icon={item.isUrl ? <LinkIcon /> : <TextFieldsIcon />}
                              label={item.isUrl ? "URL" : "텍스트"}
                              color={item.isUrl ? "primary" : "secondary"}
                              variant="outlined"
                              sx={{ fontWeight: 600, height: 22, "& .MuiChip-label": { fontSize: "0.68rem" } }}
                            />
                          </Box>

                          {/* Content text */}
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: item.isUrl ? "inherit" : "monospace",
                              color: item.isUrl ? theme.palette.primary.main : theme.palette.text.primary,
                              wordBreak: "break-all",
                              lineHeight: 1.6,
                              fontWeight: item.isUrl ? 500 : 400,
                              mb: 1.5,
                            }}
                          >
                            {item.isUrl && (
                              <LinkIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: "text-bottom", opacity: 0.7 }} />
                            )}
                            {item.text}
                          </Typography>

                          {/* Per-item actions */}
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            <Tooltip title={copiedIndex === item.index ? "복사됨!" : "복사"} arrow>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={copiedIndex === item.index ? <CheckCircleIcon /> : <ContentCopyIcon />}
                                onClick={() => handleCopy(item.text, item.index)}
                                color={copiedIndex === item.index ? "success" : "primary"}
                                sx={{ fontSize: "0.75rem" }}
                              >
                                {copiedIndex === item.index ? "복사됨!" : "복사"}
                              </Button>
                            </Tooltip>
                            {item.isUrl && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<OpenInNewIcon />}
                                component="a"
                                href={item.text.startsWith("http") ? item.text : `https://${item.text}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ fontSize: "0.75rem" }}
                              >
                                열기
                              </Button>
                            )}
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>

                    {/* Bottom action bar */}
                    <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="center">
                      {results.length > 1 && (
                        <Tooltip title={copiedIndex === -1 ? "모두 복사됨!" : "모든 링크를 한번에 복사"} arrow>
                          <Button
                            variant="contained"
                            startIcon={copiedIndex === -1 ? <CheckCircleIcon /> : <ContentCopyIcon />}
                            onClick={handleCopyAll}
                            color={copiedIndex === -1 ? "success" : "primary"}
                            sx={{ minWidth: 160 }}
                          >
                            {copiedIndex === -1 ? "모두 복사됨!" : "전체 복사"}
                          </Button>
                        </Tooltip>
                      )}
                      <Button
                        variant="text"
                        startIcon={<DeleteIcon />}
                        onClick={handleReset}
                        color="error"
                        sx={{ ml: results.length > 1 ? "auto !important" : 0 }}
                      >
                        초기화
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Zoom>
            )}
          </Box>
        </Fade>
      )}

      {/* Error without image */}
      {error && !previewUrl && (
        <Fade in>
          <Alert severity="error" sx={{ borderRadius: 3 }}>
            {error}
          </Alert>
        </Fade>
      )}

      {/* Tips */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mb: 2, opacity: 0.7 }}
        >
          💡 사용 팁
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          flexWrap="wrap"
          sx={{ gap: 1 }}
        >
          {[
            "카메라 없이 이미지만으로",
            "스크린샷 후 Ctrl+V 붙여넣기",
            "드래그 앤 드롭 지원",
            "다중 QR 코드 자동 감지",
            "URL 자동 감지 및 링크 생성",
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
