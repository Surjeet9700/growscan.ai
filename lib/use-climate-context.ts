"use client";

import { useCallback, useEffect, useState } from "react";
import type { ClimateContext } from "@/lib/climate";

type ClimateState = {
  data: ClimateContext | null;
  loading: boolean;
  error: string | null;
};

const CACHE_TTL_MS = 20 * 60 * 1000;

let cachedClimate: { data: ClimateContext; expiresAt: number } | null = null;

async function resolvePosition(): Promise<GeolocationPosition> {
  if (!("geolocation" in navigator)) {
    throw new Error("Location is not available on this device.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 15 * 60 * 1000,
    });
  });
}

function normalizeError(error: unknown) {
  if (typeof error === "string") return error;

  if (error && typeof error === "object" && "code" in error) {
    const code = Number((error as { code?: unknown }).code);

    if (code === 1) {
      return "Enable location to unlock climate-aware skin context.";
    }

    if (code === 3) {
      return "Location lookup took too long. Try again in a moment.";
    }
  }

  if (error instanceof Error) return error.message;

  return "Climate context is temporarily unavailable.";
}

export function useClimateContext(enabled = true) {
  const [state, setState] = useState<ClimateState>({
    data: cachedClimate && cachedClimate.expiresAt > Date.now() ? cachedClimate.data : null,
    loading: enabled && !(cachedClimate && cachedClimate.expiresAt > Date.now()),
    error: null,
  });

  const refresh = useCallback(async () => {
    if (!enabled) {
      setState({ data: null, loading: false, error: null });
      return null;
    }

    if (cachedClimate && cachedClimate.expiresAt > Date.now()) {
      setState({ data: cachedClimate.data, loading: false, error: null });
      return cachedClimate.data;
    }

    setState((current) => ({ ...current, loading: true, error: null }));

    try {
      const position = await resolvePosition();
      const params = new URLSearchParams({
        lat: String(position.coords.latitude),
        lon: String(position.coords.longitude),
      });

      const response = await fetch(`/api/climate?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Climate context could not be loaded.");
      }

      const data = (await response.json()) as ClimateContext;
      cachedClimate = {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      setState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      setState({ data: null, loading: false, error: normalizeError(error) });
      return null;
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    climate: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
  };
}
