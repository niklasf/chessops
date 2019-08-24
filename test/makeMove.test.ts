import { unwrap } from '../src/fp';
import { parseFen, makeFen, INITIAL_FEN } from '../src/fen';
import { setup } from '../src/setup';
import { makeMove } from '../src/makeMove';

test('setup initial position', () => {
  // TODO: reconsider ep squares
  const pos = unwrap(setup(unwrap(parseFen(INITIAL_FEN))));
  makeMove(pos, 'e2e4');
  expect(makeFen(pos)).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
  makeMove(pos, 'e7e5');
  expect(makeFen(pos)).toBe('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');
});
