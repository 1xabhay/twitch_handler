// Shared by the guess pieces (src/pieces/*.ts): the neon palette, the stroke type and path helpers for a 300x200 frame.
// A stroke is an SVG path, a NEON colour, a width and an optional faint holographic fill; timer.html adds the glow.
// Style (streamer, 2026-10-22): the character as a dark silhouette in their signature pose, rim-lit in neon, plus ONE
// glowing clue (hat, sword...). `sil` strokes are body parts: they merge into one dark shape and only its outer edge glows.
export const NEON = {
  pink: '#FF2E88', cyan: '#00F0FF', yellow: '#FFE14D', orange: '#FF8A1F', red: '#FF3B3B', green: '#39FF88', violet: '#B46BFF', blue: '#3D7BFF', white: '#F2F7FF',
};
export type Stroke = { d: string; c: keyof typeof NEON; w?: number; fill?: boolean; sil?: boolean };
export type Piece = { name: string; answers: string[]; art: Stroke[] };

export const n = (v: number) => Math.round(v * 10) / 10;
export const circle = (x: number, y: number, r: number) => `M${n(x - r)} ${y} A${r} ${r} 0 1 0 ${n(x + r)} ${y} A${r} ${r} 0 1 0 ${n(x - r)} ${y} Z`;
export const poly = (pts: [number, number][], close = false) => 'M' + pts.map(([x, y]) => `${n(x)} ${n(y)}`).join(' L') + (close ? ' Z' : '');
// a katana from its pommel at (x, y), pointing `deg` (0 = straight up): blade, guard and a wrapped handle
export const katana = (x: number, y: number, deg: number, c: Stroke['c']): Stroke[] => {
  const a = (deg * Math.PI) / 180, at = (k: number, side = 0): [number, number] =>
    [x + Math.sin(a) * k + Math.cos(a) * side, y - Math.cos(a) * k + Math.sin(a) * side];
  const wrap = [0, 9, 18, 27].flatMap((k) => [poly([at(k, -4), at(k + 9, 4)]), poly([at(k, 4), at(k + 9, -4)])]).join(' ');
  return [
    { d: poly([at(0, -4), at(36, -4), at(36, 4), at(0, 4)], true), c, w: 1.5 },
    { d: wrap, c, w: 1 },
    { d: poly([at(37, -11), at(37, 11)]), c: 'yellow', w: 3 },
    { d: `M${n(at(39)[0])} ${n(at(39)[1])} Q${n(at(110, -6)[0])} ${n(at(110, -6)[1])} ${n(at(170, -12)[0])} ${n(at(170, -12)[1])}`, c, w: 2.5 },
  ];
};
export const spiral = (x: number, y: number, turns: number, r: number) =>
  poly(Array.from({ length: turns * 24 + 1 }, (_, i) => { const t = i / 24, k = (t / turns) * r; return [x + Math.cos(t * 2 * Math.PI) * k, y + Math.sin(t * 2 * Math.PI) * k]; }));
export const afro = (x: number, y: number, r: number, bumps: number) =>
  poly(Array.from({ length: bumps * 8 + 1 }, (_, i) => { const t = (i / (bumps * 8)) * 2 * Math.PI, k = r + 5 * Math.abs(Math.sin((t * bumps) / 2)); return [x + Math.cos(t) * k, y + Math.sin(t) * k * 0.85]; }), true);
export const ellipse = (x: number, y: number, rx: number, ry: number) =>
  `M${n(x - rx)} ${n(y)} A${rx} ${ry} 0 1 0 ${n(x + rx)} ${n(y)} A${rx} ${ry} 0 1 0 ${n(x - rx)} ${n(y)} Z`;
// a body part along a polyline, `w0` wide at the first point tapering to `w1` at the last (arms, legs, a torso, a coat tail)
export const limb = (pts: [number, number][], w0: number, w1 = w0) => {
  const side = (k: 1 | -1) => pts.map(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)]!, [bx, by] = pts[Math.min(pts.length - 1, i + 1)]!;
    const len = Math.hypot(bx - ax, by - ay) || 1, w = (w0 + ((w1 - w0) * i) / Math.max(1, pts.length - 1)) / 2;
    return [x - ((by - ay) / len) * w * k, y + ((bx - ax) / len) * w * k] as [number, number];
  });
  return poly([...side(1), ...side(-1).reverse()], true);
};
