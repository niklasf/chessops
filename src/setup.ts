import { Result, ok, err } from './fp';
import { Board, Setup, Position, Square, Colored } from './types';
import { defined, opposite } from './util';
import { findKing, attacksTo } from './attacks';

export function setup(setup: Setup): Result<Position, string> {
  const board: Board = {};
  for (const square in setup.board) {
    const piece = setup.board[square];
    if (!piece) continue;

    // pawn on backrank
    if (piece.role == 'pawn' && (square[1] == '1' || square[1] == '8')) return err('pawn on backrank');

    // copy and discard promoted flag
    board[square] = { role: piece.role, color: piece.color };
  };

  // ep square
  if (defined(setup.epSquare)) {
    if (setup.epSquare[1] != (setup.turn == 'white' ? '6' : '3')) return err('illegal ep square');
    if (board[setup.epSquare]) return err('illegal ep square');
    if (board[setup.epSquare[0] + (setup.turn == 'white' ? '7' : '2') as Square]) return err('illegal ep square');
    const pawn = board[setup.epSquare[0] + (setup.turn == 'white' ? '5' : '4') as Square];
    if (!pawn || pawn.role != 'pawn' || pawn.color == setup.turn) return err('illegal ep square');
  }

  // missing king
  if (!defined(findKing(board, setup.turn))) return err('missing king');

  // other side in check
  const otherKing = findKing(board, opposite(setup.turn));
  if (!defined(otherKing)) return err('missing king');
  if (attacksTo(board, setup.turn, otherKing).length) return err('opposite king in check');

  return ok({
    rules: 'chess',
    board,
    turn: setup.turn,
    epSquare: setup.epSquare,
    castlingRights: [...setup.castlingRights],
    pockets: undefined,
    remainingChecks: undefined,
    halfmoves: setup.halfmoves,
    fullmoves: setup.fullmoves
  });
}
