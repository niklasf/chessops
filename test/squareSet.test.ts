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
