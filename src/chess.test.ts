import { SquareSet } from './squareSet.js';
import { parseUci } from './util.js';
import { parseFen, makeFen, INITIAL_FEN } from './fen.js';
import { Castles, Chess, IllegalSetup, castlingSide, normalizeMove } from './chess.js';
import { perft } from './debug.js';

const tricky: [string, string, number, number, number, number?, number?][] = [
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
  ['king-walk', '8/8/8/B2p3Q/2qPp1P1/b7/2P2PkP/4K2R b K -', 26, 611, 14583, 366807],
  ['a1-check', '4k3/5p2/5p1p/8/rbR5/1N6/5PPP/5K2 b - - 1 29', 22, 580, 12309],

  // https://github.com/ornicar/lila/issues/4625
  [
    'hside-rook-blocks-aside-castling',
    '4rrk1/pbbp2p1/1ppnp3/3n1pqp/3N1PQP/1PPNP3/PBBP2P1/4RRK1 w Ff -',
    42,
    1743,
    71908,
  ],
];

const random: [string, string, number, number, number, number, number][] = [
  ['gentest-1', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -', 20, 400, 8902, 197281, 4865609],
  ['gentest-2', 'rnbqkbnr/pp1ppppp/2p5/8/6P1/2P5/PP1PPP1P/RNBQKBNR b KQkq -', 21, 463, 11138, 274234, 7290026],
  ['gentest-3', 'rnb1kbnr/ppq1pppp/2pp4/8/6P1/2P5/PP1PPPBP/RNBQK1NR w KQkq -', 27, 734, 20553, 579004, 16988496],
  ['gentest-4', 'rnb1kbnr/p1q1pppp/1ppp4/8/4B1P1/2P5/PPQPPP1P/RNB1K1NR b KQkq -', 28, 837, 22536, 699777, 19118920],
  ['gentest-5', 'rn2kbnr/p1q1ppp1/1ppp3p/8/4B1b1/2P4P/PPQPPP2/RNB1K1NR w KQkq -', 29, 827, 24815, 701084, 21819626],
  ['gentest-6', 'rn1qkbnr/p3ppp1/1ppp2Qp/3B4/6b1/2P4P/PP1PPP2/RNB1K1NR b KQkq -', 25, 976, 23465, 872551, 21984216],
  ['gentest-7', 'rnkq1bnr/p3ppp1/1ppp3p/3B4/6b1/2PQ3P/PP1PPP2/RNB1K1NR w KQ -', 36, 957, 33542, 891412, 31155934],
  ['gentest-8', 'rnkq1bnr/p3ppp1/1ppp3p/5b2/8/2PQ3P/PP1PPPB1/RNB1K1NR b KQ -', 29, 927, 25822, 832461, 23480361],
  ['gentest-9', 'rn1q1bnr/p2kppp1/2pp3p/1p3b2/1P6/2PQ3P/P2PPPB1/RNB1K1NR w KQ -', 31, 834, 25926, 715605, 22575950],
  ['gentest-10', 'rn1q1bnr/3kppp1/p1pp3p/1p3b2/1P6/2P2N1P/P1QPPPB1/RNB1K2R b KQ -', 29, 900, 25008, 781431, 22075119],
  ['gentest-94', '2b1kbnB/rppqp3/3p3p/3P1pp1/pnP3P1/PP2P2P/4QP2/RN2KBNR b KQ -', 27, 729, 20665, 613681, 18161673],
  ['gentest-95', '2b1kbnB/r1pqp3/n2p3p/1p1P1pp1/p1P3P1/PP2P2P/Q4P2/RN2KBNR w KQ -', 30, 689, 21830, 556204, 18152100],
  ['gentest-96', '2b1kbn1/r1pqp3/n2p3p/3P1pp1/ppP3P1/PPB1P2P/Q4P2/RN2KBNR b KQ -', 23, 685, 17480, 532817, 14672791],
];

test('castles from setup', () => {
  const setup = parseFen(INITIAL_FEN).unwrap();
  const castles = Castles.fromSetup(setup);

  expect(castles.unmovedRooks).toEqual(SquareSet.corners());

  expect(castles.rook.white.a).toBe(0);
  expect(castles.rook.white.h).toBe(7);
  expect(castles.rook.black.a).toBe(56);
  expect(castles.rook.black.h).toBe(63);

  expect(Array.from(castles.path.white.a)).toEqual([1, 2, 3]);
  expect(Array.from(castles.path.white.h)).toEqual([5, 6]);
  expect(Array.from(castles.path.black.a)).toEqual([57, 58, 59]);
  expect(Array.from(castles.path.black.h)).toEqual([61, 62]);
});

test('play move', () => {
  const pos = Chess.fromSetup(parseFen('8/8/8/5k2/3p4/8/4P3/4K3 w - -').unwrap()).unwrap();

  const kd1 = pos.clone();
  kd1.play({ from: 4, to: 3 });
  expect(makeFen(kd1.toSetup())).toBe('8/8/8/5k2/3p4/8/4P3/3K4 b - - 1 1');

  const e4 = pos.clone();
  e4.play({ from: 12, to: 28 });
  expect(makeFen(e4.toSetup())).toBe('8/8/8/5k2/3pP3/8/8/4K3 b - e3 0 1');
});

test('castling moves', () => {
  let pos = Chess.fromSetup(parseFen('2r5/8/8/8/8/8/6PP/k2KR3 w K -').unwrap()).unwrap();
  let move = { from: 3, to: 4 };
  expect(pos.isLegal(move)).toBe(true);
  pos.play(move);
  expect(makeFen(pos.toSetup())).toBe('2r5/8/8/8/8/8/6PP/k4RK1 b - - 1 1');

  pos = Chess.fromSetup(
    parseFen('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1').unwrap()
  ).unwrap();
  move = { from: 4, to: 0 };
  expect(pos.isLegal(move)).toBe(true);
  pos.play(move);
  expect(makeFen(pos.toSetup())).toBe('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/2KR3R b kq - 1 1');

  pos = Chess.fromSetup(
    parseFen('1r2k2r/p1b1n1pp/1q3p2/1p2pPQ1/4P3/2P4P/1B2B1P1/R3K2R w KQk - 0 20').unwrap()
  ).unwrap();
  const queenSide = { from: 4, to: 0 };
  const altQueenSide = { from: 4, to: 2 };
  expect(castlingSide(pos, queenSide)).toBe('a');
  expect(normalizeMove(pos, queenSide)).toEqual(queenSide);
  expect(pos.isLegal(queenSide)).toBe(true);
  expect(castlingSide(pos, altQueenSide)).toBe('a');
  expect(normalizeMove(pos, altQueenSide)).toEqual(queenSide);
  expect(pos.isLegal(altQueenSide)).toBe(true);
  pos.play(altQueenSide);
  expect(makeFen(pos.toSetup())).toBe('1r2k2r/p1b1n1pp/1q3p2/1p2pPQ1/4P3/2P4P/1B2B1P1/2KR3R b k - 1 20');
});

test('test illegal promotion', () => {
  const pos = Chess.default();
  expect(pos.isLegal({ from: 12, to: 20, promotion: 'queen' })).toBe(false);
});

test('default promotion to queen', () => {
  const pos = Chess.fromSetup(parseFen('4k3/7P/8/8/8/8/8/4K3 w - - 0 1').unwrap()).unwrap();
  const move = { from: 55, to: 63 };
  expect(pos.isLegal(move)).toBe(true);
  pos.play(move);
  expect(makeFen(pos.toSetup())).toBe('4k2Q/8/8/8/8/8/8/4K3 b - - 0 1');
});

test('starting perft', () => {
  const pos = Chess.default();
  expect(perft(pos, 0, false)).toBe(1);
  expect(perft(pos, 1, false)).toBe(20);
  expect(perft(pos, 2, false)).toBe(400);
  expect(perft(pos, 3, false)).toBe(8902);
});

test.each(tricky)('tricky perft: %s: %s', (_, fen, d1, d2, d3) => {
  const pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  expect(perft(pos, 1, false)).toBe(d1);
  expect(perft(pos, 2, false)).toBe(d2);
  expect(perft(pos, 3, false)).toBe(d3);
});

test.each(random)('random perft: %s: %s', (_, fen, d1, d2, d3, d4, d5) => {
  const pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  expect(perft(pos, 1, false)).toBe(d1);
  expect(perft(pos, 2, false)).toBe(d2);
  expect(perft(pos, 3, false)).toBe(d3);
  expect(perft(pos, 4, false)).toBe(d4);
  if (d5 < 100000) expect(perft(pos, 5, false)).toBe(d5);
});

const insufficientMaterial: [string, boolean, boolean][] = [
  ['8/5k2/8/8/8/8/3K4/8 w - - 0 1', true, true],
  ['8/3k4/8/8/2N5/8/3K4/8 b - - 0 1', true, true],
  ['8/4rk2/8/8/8/8/3K4/8 w - - 0 1', true, false],
  ['8/4qk2/8/8/8/8/3K4/8 w - - 0 1', true, false],
  ['8/4bk2/8/8/8/8/3KB3/8 w - - 0 1', false, false],
  ['8/8/3Q4/2bK4/B7/8/1k6/8 w - - 1 68', false, false],
  ['8/5k2/8/8/8/4B3/3K1B2/8 w - - 0 1', true, true],
  ['5K2/8/8/1B6/8/k7/6b1/8 w - - 0 39', true, true],
  ['8/8/8/4k3/5b2/3K4/8/2B5 w - - 0 33', true, true],
  ['3b4/8/8/6b1/8/8/R7/K1k5 w - - 0 1', false, true],
];

test.each(insufficientMaterial)('insufficient material: %s', (fen, white, black) => {
  const pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
  expect(pos.hasInsufficientMaterial('white')).toBe(white);
  expect(pos.hasInsufficientMaterial('black')).toBe(black);
});

test('impossible checker alignment', () => {
  // Multiple checkers aligned with king.
  const r1 = Chess.fromSetup(parseFen('3R4/8/q4k2/2B5/1NK5/3b4/8/8 w - - 0 1').unwrap());
  expect(
    r1.unwrap(
      _ => undefined,
      err => err.message
    )
  ).toEqual(IllegalSetup.ImpossibleCheck);

  // Checkers aligned with opponent king are fine.
  Chess.fromSetup(parseFen('8/8/5k2/p1q5/PP1rp1P1/3P1N2/2RK1r2/5nN1 w - - 0 3').unwrap()).unwrap();

  // En passant square aligned with checker and king.
  const r2 = Chess.fromSetup(parseFen('8/8/8/1k6/3Pp3/8/8/4KQ2 b - d3 0 1').unwrap());
  expect(
    r2.unwrap(
      _ => undefined,
      err => err.message
    )
  ).toEqual(IllegalSetup.ImpossibleCheck);
});

test('king captures unmoved rook', () => {
  const pos = Chess.fromSetup(parseFen('8/8/8/B2p3Q/2qPp1P1/b7/2P2PkP/4K2R b K - 0 1').unwrap()).unwrap();
  const move = parseUci('g2h1')!;
  expect(move).toEqual({ from: 14, to: 7 });
  expect(pos.isLegal(move)).toBe(true);
  pos.play(move);
  expect(makeFen(pos.toSetup())).toBe('8/8/8/B2p3Q/2qPp1P1/b7/2P2P1P/4K2k w - - 0 2');
});

test('en passant and unrelated check', () => {
  const setup = parseFen('rnbqk1nr/bb3p1p/1q2r3/2pPp3/3P4/7P/1PP1NpPP/R1BQKBNR w KQkq c6').unwrap();
  expect(
    Chess.fromSetup(setup).unwrap(
      _ => undefined,
      err => err.message
    )
  ).toEqual(IllegalSetup.ImpossibleCheck);
  const pos = Chess.fromSetup(setup, { ignoreImpossibleCheck: true }).unwrap();
  const enPassant = parseUci('d5c6')!;
  expect(pos.isLegal(enPassant)).toBe(false);
});
