import { NextRequest, NextResponse } from "next/server";
import { buildClimateContext } from "@/lib/climate";

export const maxDuration = 15;

function parseCoordinate(value: string | null) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Upstream climate provider failed (${response.status})`);
  }

  return response.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseCoordinate(searchParams.get("lat"));
  const lon = parseCoordinate(searchParams.get("lon"));

  if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 });
  }

  try {
    const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
    weatherUrl.searchParams.set("latitude", String(lat));
    weatherUrl.searchParams.set("longitude", String(lon));
    weatherUrl.searchParams.set(
      "current",
      "temperature_2m,relative_humidity_2m,apparent_temperature,uv_index"
    );
    weatherUrl.searchParams.set("timezone", "auto");

    const airUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
    airUrl.searchParams.set("latitude", String(lat));
    airUrl.searchParams.set("longitude", String(lon));
    airUrl.searchParams.set("current", "pm2_5,us_aqi");
    airUrl.searchParams.set("timezone", "auto");

    const [weather, air] = await Promise.all([
      fetchJson(weatherUrl.toString()),
      fetchJson(airUrl.toString()),
    ]);

    const climate = buildClimateContext(
      {
        uv_index: typeof weather?.current?.uv_index === "number" ? weather.current.uv_index : null,
        humidity:
          typeof weather?.current?.relative_humidity_2m === "number"
            ? weather.current.relative_humidity_2m
            : null,
        pm25: typeof air?.current?.pm2_5 === "number" ? air.current.pm2_5 : null,
        us_aqi: typeof air?.current?.us_aqi === "number" ? air.current.us_aqi : null,
        temperature_c:
          typeof weather?.current?.temperature_2m === "number"
            ? weather.current.temperature_2m
            : null,
      },
      "live"
    );

    return NextResponse.json(climate);
  } catch (error) {
    console.error("[Climate] Error:", error);
    return NextResponse.json(
      { error: "Climate context is temporarily unavailable." },
      { status: 503 }
    );
  }
}
