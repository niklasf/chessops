import { Rules } from '../src/types';
import { perft } from '../src/debug';
import { setupPosition } from '../src/variant';
import { parseFen } from '../src/fen';

const skip = 0;

const variantPerfts: [Rules, string, string, number, number, number][] = [
  ['racingKings', 'racingkings-start', '8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - -', 21, 421, 11264],

  ['crazyhouse', 'zh-all-drop-types', '2k5/8/8/8/8/8/8/4K3[QRBNPqrbnp] w - -', 301, 75353, skip],
  ['crazyhouse', 'zh-drops', '2k5/8/8/8/8/8/8/4K3[Qn] w - -', 67, 3083, 88634],
  ['crazyhouse', 'zh-middlegame', 'r1bqk2r/pppp1ppp/2n1p3/4P3/1b1Pn3/2NB1N2/PPP2PPP/R1BQK2R[] b KQkq -', 42, 1347, 58057],

  ['horde', 'horde-start', 'rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP w kq -', 8, 128, 1274],
  ['horde', 'horde-open-flank', '4k3/pp4q1/3P2p1/8/P3PP2/PPP2r2/PPP5/PPPP4 b - -', 30, 241, 6633],
  ['horde', 'horde-en-passant', 'k7/5p2/4p2P/3p2P1/2p2P2/1p2P2P/p2P2P1/2P2P2 w - -', 13, 172, 2205],
];

test.each(variantPerfts)('variant perft: %s (%s): %s', (rules, name, fen, d1, d2, d3) => {
  const pos = setupPosition(rules, parseFen(fen).unwrap()).unwrap();
  expect(perft(pos, 1, false)).toBe(d1);
  if (d2) expect(perft(pos, 2, false)).toBe(d2);
  if (d3) expect(perft(pos, 3, false)).toBe(d3);
});
