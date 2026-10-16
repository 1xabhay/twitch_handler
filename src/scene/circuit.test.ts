import { describe, expect, it } from 'vitest';
import { evaluate, STREET, streetInputs, type Circuit } from './circuit.ts';

describe('evaluate', () => {
  it('AND, OR, NOT, and gates feeding gates', () => {
    const c: Circuit = { a: { op: 'and', in: ['x', 'y'] }, o: { op: 'or', in: ['x', 'y'] }, n: { op: 'not', in: ['a'] } };
    expect(evaluate(c, { x: true, y: false })).toMatchObject({ a: false, o: true, n: true });
    expect(evaluate(c, { x: true, y: true })).toMatchObject({ a: true, o: true, n: false });
  });
  it('unknown signals read false, and a loop settles instead of hanging', () => {
    expect(evaluate({ a: { op: 'or', in: ['missing'] } }, {}).a).toBe(false);
    const loop = evaluate({ a: { op: 'not', in: ['b'] }, b: { op: 'not', in: ['a'] } }, {});
    expect(typeof loop.a).toBe('boolean');
  });
});

describe('the street circuit', () => {
  const run = (o: Partial<Parameters<typeof streetInputs>[0]>) =>
    evaluate(STREET, streetInputs({ night: false, weather: 'clear', life: [], built: 0, ...o }));
  it('lamps come on at night or in the rain', () => {
    expect(run({}).lamps).toBe(false);
    expect(run({ night: true }).lamps).toBe(true);
    expect(run({ weather: 'rain' }).lamps).toBe(true);
  });
  it('the food cart stays home in bad weather, the balloon flies only by day', () => {
    expect(run({ life: ['cart'] }).cart).toBe(true);
    expect(run({ life: ['cart'], weather: 'snow' }).cart).toBe(false);
    expect(run({ life: ['balloon'] }).balloon).toBe(true);
    expect(run({ life: ['balloon'], night: true }).balloon).toBe(false);
  });
  it('the power line runs once something is built', () => {
    expect(run({}).power).toBe(false);
    expect(run({ built: 1 }).power).toBe(true);
  });
});
