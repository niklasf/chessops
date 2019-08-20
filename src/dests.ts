import { Square, Position, Dests } from './types';
import { findKing } from './attacks';

export function destsFrom(pos: Position, square: Square): Square[] {
  return [];
}

export function moveDests(pos: Position): Dests {
  const king = findKing(pos.board, pos.turn);

  const dests: Dests = {};
  for (const square in pos.board) {
    const piece = pos.board[square];
    if (piece && piece.color == pos.turn) dests[square] = destsFrom(pos, square as Square);
  }
  return dests;
}
