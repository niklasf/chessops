import { parseFen, INITIAL_FEN } from '../src/fen';
import { Castles, Chess } from '../src/chess';

const tricky: [string, string, number, number, number][] = [
  ['pos-2', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -', 48, 2039, 97862]
];

function perft1(pos: Chess) {
  const dests = pos.allDests();
  let nodes = 0;
  for (const sq in dests) nodes += dests[sq].size();
  return nodes;
}

test('castles from setup', () => {
  const setup = parseFen(INITIAL_FEN);
  const castles = Castles.fromSetup(setup);
  expect(castles.rook.white.a).toBe(0);
  expect(castles.rook.white.h).toBe(7);
  expect(castles.rook.black.a).toBe(56);
  expect(castles.rook.black.h).toBe(63);
});

test.each(tricky)('tricky perft: %s: %s', (_, fen, d1) => {
  const setup = parseFen(fen);
  const pos = Chess.fromSetup(setup);
  expect(perft1(pos)).toBe(d1);
});
