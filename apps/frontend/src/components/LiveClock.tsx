import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Card } from "@hrm-plus/ui";
import { getGeneralSettings } from "../api/generalSettings";

export function LiveClock() {
  const [now, setNow] = useState(new Date());
  const [timezone, setTimezone] = useState("UTC");

  useEffect(() => {
    getGeneralSettings()
      .then((settings) => setTimezone(settings.timezone))
      .catch(() => setTimezone("UTC"));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: timezone,
  });
  const dateStr = now.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timezone,
  });

  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
          <Clock className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-semibold tabular-nums text-slate-900">{timeStr}</div>
          <div className="truncate text-sm text-slate-500">
            {dateStr} · {timezone}
          </div>
        </div>
      </div>
    </Card>
  );
}
