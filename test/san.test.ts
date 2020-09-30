import { parseUci } from '../src/util';
import { makeSan, makeSanVariation, parseSan } from '../src/san';
import { Chess } from '../src/chess';
import { parseFen, makeFen } from '../src/fen';
import { Antichess, Crazyhouse } from '../src/variant';

test('make variation with king move', () => {
  const pos = Chess.default();
  const variation = 'e2e4 e7e5 e1e2'.split(' ').map(uci => parseUci(uci)!);
  expect(makeSanVariation(pos, variation)).toBe('1. e4 e5 2. Ke2');
  expect(pos).toEqual(Chess.default());
});

test('make crazyhouse variation', () => {
  const setup = parseFen('r4b1N~/1ppk1P2/p1b5/6p1/8/1PBPPq2/P1PR1P2/1K4N1/PNBRPPPrqnn b - - 71 36').unwrap();
  const pos = Crazyhouse.fromSetup(setup).unwrap();
  const variation = 'N@a3 b1b2 R@b1'.split(' ').map(uci => parseUci(uci)!);
  expect(makeSanVariation(pos, variation)).toBe('36... N@a3+ 37. Kb2 R@b1#');
  expect(pos).toEqual(Crazyhouse.fromSetup(setup).unwrap());
});

test('make stockfish line with many knight moves', () => {
  const setup = parseFen('2rq1rk1/pb1nbp1p/1pn3p1/3pP3/2pP4/1N3NPQ/PP3PBP/R1B1R1K1 w - - 0 16').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const variation = 'b3d2 c6b4 e1d1 f8e8 d2f1 b4d3 f3e1 d3e1 d1e1 d7f8 f2f4 f8e6 c1e3 h7h5 f4f5 e6g5 e3g5 e7g5 f5f6 d8c7'.split(' ').map(uci => parseUci(uci)!);
  expect(makeSanVariation(pos, variation)).toBe('16. Nbd2 Nb4 17. Rd1 Re8 18. Nf1 Nd3 19. Ne1 Nxe1 20. Rxe1 Nf8 21. f4 Ne6 22. Be3 h5 23. f5 Ng5 24. Bxg5 Bxg5 25. f6 Qc7');
  expect(pos).toEqual(Chess.fromSetup(setup).unwrap());
});

test('make en passant', () => {
  const setup = parseFen('6bk/7b/8/3pP3/8/8/8/Q3K3 w - d6 0 2').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const move = parseUci('e5d6')!;
  expect(makeSan(pos, move)).toBe('exd6#');
});

test('parse basic san', () => {
  const pos = Chess.default();
  expect(parseSan(pos, 'e4')).toEqual(parseUci('e2e4'));
  expect(parseSan(pos, 'Nf3')).toEqual(parseUci('g1f3'));
  expect(parseSan(pos, 'Nf6')).toBeUndefined();
  expect(parseSan(pos, 'Ke2')).toBeUndefined();
  expect(parseSan(pos, 'O-O')).toBeUndefined();
  expect(parseSan(pos, 'O-O-O')).toBeUndefined();
  expect(parseSan(pos, 'Q@e3')).toBeUndefined();
});

test('parse fools mate', () => {
  const pos = Chess.default();
  const line = ['e4', 'e5', 'Qh5', 'Nf6', 'Bc4', 'Nc6', 'Qxf7#'];
  for (const san of line) pos.play(parseSan(pos, san)!);
  expect(pos.isCheckmate()).toBe(true);
});

test('parse pawn capture', () => {
  let pos = Chess.default();
  const line = ['e4', 'd5', 'c4', 'Nf6', 'exd5'];
  for (const san of line) pos.play(parseSan(pos, san)!);
  expect(makeFen(pos.toSetup())).toBe('rnbqkb1r/ppp1pppp/5n2/3P4/2P5/8/PP1P1PPP/RNBQKBNR b KQkq - 0 3');

  pos = Chess.fromSetup(parseFen('r4br1/pp1Npkp1/2P4p/5P2/6P1/5KnP/PP6/R1B5 b - -').unwrap()).unwrap();
  const bxc6 = parseSan(pos, 'bxc6');
  expect(parseSan(pos, 'bxc6')).toEqual({from: 49, to: 42});
});

test('parse antichess', () => {
  const pos = Antichess.default();
  const line = [
    'g3', 'Nh6', 'g4', 'Nxg4', 'b3', 'Nxh2', 'Rxh2', 'g5', 'Rxh7', 'Rxh7',
    'Bh3', 'Rxh3', 'Nxh3', 'Na6', 'Nxg5', 'Nb4', 'Nxf7', 'Nxc2', 'Qxc2', 'Kxf7',
    'Qxc7', 'Qxc7', 'a4', 'Qxc1', 'Ra3', 'Qxa3', 'Nxa3', 'b5', 'Nxb5', 'Rb8',
    'Nxa7', 'Rxb3', 'Nxc8', 'Rg3', 'Nxe7', 'Bxe7', 'fxg3', 'Bh4', 'gxh4', 'd5',
    'e4', 'dxe4', 'd3', 'exd3', 'Kf1', 'd2', 'Kg1', 'Kf6', 'a5', 'Ke6', 'a6',
    'Kd7', 'a7', 'Kc7', 'h5',  'd1=B', 'a8=B', 'Bxh5', 'Bf3', 'Bxf3', 'Kg2',
    'Bxg2#',
  ];
  for (const san of line) pos.play(parseSan(pos, san)!);
  expect(makeFen(pos.toSetup())).toBe('8/2k5/8/8/8/8/6b1/8 w - - 0 32');
});

test('parse crazyhouse', () => {
  const pos = Crazyhouse.default();
  const line = [
    'd4', 'd5', 'Nc3', 'Bf5', 'e3', 'e6', 'Bd3', 'Bg6', 'Nf3', 'Bd6', 'O-O',
    'Ne7', 'g3', 'Nbc6', 'Re1', 'O-O', 'Ne2', 'e5', 'dxe5', 'Nxe5', 'Nxe5',
    'Bxe5', 'f4', 'N@f3+', 'Kg2', 'Nxe1+', 'Qxe1', 'Bd6', '@f3', '@e4', 'fxe4',
    'dxe4', 'Bc4', '@f3+', 'Kf2', 'fxe2', 'Qxe2', 'N@h3+', 'Kg2', 'R@f2+',
    'Qxf2', 'Nxf2', 'Kxf2', 'Q@f3+', 'Ke1', 'Bxf4', 'gxf4', 'Qdd1#',
  ];
  for (const san of line) pos.play(parseSan(pos, san)!);
  expect(makeFen(pos.toSetup())).toBe('r4rk1/ppp1nppp/6b1/8/2B1pP2/4Pq2/PPP4P/R1BqK3[PPNNNBRp] w - - 1 25');
});
