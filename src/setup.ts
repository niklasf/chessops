import { Board, Setup, Position, Sq, Colored } from './types';
import { defined, otherColor, fail } from './util';
import { findKing, attacksTo } from './attacks';

export function setup(setup: Setup): Position | undefined {
  console.log('----');
  // pawn on backrank
  if (setup.board.some((piece, square) => {
    const rank = square >> 3;
    return piece && piece.role == 'pawn' && (rank == 0 || rank == 7);
  })) return fail('pawns on backrank');

  // copy and discard promoted flag
  const board = setup.board.map(piece => piece && { role: piece.role, color: piece.color });

  if (!defined(findKing(board, setup.turn))) return fail('side to move has no king');

  // TODO: castling rights?

  // TODO: ep square

  const otherKing = findKing(board, otherColor(setup.turn));
  if (!defined(otherKing)) return fail('other side has no king');
  if (attacksTo(board, setup.turn, otherKing)) return fail('opposite check'); // opposite check

  return {
    rules: 'chess',
    board,
    pockets: undefined,
    remainingChecks: undefined,
    ...setup
  };
}
