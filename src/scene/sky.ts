// The real sky over the stream (server side: suncalc isn't served to the browser). Azimuth in degrees from north,
// eastward; altitude in degrees above the horizon. Stars: bright named stars, J2000 RA/Dec in degrees, magnitude.
import SunCalc from 'suncalc';

export type Star = { name: string; ra: number; dec: number; mag: number };
export const STARS: Star[] = [
  { name: 'Sirius', ra: 101.287, dec: -16.716, mag: -1.46 }, { name: 'Arcturus', ra: 213.915, dec: 19.182, mag: -0.05 },
  { name: 'Vega', ra: 279.234, dec: 38.784, mag: 0.03 }, { name: 'Capella', ra: 79.172, dec: 45.998, mag: 0.08 },
  { name: 'Rigel', ra: 78.634, dec: -8.202, mag: 0.13 }, { name: 'Procyon', ra: 114.825, dec: 5.225, mag: 0.34 },
  { name: 'Betelgeuse', ra: 88.793, dec: 7.407, mag: 0.5 }, { name: 'Altair', ra: 297.696, dec: 8.868, mag: 0.77 },
  { name: 'Aldebaran', ra: 68.98, dec: 16.509, mag: 0.85 }, { name: 'Spica', ra: 201.298, dec: -11.161, mag: 0.97 },
  { name: 'Antares', ra: 247.352, dec: -26.432, mag: 1.09 }, { name: 'Pollux', ra: 116.329, dec: 28.026, mag: 1.14 },
  { name: 'Fomalhaut', ra: 344.413, dec: -29.622, mag: 1.16 }, { name: 'Deneb', ra: 310.358, dec: 45.28, mag: 1.25 },
  { name: 'Regulus', ra: 152.093, dec: 11.967, mag: 1.35 }, { name: 'Castor', ra: 113.65, dec: 31.888, mag: 1.58 },
  { name: 'Bellatrix', ra: 81.283, dec: 6.35, mag: 1.64 }, { name: 'Alnilam', ra: 84.053, dec: -1.202, mag: 1.69 },
  { name: 'Alnitak', ra: 85.19, dec: -1.943, mag: 1.77 }, { name: 'Mintaka', ra: 83.002, dec: -0.299, mag: 2.23 },
  { name: 'Saiph', ra: 86.939, dec: -9.67, mag: 2.06 }, { name: 'Polaris', ra: 37.955, dec: 89.264, mag: 1.98 },
  { name: 'Dubhe', ra: 165.932, dec: 61.751, mag: 1.79 }, { name: 'Merak', ra: 165.46, dec: 56.382, mag: 2.37 },
  { name: 'Phecda', ra: 178.458, dec: 53.695, mag: 2.44 }, { name: 'Megrez', ra: 183.857, dec: 57.033, mag: 3.31 },
  { name: 'Alioth', ra: 193.507, dec: 55.96, mag: 1.77 }, { name: 'Mizar', ra: 200.981, dec: 54.925, mag: 2.27 },
  { name: 'Alkaid', ra: 206.885, dec: 49.313, mag: 1.86 }, { name: 'Caph', ra: 2.295, dec: 59.15, mag: 2.28 },
  { name: 'Schedar', ra: 10.127, dec: 56.537, mag: 2.24 }, { name: 'Navi', ra: 14.177, dec: 60.717, mag: 2.47 },
  { name: 'Ruchbah', ra: 21.454, dec: 60.235, mag: 2.68 }, { name: 'Segin', ra: 28.599, dec: 63.67, mag: 3.37 },
  { name: 'Markab', ra: 346.19, dec: 15.205, mag: 2.49 }, { name: 'Scheat', ra: 345.944, dec: 28.083, mag: 2.42 },
  { name: 'Algenib', ra: 3.309, dec: 15.184, mag: 2.83 }, { name: 'Alpheratz', ra: 2.097, dec: 29.091, mag: 2.06 },
  { name: 'Alcyone', ra: 56.871, dec: 24.105, mag: 2.87 },
];
// Constellation figures (faint lines): Orion, Big Dipper, Cassiopeia, Summer Triangle, Great Square of Pegasus.
const FIGURES = [
  'Betelgeuse-Bellatrix', 'Bellatrix-Mintaka', 'Betelgeuse-Alnitak', 'Mintaka-Alnilam', 'Alnilam-Alnitak', 'Alnitak-Saiph', 'Mintaka-Rigel',
  'Dubhe-Merak', 'Merak-Phecda', 'Phecda-Megrez', 'Megrez-Dubhe', 'Megrez-Alioth', 'Alioth-Mizar', 'Mizar-Alkaid',
  'Caph-Schedar', 'Schedar-Navi', 'Navi-Ruchbah', 'Ruchbah-Segin',
  'Vega-Deneb', 'Deneb-Altair', 'Altair-Vega',
  'Markab-Scheat', 'Scheat-Alpheratz', 'Alpheratz-Algenib', 'Algenib-Markab',
].map((p) => p.split('-') as [string, string]);

const RAD = Math.PI / 180, mod = (x: number) => ((x % 360) + 360) % 360;

export const lst = (t: Date, lon: number) => {
  const d = t.getTime() / 86_400_000 + 2440587.5 - 2451545; // days since J2000
  return mod(280.46061837 + 360.98564736629 * d + lon);
};

export const horizontal = ({ ra, dec }: { ra: number; dec: number }, t: Date, { lat, lon }: { lat: number; lon: number }) => {
  const h = (lst(t, lon) - ra) * RAD, d = dec * RAD, p = lat * RAD;
  const alt = Math.asin(Math.sin(d) * Math.sin(p) + Math.cos(d) * Math.cos(p) * Math.cos(h)) / RAD;
  const az = mod(Math.atan2(-Math.cos(d) * Math.sin(h), Math.sin(d) * Math.cos(p) - Math.cos(d) * Math.sin(p) * Math.cos(h)) / RAD);
  return { az, alt };
};

// suncalc measures azimuth from south, westward
const fromSuncalc = ({ azimuth, altitude }: { azimuth: number; altitude: number }) => ({ az: mod(azimuth / RAD + 180), alt: altitude / RAD });

export const skyAt = (t: Date, where: { lat: number; lon: number }) => {
  const stars = STARS.map((s) => ({ name: s.name, mag: s.mag, ...horizontal(s, t, where) })).filter((s) => s.alt > 0);
  const at = new Map(stars.map((s, i) => [s.name, i]));
  const lines = FIGURES.flatMap(([a, b]) => (at.has(a) && at.has(b) ? [[at.get(a)!, at.get(b)!]] : []));
  const { fraction, phase } = SunCalc.getMoonIllumination(t);
  return {
    sun: fromSuncalc(SunCalc.getPosition(t, where.lat, where.lon)),
    moon: { ...fromSuncalc(SunCalc.getMoonPosition(t, where.lat, where.lon)), phase, lit: fraction },
    stars, lines,
  };
};
