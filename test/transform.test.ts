import { SquareSet } from '../src/squareSet';
import { flipVertical, flipHorizontal, flipDiagonal, rotate180 } from '../src/transform';

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
