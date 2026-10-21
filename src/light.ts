// Lighting follow-along for the anime room: the picture is painted once, then dimmed and brightened to match the real
// room (a lamp, dusk) instead of repainted. Thumbnails are 64x36 gray from the camera; mask is the cutout's alpha.
// Multiplicative model: live ≈ gain × painted, fitted on room pixels only (research: reports/Anime room backdrop for OBS.md).
const room = (mask: Uint8Array, i: number) => mask[i] <= 128;

export const fitGain = (base: Uint8Array, live: Uint8Array, mask: Uint8Array) => {
  const ratios = [...base].flatMap((b, i) => (room(mask, i) && b > 8 ? [live[i] / b] : [])).sort((a, b) => a - b);
  return ratios.length ? ratios[ratios.length >> 1] : 1;
};

// Mean difference left once the light is accounted for: high means something in the room moved.
export const residual = (base: Uint8Array, live: Uint8Array, mask: Uint8Array, gain: number) => {
  const d = [...base].flatMap((b, i) => (room(mask, i) ? [Math.abs(live[i] - gain * b)] : []));
  return d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0;
};

export const ease = (prev: number, target: number, rate: number) => prev + (target - prev) * rate;

// OBS Color Correction (color_filter_v2) settings for a gain: multiply by gray to darken; above the painted light,
// brightness. ponytail: brightness is additive, so brightening is only approximate; fine while plates are painted
// in normal room light and nights mostly darken.
export const lightFilter = (gain: number) => {
  const g = Math.min(1.5, Math.max(0.25, gain));
  const v = Math.round(255 * Math.min(1, g));
  return { color_multiply: ((0xff << 24) | (v << 16) | (v << 8) | v) >>> 0, brightness: g > 1 ? (g - 1) * 0.5 : 0 };
};
