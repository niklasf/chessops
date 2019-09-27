import { rookAttacks } from '../src/attacks';
import { SquareSet } from '../src/squareSet';

test('rook attacks', () => {
  const d6 = 43;
  expect(rookAttacks(d6, new SquareSet(0x2826f5b9, 0x3f7f2880))).toEqual(new SquareSet(0x8000000, 0x83708));
});
