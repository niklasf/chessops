import assert from 'node:assert/strict';
import { test } from 'node:test';
import { perft } from './debug.js';
import { makeFen, parseFen } from './fen.js';
import { makeSanAndPlay, parseSan } from './san.js';
import { RULES, Rules } from './types.js';
import { parseUci } from './util.js';
import { Atomic, defaultPosition, isStandardMaterial, setupPosition } from './variant.js';

const skip = 0;

const variantPerfts: [Rules, string, string, number, number, number][] = [
  ['racingkings', 'racingkings-start', '8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - -', 21, 421, 11264],
  ['racingkings', 'occupied-goal', '4brn1/2K2k2/8/8/8/8/8/8 w - -', 6, 33, 178],

  ['crazyhouse', 'zh-all-drop-types', '2k5/8/8/8/8/8/8/4K3[QRBNPqrbnp] w - -', 301, 75353, skip],
  ['crazyhouse', 'zh-drops', '2k5/8/8/8/8/8/8/4K3[Qn] w - -', 67, 3083, 88634],
  [
    'crazyhouse',
    'zh-middlegame',
    'r1bqk2r/pppp1ppp/2n1p3/4P3/1b1Pn3/2NB1N2/PPP2PPP/R1BQK2R[] b KQkq -',
    42,
    1347,
    58057,
  ],
  ['crazyhouse', 'zh-promoted', '4k3/1Q~6/8/8/4b3/8/Kpp5/8/ b - -', 20, 360, 5445],

  ['horde', 'horde-start', 'rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq -', 8, 128, 1274],
  ['horde', 'horde-open-flank', '4k3/pp4q1/3P2p1/8/P3PP2/PPP2r2/PPP5/PPPP4 b - -', 30, 241, 6633],
  ['horde', 'horde-en-passant', 'k7/5p2/4p2P/3p2P1/2p2P2/1p2P2P/p2P2P1/2P2P2 w - -', 13, 172, 2205],

  ['atomic', 'atomic-start', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq -', 20, 400, 8902],
  ['atomic', 'programfox-1', 'rn2kb1r/1pp1p2p/p2q1pp1/3P4/2P3b1/4PN2/PP3PPP/R2QKB1R b KQkq -', 40, 1238, 45237],
  ['atomic', 'programfox-2', 'rn1qkb1r/p5pp/2p5/3p4/N3P3/5P2/PPP4P/R1BQK3 w Qkq -', 28, 833, 23353],
  ['atomic', 'atomic960-castle-1', '8/8/8/8/8/8/2k5/rR4KR w KQ -', 18, 180, 4364],
  ['atomic', 'atomic960-castle-2', 'r3k1rR/5K2/8/8/8/8/8/8 b kq -', 25, 282, 6753],
  ['atomic', 'atomic960-castle-3', 'Rr2k1rR/3K4/3p4/8/8/8/7P/8 w kq -', 21, 465, 10631],
  ['atomic', 'shakmaty-bench', 'rn2kb1r/1pp1p2p/p2q1pp1/3P4/2P3b1/4PN2/PP3PPP/R2QKB1R b KQkq -', 40, 1238, 45237],
  ['atomic', 'near-king-explosion', 'rnbqk2r/pp1p2pp/2p3Nn/5p2/1b2P1PP/8/PPP2P2/R1BQKB1R w KQkq -', 5, 132, 4973],

  ['antichess', 'antichess-start', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - -', 20, 400, 8067],
  ['antichess', 'a-pawn-vs-b-pawn', '8/1p6/8/8/8/8/P7/8 w - -', 2, 4, 4],
  ['antichess', 'a-pawn-vs-c-pawn', '8/2p5/8/8/8/8/P7/8 w - -', 2, 4, 4],

  ['3check', 'kiwipete', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 1+1', 48, 2039, 97848],
  ['3check', 'castling', 'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 1+1', 26, 562, 13410],
];

for (const [rules, name, fen, d1, d2, d3] of variantPerfts) {
  test(`variant perft: ${rules} (${name}): ${fen}`, () => {
    const pos = setupPosition(rules, parseFen(fen).unwrap()).unwrap();
    assert.strictEqual(perft(pos, 1, false), d1);
    if (d2) assert.strictEqual(perft(pos, 2, false), d2);
    if (d3) assert.strictEqual(perft(pos, 3, false), d3);
  });
}

const falseNegative = false;

const insufficientMaterial: [Rules, string, boolean, boolean][] = [
  ['atomic', '8/3k4/8/8/2N5/8/3K4/8 b - -', true, true],
  ['atomic', '8/4rk2/8/8/8/8/3K4/8 w - -', true, true],
  ['atomic', '8/4qk2/8/8/8/8/3K4/8 w - -', true, false],
  ['atomic', '8/1k6/8/2n5/8/3NK3/8/8 b - -', false, false],
  ['atomic', '8/4bk2/8/8/8/8/3KB3/8 w - -', true, true],
  ['atomic', '4b3/5k2/8/8/8/8/3KB3/8 w - -', false, false],
  ['atomic', '3Q4/5kKB/8/8/8/8/8/8 b - -', false, true],
  ['atomic', '8/5k2/8/8/8/8/5K2/4bb2 w - -', true, false],
  ['atomic', '8/5k2/8/8/8/8/5K2/4nb2 w - -', true, false],

  ['antichess', '8/4bk2/8/8/8/8/3KB3/8 w - -', false, false],
  ['antichess', '4b3/5k2/8/8/8/8/3KB3/8 w - -', false, false],
  ['antichess', '8/8/8/6b1/8/3B4/4B3/5B2 w - -', true, true],
  ['antichess', '8/8/5b2/8/8/3B4/3B4/8 w - -', true, false],
  ['antichess', '8/5p2/5P2/8/3B4/1bB5/8/8 b - -', falseNegative, falseNegative],
  ['antichess', '8/8/8/1n2N3/8/8/8/8 w - - 0 32', true, false],
  ['antichess', '8/3N4/8/1n6/8/8/8/8 b - - 1 32', true, false],
  ['antichess', '6n1/8/8/4N3/8/8/8/8 b - - 0 27', false, true],
  ['antichess', '8/8/5n2/4N3/8/8/8/8 w - - 1 28', false, true],
  ['antichess', '8/3n4/8/8/8/8/8/8 w - - 0 29', false, true],

  ['kingofthehill', '8/5k2/8/8/8/8/3K4/8 w - -', false, false],

  ['racingkings', '8/5k2/8/8/8/8/3K4/8 w - -', false, false],

  ['3check', '8/5k2/8/8/8/8/3K4/8 w - - 3+3', true, true],
  ['3check', '8/5k2/8/8/8/8/3K2N1/8 w - - 3+3', false, true],

  ['crazyhouse', '8/5k2/8/8/8/8/3K2N1/8[] w - -', true, true],
  ['crazyhouse', '8/5k2/8/8/8/5B2/3KB3/8[] w - -', false, false],

  ['horde', '8/5k2/8/8/8/4NN2/8/8 w - - 0 1', true, false],
  ['horde', '8/8/8/2B5/p7/kp6/pq6/8 b - - 0 1', false, false],
  ['horde', '8/8/8/2B5/r7/kn6/nr6/8 b - - 0 1', true, false],
  ['horde', '8/8/1N6/rb6/kr6/qn6/8/8 b - - 0 1', false, false],
  ['horde', '8/8/1N6/qq6/kq6/nq6/8/8 b - - 0 1', true, false],
  ['horde', '8/P1P5/8/8/8/8/brqqn3/k7 b - - 0 1', false, false],
  ['horde', '8/1b5r/1P6/1Pk3q1/1PP5/r1P5/P1P5/2P5 b - - 0 52', false, false],
];

for (const [rules, fen, white, black] of insufficientMaterial) {
  test(`${rules} insufficient material: ${fen}`, () => {
    const pos = setupPosition(rules, parseFen(fen).unwrap()).unwrap();
    assert.strictEqual(pos.hasInsufficientMaterial('white'), white);
    assert.strictEqual(pos.hasInsufficientMaterial('black'), black);
  });
}

test('king of the hill not over', () => {
  const pos = setupPosition(
    'kingofthehill',
    parseFen('rnbqkbnr/pppppppp/8/1Q6/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1').unwrap(),
  ).unwrap();
  assert.strictEqual(pos.isInsufficientMaterial(), false);
  assert.strictEqual(pos.isCheck(), false);
  assert.strictEqual(pos.isVariantEnd(), false);
  assert.strictEqual(pos.variantOutcome(), undefined);
  assert.strictEqual(pos.outcome(), undefined);
  assert.strictEqual(pos.isEnd(), false);
});

test('racing kings end', () => {
  // Both players reached the backrank.
  const draw = setupPosition(
    'racingkings',
    parseFen('kr3NK1/1q2R3/8/8/8/5n2/2N5/1rb2B1R w - - 11 14').unwrap(),
  ).unwrap();
  assert.strictEqual(draw.isEnd(), true);
  assert.deepStrictEqual(draw.outcome(), { winner: undefined });

  // White to move is lost because black reached the backrank.
  const black = setupPosition('racingkings', parseFen('1k6/6K1/8/8/8/8/8/8 w - - 0 1').unwrap()).unwrap();
  assert.strictEqual(black.isEnd(), true);
  assert.deepStrictEqual(black.outcome(), { winner: 'black' });

  // Black is given a chance to catch up.
  const pos = setupPosition('racingkings', parseFen('1K6/7k/8/8/8/8/8/8 b - - 0 1').unwrap()).unwrap();
  assert.strictEqual(pos.isEnd(), false);
  assert.strictEqual(pos.outcome(), undefined);

  // Black near backrank but cannot move there.
  const white = setupPosition('racingkings', parseFen('2KR4/k7/2Q5/4q3/8/8/8/2N5 b - - 0 1').unwrap()).unwrap();
  assert.strictEqual(white.isEnd(), true);
  assert.deepStrictEqual(white.outcome(), { winner: 'white' });
});

test('atomic king exploded', () => {
  const pos1 = setupPosition(
    'atomic',
    parseFen('r4b1r/ppp1pppp/7n/8/8/8/PPPPPPPP/RNBQKB1R b KQ - 0 3').unwrap(),
  ).unwrap();
  assert.strictEqual(pos1.isEnd(), true);
  assert.strictEqual(pos1.isVariantEnd(), true);
  assert.deepStrictEqual(pos1.outcome(), { winner: 'white' });

  const pos2 = setupPosition(
    'atomic',
    parseFen('rn5r/pp4pp/2p3Nn/5p2/1b2P1PP/8/PPP2P2/R1B1KB1R b KQ - 0 9').unwrap(),
  ).unwrap();
  assert.strictEqual(pos2.isEnd(), true);
  assert.strictEqual(pos2.isVariantEnd(), true);
  assert.deepStrictEqual(pos2.outcome(), { winner: 'white' });
});

test('3check remaining checks', () => {
  const pos = setupPosition(
    '3check',
    parseFen('rnbqkbnr/ppp1pppp/3p4/8/8/4P3/PPPP1PPP/RNBQKBNR w KQkq - 3+3 0 2').unwrap(),
  ).unwrap();
  pos.play(parseUci('f1b5')!);
  assert.strictEqual(makeFen(pos.toSetup()), 'rnbqkbnr/ppp1pppp/3p4/1B6/8/4P3/PPPP1PPP/RNBQK1NR b KQkq - 2+3 1 2');
});

test('antichess en passant', () => {
  const pos = setupPosition(
    'antichess',
    parseFen('r1bqkbn1/p1ppp3/2n4p/6p1/1Pp5/4P3/P2P1PP1/R1B1K3 b - b3 0 11').unwrap(),
  ).unwrap();
  const move = parseUci('c4b3')!;
  assert.strictEqual(pos.isLegal(move), true);
  const san = parseSan(pos, 'cxb3');
  assert.deepStrictEqual(move, san);
});

test('atomic rooks after explosion', () => {
  const pos = Atomic.default();
  for (
    const san
      of 'e4 d5 d4 e6 Nc3 b5 Bg5 f6 Bh6 Ba3 Bxg7 h5 bxa3 c5 Qc1 Qe7 Qh6 Qg7 Qh8+ Qxh8 Rb1 cxd4 Bxb5 Nd7 Rb7 Kf8 Rxd7 Rb8 Ne2 Rb1+ Nc1 d4 O-O'
        .split(
          ' ',
        )
  ) {
    assert.deepStrictEqual(makeSanAndPlay(pos, parseSan(pos, san)!), san);
  }
});

for (const rules of RULES) {
  test(`${rules} standard material`, () => {
    assert.strictEqual(isStandardMaterial(defaultPosition(rules)), true);
  });
}
