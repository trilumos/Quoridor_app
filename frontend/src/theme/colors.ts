export type ThemeName =
  | "orange"
  | "sapphire"
  | "amethyst"
  | "emerald"
  | "crimson"
  | "obsidianGold"
  | "mistGraphite"
  | "arcticCyan"
  | "earthClay"
  | "deepIndigo"
  | "sunsetFlow"
  | "oceanDrift"
  | "auroraBloom"
  | "nebulaPulse"
  | "liquidGlass";

export type ThemeType = "static" | "gradient" | "animated";
export type AccentType = "solid" | "gradient" | "animated";

export type ThemeGradient = {
  startColor: string;
  endColor: string;
};

export type ThemeAnimationType =
  | "pulse"
  | "shimmer"
  | "wave"
  | "breathe"
  | "gradientShift"
  | "liquidFlow"
  | "fluid";

export type ThemeAnimationConfig = {
  type: ThemeAnimationType;
  speed: number;
  intensity: number;
  colors: string[];
};

type ThemeMode = "dark" | "light";

type ThemeVariant = {
  background: string;
  surface: string;
  elevated: string;
  accent: string;
  accentGradientStart: string;
  accentGradientEnd: string;
  textPrimary: string;
  textSecondary: string;
};

type ThemeConfig = {
  id: ThemeName;
  label: string;
  dark: ThemeVariant;
  light: ThemeVariant;
  themeType?: ThemeType;
  accentType?: AccentType;
  gradient?: Partial<Record<ThemeMode, ThemeGradient>>;
  animation?: Partial<Record<ThemeMode, ThemeAnimationConfig>>;
  isPreviewOnly?: boolean;
};

const DEFAULT_ANIMATION_CONFIG: ThemeAnimationConfig = {
  type: "pulse",
  speed: 1,
  intensity: 0.5,
  colors: ["#8B5CF6", "#3B82F6", "#22C55E"],
};

function resolveThemeGradient(
  config: ThemeConfig,
  mode: ThemeMode,
  variant: ThemeVariant,
): ThemeGradient {
  return (
    config.gradient?.[mode] ?? {
      startColor: variant.accentGradientStart,
      endColor: variant.accentGradientEnd,
    }
  );
}

function resolveThemeAnimation(
  config: ThemeConfig,
  mode: ThemeMode,
  variant: ThemeVariant,
): ThemeAnimationConfig | null {
  const fallbackColors = [
    variant.accentGradientStart,
    variant.accentGradientEnd,
    variant.accent,
  ];

  if (config.animation?.[mode]) {
    const animation = config.animation[mode] as ThemeAnimationConfig;
    return {
      ...animation,
      colors: animation.colors.length ? animation.colors : fallbackColors,
    };
  }

  if ((config.themeType ?? "static") === "animated") {
    return {
      ...DEFAULT_ANIMATION_CONFIG,
      colors: fallbackColors,
    };
  }

  return null;
}

function resolveAccentType(config: ThemeConfig): AccentType {
  if (config.accentType) return config.accentType;

  const resolvedThemeType = config.themeType ?? "static";
  if (resolvedThemeType === "gradient") return "gradient";
  if (resolvedThemeType === "animated") return "animated";
  return "solid";
}

function resolveAnimationDuration(animation: ThemeAnimationConfig | null): number | null {
  if (!animation) return null;

  const speed = Math.max(animation.speed, 0.25);

  if (animation.type === "gradientShift") {
    return Math.max(7000, Math.round(13000 / speed));
  }

  if (animation.type === "liquidFlow" || animation.type === "fluid") {
    return Math.max(8500, Math.round(15000 / speed));
  }

  return Math.max(6000, Math.round(12000 / speed));
}

export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : value;

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const value = hex.replace("#", "");
  const normalized =
    value.length === 3
      ? value
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : value;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function blendHex(fromHex: string, toHex: string, amount: number): string {
  const from = hexToRgb(fromHex);
  const to = hexToRgb(toHex);
  const t = Math.max(0, Math.min(1, amount));

  const r = Math.round(from.r + (to.r - from.r) * t);
  const g = Math.round(from.g + (to.g - from.g) * t);
  const b = Math.round(from.b + (to.b - from.b) * t);

  return `#${[r, g, b]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function srgbToLinear(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const R = srgbToLinear(r);
  const G = srgbToLinear(g);
  const B = srgbToLinear(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const high = Math.max(l1, l2);
  const low = Math.min(l1, l2);

  return (high + 0.05) / (low + 0.05);
}

const THEME_MAP: Record<ThemeName, ThemeConfig> = {
  orange: {
    id: "orange",
    label: "Orange",
    themeType: "static",
    accentType: "solid",
    dark: {
      background: "#0D0D0D",
      surface: "#141414",
      elevated: "#1C1C1C",
      accent: "#FF7A00",
      accentGradientStart: "#FF7A00",
      accentGradientEnd: "#FF9500",
      textPrimary: "#FFFFFF",
      textSecondary: "#9CA3AF",
    },
    light: {
      background: "#F7F4EE",
      surface: "#FFFDF9",
      elevated: "#FFFFFF",
      accent: "#E96A00",
      accentGradientStart: "#E96A00",
      accentGradientEnd: "#FF8A00",
      textPrimary: "#1A1A1A",
      textSecondary: "#5E5E5E",
    },
  },
  sapphire: {
    id: "sapphire",
    label: "Sapphire",
    themeType: "gradient",
    accentType: "gradient",
    gradient: {
      dark: {
        startColor: "#1D4ED8",
        endColor: "#60A5FA",
      },
      light: {
        startColor: "#3B82F6",
        endColor: "#93C5FD",
      },
    },
    dark: {
      background: "#0B0F14",
      surface: "#121821",
      elevated: "#18212B",
      accent: "#3B82F6",
      accentGradientStart: "#3B82F6",
      accentGradientEnd: "#60A5FA",
      textPrimary: "#FFFFFF",
      textSecondary: "#94A3B8",
    },
    light: {
      background: "#F8FAFC",
      surface: "#FFFFFF",
      elevated: "#E2E8F0",
      accent: "#2563EB",
      accentGradientStart: "#3B82F6",
      accentGradientEnd: "#60A5FA",
      textPrimary: "#0F172A",
      textSecondary: "#475569",
    },
  },
  amethyst: {
    id: "amethyst",
    label: "Amethyst",
    themeType: "animated",
    accentType: "animated",
    gradient: {
      dark: {
        startColor: "#7C3AED",
        endColor: "#A78BFA",
      },
      light: {
        startColor: "#8B5CF6",
        endColor: "#C4B5FD",
      },
    },
    animation: {
      dark: {
        type: "wave",
        speed: 1.1,
        intensity: 0.6,
        colors: ["#7C3AED", "#A78BFA", "#C4B5FD"],
      },
      light: {
        type: "shimmer",
        speed: 0.9,
        intensity: 0.4,
        colors: ["#8B5CF6", "#A78BFA", "#DDD6FE"],
      },
    },
    dark: {
      background: "#0F0B14",
      surface: "#16121D",
      elevated: "#1F1829",
      accent: "#8B5CF6",
      accentGradientStart: "#8B5CF6",
      accentGradientEnd: "#A78BFA",
      textPrimary: "#FFFFFF",
      textSecondary: "#A1A1AA",
    },
    light: {
      background: "#FAF5FF",
      surface: "#FFFFFF",
      elevated: "#E9D5FF",
      accent: "#7C3AED",
      accentGradientStart: "#8B5CF6",
      accentGradientEnd: "#A78BFA",
      textPrimary: "#1F2937",
      textSecondary: "#6B7280",
    },
  },
  emerald: {
    id: "emerald",
    label: "Emerald",
    themeType: "gradient",
    accentType: "gradient",
    gradient: {
      dark: {
        startColor: "#059669",
        endColor: "#34D399",
      },
      light: {
        startColor: "#10B981",
        endColor: "#6EE7B7",
      },
    },
    dark: {
      background: "#0B1410",
      surface: "#121C17",
      elevated: "#1A2620",
      accent: "#10B981",
      accentGradientStart: "#10B981",
      accentGradientEnd: "#34D399",
      textPrimary: "#FFFFFF",
      textSecondary: "#9CA3AF",
    },
    light: {
      background: "#F0FDF4",
      surface: "#FFFFFF",
      elevated: "#D1FAE5",
      accent: "#059669",
      accentGradientStart: "#10B981",
      accentGradientEnd: "#34D399",
      textPrimary: "#064E3B",
      textSecondary: "#4B5563",
    },
  },
  crimson: {
    id: "crimson",
    label: "Crimson",
    themeType: "animated",
    accentType: "animated",
    gradient: {
      dark: {
        startColor: "#DC2626",
        endColor: "#F87171",
      },
      light: {
        startColor: "#EF4444",
        endColor: "#FCA5A5",
      },
    },
    animation: {
      dark: {
        type: "breathe",
        speed: 1,
        intensity: 0.55,
        colors: ["#DC2626", "#EF4444", "#F87171"],
      },
      light: {
        type: "pulse",
        speed: 0.85,
        intensity: 0.35,
        colors: ["#EF4444", "#F87171", "#FCA5A5"],
      },
    },
    dark: {
      background: "#140B0B",
      surface: "#1C1212",
      elevated: "#261818",
      accent: "#EF4444",
      accentGradientStart: "#EF4444",
      accentGradientEnd: "#F87171",
      textPrimary: "#FFFFFF",
      textSecondary: "#A1A1AA",
    },
    light: {
      background: "#FEF2F2",
      surface: "#FFFFFF",
      elevated: "#FECACA",
      accent: "#DC2626",
      accentGradientStart: "#EF4444",
      accentGradientEnd: "#F87171",
      textPrimary: "#1F2937",
      textSecondary: "#6B7280",
    },
  },
  obsidianGold: {
    id: "obsidianGold",
    label: "Obsidian Gold",
    themeType: "static",
    accentType: "solid",
    isPreviewOnly: true,
    dark: {
      background: "#0A0A0B",
      surface: "#121214",
      elevated: "#1A1A1F",
      accent: "#D4A017",
      accentGradientStart: "#D4A017",
      accentGradientEnd: "#F2C14E",
      textPrimary: "#F9FAFB",
      textSecondary: "#9CA3AF",
    },
    light: {
      background: "#FAF8F2",
      surface: "#FFFFFF",
      elevated: "#F2EADB",
      accent: "#B8860B",
      accentGradientStart: "#B8860B",
      accentGradientEnd: "#D4A017",
      textPrimary: "#1F2937",
      textSecondary: "#6B7280",
    },
  },
  mistGraphite: {
    id: "mistGraphite",
    label: "Mist Graphite",
    themeType: "static",
    accentType: "solid",
    isPreviewOnly: true,
    dark: {
      background: "#111315",
      surface: "#191C20",
      elevated: "#232831",
      accent: "#8B95A7",
      accentGradientStart: "#8B95A7",
      accentGradientEnd: "#B5BECC",
      textPrimary: "#F3F4F6",
      textSecondary: "#9CA3AF",
    },
    light: {
      background: "#F5F7FA",
      surface: "#FFFFFF",
      elevated: "#E5EAF0",
      accent: "#64748B",
      accentGradientStart: "#64748B",
      accentGradientEnd: "#94A3B8",
      textPrimary: "#1F2937",
      textSecondary: "#6B7280",
    },
  },
  arcticCyan: {
    id: "arcticCyan",
    label: "Arctic Cyan",
    themeType: "static",
    accentType: "solid",
    isPreviewOnly: true,
    dark: {
      background: "#071319",
      surface: "#0D1C24",
      elevated: "#132935",
      accent: "#22D3EE",
      accentGradientStart: "#22D3EE",
      accentGradientEnd: "#67E8F9",
      textPrimary: "#F0FDFF",
      textSecondary: "#94A3B8",
    },
    light: {
      background: "#ECFEFF",
      surface: "#FFFFFF",
      elevated: "#CFFAFE",
      accent: "#0891B2",
      accentGradientStart: "#06B6D4",
      accentGradientEnd: "#22D3EE",
      textPrimary: "#164E63",
      textSecondary: "#4B5563",
    },
  },
  earthClay: {
    id: "earthClay",
    label: "Earth Clay",
    themeType: "static",
    accentType: "solid",
    isPreviewOnly: true,
    dark: {
      background: "#15100D",
      surface: "#1E1713",
      elevated: "#2A201A",
      accent: "#C47A4A",
      accentGradientStart: "#C47A4A",
      accentGradientEnd: "#D99A6C",
      textPrimary: "#FAF6F2",
      textSecondary: "#A8A29E",
    },
    light: {
      background: "#FAF3ED",
      surface: "#FFFFFF",
      elevated: "#F3E4D7",
      accent: "#A75A2A",
      accentGradientStart: "#B86B3A",
      accentGradientEnd: "#D0875A",
      textPrimary: "#3F2B1F",
      textSecondary: "#6B7280",
    },
  },
  deepIndigo: {
    id: "deepIndigo",
    label: "Deep Indigo",
    themeType: "static",
    accentType: "solid",
    isPreviewOnly: true,
    dark: {
      background: "#0C1022",
      surface: "#131934",
      elevated: "#1C2550",
      accent: "#6366F1",
      accentGradientStart: "#6366F1",
      accentGradientEnd: "#818CF8",
      textPrimary: "#F8FAFC",
      textSecondary: "#A5B4FC",
    },
    light: {
      background: "#EEF2FF",
      surface: "#FFFFFF",
      elevated: "#E0E7FF",
      accent: "#4F46E5",
      accentGradientStart: "#6366F1",
      accentGradientEnd: "#818CF8",
      textPrimary: "#1E1B4B",
      textSecondary: "#6B7280",
    },
  },
  sunsetFlow: {
    id: "sunsetFlow",
    label: "Sunset Flow",
    themeType: "gradient",
    accentType: "gradient",
    isPreviewOnly: true,
    gradient: {
      dark: {
        startColor: "#F97316",
        endColor: "#EC4899",
      },
      light: {
        startColor: "#FB923C",
        endColor: "#F472B6",
      },
    },
    dark: {
      background: "#120E14",
      surface: "#1A1422",
      elevated: "#251A31",
      accent: "#F97316",
      accentGradientStart: "#F97316",
      accentGradientEnd: "#EC4899",
      textPrimary: "#FFF7ED",
      textSecondary: "#C4B5FD",
    },
    light: {
      background: "#FFF7ED",
      surface: "#FFFFFF",
      elevated: "#FCE7F3",
      accent: "#EA580C",
      accentGradientStart: "#FB923C",
      accentGradientEnd: "#F472B6",
      textPrimary: "#3B1D2E",
      textSecondary: "#6B7280",
    },
  },
  oceanDrift: {
    id: "oceanDrift",
    label: "Ocean Drift",
    themeType: "gradient",
    accentType: "gradient",
    isPreviewOnly: true,
    gradient: {
      dark: {
        startColor: "#0EA5E9",
        endColor: "#14B8A6",
      },
      light: {
        startColor: "#38BDF8",
        endColor: "#2DD4BF",
      },
    },
    dark: {
      background: "#08131B",
      surface: "#10202A",
      elevated: "#16303D",
      accent: "#0EA5E9",
      accentGradientStart: "#0EA5E9",
      accentGradientEnd: "#14B8A6",
      textPrimary: "#ECFEFF",
      textSecondary: "#93C5FD",
    },
    light: {
      background: "#F0FDFF",
      surface: "#FFFFFF",
      elevated: "#CCFBF1",
      accent: "#0284C7",
      accentGradientStart: "#38BDF8",
      accentGradientEnd: "#2DD4BF",
      textPrimary: "#0F3A4A",
      textSecondary: "#4B5563",
    },
  },
  auroraBloom: {
    id: "auroraBloom",
    label: "Aurora Bloom",
    themeType: "gradient",
    accentType: "gradient",
    isPreviewOnly: true,
    gradient: {
      dark: {
        startColor: "#22C55E",
        endColor: "#A855F7",
      },
      light: {
        startColor: "#4ADE80",
        endColor: "#C084FC",
      },
    },
    dark: {
      background: "#0A1315",
      surface: "#111C22",
      elevated: "#192933",
      accent: "#22C55E",
      accentGradientStart: "#22C55E",
      accentGradientEnd: "#A855F7",
      textPrimary: "#F0FDF4",
      textSecondary: "#C4B5FD",
    },
    light: {
      background: "#F5FFF7",
      surface: "#FFFFFF",
      elevated: "#F3E8FF",
      accent: "#16A34A",
      accentGradientStart: "#4ADE80",
      accentGradientEnd: "#C084FC",
      textPrimary: "#1F2937",
      textSecondary: "#6B7280",
    },
  },
  nebulaPulse: {
    id: "nebulaPulse",
    label: "Nebula Pulse",
    themeType: "animated",
    accentType: "animated",
    isPreviewOnly: true,
    gradient: {
      dark: {
        startColor: "#7C3AED",
        endColor: "#22D3EE",
      },
      light: {
        startColor: "#A78BFA",
        endColor: "#67E8F9",
      },
    },
    animation: {
      dark: {
        type: "gradientShift",
        speed: 1.2,
        intensity: 0.7,
        colors: ["#7C3AED", "#22D3EE", "#EC4899"],
      },
      light: {
        type: "gradientShift",
        speed: 1,
        intensity: 0.45,
        colors: ["#A78BFA", "#67E8F9", "#F472B6"],
      },
    },
    dark: {
      background: "#090D1A",
      surface: "#11172A",
      elevated: "#1A2240",
      accent: "#7C3AED",
      accentGradientStart: "#7C3AED",
      accentGradientEnd: "#22D3EE",
      textPrimary: "#F8FAFC",
      textSecondary: "#C4B5FD",
    },
    light: {
      background: "#F5F3FF",
      surface: "#FFFFFF",
      elevated: "#EDE9FE",
      accent: "#6D28D9",
      accentGradientStart: "#A78BFA",
      accentGradientEnd: "#67E8F9",
      textPrimary: "#1F2937",
      textSecondary: "#6B7280",
    },
  },
  liquidGlass: {
    id: "liquidGlass",
    label: "Liquid Glass",
    themeType: "animated",
    accentType: "animated",
    isPreviewOnly: true,
    gradient: {
      dark: {
        startColor: "#06B6D4",
        endColor: "#A78BFA",
      },
      light: {
        startColor: "#67E8F9",
        endColor: "#C4B5FD",
      },
    },
    animation: {
      dark: {
        type: "fluid",
        speed: 0.9,
        intensity: 0.65,
        colors: ["#06B6D4", "#67E8F9", "#A78BFA"],
      },
      light: {
        type: "fluid",
        speed: 0.75,
        intensity: 0.4,
        colors: ["#67E8F9", "#A5F3FC", "#DDD6FE"],
      },
    },
    dark: {
      background: "#08151C",
      surface: "#10222C",
      elevated: "#19313F",
      accent: "#22D3EE",
      accentGradientStart: "#06B6D4",
      accentGradientEnd: "#A78BFA",
      textPrimary: "#F0FDFF",
      textSecondary: "#A5F3FC",
    },
    light: {
      background: "#F0FDFF",
      surface: "#FFFFFF",
      elevated: "#E0F2FE",
      accent: "#0891B2",
      accentGradientStart: "#67E8F9",
      accentGradientEnd: "#C4B5FD",
      textPrimary: "#164E63",
      textSecondary: "#6B7280",
    },
  },
};

export const DEFAULT_THEME_NAME: ThemeName = "orange";

export const THEME_OPTIONS = Object.values(THEME_MAP)
  .filter((item) => !item.isPreviewOnly)
  .map((item) => ({
    id: item.id,
    label: item.label,
  }));

export const ALL_THEME_OPTIONS = Object.values(THEME_MAP).map((item) => ({
  id: item.id,
  label: item.label,
}));

export function getThemeConfig(themeName: ThemeName = DEFAULT_THEME_NAME) {
  return THEME_MAP[themeName] ?? THEME_MAP[DEFAULT_THEME_NAME];
}

export function getThemePresentation(
  darkMode: boolean = true,
  themeName: ThemeName = DEFAULT_THEME_NAME,
) {
  const config = getThemeConfig(themeName);
  const mode: ThemeMode = darkMode ? "dark" : "light";
  const variant = config[mode];

  return {
    themeType: config.themeType ?? "static",
    accentType: resolveAccentType(config),
    gradient: resolveThemeGradient(config, mode, variant),
    animation: resolveThemeAnimation(config, mode, variant),
  };
}

export function isThemeName(value: string): value is ThemeName {
  return value in THEME_MAP;
}

export function getThemeColors(
  darkMode: boolean = true,
  themeName: ThemeName = DEFAULT_THEME_NAME,
) {
  const config = getThemeConfig(themeName);
  const mode: ThemeMode = darkMode ? "dark" : "light";
  const variant = config[mode];
  const presentation = getThemePresentation(darkMode, themeName);

  const accentAlpha15 = hexToRgba(variant.accent, 0.15);
  const accentAlpha40 = hexToRgba(variant.accent, 0.4);
  const glowColor = hexToRgba(variant.accent, 0.15);
  const lightTextColor = darkMode ? "#FFFFFF" : "#0F172A";
  const darkTextColor = darkMode ? variant.textPrimary : "#1F2937";
  const uiGradientStart =
    presentation.themeType === "gradient"
      ? blendHex(presentation.gradient.startColor, variant.accent, 0.35)
      : presentation.gradient.startColor;
  const uiGradientEnd =
    presentation.themeType === "gradient"
      ? blendHex(presentation.gradient.endColor, variant.accent, 0.35)
      : presentation.gradient.endColor;
  const animationDuration = resolveAnimationDuration(presentation.animation);

  const lightOnGradient = "#FFFFFF";
  const darkOnGradient = "#0F172A";
  const lightContrast = Math.min(
    contrastRatio(lightOnGradient, uiGradientStart),
    contrastRatio(lightOnGradient, uiGradientEnd),
  );
  const darkContrast = Math.min(
    contrastRatio(darkOnGradient, uiGradientStart),
    contrastRatio(darkOnGradient, uiGradientEnd),
  );
  const buttonText = lightContrast >= darkContrast ? lightOnGradient : darkOnGradient;
  const backgroundGradientStart = hexToRgba(
    uiGradientStart,
    darkMode ? 0.22 : 0.14,
  );
  const backgroundGradientEnd = hexToRgba(
    uiGradientEnd,
    darkMode ? 0.14 : 0.08,
  );

  return {
    // Foundation
    background: variant.background,
    surface: variant.surface,
    elevated: variant.elevated,
    surfaceElevated: variant.elevated,
    surfaceLowest: variant.background,

    // Primary
    accent: variant.accent,
    accentEnd: presentation.gradient.endColor,
    accentGradientStart: presentation.gradient.startColor,
    accentGradientEnd: presentation.gradient.endColor,
    buttonGradientStart: uiGradientStart,
    buttonGradientEnd: uiGradientEnd,

    // New: Action Button (for all major action buttons, not just PrimaryButton)
    actionButtonGradientStart: uiGradientStart,
    actionButtonGradientEnd: uiGradientEnd,
    actionButtonText: buttonText,
    actionButtonAccent: variant.accent,
    actionButtonAnimationColors:
      presentation.accentType === "animated"
        ? presentation.animation?.colors ?? [uiGradientStart, uiGradientEnd]
        : null,
    actionButtonAnimationType:
      presentation.accentType === "animated"
        ? presentation.animation?.type ?? null
        : null,
    actionButtonAnimationDuration:
      presentation.accentType === "animated" ? animationDuration : null,
    buttonText,
    highlightGradientStart: uiGradientStart,
    highlightGradientEnd: uiGradientEnd,
    backgroundGradientStart,
    backgroundGradientEnd,
    accentAlpha15,
    accentAlpha40,
    glowColor,

    // Theme presentation metadata
    themeType: presentation.themeType,
    accentType: presentation.accentType,
    gradient: presentation.gradient,
    animation: presentation.animation,

    // New accent-model tokens
    accentColor: presentation.accentType === "solid" ? variant.accent : null,
    gradientStart: presentation.accentType === "gradient" ? uiGradientStart : null,
    gradientEnd: presentation.accentType === "gradient" ? uiGradientEnd : null,
    animationColors:
      presentation.accentType === "animated"
        ? presentation.animation?.colors ?? [uiGradientStart, uiGradientEnd]
        : null,
    animationType:
      presentation.accentType === "animated"
        ? presentation.animation?.type ?? null
        : null,
    animationDuration:
      presentation.accentType === "animated" ? animationDuration : null,

    // Text
    textPrimary: variant.textPrimary,
    textSecondary: variant.textSecondary,
    spaceTextPrimary: variant.textPrimary,
    spaceTextSecondary: variant.textSecondary,

    // Borders & Overlay
    border: hexToRgba(variant.textPrimary, darkMode ? 0.08 : 0.12),
    borderFocus: hexToRgba(variant.accent, darkMode ? 0.28 : 0.22),
    overlayGlass: hexToRgba(variant.surface, darkMode ? 0.88 : 0.72),

    // Button surfaces
    secondaryBg: hexToRgba(variant.textPrimary, darkMode ? 0.04 : 0.06),
    secondaryPress: hexToRgba(variant.textPrimary, darkMode ? 0.08 : 0.1),

    // Game — Players
    player1: lightTextColor,
    player1Glow: hexToRgba(lightTextColor, darkMode ? 0.12 : 0.14),
    player2: variant.accent,
    player2Glow: hexToRgba(variant.accent, darkMode ? 0.14 : 0.18),

    // Game — Board
    boardBg: variant.surface,
    gridLine: hexToRgba(variant.textPrimary, darkMode ? 0.08 : 0.12),

    // Game — Walls
    wallPlaced: hexToRgba(variant.textPrimary, darkMode ? 0.9 : 0.82),
    wallPreview: hexToRgba(variant.textPrimary, darkMode ? 0.25 : 0.24),
    wallAvailable: hexToRgba(variant.textPrimary, darkMode ? 0.7 : 0.62),
    wallUsed: hexToRgba(variant.textSecondary, 0.3),

    // Game — Indicators
    validMove: hexToRgba(variant.accent, darkMode ? 0.12 : 0.16),
    selectedSquare: hexToRgba(variant.accent, darkMode ? 0.18 : 0.24),

    // Semantic
    success: "#22C55E",
    error: "#EF4444",
    warning: "#F59E0B",
    successAlpha12: hexToRgba("#22C55E", darkMode ? 0.12 : 0.1),
    errorAlpha12: hexToRgba("#EF4444", darkMode ? 0.12 : 0.1),

    // Backward compat (old screens)
    boardSquare: variant.surface,
    wallGlow: hexToRgba(variant.textPrimary, darkMode ? 0.12 : 0.14),
    wallPreviewBorder: hexToRgba(variant.textPrimary, darkMode ? 0.15 : 0.18),
    validMoveBorder: hexToRgba(variant.accent, darkMode ? 0.2 : 0.24),
    cardBg: variant.elevated,
    buttonBg: accentAlpha15,
    overlay: hexToRgba(variant.background, darkMode ? 0.85 : 0.72),
    playerPawn: variant.accent,
    opponentPawn: darkTextColor,
  };
}

// Backward-compatible aliases for legacy screens still importing static palettes.
export const COLORS = getThemeColors(true, DEFAULT_THEME_NAME);
export const LIGHT_COLORS = getThemeColors(false, DEFAULT_THEME_NAME);
