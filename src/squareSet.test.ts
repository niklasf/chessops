import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SquareSet } from './squareSet.js';

test('full set has all', () => {
  for (let square = 0; square < 64; square++) {
    assert.strictEqual(SquareSet.full().has(square), true);
  }
});

test('size', () => {
  let squares = SquareSet.empty();
  for (let i = 0; i < 64; i++) {
    assert.strictEqual(squares.size(), i);
    squares = squares.with(i);
  }
});

test('shr64', () => {
  const r = new SquareSet(0xe0a1222, 0x1e222212);
  assert.deepStrictEqual(r.shr64(0), r);
  assert.deepStrictEqual(r.shr64(1), new SquareSet(0x7050911, 0xf111109));
  assert.deepStrictEqual(r.shr64(3), new SquareSet(0x41c14244, 0x3c44442));
  assert.deepStrictEqual(r.shr64(31), new SquareSet(0x3c444424, 0x0));
  assert.deepStrictEqual(r.shr64(32), new SquareSet(0x1e222212, 0x0));
  assert.deepStrictEqual(r.shr64(33), new SquareSet(0xf111109, 0x0));
  assert.deepStrictEqual(r.shr64(62), new SquareSet(0x0, 0x0));
});

test('shl64', () => {
  const r = new SquareSet(0xe0a1222, 0x1e222212);
  assert.deepStrictEqual(r.shl64(0), r);
  assert.deepStrictEqual(r.shl64(1), new SquareSet(0x1c142444, 0x3c444424));
  assert.deepStrictEqual(r.shl64(3), new SquareSet(0x70509110, 0xf1111090));
  assert.deepStrictEqual(r.shl64(31), new SquareSet(0x0, 0x7050911));
  assert.deepStrictEqual(r.shl64(32), new SquareSet(0x0, 0xe0a1222));
  assert.deepStrictEqual(r.shl64(33), new SquareSet(0x0, 0x1c142444));
  assert.deepStrictEqual(r.shl64(62), new SquareSet(0x0, 0x80000000));
  assert.deepStrictEqual(r.shl64(63), new SquareSet(0x0, 0x0));
});

test('more than one', () => {
  assert.strictEqual(new SquareSet(0, 0).moreThanOne(), false);
  assert.strictEqual(new SquareSet(1, 0).moreThanOne(), false);
  assert.strictEqual(new SquareSet(2, 0).moreThanOne(), false);
  assert.strictEqual(new SquareSet(4, 0).moreThanOne(), false);
  assert.strictEqual(new SquareSet(-2147483648, 0).moreThanOne(), false);
  assert.strictEqual(new SquareSet(0, 1).moreThanOne(), false);
  assert.strictEqual(new SquareSet(0, 2).moreThanOne(), false);
  assert.strictEqual(new SquareSet(0, 4).moreThanOne(), false);
  assert.strictEqual(new SquareSet(0, -2147483648).moreThanOne(), false);

  assert.strictEqual(new SquareSet(1, 1).moreThanOne(), true);
  assert.strictEqual(new SquareSet(3, 0).moreThanOne(), true);
  assert.strictEqual(new SquareSet(-1, 0).moreThanOne(), true);
  assert.strictEqual(new SquareSet(0, 3).moreThanOne(), true);
  assert.strictEqual(new SquareSet(0, -1).moreThanOne(), true);
});
