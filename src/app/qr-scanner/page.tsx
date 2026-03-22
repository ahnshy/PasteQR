import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import { QRScanner } from "@/components/QRScanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PasteQR — 붙여넣기로 QR 코드 즉시 해석",
  description: "카메라 없이 이미지만으로 QR 코드를 해석하세요. 붙여넣기, 드래그 앤 드롭, 파일 업로드 모두 지원",
};

export default function QRScannerPage() {
  return (
    <Box
      sx={{
        flex: 1,
        py: { xs: 4, sm: 6 },
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <QRScanner />
      </Container>
    </Box>
  );
}
