// Theme preview without Twitch: a finished demo city (every kind, a few storeys) on the real overlay.
// Usage: npm run preview -- [theme|plain] [day|dawn|dusk|night]   then open http://localhost:3005/town (?bg=0 bottom only)
// Type another theme name (or "plain") and press enter to watch the tide wash it in.
import { startOverlay } from '../src/overlay.ts';
import { FOCUS_ID, SIZE, type Kind } from '../src/scene/city.ts';
import { THEMES } from '../src/scene/theme.ts';
import type { Town } from '../src/town.ts';

const [first = 'plain', phase = 'day'] = process.argv.slice(2);
const pick = (id: string) => (id === 'plain' ? null : id in THEMES ? id : (console.error(`unknown theme "${id}": ${Object.keys(THEMES).join(', ')}, plain`), process.exit(1)));
let theme = pick(first);
const PORT = Number(process.env.PORT ?? 3005); // not 3001: runs next to the live bot

const LANDMARKS: Kind[] = ['clocktower', 'ferris', 'skyscraper']; // the tall focus-only ones
const street = (Object.keys(SIZE) as Kind[]).filter((k) => !LANDMARKS.includes(k));
const t0 = Date.UTC(2026, 0, 1);
const floor = (kind: Kind, at: number, done = true) => ({ task: kind, done, kind, at });
const town: Town = {
  demo: { name: 'demo', floors: [...street.map((k, i) => floor(k, t0 + i)), ...[0, 1, 2, 3].map((i) => floor('office', t0 + 100 + i, i < 3))] },
  [FOCUS_ID]: { name: 'focus', floors: LANDMARKS.map((k, i) => floor(k, t0 + 200 + i)) },
};

const state = () => ({ type: 'state', boot: 1, theme, phase, town, builders: [] });
const push = startOverlay(PORT, state);
console.log(`preview: ${theme ?? 'plain'} at ${phase} → http://localhost:${PORT}/town, ?bg=0 for bottom only (type a theme name + enter to switch)`);
process.stdin.on('data', (b) => { theme = pick(String(b).trim() || 'plain'); push(state()); });
