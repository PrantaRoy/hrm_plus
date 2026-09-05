import { useEffect, useState } from "react";
import { PublicSaasSiteSettingsDto } from "@hrm-plus/shared";
import { getLandingContent } from "../api/landing";

let cached: PublicSaasSiteSettingsDto | null = null;

/** Shared public site settings for the navbar/footer on standalone public pages. */
export function usePublicSettings(): PublicSaasSiteSettingsDto | null {
  const [settings, setSettings] = useState<PublicSaasSiteSettingsDto | null>(cached);

  useEffect(() => {
    if (settings) return;
    getLandingContent()
      .then((content) => {
        cached = content.settings;
        setSettings(content.settings);
      })
      .catch(() => undefined);
  }, [settings]);

  return settings;
}
