import type { CSSProperties } from "react";

// RGB color per wizard step. Step 1 = red, Step 2 = blue, Step 3 = green.
// Shared by /bulk-start (the wizard page) and /design/[id] (when bulkStart=1)
// so the step-2 designer banner matches the step-2 pill color.
export const STEP_COLORS = ["#d96b6b", "#5e7ba8", "#67b079"];

// Inline-style CSS var overrides for step 2 so the entire designer surface
// (buttons, active-layer outlines, dimension labels, dashed print area, etc.)
// picks up the step-2 blue instead of the global brand slate. Apply on the
// design page's outer <section> when bulkStart=1.
export const STEP_2_CSS_VARS: CSSProperties = {
  ["--accent" as never]: "#5e7ba8",
  ["--accent-hover" as never]: "#7a93b8",
  ["--accent-active" as never]: "#4b6691",
  ["--accent-rgb" as never]: "94, 123, 168",
};
