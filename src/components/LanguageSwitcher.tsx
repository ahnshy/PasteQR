"use client";

import { useEffect } from "react";
import TranslateIcon from "@mui/icons-material/Translate";
import {
  alpha,
  MenuItem,
  Select,
  type SelectChangeEvent,
  useTheme,
} from "@mui/material";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

const LOCALE_STORAGE_KEY = "preferred-locale";

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const t = useTranslations("LanguageSwitcher");

  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  const handleChange = (event: SelectChangeEvent<AppLocale>) => {
    const nextLocale = event.target.value as AppLocale;

    localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Select
      value={locale}
      size="small"
      onChange={handleChange}
      startAdornment={<TranslateIcon sx={{ ml: 1, mr: 0.5, fontSize: 18 }} />}
      sx={{
        minWidth: 104,
        bgcolor: alpha(theme.palette.background.paper, 0.6),
        borderRadius: 2,
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: alpha(theme.palette.divider, 0.3),
        },
        "& .MuiSelect-select": {
          py: 0.9,
          pr: 4,
          pl: 0.5,
          fontWeight: 600,
        },
      }}
      inputProps={{
        "aria-label": t("label"),
      }}
    >
      {routing.locales.map((item) => (
        <MenuItem key={item} value={item}>
          {t(item)}
        </MenuItem>
      ))}
    </Select>
  );
}
