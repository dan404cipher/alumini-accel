// Shared color palette and chart configuration constants
export const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  pink: "#ec4899",
  indigo: "#6366f1",
  cyan: "#06b6d4",
  emerald: "#059669",
  amber: "#f59e0b",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  sky: "#0ea5e9",
  lime: "#84cc16",
  fuchsia: "#d946ef",
  slate: "#64748b",
  stone: "#78716c",
};

// Extended color palette to ensure unique colors for all chart segments
export const PIE_CHART_COLORS = [
  COLORS.blue,
  COLORS.green,
  COLORS.orange,
  COLORS.purple,
  COLORS.teal,
  COLORS.pink,
  COLORS.indigo,
  COLORS.cyan,
  COLORS.emerald,
  COLORS.rose,
  COLORS.violet,
  COLORS.sky,
  COLORS.lime,
  COLORS.fuchsia,
  COLORS.red,
  COLORS.slate,
];

// Chart configuration for consistent styling
export const CHART_CONFIG = {
  // Responsive heights
  chartHeight: {
    mobile: "h-[250px]",
    tablet: "h-[300px]",
    desktop: "h-[350px]",
    large: "h-[400px]",
  },
  // Pie chart radius
  pieRadius: {
    mobile: 60,
    tablet: 80,
    desktop: 100,
    large: 120,
  },
};

