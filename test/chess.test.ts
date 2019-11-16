import { SquareSet } from '../src/squareSet';
import { parseFen, INITIAL_FEN } from '../src/fen';
import { Castles, Chess } from '../src/chess';

const tricky: [string, string, number, number?, number?, number?, number?][] = [
  ['pos-2', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq -', 48, 2039, 97862], // Kiwipete by Peter McKenzie
  ['pos-3', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - -', 14, 191, 2812, 43238],
  ['pos-4', 'r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ -', 6, 264, 9467],
  ['pos-5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ -', 44, 1486, 62379], // http://www.talkchess.com/forum/viewtopic.php?t=42463
  ['pos-6', 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - -', 46, 2079, 89890], // By Steven Edwards

  // http://www.talkchess.com/forum/viewtopic.php?t=55274
  ['xfen-00', 'r1k1r2q/p1ppp1pp/8/8/8/8/P1PPP1PP/R1K1R2Q w KQkq -', 23, 522, 12333, 285754],
  ['xfen-01', 'r1k2r1q/p1ppp1pp/8/8/8/8/P1PPP1PP/R1K2R1Q w KQkq -', 28, 738, 20218, 541480],
  ['xfen-02', '8/8/8/4B2b/6nN/8/5P2/2R1K2k w Q -', 34, 318, 9002, 118388],
  ['xfen-03', '2r5/8/8/8/8/8/6PP/k2KR3 w K -', 17, 242, 3931, 57700],
  ['xfen-04', '4r3/3k4/8/8/8/8/6PP/qR1K1R2 w KQ -', 19, 628, 12858, 405636],

  // Regression tests
  ['ep-evasion', '8/8/8/5k2/3p4/8/4P3/4K3 w - -', 6, 54, 343, 2810, 19228],
  ['prison', '2b5/kpPp4/1p1P4/1P6/6p1/4p1P1/4PpPK/5B2 w - -', 1, 1, 1],

  // https://github.com/ornicar/lila/issues/4625
  ['hside-rook-blocks-aside-castling', '4rrk1/pbbp2p1/1ppnp3/3n1pqp/3N1PQP/1PPNP3/PBBP2P1/4RRK1 w Ff -', 42, 1743, 71908],
];

function perft1(pos: Chess) {
  const dests = pos.allDests();
  let nodes = 0;
  for (const [from, to] of dests) {
    nodes += to.size();

    // promotion
    if (pos.board.pawn.has(from)) {
      const backrank = SquareSet.fromRank(pos.turn == 'white' ? 7 : 0);
      nodes += to.intersect(backrank).size() * 3;
    }
  }
  return nodes;
}

test('castles from setup', () => {
  const setup = parseFen(INITIAL_FEN);
  const castles = Castles.fromSetup(setup);

  expect(castles.unmovedRooks).toEqual(SquareSet.corners());

  expect(castles.rook.white.a).toBe(0);
  expect(castles.rook.white.h).toBe(7);
  expect(castles.rook.black.a).toBe(56);
  expect(castles.rook.black.h).toBe(63);

  expect(castles.path.white.a.toArray()).toEqual([1, 2, 3]);
  expect(castles.path.white.h.toArray()).toEqual([5, 6]);
  expect(castles.path.black.a.toArray()).toEqual([57, 58, 59]);
  expect(castles.path.black.h.toArray()).toEqual([61, 62]);
});

test.each(tricky)('tricky perft: %s: %s', (_, fen, d1) => {
  const setup = parseFen(fen);
  const pos = Chess.fromSetup(setup);
  expect(perft1(pos)).toBe(d1);
});
