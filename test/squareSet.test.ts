import { SquareSet } from '../src/squareSet';

test('full set has all', () => {
  for (let square = 0; square < 64; square++) {
    expect(SquareSet.full().has(square)).toBe(true);
  }
});

test('size', () => {
  let squares = SquareSet.empty();
  for (let i = 0; i < 64; i++) {
    expect(squares.size()).toBe(i);
    squares = squares.with(i);
  }
});

test('shr', () => {
  const r = new SquareSet(0xe0a1222, 0x1e222212);
  expect(r.shr(0)).toEqual(r);
  expect(r.shr(1)).toEqual(new SquareSet(0x7050911, 0xf111109));
  expect(r.shr(3)).toEqual(new SquareSet(0x41c14244, 0x3c44442));
  expect(r.shr(31)).toEqual(new SquareSet(0x3c444424, 0x0));
  expect(r.shr(32)).toEqual(new SquareSet(0x1e222212, 0x0));
  expect(r.shr(33)).toEqual(new SquareSet(0xf111109, 0x0));
  expect(r.shr(62)).toEqual(new SquareSet(0x0, 0x0));
});

test('shl', () => {
  const r = new SquareSet(0xe0a1222, 0x1e222212);
  expect(r.shl(0)).toEqual(r);
  expect(r.shl(1)).toEqual(new SquareSet(0x1c142444, 0x3c444424));
  expect(r.shl(3)).toEqual(new SquareSet(0x70509110, 0xf1111090));
  expect(r.shl(31)).toEqual(new SquareSet(0x0, 0x7050911));
  expect(r.shl(32)).toEqual(new SquareSet(0x0, 0xe0a1222));
  expect(r.shl(33)).toEqual(new SquareSet(0x0, 0x1c142444));
  expect(r.shl(62)).toEqual(new SquareSet(0x0, 0x80000000));
  expect(r.shl(63)).toEqual(new SquareSet(0x0, 0x0));
});

test('plus one', () => {
  expect(SquareSet.empty().plusOne()).toEqual(new SquareSet(1, 0));
  expect(SquareSet.full().plusOne()).toEqual(SquareSet.empty());
  expect(new SquareSet(0xffffffff, 0).plusOne()).toEqual(new SquareSet(0, 1));
});
