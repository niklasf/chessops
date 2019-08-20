import { Board, Setup, Position, Square, Colored } from './types';
import { defined, opposite } from './util';
import { findKing, attacksTo } from './attacks';

export function setup(setup: Setup): Position | undefined {
  console.log('----');
  const board: Board = {};
  for (const square in setup.board) {
    const piece = setup.board[square];
    if (!piece) continue;

    // pawn on backrank
    if (piece.role == 'pawn' && (square[1] == '1' || square[1] == '8')) return;

    // copy and discard promoted flag
    board[square] = { role: piece.role, color: piece.color };
  };

  // ep square
  if (defined(setup.epSquare)) {
    if (setup.epSquare[1] != (setup.turn == 'white' ? '6' : '3')) return;
    if (board[setup.epSquare]) return;
    if (board[setup.epSquare[0] + (setup.turn == 'white' ? '7' : '2') as Square]) return;
    const pawn = board[setup.epSquare[0] + (setup.turn == 'white' ? '5' : '4') as Square];
    if (!pawn || pawn.role != 'pawn' || pawn.color == setup.turn) return;
  }

  // missing king
  if (!defined(findKing(board, setup.turn))) return;

  // other side in check
  const otherKing = findKing(board, opposite(setup.turn));
  if (!defined(otherKing)) return;
  if (attacksTo(board, setup.turn, otherKing).length) return;

  return {
    rules: 'chess',
    board,
    pockets: undefined,
    remainingChecks: undefined,
    ...setup
  };
}
