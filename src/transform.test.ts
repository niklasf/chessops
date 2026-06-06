import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SquareSet } from './squareSet.js';
import {
  flipDiagonal,
  flipHorizontal,
  flipVertical,
  rotate180,
  shiftDown,
  shiftLeft,
  shiftRight,
  shiftUp,
} from './transform.js';

const r = new SquareSet(0x0e0a1222, 0x1e222212);

test('flip vertical', () => {
  assert.deepStrictEqual(flipVertical(SquareSet.full()), SquareSet.full());
  assert.deepStrictEqual(flipVertical(r), new SquareSet(0x1222221e, 0x22120a0e));
});

test('flip horizontal', () => {
  assert.deepStrictEqual(flipHorizontal(SquareSet.full()), SquareSet.full());
  assert.deepStrictEqual(flipHorizontal(r), new SquareSet(0x70504844, 0x78444448));
});

test('flip diagonal', () => {
  assert.deepStrictEqual(flipDiagonal(SquareSet.full()), SquareSet.full());
  assert.deepStrictEqual(flipDiagonal(r), new SquareSet(0x8c88ff00, 0x00006192));
});

test('rotate 180', () => {
  assert.deepStrictEqual(rotate180(SquareSet.full()), SquareSet.full());
  assert.deepStrictEqual(rotate180(r), new SquareSet(0x48444478, 0x44485070));
});

test('shift left', () => {
  assert.deepStrictEqual(shiftLeft(SquareSet.full()), SquareSet.full());
  assert.deepStrictEqual(shiftLeft(SquareSet.darkSquares()), SquareSet.lightSquares());
  assert.deepStrictEqual(shiftLeft(SquareSet.fromRank(0)), SquareSet.fromRank(0));
  assert.deepStrictEqual(shiftLeft(SquareSet.fromRank(7)), SquareSet.fromRank(7));
  assert.deepStrictEqual(shiftLeft(SquareSet.fromFile(0)), SquareSet.fromFile(7));
  assert.deepStrictEqual(shiftLeft(SquareSet.fromFile(7)), SquareSet.fromFile(6));
});

test('shift right', () => {
  assert.deepStrictEqual(shiftRight(SquareSet.full()), SquareSet.full());
  assert.deepStrictEqual(shiftRight(SquareSet.darkSquares()), SquareSet.lightSquares());
  assert.deepStrictEqual(shiftRight(SquareSet.fromRank(0)), SquareSet.fromRank(0));
  assert.deepStrictEqual(shiftRight(SquareSet.fromRank(7)), SquareSet.fromRank(7));
  assert.deepStrictEqual(shiftRight(SquareSet.fromFile(0)), SquareSet.fromFile(1));
  assert.deepStrictEqual(shiftRight(SquareSet.fromFile(7)), SquareSet.fromFile(0));
});

test('shift down', () => {
  assert.deepStrictEqual(shiftDown(SquareSet.full()), SquareSet.full());
  assert.deepStrictEqual(shiftDown(SquareSet.darkSquares()), SquareSet.lightSquares());
  assert.deepStrictEqual(shiftDown(SquareSet.fromRank(0)), SquareSet.fromRank(7));
  assert.deepStrictEqual(shiftDown(SquareSet.fromRank(7)), SquareSet.fromRank(6));
  assert.deepStrictEqual(shiftDown(SquareSet.fromFile(0)), SquareSet.fromFile(0));
  assert.deepStrictEqual(shiftDown(SquareSet.fromFile(7)), SquareSet.fromFile(7));
});

test('shift up', () => {
  assert.deepStrictEqual(shiftUp(SquareSet.full()), SquareSet.full());
  assert.deepStrictEqual(shiftUp(SquareSet.darkSquares()), SquareSet.lightSquares());
  assert.deepStrictEqual(shiftUp(SquareSet.fromRank(0)), SquareSet.fromRank(1));
  assert.deepStrictEqual(shiftUp(SquareSet.fromRank(7)), SquareSet.fromRank(0));
  assert.deepStrictEqual(shiftUp(SquareSet.fromFile(0)), SquareSet.fromFile(0));
  assert.deepStrictEqual(shiftUp(SquareSet.fromFile(7)), SquareSet.fromFile(7));
});
