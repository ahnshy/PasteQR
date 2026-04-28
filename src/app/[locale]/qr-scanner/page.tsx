import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { QRScanner } from "@/components/QRScanner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: t("scannerTitle"),
    description: t("scannerDescription"),
  };
}

export default async function QRScannerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

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
