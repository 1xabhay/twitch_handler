import { describe, expect, it } from 'vitest';
import { handleGuess, PALETTE, PIECES, pieceAt, ROTATE_MS, slotAt } from './guess.ts';

const sam = { userName: 'sam' };
const at = (slot: number, min = 0) => slot * ROTATE_MS + min * 60_000;

describe('pieces', () => {
  it('every piece is a 20x16 grid in the palette, answers already normalised', () => {
    for (const p of PIECES) {
      expect(p.art).toHaveLength(16);
      for (const row of p.art) expect(row).toMatch(/^.{20}$/);
      for (const ch of p.art.join('')) expect(ch === '.' || ch in PALETTE, `${p.name}: ${ch}`).toBe(true);
      for (const a of p.answers) expect(a).toMatch(/^[a-z]+$/);
    }
  });
  it('a new piece every ROTATE_MS, all of them before one repeats', () => {
    expect(pieceAt(at(3, 0))).toBe(pieceAt(at(3, 9)));
    expect(new Set(PIECES.map((_, i) => pieceAt(at(i))))).toHaveLength(PIECES.length);
  });
});

describe('handleGuess', () => {
  const now = at(5, 2), piece = pieceAt(now);
  it('ignores other messages', () => {
    expect(handleGuess(null, sam, '!guesswho', now)).toBeNull();
    expect(handleGuess(null, sam, 'guess luffy', now)).toBeNull();
  });
  it('a right guess solves the piece: any case, spaces or punctuation, until the next piece', () => {
    const r = handleGuess(null, sam, `!guess  ${piece.name.toUpperCase()}!`, now)!;
    expect(r.solved).toEqual({ slot: slotAt(now), by: 'sam' });
    expect(r.reply).toContain(piece.name);
    expect(r.reply).toContain('8 min');
    expect(handleGuess(r.solved, { userName: 'kai' }, `!guess ${piece.name}`, now)).toEqual({ solved: r.solved, reply: expect.stringContaining('sam') });
    expect(handleGuess(r.solved, sam, `!guess ${pieceAt(at(6)).name}`, at(6))!.solved!.slot).toBe(6);
  });
  it('a wrong guess or a bare !guess leaves it open', () => {
    const wrong = PIECES.find((p) => p !== piece)!.name;
    expect(handleGuess(null, sam, `!guess ${wrong}`, now)).toEqual({ solved: null, reply: expect.stringContaining('not quite') });
    expect(handleGuess(null, sam, '!guess', now)!.solved).toBeNull();
  });
  it('full names and nicknames count', () => {
    const zoro = PIECES.findIndex((p) => p.name === 'Zoro');
    expect(handleGuess(null, sam, '!guess Roronoa Zoro', at(zoro))!.solved).not.toBeNull();
  });
  it('no em dashes in replies', () => {
    for (const t of ['!guess', '!guess nope', `!guess ${piece.name}`]) expect(handleGuess(null, sam, t, now)!.reply).not.toContain('—');
  });
});
