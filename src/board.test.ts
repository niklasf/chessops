import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Board, boardEquals } from './board.js';
import { Piece } from './types.js';

test('set and get', () => {
  const emptyBoard = Board.empty();
  assert.strictEqual(emptyBoard.getColor(0), undefined);
  assert.strictEqual(emptyBoard.getRole(0), undefined);
  assert.strictEqual(emptyBoard.has(0), false);
  assert.strictEqual(emptyBoard.get(0), undefined);
  assert.ok(boardEquals(emptyBoard, emptyBoard.clone()));

  const board = emptyBoard.clone();
  const piece: Piece = { role: 'knight', color: 'black', promoted: false };
  assert.strictEqual(board.set(0, piece), undefined);
  assert.strictEqual(board.getColor(0), 'black');
  assert.strictEqual(board.getRole(0), 'knight');
  assert.strictEqual(board.has(0), true);
  assert.deepStrictEqual(board.get(0), piece);
  assert.ok(boardEquals(board, board.clone()));
  assert.strictEqual(boardEquals(emptyBoard, board), false);
});
