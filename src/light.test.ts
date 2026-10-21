import { describe, expect, it } from 'vitest';
import { ease, fitGain, lightFilter, residual } from './light.ts';

const px = (...v: number[]) => Uint8Array.from(v);
const none = (n: number) => new Uint8Array(n); // cutout alpha: nobody in frame

describe('fitGain', () => {
  it('is how much brighter the room is now than when it was painted', () => {
    expect(fitGain(px(100, 50, 200), px(50, 25, 100), none(3))).toBeCloseTo(0.5, 1);
  });
  it('ignores pixels you cover (cutout alpha) and near-black ones (noise)', () => {
    expect(fitGain(px(100, 100, 2), px(60, 250, 200), px(0, 255, 0))).toBeCloseTo(0.6, 1);
  });
  it('takes the median, so one moved object does not tint the whole room', () => {
    expect(fitGain(px(100, 100, 100, 100, 100), px(80, 80, 80, 80, 255), none(5))).toBeCloseTo(0.8, 1);
  });
  it('is 1 when it cannot tell (everything covered)', () => {
    expect(fitGain(px(100), px(30), px(255))).toBe(1);
  });
});

describe('residual', () => {
  it('is zero for a pure lighting change: light is not a reason to repaint', () => {
    expect(residual(px(100, 50), px(50, 25), none(2), 0.5)).toBe(0);
  });
  it('is what is left after the light: something moved', () => {
    expect(residual(px(100, 100), px(50, 150), none(2), 0.5)).toBe(50);
  });
  it('only counts the room, not you', () => {
    expect(residual(px(100, 100), px(100, 0), px(0, 255), 1)).toBe(0);
  });
});

describe('ease', () => {
  it('moves part of the way, so the backdrop dims calmly over a few ticks', () => {
    expect(ease(1, 0.5, 0.25)).toBeCloseTo(0.875);
  });
});

describe('lightFilter', () => {
  it('darkens by multiplying the picture by a gray (OBS Color Correction color_multiply, 0xAABBGGRR)', () => {
    expect(lightFilter(0.5)).toEqual({ color_multiply: 0xff808080, brightness: 0 });
  });
  it('brightens past the painted light with brightness, capped', () => {
    expect(lightFilter(1)).toEqual({ color_multiply: 0xffffffff, brightness: 0 });
    expect(lightFilter(1.2).brightness).toBeCloseTo(0.1);
    expect(lightFilter(9)).toEqual(lightFilter(1.5));
  });
  it('never goes fully black', () => {
    expect(lightFilter(0)).toEqual(lightFilter(0.25));
  });
});
