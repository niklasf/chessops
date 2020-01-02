import { parseUci } from '../src/util';
import { makeSanVariation } from '../src/san';
import { Chess } from '../src/chess';
import { parseFen } from '../src/fen';
import { Crazyhouse } from '../src/variant';

test('variation with king move', () => {
  const pos = Chess.default();
  const variation = 'e2e4 e7e5 e1e2'.split(' ').map(uci => parseUci(uci)!);
  expect(makeSanVariation(pos, variation)).toBe('1. e4 e5 2. Ke2');
  expect(pos).toEqual(Chess.default());
});

test('crazyhouse variation', () => {
  const setup = parseFen('r4b1N~/1ppk1P2/p1b5/6p1/8/1PBPPq2/P1PR1P2/1K4N1/PNBRPPPrqnn b - - 71 36').unwrap();
  const pos = Crazyhouse.fromSetup(setup).unwrap();
  const variation = 'N@a3 b1b2 R@b1'.split(' ').map(uci => parseUci(uci)!);
  expect(makeSanVariation(pos, variation)).toBe('36... N@a3+ 37. Kb2 R@b1#');
  expect(pos).toEqual(Crazyhouse.fromSetup(setup).unwrap());
});
