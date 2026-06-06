import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeUci, parseUci } from './util.js';
import { NormalMove } from './types.js';

test('parse uci', () => {
  const m1 = parseUci('a1a2') as NormalMove;
  assert.strictEqual(m1.from, 0);
  assert.strictEqual(m1.to, 8);
  assert.strictEqual(m1.promotion, undefined);
  const m2 = parseUci('h7h8k') as NormalMove;
  assert.strictEqual(m2.from, 55);
  assert.strictEqual(m2.to, 63);
  assert.strictEqual(m2.promotion, 'king');
  assert.deepStrictEqual(parseUci('P@h1'), { role: 'pawn', to: 7 });
});

test('make uci', () => {
  assert.strictEqual(makeUci({ role: 'queen', to: 1 }), 'Q@b1');
  assert.strictEqual(makeUci({ from: 2, to: 3 }), 'c1d1');
  assert.strictEqual(makeUci({ from: 0, to: 0, promotion: 'pawn' }), 'a1a1p');
});
