export type ClimateStressLevel = "low" | "moderate" | "high" | "extreme";

export interface ClimateSignals {
  uv_index: number | null;
  humidity: number | null;
  pm25: number | null;
  us_aqi: number | null;
  temperature_c: number | null;
}

export interface ClimateContext {
  score: number;
  level: ClimateStressLevel;
  summary: string;
  drivers: string[];
  watchouts: string[];
  actions: string[];
  captured_at: string;
  source: "live" | "scan-time";
  signals: ClimateSignals;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function scoreUv(uv: number | null) {
  if (uv === null || Number.isNaN(uv)) return null;
  if (uv < 3) return 12;
  if (uv < 6) return 34;
  if (uv < 8) return 58;
  if (uv < 11) return 82;
  return 96;
}

function scoreHumidity(humidity: number | null) {
  if (humidity === null || Number.isNaN(humidity)) return null;
  if (humidity < 30) return 82;
  if (humidity < 40) return 58;
  if (humidity <= 60) return 18;
  if (humidity <= 75) return 52;
  return 80;
}

function scorePm25(pm25: number | null) {
  if (pm25 === null || Number.isNaN(pm25)) return null;
  if (pm25 < 12) return 10;
  if (pm25 < 35.5) return 38;
  if (pm25 < 55.5) return 62;
  if (pm25 < 100) return 82;
  return 96;
}

function scoreTemperature(temperature: number | null) {
  if (temperature === null || Number.isNaN(temperature)) return null;
  if (temperature < 18) return 28;
  if (temperature <= 30) return 16;
  if (temperature <= 34) return 44;
  if (temperature <= 38) return 72;
  return 88;
}

function getLevel(score: number): ClimateStressLevel {
  if (score < 32) return "low";
  if (score < 58) return "moderate";
  if (score < 78) return "high";
  return "extreme";
}

function getDriverLabel(key: keyof ClimateSignals, value: number | null) {
  switch (key) {
    case "uv_index":
      return value !== null && value >= 8 ? "Strong UV" : "UV exposure";
    case "humidity":
      return value !== null && value >= 76 ? "Sticky humidity" : "Dry air";
    case "pm25":
      return "Elevated PM2.5";
    case "us_aqi":
      return "Air quality stress";
    case "temperature_c":
      return value !== null && value >= 35 ? "Heat load" : "Temperature swing";
    default:
      return "Climate shift";
  }
}

function getWatchouts(signals: ClimateSignals, scoreMap: Record<string, number | null>) {
  const watchouts = new Set<string>();

  if ((scoreMap.uv_index ?? 0) >= 58) {
    watchouts.add("Tanning and post-acne marks can deepen faster today.");
  }

  if ((scoreMap.humidity ?? 0) >= 52 && (signals.humidity ?? 0) >= 60) {
    watchouts.add("Oil breakthrough and pore congestion may build by afternoon.");
  }

  if ((scoreMap.humidity ?? 0) >= 58 && (signals.humidity ?? 100) < 40) {
    watchouts.add("Dry indoor air can leave skin tight, dull, or sting-prone.");
  }

  if ((scoreMap.pm25 ?? 0) >= 38 || (scoreMap.us_aqi ?? 0) >= 38) {
    watchouts.add("Pollution stress can make skin look tired and more reactive.");
  }

  if ((scoreMap.temperature_c ?? 0) >= 44) {
    watchouts.add("Heat can increase sweat, redness, and sunscreen breakdown.");
  }

  if (watchouts.size === 0) {
    watchouts.add("Conditions are relatively calm, so consistency matters more than correction today.");
  }

  return Array.from(watchouts).slice(0, 3);
}

function getActions(signals: ClimateSignals, scoreMap: Record<string, number | null>) {
  const actions = new Set<string>();

  if ((scoreMap.uv_index ?? 0) >= 34) {
    actions.add("Reapply broad-spectrum SPF every 2-3 hours if outdoors.");
  }

  if ((scoreMap.humidity ?? 0) >= 52 && (signals.humidity ?? 0) >= 60) {
    actions.add("Keep layers lighter and avoid stacking rich textures in the daytime.");
  }

  if ((scoreMap.humidity ?? 0) >= 58 && (signals.humidity ?? 100) < 40) {
    actions.add("Use a barrier-supporting moisturizer to lock in hydration.");
  }

  if ((scoreMap.pm25 ?? 0) >= 38 || (scoreMap.us_aqi ?? 0) >= 38) {
    actions.add("Cleanse well after travel or commuting, but avoid over-scrubbing.");
  }

  if ((scoreMap.temperature_c ?? 0) >= 44) {
    actions.add("Blot sweat gently and rinse after heavy outdoor exposure.");
  }

  if (actions.size === 0) {
    actions.add("Stick to a balanced cleanse, hydrate, and protect routine today.");
  }

  return Array.from(actions).slice(0, 3);
}

export function buildClimateContext(
  signals: ClimateSignals,
  source: ClimateContext["source"] = "live"
): ClimateContext {
  const scoreMap = {
    uv_index: scoreUv(signals.uv_index),
    humidity: scoreHumidity(signals.humidity),
    pm25: scorePm25(signals.pm25),
    us_aqi: scorePm25(signals.us_aqi !== null ? signals.us_aqi / 2 : null),
    temperature_c: scoreTemperature(signals.temperature_c),
  };

  const weights: Record<keyof ClimateSignals, number> = {
    uv_index: 0.34,
    humidity: 0.2,
    pm25: 0.26,
    us_aqi: 0.08,
    temperature_c: 0.12,
  };

  const weighted = (Object.entries(scoreMap) as Array<[keyof ClimateSignals, number | null]>)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => ({ key, value: value as number, weight: weights[key] }));

  if (weighted.length === 0) {
    throw new Error("No climate signals available");
  }

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const score = round(
    weighted.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight
  );
  const level = getLevel(score);

  const drivers = weighted
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map(({ key }) => getDriverLabel(key, signals[key]));

  const watchouts = getWatchouts(signals, scoreMap);
  const actions = getActions(signals, scoreMap);

  const levelLead = {
    low: "Low skin stress today",
    moderate: "Moderate skin stress today",
    high: "High skin stress today",
    extreme: "Very high skin stress today",
  }[level];

  const summary =
    drivers.length > 0
      ? `${levelLead} from ${drivers.join(" and ").toLowerCase()}.`
      : `${levelLead}.`;

  return {
    score: clamp(score, 0, 100),
    level,
    summary,
    drivers,
    watchouts,
    actions,
    captured_at: new Date().toISOString(),
    source,
    signals: {
      uv_index: signals.uv_index !== null ? round(signals.uv_index, 1) : null,
      humidity: signals.humidity !== null ? round(signals.humidity) : null,
      pm25: signals.pm25 !== null ? round(signals.pm25, 1) : null,
      us_aqi: signals.us_aqi !== null ? round(signals.us_aqi) : null,
      temperature_c: signals.temperature_c !== null ? round(signals.temperature_c, 1) : null,
    },
  };
}
