import { Board, Setup, Position, Sq, Colored } from './types';
import { defined, otherColor } from './util';
import { findKing, attacksTo } from './attacks';

export function setup(setup: Setup): Position | undefined {
  // pawn on backrank
  if (setup.board.some((piece, square) => {
    const rank = square >> 3;
    return piece && piece.role == 'pawn' && (rank == 0 || rank == 7);
  })) return;

  // copy and discard promoted flag
  const board = setup.board.map(piece => piece && { role: piece.role, color: piece.color });

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
