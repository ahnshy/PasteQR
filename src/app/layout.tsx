import type { Metadata } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import Box from "@mui/material/Box";

export const metadata: Metadata = {
  title: "PasteQR — 카메라 없이 QR 코드 해석",
  description: "이미지를 붙여넣거나 업로드하면 카메라 없이 바로 QR 코드를 추출합니다. Next.js 15 + Material UI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <ThemeProvider>
          <Navbar />
          <Box
            component="main"
            sx={{
              minHeight: "calc(100vh - 64px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children}
          </Box>
        </ThemeProvider>
      </body>
    </html>
  );
}
