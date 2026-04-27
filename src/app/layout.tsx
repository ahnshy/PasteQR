import "./globals.css";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value;
  const lang = routing.locales.includes(locale as "en" | "ko")
    ? locale
    : routing.defaultLocale;

  return (
    <html lang={lang}>
      <body>{children}</body>
    </html>
  );
}
