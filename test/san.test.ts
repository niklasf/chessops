import { parseUci } from '../src/util';
import { makeSan, makeSanVariation, parseSan } from '../src/san';
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

test('stockfish line with many knight moves', () => {
  const setup = parseFen('2rq1rk1/pb1nbp1p/1pn3p1/3pP3/2pP4/1N3NPQ/PP3PBP/R1B1R1K1 w - - 0 16').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const variation = 'b3d2 c6b4 e1d1 f8e8 d2f1 b4d3 f3e1 d3e1 d1e1 d7f8 f2f4 f8e6 c1e3 h7h5 f4f5 e6g5 e3g5 e7g5 f5f6 d8c7'.split(' ').map(uci => parseUci(uci)!);
  expect(makeSanVariation(pos, variation)).toBe('16. Nbd2 Nb4 17. Rd1 Re8 18. Nf1 Nd3 19. Ne1 Nxe1 20. Rxe1 Nf8 21. f4 Ne6 22. Be3 h5 23. f5 Ng5 24. Bxg5 Bxg5 25. f6 Qc7');
  expect(pos).toEqual(Chess.fromSetup(setup).unwrap());
});

test('en passant', () => {
  const setup = parseFen('6bk/7b/8/3pP3/8/8/8/Q3K3 w - d6 0 2').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const move = parseUci('e5d6')!;
  expect(makeSan(pos, move)).toBe('exd6#');
});

test('parse', () => {
  const pos = Chess.default();
  expect(parseSan(pos, 'e4')).toEqual(parseUci('e2e4'));
  expect(parseSan(pos, 'Nf3')).toEqual(parseUci('g1f3'));
  expect(parseSan(pos, 'Nf6')).toBeUndefined();
  expect(parseSan(pos, 'Ke2')).toBeUndefined();
  expect(parseSan(pos, 'O-O')).toBeUndefined();
  expect(parseSan(pos, 'O-O-O')).toBeUndefined();
  expect(parseSan(pos, 'Q@e3')).toBeUndefined();
});
