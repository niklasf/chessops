import { unwrap } from '../src/fp';
import { Position } from '../src/types';
import { parseFen, INITIAL_FEN} from '../src/fen';
import { setup } from '../src/setup';
import { moveDests } from '../src/dests';

function perft(pos: Position, depth: number): number {
  if (depth == 0) return 1;
  let nodes = 0;
  if (depth == 1) {
    const dests = moveDests(pos);
    for (const from in dests) {
      for (const to of from) {
        nodes += 1;
      }
    }
  }
  return nodes;
}

test('setup initial position', () => {
  const pos = unwrap(setup(unwrap(parseFen(INITIAL_FEN))));
  expect(perft(pos, 1)).toBe(20);
});
