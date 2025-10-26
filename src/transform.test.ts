import { expect, test } from '@jest/globals';
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
  expect(flipVertical(SquareSet.full())).toEqual(SquareSet.full());
  expect(flipVertical(r)).toEqual(new SquareSet(0x1222221e, 0x22120a0e));
});

test('flip horizontal', () => {
  expect(flipHorizontal(SquareSet.full())).toEqual(SquareSet.full());
  expect(flipHorizontal(r)).toEqual(new SquareSet(0x70504844, 0x78444448));
});

test('flip diagonal', () => {
  expect(flipDiagonal(SquareSet.full())).toEqual(SquareSet.full());
  expect(flipDiagonal(r)).toEqual(new SquareSet(0x8c88ff00, 0x00006192));
});

test('rotate 180', () => {
  expect(rotate180(SquareSet.full())).toEqual(SquareSet.full());
  expect(rotate180(r)).toEqual(new SquareSet(0x48444478, 0x44485070));
});

test('shift left', () => {
  expect(shiftLeft(SquareSet.full())).toEqual(SquareSet.full());
  expect(shiftLeft(SquareSet.darkSquares())).toEqual(SquareSet.lightSquares());
  expect(shiftLeft(SquareSet.fromRank(0))).toEqual(SquareSet.fromRank(0));
  expect(shiftLeft(SquareSet.fromRank(7))).toEqual(SquareSet.fromRank(7));
  expect(shiftLeft(SquareSet.fromFile(0))).toEqual(SquareSet.fromFile(7));
  expect(shiftLeft(SquareSet.fromFile(7))).toEqual(SquareSet.fromFile(6));
});

test('shift right', () => {
  expect(shiftRight(SquareSet.full())).toEqual(SquareSet.full());
  expect(shiftRight(SquareSet.darkSquares())).toEqual(SquareSet.lightSquares());
  expect(shiftRight(SquareSet.fromRank(0))).toEqual(SquareSet.fromRank(0));
  expect(shiftRight(SquareSet.fromRank(7))).toEqual(SquareSet.fromRank(7));
  expect(shiftRight(SquareSet.fromFile(0))).toEqual(SquareSet.fromFile(1));
  expect(shiftRight(SquareSet.fromFile(7))).toEqual(SquareSet.fromFile(0));
});

test('shift down', () => {
  expect(shiftDown(SquareSet.full())).toEqual(SquareSet.full());
  expect(shiftDown(SquareSet.darkSquares())).toEqual(SquareSet.lightSquares());
  expect(shiftDown(SquareSet.fromRank(0))).toEqual(SquareSet.fromRank(7));
  expect(shiftDown(SquareSet.fromRank(7))).toEqual(SquareSet.fromRank(6));
  expect(shiftDown(SquareSet.fromFile(0))).toEqual(SquareSet.fromFile(0));
  expect(shiftDown(SquareSet.fromFile(7))).toEqual(SquareSet.fromFile(7));
});

test('shift up', () => {
  expect(shiftUp(SquareSet.full())).toEqual(SquareSet.full());
  expect(shiftUp(SquareSet.darkSquares())).toEqual(SquareSet.lightSquares());
  expect(shiftUp(SquareSet.fromRank(0))).toEqual(SquareSet.fromRank(1));
  expect(shiftUp(SquareSet.fromRank(7))).toEqual(SquareSet.fromRank(0));
  expect(shiftUp(SquareSet.fromFile(0))).toEqual(SquareSet.fromFile(0));
  expect(shiftUp(SquareSet.fromFile(7))).toEqual(SquareSet.fromFile(7));
});
