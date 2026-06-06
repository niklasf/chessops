import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Chess } from './chess.js';
import { makeFen, parseFen } from './fen.js';
import { makeSan, makeSanVariation, parseSan } from './san.js';
import { parseUci } from './util.js';
import { Antichess, Crazyhouse } from './variant.js';
import { NormalMove } from './types.js';

test('make variation with king move', () => {
  const pos = Chess.default();
  const variation = 'e2e4 e7e5 e1e2'.split(' ').map(uci => parseUci(uci)!);
  assert.strictEqual(makeSanVariation(pos, variation), '1. e4 e5 2. Ke2');
  assert.deepStrictEqual(pos, Chess.default());
});

test('make crazyhouse variation', () => {
  const setup = parseFen('r4b1N~/1ppk1P2/p1b5/6p1/8/1PBPPq2/P1PR1P2/1K4N1/PNBRPPPrqnn b - - 71 36').unwrap();
  const pos = Crazyhouse.fromSetup(setup).unwrap();
  const variation = 'N@a3 b1b2 R@b1'.split(' ').map(uci => parseUci(uci)!);
  assert.strictEqual(makeSanVariation(pos, variation), '36... N@a3+ 37. Kb2 R@b1#');
  assert.deepStrictEqual(pos, Crazyhouse.fromSetup(setup).unwrap());
});

test('make stockfish line with many knight moves', () => {
  const setup = parseFen('2rq1rk1/pb1nbp1p/1pn3p1/3pP3/2pP4/1N3NPQ/PP3PBP/R1B1R1K1 w - - 0 16').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const variation =
    'b3d2 c6b4 e1d1 f8e8 d2f1 b4d3 f3e1 d3e1 d1e1 d7f8 f2f4 f8e6 c1e3 h7h5 f4f5 e6g5 e3g5 e7g5 f5f6 d8c7'
      .split(' ')
      .map(uci => parseUci(uci)!);
  assert.strictEqual(
    makeSanVariation(pos, variation),
    '16. Nbd2 Nb4 17. Rd1 Re8 18. Nf1 Nd3 19. Ne1 Nxe1 20. Rxe1 Nf8 21. f4 Ne6 22. Be3 h5 23. f5 Ng5 24. Bxg5 Bxg5 25. f6 Qc7',
  );
  assert.deepStrictEqual(pos, Chess.fromSetup(setup).unwrap());
});

test('make en passant', () => {
  const setup = parseFen('6bk/7b/8/3pP3/8/8/8/Q3K3 w - d6 0 2').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const move = parseUci('e5d6')!;
  assert.strictEqual(makeSan(pos, move), 'exd6#');
});

test('parse basic san', () => {
  const pos = Chess.default();
  assert.deepStrictEqual(parseSan(pos, 'e4'), parseUci('e2e4'));
  assert.deepStrictEqual(parseSan(pos, 'Nf3'), parseUci('g1f3'));
  assert.strictEqual(parseSan(pos, 'Nf6'), undefined);
  assert.strictEqual(parseSan(pos, 'Ke2'), undefined);
  assert.strictEqual(parseSan(pos, 'O-O'), undefined);
  assert.strictEqual(parseSan(pos, 'O-O-O'), undefined);
  assert.strictEqual(parseSan(pos, 'Q@e3'), undefined);
});

test('parse fools mate', () => {
  const pos = Chess.default();
  const line = ['e4', 'e5', 'Qh5', 'Nf6', 'Bc4', 'Nc6', 'Qxf7#'];
  for (const san of line) pos.play(parseSan(pos, san)!);
  assert.strictEqual(pos.isCheckmate(), true);
});

test('parse pawn capture', () => {
  let pos = Chess.default();
  const line = ['e4', 'd5', 'c4', 'Nf6', 'exd5'];
  for (const san of line) pos.play(parseSan(pos, san)!);
  assert.strictEqual(makeFen(pos.toSetup()), 'rnbqkb1r/ppp1pppp/5n2/3P4/2P5/8/PP1P1PPP/RNBQKBNR b KQkq - 0 3');

  pos = Chess.fromSetup(parseFen('r4br1/pp1Npkp1/2P4p/5P2/6P1/5KnP/PP6/R1B5 b - -').unwrap()).unwrap();
  const bxc6 = parseSan(pos, 'bxc6') as NormalMove;
  assert.strictEqual(bxc6.from, 49);
  assert.strictEqual(bxc6.to, 42);
  assert.strictEqual(bxc6.promotion, undefined);

  pos = Chess.fromSetup(parseFen('2rq1rk1/pb2bppp/1p2p3/n1ppPn2/2PP4/PP3N2/1B1NQPPP/RB3RK1 b - -').unwrap()).unwrap();
  assert.strictEqual(parseSan(pos, 'c4'), undefined);
});

test('parse antichess', () => {
  const pos = Antichess.default();
  const line = [
    'g3',
    'Nh6',
    'g4',
    'Nxg4',
    'b3',
    'Nxh2',
    'Rxh2',
    'g5',
    'Rxh7',
    'Rxh7',
    'Bh3',
    'Rxh3',
    'Nxh3',
    'Na6',
    'Nxg5',
    'Nb4',
    'Nxf7',
    'Nxc2',
    'Qxc2',
    'Kxf7',
    'Qxc7',
    'Qxc7',
    'a4',
    'Qxc1',
    'Ra3',
    'Qxa3',
    'Nxa3',
    'b5',
    'Nxb5',
    'Rb8',
    'Nxa7',
    'Rxb3',
    'Nxc8',
    'Rg3',
    'Nxe7',
    'Bxe7',
    'fxg3',
    'Bh4',
    'gxh4',
    'd5',
    'e4',
    'dxe4',
    'd3',
    'exd3',
    'Kf1',
    'd2',
    'Kg1',
    'Kf6',
    'a5',
    'Ke6',
    'a6',
    'Kd7',
    'a7',
    'Kc7',
    'h5',
    'd1=B',
    'a8=B',
    'Bxh5',
    'Bf3',
    'Bxf3',
    'Kg2',
    'Bxg2#',
  ];
  for (const san of line) pos.play(parseSan(pos, san)!);
  assert.strictEqual(makeFen(pos.toSetup()), '8/2k5/8/8/8/8/6b1/8 w - - 0 32');
});

test('parse crazyhouse', () => {
  const pos = Crazyhouse.default();
  const line = [
    'd4',
    'd5',
    'Nc3',
    'Bf5',
    'e3',
    'e6',
    'Bd3',
    'Bg6',
    'Nf3',
    'Bd6',
    'O-O',
    'Ne7',
    'g3',
    'Nbc6',
    'Re1',
    'O-O',
    'Ne2',
    'e5',
    'dxe5',
    'Nxe5',
    'Nxe5',
    'Bxe5',
    'f4',
    'N@f3+',
    'Kg2',
    'Nxe1+',
    'Qxe1',
    'Bd6',
    '@f3',
    '@e4',
    'fxe4',
    'dxe4',
    'Bc4',
    '@f3+',
    'Kf2',
    'fxe2',
    'Qxe2',
    'N@h3+',
    'Kg2',
    'R@f2+',
    'Qxf2',
    'Nxf2',
    'Kxf2',
    'Q@f3+',
    'Ke1',
    'Bxf4',
    'gxf4',
    'Qdd1#',
  ];
  for (const san of line) pos.play(parseSan(pos, san)!);
  assert.strictEqual(makeFen(pos.toSetup()), 'r4rk1/ppp1nppp/6b1/8/2B1pP2/4Pq2/PPP4P/R1BqK3[PPNNNBRp] w - - 1 25');
});

test('overspecified pawn move', () => {
  const pos = Chess.default();
  const e4 = parseSan(pos, '2e4') as NormalMove;
  assert.strictEqual(e4.from, 12);
  assert.strictEqual(e4.to, 28);
  assert.strictEqual(e4.promotion, undefined);
});

for (const [fen, uci, san] of [
  ['N3k2N/8/8/3N4/N4N1N/2R5/1R6/4K3 w - -', 'e1f1', 'Kf1'],
  ['N3k2N/8/8/3N4/N4N1N/2R5/1R6/4K3 w - -', 'c3c2', 'Rcc2'],
  ['N3k2N/8/8/3N4/N4N1N/2R5/1R6/4K3 w - -', 'b2c2', 'Rbc2'],
  ['N3k2N/8/8/3N4/N4N1N/2R5/1R6/4K3 w - -', 'a4b6', 'N4b6'],
  ['N3k2N/8/8/3N4/N4N1N/2R5/1R6/4K3 w - -', 'h8g6', 'N8g6'],
  ['N3k2N/8/8/3N4/N4N1N/2R5/1R6/4K3 w - -', 'h4g6', 'Nh4g6'],
  ['8/2KN1p2/5p2/3N1B1k/5PNp/7P/7P/8 w - -', 'd5f6', 'N5xf6#'],
  ['8/8/8/R2nkn2/8/8/2K5/8 b - -', 'f5e3', 'Ne3+'],
  ['7k/1p2Npbp/8/2P5/1P1r4/3b2QP/3q1pPK/2RB4 b - -', 'f2f1q', 'f1=Q'],
  ['7k/1p2Npbp/8/2P5/1P1r4/3b2QP/3q1pPK/2RB4 b - -', 'f2f1n', 'f1=N+'],
] as [string, string, string][]) {
  test(`disambiguation: ${uci}`, () => {
    const pos = Chess.fromSetup(parseFen(fen).unwrap()).unwrap();
    const move = parseUci(uci)!;
    assert.strictEqual(makeSan(pos, move), san);
  });
}
