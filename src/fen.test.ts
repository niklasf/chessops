import { expect, test } from '@jest/globals';
import { Board } from './board.js';
import { EMPTY_BOARD_FEN, INITIAL_BOARD_FEN, INITIAL_FEN, makeBoardFen, makeFen, parseFen } from './fen.js';
import { defaultSetup } from './setup.js';
import { SquareSet } from './squareSet.js';

test('make board fen', () => {
  expect(makeBoardFen(Board.default())).toEqual(INITIAL_BOARD_FEN);
  expect(makeBoardFen(Board.empty())).toEqual(EMPTY_BOARD_FEN);
});

test('make initial fen', () => {
  expect(makeFen(defaultSetup())).toEqual(INITIAL_FEN);
});

test('parse initial fen', () => {
  const setup = parseFen(INITIAL_FEN).unwrap();
  expect(setup.board).toEqual(Board.default());
  expect(setup.pockets).toBeUndefined();
  expect(setup.turn).toEqual('white');
  expect(setup.castlingRights).toEqual(SquareSet.corners());
  expect(setup.epSquare).toBeUndefined();
  expect(setup.remainingChecks).toBeUndefined();
  expect(setup.halfmoves).toEqual(0);
  expect(setup.fullmoves).toEqual(1);
});

test('partial fen', () => {
  const setup = parseFen(INITIAL_BOARD_FEN).unwrap();
  expect(setup.board).toEqual(Board.default());
  expect(setup.pockets).toBeUndefined();
  expect(setup.turn).toEqual('white');
  expect(setup.castlingRights).toEqual(SquareSet.empty());
  expect(setup.epSquare).toBeUndefined();
  expect(setup.remainingChecks).toBeUndefined();
  expect(setup.halfmoves).toEqual(0);
  expect(setup.fullmoves).toEqual(1);
});

test('invalid fen', () => {
  expect(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQQKBNR w cq - 0P1').isErr).toBe(true);
  expect(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w  - 0 1').isErr).toBe(true);
  expect(parseFen('4k2r/8/8/8/8/8/8/RR2K2R w KBQk - 0 1').isErr).toBe(true);
});

test.each([
  '8/8/8/8/8/8/8/8 w - - 1+2 12 42',
  '8/8/8/8/8/8/8/8[Q] b - - 0 1',
  'r3k2r/8/8/8/8/8/8/R3K2R[] w Qkq - 0 1',
  'r3kb1r/p1pN1ppp/2p1p3/8/2Pn4/3Q4/PP3PPP/R1B2q~K1[] w kq - 0 1',
  'rQ~q1kb1r/pp2pppp/2p5/8/3P1Bb1/4PN2/PPP3PP/R2QKB1R[NNpn] b KQkq - 0 9',
  'rnb1kbnr/ppp1pppp/2Pp2PP/1P3PPP/PPP1PPPP/PPP1PPPP/PPP1PPP1/PPPqPP2 w kq - 0 1',
  '5b1r/1p5p/4ppp1/4Bn2/1PPP1PP1/4P2P/3k4/4K2R w K - 1 1',
  'rnbqkb1r/p1p1nppp/2Pp4/3P1PP1/PPPPPP1P/PPP1PPPP/PPPnbqkb/PPPPPPPP w ha - 1 6',
  'rnbNRbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQhb - 2 3',
])('parse and make fen', fen => {
  const setup = parseFen(fen).unwrap();
  expect(makeFen(setup)).toEqual(fen);
});
