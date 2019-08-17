import { parseFen, INITIAL_FEN, EMPTY_FEN } from '../src/fen';
import { setup } from '../src/setup';

test('setup initial position', () => {
  expect(setup(parseFen(INITIAL_FEN)!)).toBeDefined();
});

test('setup empty position', () => {
  expect(setup(parseFen(EMPTY_FEN)!)).toBeUndefined();
});
