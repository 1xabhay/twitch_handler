// One Piece fan art for the tall Focus panel, told through objects only (no faces): chat guesses who with !guess.
// Cyberpunk neon strokes (src/pieces/: draw.ts has the palette and helpers, one file per group). New piece every ROTATE_MS.
import type { Piece } from './pieces/draw.ts';
import { CREW } from './pieces/crew.ts';
import { SHIPS } from './pieces/ships.ts';
import { LEGENDS } from './pieces/legends.ts';
import { RIVALS } from './pieces/rivals.ts';
import { MARINES } from './pieces/marines.ts';
import { FAVOURITES } from './pieces/favourites.ts';
export { NEON } from './pieces/draw.ts';
export type { Piece, Stroke } from './pieces/draw.ts';

// Groups take turns (one crew piece, one legend, one rival...), so two hats or two swords rarely come back to back.
const turns = (groups: Piece[][]) => Array.from({ length: Math.max(...groups.map((g) => g.length)) }, (_, i) => groups.flatMap((g) => g[i] ?? [])).flat();
export const PIECES: Piece[] = turns([CREW, SHIPS, LEGENDS, RIVALS, MARINES, FAVOURITES]);

export const ROTATE_MS = 10 * 60_000;
export const slotAt = (now: number) => Math.floor(now / ROTATE_MS);
export const pieceAt = (now: number) => PIECES[slotAt(now) % PIECES.length]!;
export type Solved = { slot: number; by: string } | null; // first right guess for the piece on screen now

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
export const handleGuess = (solved: Solved, { userName }: { userName: string }, text: string, now: number) => {
  const arg = text.trim().match(/^!guess(?:\s+(.+))?$/i);
  if (!arg) return null;
  const slot = slotAt(now), piece = pieceAt(now), mins = Math.ceil(((slot + 1) * ROTATE_MS - now) / 60_000);
  if (solved?.slot === slot) return { solved, reply: `🏴‍☠️ already solved by ${solved.by}, it's ${piece.name}! new piece in ${mins} min` };
  if (!arg[1]) return { solved, reply: '🏴‍☠️ who is on the panel? type !guess <name>' };
  if (!piece.answers.includes(norm(arg[1]))) return { solved, reply: `@${userName} not quite 👀` };
  return { solved: { slot, by: userName }, reply: `🏴‍☠️ @${userName} got it, ${piece.name}! new piece in ${mins} min` };
};
