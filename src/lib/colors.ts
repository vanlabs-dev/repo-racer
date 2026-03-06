export const CAR_COLORS = [
  "#e8a430", // amber
  "#4ecdc4", // teal
  "#e05555", // brick red
  "#7ec85a", // olive green
  "#c084fc", // lavender
  "#f59e42", // tangerine
  "#5b9bd5", // steel blue
  "#d4d4d8", // silver
] as const;

// --- Base surfaces ---
export const BG_CHARCOAL = "#1a1a1f";
export const BG_GRAPHITE = "#222228";
export const BG_NAVY = "#12121a";
export const BG_PANEL = "#1e1e24";
export const BG_DEEP = "#141418";

// --- Environment ---
export const FOG_COLOR = "#151f15";
export const SKY_COLOR = "#0f170f";
export const GROUND_COLOR = "#1e1e26";
export const GRASS_COLOR = "#1c3b1c";
export const GRASS_COLOR_ALT = "#224522";
export const RUNOFF_COLOR = "#5c4a2e";

// --- Accent colors ---
export const ACCENT_AMBER = "#e8a430";
export const ACCENT_CYAN = "#5a9ea6";
export const ACCENT_GREEN = "#7ec85a";
export const ACCENT_RED = "#c84040";

// --- Track ---
export const TRACK_SURFACE = "#2a2e34";
export const TRACK_SURFACE_EDGE = "#3a3f46";
export const TRACK_EDGE = "#f5b642";
export const TRACK_BARRIER = "#3b3b3b";
export const TRACK_MARKING = "#44444f";

// --- Text ---
export const TEXT_PRIMARY = "#d4d4d8";
export const TEXT_SECONDARY = "#8a8a96";
export const TEXT_DIM = "#555564";
export const TEXT_AMBER = "#e8a430";

// --- UI borders and dividers ---
export const BORDER_SUBTLE = "#2a2a35";
export const BORDER_ACTIVE = "#e8a43066";

export function getSubnetColor(index: number): string {
  return CAR_COLORS[index % CAR_COLORS.length];
}
