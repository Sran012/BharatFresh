export const colors = {
  primary: "#0d631b",
  primaryContainer: "#2e7d32",
  onPrimary: "#ffffff",
  onPrimaryContainer: "#cbffc2",

  secondary: "#795900",
  secondaryContainer: "#fec330",
  onSecondary: "#ffffff",
  onSecondaryContainer: "#6f5100",

  surface: "#fbf9f9",
  surfaceDim: "#dbdad9",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f5f3f3",
  surfaceContainer: "#efeded",
  surfaceContainerHigh: "#e9e8e7",
  surfaceContainerHighest: "#e3e2e2",

  onSurface: "#1b1c1c",
  onSurfaceVariant: "#40493d",

  outline: "#707a6c",
  outlineVariant: "#bfcaba",

  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onError: "#ffffff",

  success: "#2e7d32",
  warning: "#fbc02d",

  background: "#fbf9f9",
  onBackground: "#1b1c1c",
} as const;

// ponytail: using system fonts for now, swap in Plus Jakarta Sans / Inter when .ttf files are bundled
export const typography = {
  headlineLg: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  headlineLgMobile: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700" as const,
  },
  headlineMd: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  bodyMd: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  labelBold: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  bodySm: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
  },
  headlineXl: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  priceDisplay: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700" as const,
  },
} as const;

export const spacing = {
  unit: 4,
  marginMobile: 16,
  gutter: 12,
  stackSm: 8,
  stackMd: 16,
  stackLg: 24,
} as const;

export const radius = {
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
