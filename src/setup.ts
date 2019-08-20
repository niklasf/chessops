import { Board, Setup, Position, Square, Colored } from './types';
import { defined, opposite, fail } from './util';
import { findKing, attacksTo } from './attacks';

export function setup(setup: Setup): Position | undefined {
  console.log('----');
  const board: Board = {};
  for (const square in setup.board) {
    const piece = setup.board[square];
    if (!piece) continue;

    // pawn on backrank
    if (piece.role == 'pawn' && (square[1] == '1' || square[1] == '8')) return fail('pawns on backrank');

    // copy and discard promoted flag
    board[square] = { role: piece.role, color: piece.color };
  };

  // ep square
  if (defined(setup.epSquare)) {
    if (setup.epSquare[1] != (setup.turn == 'white' ? '6' : '3')) return fail('ep square not on sixth rank');
    if (board[setup.epSquare[0] + (setup.turn == 'white' ? '7' : '2') as Square]) return fail('invalid ep square');
    const pawn = board[setup.epSquare[0] + (setup.turn == 'white' ? '5' : '4') as Square];
    if (!pawn || pawn.role != 'pawn' || pawn.color == setup.turn) return fail('missing ep pawn');
  }

  // missing king
  if (!defined(findKing(board, setup.turn))) return fail('side to move has no king');

  // other side in check
  const otherKing = findKing(board, opposite(setup.turn));
  if (!defined(otherKing)) return fail('other side has no king');
  if (attacksTo(board, setup.turn, otherKing).length) return fail('opposite check'); // opposite check

  return {
    rules: 'chess',
    board,
    pockets: undefined,
    remainingChecks: undefined,
    ...setup
  };
}
