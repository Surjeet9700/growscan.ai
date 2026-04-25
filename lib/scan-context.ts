import type { ScanContext } from "@/lib/types";

export function formatScanContextForPrompt(context?: ScanContext | null) {
  if (!context) return "";

  const lines: string[] = [];

  if (context.age) lines.push(`Age Range: ${context.age}`);
  if (context.concern) lines.push(`Primary Concern: ${context.concern}`);
  if (context.habits) lines.push(`Water Intake: ${context.habits}`);

  if (context.climate) {
    lines.push(`Climate Stress: ${context.climate.level} (${context.climate.score}/100)`);

    const { uv_index, humidity, pm25, us_aqi, temperature_c } = context.climate.signals;

    if (uv_index !== null) lines.push(`UV Index: ${uv_index}`);
    if (humidity !== null) lines.push(`Humidity: ${humidity}%`);
    if (pm25 !== null) lines.push(`PM2.5: ${pm25} ug/m3`);
    if (us_aqi !== null) lines.push(`Air Quality Index: ${us_aqi}`);
    if (temperature_c !== null) lines.push(`Temperature: ${temperature_c}C`);
    if (context.climate.drivers.length > 0) {
      lines.push(`Climate Drivers: ${context.climate.drivers.join(", ")}`);
    }
    if (context.climate.watchouts.length > 0) {
      lines.push(`Climate Watchouts: ${context.climate.watchouts.join(" ")}`);
    }
  }

  return lines.join("\n");
}
