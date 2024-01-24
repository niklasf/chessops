import { expect, test } from '@jest/globals';
import { Board, boardEquals } from './board.js';
import { Piece } from './types.js';

test('set and get', () => {
  const emptyBoard = Board.empty();
  expect(emptyBoard.getColor(0)).toBeUndefined();
  expect(emptyBoard.getRole(0)).toBeUndefined();
  expect(emptyBoard.has(0)).toBe(false);
  expect(emptyBoard.get(0)).toBeUndefined();
  expect(boardEquals(emptyBoard, emptyBoard.clone())).toBe(true);

  const board = emptyBoard.clone();
  const piece: Piece = { role: 'knight', color: 'black', promoted: false };
  expect(board.set(0, piece)).toBeUndefined();
  expect(board.getColor(0)).toBe('black');
  expect(board.getRole(0)).toBe('knight');
  expect(board.has(0)).toBe(true);
  expect(board.get(0)).toEqual(piece);
  expect(boardEquals(board, board.clone())).toBe(true);
  expect(boardEquals(emptyBoard, board)).toBe(false);
});
