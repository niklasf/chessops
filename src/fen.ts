import { Role, Piece, Square } from './types';
import { SquareSet } from './squareSet';
import { ReadonlyBoard } from './board';
import { ReadonlyChess } from './chess';
import { defined } from './util';

export const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
export const INITIAL_FEN = INITIAL_BOARD_FEN + ' w KQkq - 0 1';
export const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8';
export const EMPTY_FEN = EMPTY_BOARD_FEN + ' w - - 0 1';

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

function makeSquare(square: Square | undefined): string {
  if (defined(square)) return 'abcdefgh'[square & 0x7] + '12345678'[square >> 3];
  else return '-';
}

function makePiece(piece: Piece, opts?: FenOpts): string {
  let r = roleToChar(piece.role);
  if (piece.color == 'white') r = r.toUpperCase();
  if (opts && opts.promoted && piece.promoted) r += '~';
  return r;
}

export function makeBoardFen(board: ReadonlyBoard, opts?: FenOpts) {
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

function makeCastlingFen(board: ReadonlyBoard, unmovedRooks: SquareSet): string {
  return '-'; // TODO
}

export function makeFen(pos: ReadonlyChess, opts?: FenOpts): string {
  return [
    makeBoardFen(pos.board(), opts),
    pos.turn()[0],
    makeCastlingFen(pos.board(), pos.castles().unmovedRooks()),
    makeSquare(pos.epSquare()),
    pos.halfmoves(),
    pos.fullmoves(),
  ].join(' ');
}
