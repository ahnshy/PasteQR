"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

const LOCALE_STORAGE_KEY = "preferred-locale";

export function LocaleSync({ locale }: { locale: AppLocale }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);

    if (savedLocale === locale) {
      return;
    }

    if (savedLocale && routing.locales.includes(savedLocale as AppLocale)) {
      router.replace(pathname, { locale: savedLocale as AppLocale });
      return;
    }

    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale, pathname, router]);

  return null;
}
