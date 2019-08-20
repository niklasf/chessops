import { Square, Position, Dests } from './types';

export function destsFrom(pos: Position, square: Square): Square[] {
  return [];
}

export function moveDests(pos: Position): Dests {
  const dests: Dests = {};
  for (const square in pos.board) {
    const piece = pos.board[square];
    if (piece && piece.color == pos.turn) dests[square] = destsFrom(pos, square as Square);
  }
  return dests;
}
