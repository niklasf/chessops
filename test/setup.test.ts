import { parseFen, INITIAL_FEN } from '../src/fen';
import { setup } from '../src/setup';

test('setup initial position', () => {
  const s = parseFen(INITIAL_FEN);
  expect(s).toBeDefined();
  const pos = setup(s!);
  expect(pos).toBeDefined();
});
