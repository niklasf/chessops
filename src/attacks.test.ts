import assert from 'node:assert/strict';
import { test } from 'node:test';
import { between, ray, rookAttacks } from './attacks.js';
import { SquareSet } from './squareSet.js';

test('rook attacks', () => {
  const d6 = 43;
  assert.deepStrictEqual(rookAttacks(d6, new SquareSet(0x2826f5b9, 0x3f7f2880)), new SquareSet(0x8000000, 0x83708));
  assert.deepStrictEqual(rookAttacks(d6, SquareSet.empty()), SquareSet.fromFile(3).xor(SquareSet.fromRank(5)));
});

test('ray', () => {
  assert.deepStrictEqual(ray(0, 8), SquareSet.fromFile(0));
});

test('between', () => {
  assert.deepStrictEqual(between(42, 42), SquareSet.empty());
  assert.deepStrictEqual(Array.from(between(0, 3)), [1, 2]);

  assert.deepStrictEqual(Array.from(between(61, 47)), [54]);
  assert.deepStrictEqual(Array.from(between(47, 61)), [54]);
});
