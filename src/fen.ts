import { Role, Piece, Square, COLORS, ROLES } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, MaterialSide, Material, RemainingChecks } from './setup';
import { defined, strRepeat } from './util';

export const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
export const INITIAL_FEN = INITIAL_BOARD_FEN + ' w KQkq - 0 1';
export const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8';
export const EMPTY_FEN = EMPTY_BOARD_FEN + ' w - - 0 1';

export class FenError extends Error { }

function parseBoardFen(boardPart: string): Board {
  const board = Board.empty();
  let rank = 7, file = 0;
  for (let i = 0; i < boardPart.length; i++) {
    const c = boardPart[i];
    if (c == '/' && file == 8) {
      file = 0;
      rank--;
    } else {
      const step = parseInt(c, 10);
      if (step) file += step;
      else {
        if (file >= 8 || rank < 0) throw new FenError('invalid board part in fen');
        const square = file + rank * 8;
        const piece = charToPiece(c);
        if (!piece) throw new FenError('invalid board part in fen');
        if (boardPart[i + 1] == '~') {
          piece.promoted = true;
          i++;
        }
        board.set(square, piece);
        file++;
      }
    }
  }
  if (rank != 0 || file != 8) throw new FenError('invalid board part in fen');
  return board;
}

interface FenOpts {
  promoted?: boolean;
  shredder?: boolean;
}

function charToRole(ch: string): Role | undefined {
  switch (ch) {
    case 'p': return 'pawn';
    case 'n': return 'knight';
    case 'b': return 'bishop';
    case 'r': return 'rook';
    case 'q': return 'queen';
    case 'k': return 'king';
    default: return;
  }
}

function charToPiece(ch: string): Piece | undefined {
  const lower = ch.toLowerCase();
  const role = charToRole(lower);
  if (!role) return;
  return { role, color: lower == ch ? 'black' : 'white' };
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

function makePocket(material: MaterialSide): string {
  return ROLES.map(role => strRepeat(roleToChar(role), material[role])).join('');
}

export function makePockets(pocket: Material): string {
  return makePocket(pocket.white).toUpperCase() + makePocket(pocket.black);
}

export function makeCastlingFen(board: Board, unmovedRooks: SquareSet, opts?: FenOpts): string {
  const shredder = opts && opts.shredder;
  let fen = '';
  for (const color of COLORS) {
    const king = board.kingOf(color);
    const backrank = SquareSet.fromRank(color == 'white' ? 0 : 7);
    const candidates = board.pieces(color, 'rook').intersect(backrank);
    for (const rook of unmovedRooks.intersect(candidates).reversed()) {
      if (!shredder && rook === candidates.first() && king && rook < king) {
        fen += color == 'white' ? 'Q' : 'q';
      } else if (!shredder && rook === candidates.last() && king && king < rook) {
        fen += color == 'white' ? 'K' : 'k';
      } else {
        fen += (color == 'white' ? 'ABCDEFGH' : 'abcdefgh')[rook & 0x7];
      }
    }
  }
  return fen || '-';
}

export function makeRemainingChecks(checks: RemainingChecks): string {
  return `${checks.white}+${checks.black}`;
}

export function makeFen(setup: Setup, opts?: FenOpts): string {
  return [
    makeBoardFen(setup.board, opts) + (setup.pockets ? `[${makePockets(setup.pockets)}]` : ''),
    setup.turn[0],
    makeCastlingFen(setup.board, setup.unmovedRooks, opts),
    makeSquare(setup.epSquare),
    ...(setup.remainingChecks ? [makeRemainingChecks(setup.remainingChecks)] : []),
    setup.halfmoves,
    setup.fullmoves,
  ].join(' ');
}
