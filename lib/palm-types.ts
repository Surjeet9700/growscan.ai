// lib/palm-types.ts — Types for AI Palm Reading feature

export interface PalmCoordinate {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

export interface PalmLine {
  reading: string;
  coordinates: PalmCoordinate[];
}

export interface PalmScores {
  emotional_strength: number; // 0-100
  intellectual_drive: number; // 0-100
  vitality: number; // 0-100
}

export interface PalmReadingResult {
  summary: string;
  scores: PalmScores;
  lines: {
    heart_line: PalmLine;
    head_line: PalmLine;
    life_line: PalmLine;
    fate_line: PalmLine;
  };
  hidden_trait: string;
  disclaimer: string;
  error: string | null;
  _meta?: {
    request_id: string;
    processing_time_ms: number;
    model_used: string;
  };
}

export interface StoredPalmReading {
  result: PalmReadingResult;
  palm_image: string;
  timestamp: number;
}

export const PALM_LINE_COLORS = {
  heart_line: "#FF6B8A",    // Warm pink
  head_line: "#7B68EE",     // Medium slate blue
  life_line: "#FF8C42",     // Orange
  fate_line: "#4ECDC4",     // Teal
} as const;

export const PALM_LINE_LABELS = {
  heart_line: "Heart Line",
  head_line: "Head Line",
  life_line: "Life Line",
  fate_line: "Fate Line",
} as const;

export const SCORE_LABELS = {
  emotional_strength: "Emotional Strength",
  intellectual_drive: "Intellectual Drive",
  vitality: "Vitality",
} as const;
