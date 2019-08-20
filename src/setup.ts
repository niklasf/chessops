import { Board, Setup, Position, Square, Colored } from './types';

export function setup(setup: Setup): Position | undefined {
  // check for pawns on backranks and kings
  const board: Board = {};
  const kings = { white: false, black: false };
  for (const square in setup.board) {
    const piece = setup.board[square];
    if (!piece) continue;
    if (piece.role == 'king') {
      if (kings[piece.color]) return; // too many kings
      kings[piece.color] = true;
    } else if (piece.role == 'pawn') {
      const rank = square >> 3;
      if (rank == 0 || rank == 7) return; // pawn on backrank
    }
    board[square] = { role: piece.role, color: piece.color }; // discard promoted
  }
  if (!kings.white || !kings.black) return; // missing king

  // TODO: castling rights?

  // TODO: ep square

  // TODO: opposite check

  return {
    rules: 'chess',
    board,
    pockets: undefined,
    remainingChecks: undefined,
    ...setup
  };
}
