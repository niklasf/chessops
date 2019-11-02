import { Role, Piece } from './types';
import { Board } from './board';

export const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
export const INITIAL_FEN = INITIAL_BOARD_FEN + ' w KQkq - 0 1';

interface FenOpts {
  promoted?: boolean;
}

function roleToChar(role: Role): string {
  switch (role) {
    case 'pawn': return 'p';
    case 'knight': return 'n';
    case 'bishop': return 'b';
    case 'rook': return 'r';
    case 'queen': return 'q';
    case 'king': return 'k';
  }
}

function makePiece(piece: Piece, opts?: FenOpts): string {
  let r = roleToChar(piece.role);
  if (piece.color == 'white') r = r.toUpperCase();
  if (opts && opts.promoted && piece.promoted) r += '~';
  return r;
}

export function makeBoardFen(board: Board, opts?: FenOpts) {
  let fen = '', empty = 0;
  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const square = file + rank * 8;
      const piece = board.get(square);
      if (!piece) empty++;
      else {
        if (empty) {
          fen += empty;
          empty = 0;
        }
        fen += makePiece(piece, opts);
      }

      if (file == 7) {
        if (empty) {
          fen += empty;
          empty = 0;
        }
        if (rank != 0) fen += '/';
      }
    }
  }
  return fen;
}
