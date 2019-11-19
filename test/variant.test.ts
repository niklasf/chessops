import { Rules } from '../src/types';
import { perft } from '../src/debug';
import { setupPosition } from '../src/variant';
import { parseFen } from '../src/fen';

const variantPerfts: [Rules, string, string, number, number, number][] = [
  ['racingKings', 'racingkings-start', '8/8/8/8/8/8/krbnNBRK/qrbnNBRQ w - -', 21, 421, 11264],
];

test.each(variantPerfts)('variant perft: %s (%s): %s', (rules, name, fen, d1, d2, d3) => {
  const pos = setupPosition(rules, parseFen(fen).unwrap()).unwrap();
  expect(perft(pos, 1, false)).toBe(d1);
  expect(perft(pos, 2, false)).toBe(d2);
  expect(perft(pos, 3, false)).toBe(d3);
});
