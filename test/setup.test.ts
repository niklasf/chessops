import { unwrap } from '../src/fp';
import { parseFen, INITIAL_FEN, EMPTY_FEN } from '../src/fen';
import { setup } from '../src/setup';

test('setup initial position', () => {
  unwrap(setup(unwrap(parseFen(INITIAL_FEN))));
});

test('setup empty position', () => {
  expect(setup(unwrap(parseFen(EMPTY_FEN))).error).toBeDefined();
});
