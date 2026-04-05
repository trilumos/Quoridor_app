export const COLORS = {
  // Foundation
  background: "#0D0D0D",
  surface: "#141414",
  elevated: "#1C1C1C",
  surfaceElevated: "#2A2A2A",
  surfaceLowest: "#0E0E0E",

  // Primary
  accent: "#FF7A00",
  accentEnd: "#FF9500",
  accentAlpha15: "rgba(255, 122, 0, 0.15)",
  accentAlpha40: "rgba(255, 122, 0, 0.40)",

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#9CA3AF",
  spaceTextPrimary: "#FFFFFF",
  spaceTextSecondary: "#9CA3AF",

  // Borders & Overlay
  border: "rgba(255, 255, 255, 0.06)",
  borderFocus: "rgba(255, 255, 255, 0.20)",
  overlayGlass: "rgba(20, 20, 20, 0.85)",

  // Button surfaces
  secondaryBg: "rgba(255, 255, 255, 0.04)",
  secondaryPress: "rgba(255, 255, 255, 0.08)",

  // Game — Players
  player1: "#FFFFFF",
  player1Glow: "rgba(255, 255, 255, 0.12)",
  player2: "#FF7A00",
  player2Glow: "rgba(255, 122, 0, 0.12)",

  // Game — Board
  boardBg: "#141414",
  gridLine: "rgba(255, 255, 255, 0.06)",

  // Game — Walls
  wallPlaced: "rgba(255, 255, 255, 0.90)",
  wallPreview: "rgba(255, 255, 255, 0.25)",
  wallAvailable: "rgba(255, 255, 255, 0.70)",
  wallUsed: "rgba(156, 163, 175, 0.30)",

  // Game — Indicators
  validMove: "rgba(255, 255, 255, 0.08)",
  selectedSquare: "rgba(255, 122, 0, 0.15)",

  // Semantic
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",

  // Backward compat (old screens — remove in Priority 2)
  boardSquare: "#141414",
  wallGlow: "rgba(255, 255, 255, 0.12)",
  wallPreviewBorder: "rgba(255, 255, 255, 0.15)",
  validMoveBorder: "rgba(255, 255, 255, 0.15)",
  cardBg: "#1C1C1C",
  buttonBg: "rgba(255, 122, 0, 0.15)",
  overlay: "rgba(13, 13, 13, 0.85)",
  playerPawn: "#FF7A00",
  opponentPawn: "#FFFFFF",
};

export const LIGHT_COLORS = {
  ...COLORS,
  background: "#F7F4EE",
  surface: "#FFFDF9",
  elevated: "#FFFFFF",
  surfaceElevated: "#F6EFE3",
  surfaceLowest: "#EFE6D8",
  accent: "#E96A00",
  accentEnd: "#FF8A00",
  accentAlpha15: "rgba(233, 106, 0, 0.16)",
  accentAlpha40: "rgba(233, 106, 0, 0.34)",
  textPrimary: "#1A1A1A",
  textSecondary: "#5E5E5E",
  spaceTextPrimary: "#111827",
  spaceTextSecondary: "#4B5563",
  border: "rgba(26, 26, 26, 0.10)",
  borderFocus: "rgba(26, 26, 26, 0.22)",
  overlayGlass: "rgba(26, 26, 26, 0.22)",
  secondaryBg: "rgba(26, 26, 26, 0.06)",
  secondaryPress: "rgba(26, 26, 26, 0.10)",
  player1: "#1A1A1A",
  player1Glow: "rgba(26, 26, 26, 0.12)",
  player2: "#E96A00",
  player2Glow: "rgba(233, 106, 0, 0.14)",
  boardBg: "#FFFDF9",
  gridLine: "rgba(26, 26, 26, 0.12)",
  wallPlaced: "rgba(26, 26, 26, 0.82)",
  wallPreview: "rgba(26, 26, 26, 0.24)",
  wallAvailable: "rgba(26, 26, 26, 0.60)",
  wallUsed: "rgba(94, 94, 94, 0.28)",
  validMove: "rgba(233, 106, 0, 0.16)",
  selectedSquare: "rgba(233, 106, 0, 0.24)",
  cardBg: "#1C1C1C",
  buttonBg: "rgba(233, 106, 0, 0.16)",
  overlay: "rgba(13, 13, 13, 0.85)",
  playerPawn: "#E96A00",
  opponentPawn: "#1A1A1A",
};

export function getThemeColors(darkMode: boolean = true) {
  return darkMode ? COLORS : LIGHT_COLORS;
}
