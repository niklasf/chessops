import { Board, Setup, Position, Sq, Colored } from './types';
import { defined, otherColor } from './util';
import { findKing, attacksTo } from './attacks';

export function setup(setup: Setup): Position | undefined {
  const board: Board = {};
  for (const square in setup.board) {
    const piece = setup.board[square];
    if (!piece) continue;
    if (piece.role == 'pawn') {
      const rank: number = square >> 3;
      if (rank == 0 || rank == 7) return; // pawn on backrank
    }
    board[square] = { role: piece.role, color: piece.color }; // discard promoted
  }

  if (!defined(findKing(board, setup.turn))) return;

  // TODO: castling rights?

  // TODO: ep square

  const otherKing = findKing(board, otherColor(setup.turn));
  if (!defined(otherKing)) return;
  if (attacksTo(board, setup.turn, otherKing)) return; // opposite check

  return {
    rules: 'chess',
    board,
    pockets: undefined,
    remainingChecks: undefined,
    ...setup
  };
}
