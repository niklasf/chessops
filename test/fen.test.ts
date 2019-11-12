import { makeFen, makeBoardFen, INITIAL_FEN, INITIAL_BOARD_FEN, EMPTY_BOARD_FEN } from '../src/fen';
import { Board } from '../src/board';
import { Chess } from '../src/chess';

test('board fen', () => {
  expect(makeBoardFen(Board.default())).toEqual(INITIAL_BOARD_FEN);
  expect(makeBoardFen(Board.empty())).toEqual(EMPTY_BOARD_FEN);
});

test('initial fen', () => {
  expect(makeFen(Chess.default())).toEqual(INITIAL_FEN);
});
