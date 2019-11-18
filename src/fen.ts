import { Role, Piece, Square, Color, COLORS, ROLES } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, MaterialSide, Material, RemainingChecks } from './setup';
import { defined, strRepeat, nthIndexOf, parseSquare, makeSquare } from './util';

export const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
export const INITIAL_FEN = INITIAL_BOARD_FEN + ' w KQkq - 0 1';
export const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8';
export const EMPTY_FEN = EMPTY_BOARD_FEN + ' w - - 0 1';

export class FenError extends Error { }

function parseSmallUint(str: string): number | undefined {
  return /^\d{1,4}$/.test(str) ? parseInt(str, 10) : undefined;
}

export function parseBoardFen(boardPart: string): Board {
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

export function parsePockets(pocketPart: string): Material {
  const pockets = Material.empty();
  for (const c of pocketPart) {
    const piece = charToPiece(c);
    if (!piece) throw new FenError('invalid pocket in fen');
    pockets[piece.color][piece.role]++;
  }
  return pockets;
}

export function parseCastlingFen(board: Board, castlingPart: string): SquareSet {
  let unmovedRooks = SquareSet.empty();
  if (castlingPart == '-') return unmovedRooks;
  if (!/^[KQABCDEFGH]{0,2}[kqabcdefgh]{0,2}$/.test(castlingPart)) throw new FenError('invalid castling part in fen');
  for (const c of castlingPart) {
    const lower = c.toLowerCase();
    const color = c == lower ? 'black' : 'white';
    const rank = color == 'white' ? 0 : 7;
    const files = (lower == 'q') ? [0, 1, 2, 3, 4, 5, 6, 7] :
                  (lower == 'k') ? [7, 6, 5, 4, 3, 2, 1, 0] :
                                   [lower.charCodeAt(0) - 'a'.charCodeAt(0)];
    for (const file of files) {
      const square = file + 8 * rank;
      const piece = board.get(square);
      if (!piece) continue;
      if (piece.color == color && piece.role == 'king') break;
      if (piece.color == color && piece.role == 'rook') {
        unmovedRooks = unmovedRooks.with(square);
        break;
      }
    }
  }
  return unmovedRooks;
}

export function parseRemainingChecks(part: string): RemainingChecks {
  const parts = part.split('+');
  if (parts.length == 3 && parts[0] === '') {
    const white = parseSmallUint(parts[1]), black = parseSmallUint(parts[2]);
    if (!defined(white) || white > 3 || !defined(black) || black > 3) throw new FenError('invalid remaining checks in fen');
    return new RemainingChecks(3 - white, 3 - black);
  } else if (parts.length == 2) {
    const white = parseSmallUint(parts[0]), black = parseSmallUint(parts[1]);
    if (!defined(white) || white > 3 || !defined(black) || black > 3) throw new FenError('invalid remaining checks in fen');
    return new RemainingChecks(white, black);
  } else throw new FenError('invalid remaining checks in fen');
}

export function parseFen(fen: string): Setup {
  const parts = fen.split(' ');
  const boardPart = parts.shift()!;

  let board, pockets;
  if (boardPart.endsWith(']')) {
    const pocketStart = boardPart.indexOf('[');
    if (pocketStart == -1) throw new FenError('invalid fen');
    board = parseBoardFen(boardPart.substr(0, pocketStart));
    pockets = parsePockets(boardPart.substr(pocketStart + 1, boardPart.length - 1 - pocketStart - 1));
  } else {
    const pocketStart = nthIndexOf(boardPart, '/', 7);
    if (pocketStart == -1) board = parseBoardFen(boardPart);
    else {
      board = parseBoardFen(boardPart.substr(0, pocketStart));
      pockets = parsePockets(boardPart.substr(pocketStart + 1));
    }
  }

  let turn: Color;
  const turnPart = parts.shift();
  if (!defined(turnPart) || turnPart == 'w') turn = 'white';
  else if (turnPart == 'b') turn = 'black';
  else throw new FenError('invalid turn in fen');

  const castlingPart = parts.shift();
  const unmovedRooks = defined(castlingPart) ? parseCastlingFen(board, castlingPart) : SquareSet.empty();

  const epPart = parts.shift();
  let epSquare;
  if (defined(epPart) && epPart != '-') {
    epSquare = parseSquare(epPart);
    if (!defined(epSquare)) throw new FenError('invalid ep square in fen');
  }

  let halfmovePart = parts.shift();
  let remainingChecks;
  if (defined(halfmovePart) && halfmovePart.includes('+')) {
    remainingChecks = parseRemainingChecks(halfmovePart);
    halfmovePart = parts.shift();
  }
  const halfmoves = defined(halfmovePart) ? parseSmallUint(halfmovePart) : 0;
  if (!defined(halfmoves)) throw new FenError('invalid halfmoves in fen');

  const fullmovesPart = parts.shift();
  const fullmoves = defined(fullmovesPart) ? parseSmallUint(fullmovesPart) : 1;
  if (!defined(fullmoves)) throw new FenError('invalid fullmoves in fen');

  const remainingChecksPart = parts.shift();
  if (defined(remainingChecksPart)) {
    if (defined(remainingChecks)) throw new FenError('duplicate remaining checks in fen');
    remainingChecks = parseRemainingChecks(remainingChecksPart);
  }

  if (parts.length) throw new FenError('too many parts in fen');

  return {
    board,
    pockets,
    turn,
    unmovedRooks,
    remainingChecks,
    epSquare,
    halfmoves,
    fullmoves: Math.max(1, fullmoves)
  };
}

interface FenOpts {
  promoted?: boolean;
  shredder?: boolean;
  epd?: boolean;
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

export function makePiece(piece: Piece, opts?: FenOpts): string {
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
    defined(setup.epSquare) ? makeSquare(setup.epSquare) : '-',
    ...(setup.remainingChecks ? [makeRemainingChecks(setup.remainingChecks)] : []),
    ...(opts && opts.epd ? [] : [setup.halfmoves, setup.fullmoves])
  ].join(' ');
}
