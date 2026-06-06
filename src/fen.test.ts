import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Board } from './board.js';
import { EMPTY_BOARD_FEN, INITIAL_BOARD_FEN, INITIAL_FEN, makeBoardFen, makeFen, parseFen } from './fen.js';
import { defaultSetup } from './setup.js';
import { SquareSet } from './squareSet.js';

test('make board fen', () => {
  assert.strictEqual(makeBoardFen(Board.default()), INITIAL_BOARD_FEN);
  assert.strictEqual(makeBoardFen(Board.empty()), EMPTY_BOARD_FEN);
});

test('make initial fen', () => {
  assert.strictEqual(makeFen(defaultSetup()), INITIAL_FEN);
});

test('parse initial fen', () => {
  const setup = parseFen(INITIAL_FEN).unwrap();
  assert.deepStrictEqual(setup.board, Board.default());
  assert.strictEqual(setup.pockets, undefined);
  assert.strictEqual(setup.turn, 'white');
  assert.deepStrictEqual(setup.castlingRights, SquareSet.corners());
  assert.strictEqual(setup.epSquare, undefined);
  assert.strictEqual(setup.remainingChecks, undefined);
  assert.strictEqual(setup.halfmoves, 0);
  assert.strictEqual(setup.fullmoves, 1);
});

test('partial fen', () => {
  const setup = parseFen(INITIAL_BOARD_FEN).unwrap();
  assert.deepStrictEqual(setup.board, Board.default());
  assert.strictEqual(setup.pockets, undefined);
  assert.strictEqual(setup.turn, 'white');
  assert.deepStrictEqual(setup.castlingRights, SquareSet.empty());
  assert.strictEqual(setup.epSquare, undefined);
  assert.strictEqual(setup.remainingChecks, undefined);
  assert.strictEqual(setup.halfmoves, 0);
  assert.strictEqual(setup.fullmoves, 1);
});

test('invalid fen', () => {
  assert.ok(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQQKBNR w cq - 0P1').isErr);
  assert.ok(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w  - 0 1').isErr);
  assert.ok(parseFen('4k2r/8/8/8/8/8/8/RR2K2R w KBQk - 0 1').isErr);
});

for (const fen of [
  '8/8/8/8/8/8/8/8 w - - 1+2 12 42',
  '8/8/8/8/8/8/8/8[Q] b - - 0 1',
  'r3k2r/8/8/8/8/8/8/R3K2R[] w Qkq - 0 1',
  'r3kb1r/p1pN1ppp/2p1p3/8/2Pn4/3Q4/PP3PPP/R1B2q~K1[] w kq - 0 1',
  'rQ~q1kb1r/pp2pppp/2p5/8/3P1Bb1/4PN2/PPP3PP/R2QKB1R[NNpn] b KQkq - 0 9',
  'rnb1kbnr/ppp1pppp/2Pp2PP/1P3PPP/PPP1PPPP/PPP1PPPP/PPP1PPP1/PPPqPP2 w kq - 0 1',
  '5b1r/1p5p/4ppp1/4Bn2/1PPP1PP1/4P2P/3k4/4K2R w K - 1 1',
  'rnbqkb1r/p1p1nppp/2Pp4/3P1PP1/PPPPPP1P/PPP1PPPP/PPPnbqkb/PPPPPPPP w ha - 1 6',
  'rnbNRbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQhb - 2 3',
]) {
  test(`parse and make fen: ${fen}`, () => {
    const setup = parseFen(fen).unwrap();
    assert.strictEqual(makeFen(setup), fen);
  });
}
