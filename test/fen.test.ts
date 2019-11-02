import { makeBoardFen, INITIAL_BOARD_FEN, EMPTY_BOARD_FEN } from '../src/fen';
import { Board } from '../src/board';

test('board fen', () => {
  expect(makeBoardFen(Board.default())).toEqual(INITIAL_BOARD_FEN);
  expect(makeBoardFen(Board.empty())).toEqual(EMPTY_BOARD_FEN);
});
