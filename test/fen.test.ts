import { parseFen, makeFen, makeBoardFen, INITIAL_FEN, INITIAL_BOARD_FEN, EMPTY_BOARD_FEN, FenError } from '../src/fen';
import { SquareSet } from '../src/squareSet';
import { Board } from '../src/board';
import { defaultSetup } from '../src/setup';

test('make board fen', () => {
  expect(makeBoardFen(Board.default())).toEqual(INITIAL_BOARD_FEN);
  expect(makeBoardFen(Board.empty())).toEqual(EMPTY_BOARD_FEN);
  expect(makeBoardFen(Board.racingKings())).toEqual('8/8/8/8/8/8/krbnNBRK/qrbnNBRQ');
  expect(makeBoardFen(Board.horde())).toEqual('rnbqkbnr/pppppppp/8/1PP2PP1/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP');
});

test('make initial fen', () => {
  expect(makeFen(defaultSetup())).toEqual(INITIAL_FEN);
});

test('parse initial fen', () => {
  const setup = parseFen(INITIAL_FEN).unwrap();
  expect(setup.board).toEqual(Board.default());
  expect(setup.pockets).toBeUndefined();
  expect(setup.turn).toEqual('white');
  expect(setup.unmovedRooks).toEqual(SquareSet.corners());
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
  expect(setup.unmovedRooks).toEqual(SquareSet.empty());
  expect(setup.epSquare).toBeUndefined();
  expect(setup.remainingChecks).toBeUndefined();
  expect(setup.halfmoves).toEqual(0);
  expect(setup.fullmoves).toEqual(1);
});

test.each([
  '8/8/8/8/8/8/8/8 w - - 1+2 12 42',
  '8/8/8/8/8/8/8/8[Q] b - - 0 1',
  'r3k2r/8/8/8/8/8/8/R3K2R[] w Qkq - 0 1',
  'r3kb1r/p1pN1ppp/2p1p3/8/2Pn4/3Q4/PP3PPP/R1B2q~K1[] w kq - 0 1',
  'rnb1kbnr/ppp1pppp/2Pp2PP/1P3PPP/PPP1PPPP/PPP1PPPP/PPP1PPP1/PPPqPP2 w kq - 0 1',
  '5b1r/1p5p/4ppp1/4Bn2/1PPP1PP1/4P2P/3k4/4K2R w K - 1 1',
])('parse and make fen', (fen) => {
  const setup = parseFen(fen).unwrap();
  expect(makeFen(setup, { promoted: true })).toEqual(fen);
});
