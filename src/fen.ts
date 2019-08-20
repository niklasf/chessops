import { defined, nthIndexOf, charToRole, strRepeat } from './util';
import { Color, COLORS, Board, Square, Role, ROLES, Piece, Colored, Material, Setup, SQUARES } from './types';

export const INITIAL_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
export const INITIAL_FEN = INITIAL_BOARD_FEN + ' w KQkq - 0 1';
export const EMPTY_BOARD_FEN = '8/8/8/8/8/8/8/8';
export const EMPTY_FEN = EMPTY_BOARD_FEN + ' w - - 0 1';

const ABCDEFGH = 'abcdefgh';
const HGFEDCBA = 'hgfedcba';

function emptyMaterial(): Material {
  return {
    pawn: 0,
    knight: 0,
    bishop: 0,
    rook: 0,
    queen: 0,
    king: 0,
  };
}

function parseSquare(square: string): Square | undefined {
  return /^[a-h][1-8]$/.test(square) ? square as Square : undefined;
}

function parsePockets(pocketPart: string): Colored<Material> | undefined {
  const pockets = { white: emptyMaterial(), black: emptyMaterial() };
  for (const c of pocketPart) {
    const piece = charToPiece(c);
    if (piece) pockets[piece.color][piece.role]++;
  }
  return pockets;
}

function charToPiece(c: string): Piece | undefined {
  const color = c.toLowerCase() == c ? 'black' : 'white';
  const role = charToRole(c);
  return role && { role, color };
}

export function parseBoardFen(boardPart: string): Board | undefined {
  const board: Board = {};
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
        const square = SQUARES[file + rank * 8];
        const piece = charToPiece(c);
        if (!piece) return;
        if (boardPart[i + 1] == '~') {
          board[square] = { promoted: true, ...piece };
          i++;
        } else board[square] = piece;
        file++;
      }
    }
  }
  return (rank == 0 && file == 8) ? board : undefined;
}

export function parseCastlingFen(board: Board, castlingPart: string): Square[] | undefined {
  if (castlingPart == '-') return [];
  if (!/^[KQABCDEFGH]{0,2}[kqabcdefgh]{0,2}$/.test(castlingPart)) return;
  const castlingRights: Square[] = [];
  for (const c of castlingPart) {
    const color = c == c.toLowerCase() ? 'black' : 'white';
    const rank = color == 'white' ? '1' : '8';
    const files = (c == 'q' || c == 'Q') ? ABCDEFGH :
                  (c == 'k' || c == 'K') ? HGFEDCBA : c.toLowerCase();
    for (const file of files) {
      const square = (file + rank) as Square;
      const piece = board[square];
      if (!piece || piece.color != color) continue;
      if (piece.role == 'king') break;
      if (piece.role == 'rook' && castlingRights.indexOf(square) == -1) castlingRights.push(square);
    }
  }
  return castlingRights;
}

function parseSmallUint(str: string): number | undefined {
  return /^\d{1,4}$/.test(str) ? parseInt(str, 10) : undefined;
}

function parseRemainingChecks(part: string): Colored<number> | undefined {
  const parts = part.split('+');
  if (parts.length == 3 && parts[0] === '') {
    const white = parseSmallUint(parts[1]), black = parseSmallUint(parts[2]);
    if (!defined(white) || white > 3 || !defined(black) || black > 3) return;
    return { white: 3 - white, black: 3 - black };
  } else if (parts.length == 2) {
    const white = parseSmallUint(parts[0]), black = parseSmallUint(parts[1]);
    if (!defined(white) || white > 3 || !defined(black) || black > 3) return;
    return { white, black };
  } else return;
}

export function parseFen(fen: string): Setup | undefined {
  const parts = fen.split(' ');
  const boardPart = parts.shift()!;

  let board, pockets;
  if (boardPart.endsWith(']')) {
    const pocketStart = boardPart.indexOf('[');
    if (pocketStart == -1) return; // no matching '[' for ']'
    board = parseBoardFen(boardPart.substr(0, pocketStart));
    pockets = parsePockets(boardPart.substr(pocketStart + 1, boardPart.length - 1 - pocketStart - 1));
    if (!pockets) return; // invalid pocket
  } else {
    const pocketStart = nthIndexOf(boardPart, '/', 7);
    if (pocketStart == -1) board = parseBoardFen(boardPart);
    else {
      board = parseBoardFen(boardPart.substr(0, pocketStart));
      pockets = parsePockets(boardPart.substr(pocketStart + 1));
      if (!pockets) return; // invalid pocket
    }
  }
  if (!board) return; // invalid board

  let turn: Color;
  const turnPart = parts.shift();
  if (!defined(turnPart) || turnPart == 'w') turn = 'white';
  else if (turnPart) turn = 'black';
  else return; // invalid turn

  let castlingRights: Square[] | undefined = [];
  const castlingPart = parts.shift();
  if (defined(castlingPart)) {
    castlingRights = parseCastlingFen(board, castlingPart);
    if (!castlingRights) return; // invalid castling rights
  }

  let epSquare: Square | undefined;
  const epPart = parts.shift();
  if (defined(epPart) && epPart != '-') {
    epSquare = parseSquare(epPart);
    if (!defined(epSquare)) return; // invalid ep square
  }

  let halfmoves, remainingChecks;
  let halfmovePart = parts.shift();
  if (defined(halfmovePart) && halfmovePart.includes('+')) {
    remainingChecks = parseRemainingChecks(halfmovePart);
    if (!remainingChecks) return; // invalid remaining checks
    halfmovePart = parts.shift();
  }
  if (defined(halfmovePart)) {
    halfmoves = parseSmallUint(halfmovePart);
    if (!defined(halfmoves)) return; // invalid halfmoves
  }

  let fullmoves;
  const fullmovesPart = parts.shift();
  if (defined(fullmovesPart)) {
    fullmoves = parseSmallUint(fullmovesPart);
    if (!defined(fullmoves)) return; // invalid fullmoves
  }

  const remainingChecksPart = parts.shift();
  if (defined(remainingChecksPart)) {
    if (remainingChecks) return; // already got this part
    remainingChecks = parseRemainingChecks(remainingChecksPart);
    if (!remainingChecks) return; // invalid remaining checks
  }

  if (parts.length) return;

  return {
    board,
    pockets,
    turn,
    epSquare,
    castlingRights,
    remainingChecks,
    halfmoves: halfmoves || 0,
    fullmoves: Math.max(1, fullmoves || 1)
  };
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

interface FenOpts {
  promoted?: boolean;
}

export function makeBoardFen(board: Board, opts?: FenOpts): string {
  let fen = '', empty = 0;

  for (let rank = 7; rank >= 0; rank--) {
    for (let file = 0; file < 8; file++) {
      const square = SQUARES[file + rank * 8];
      const piece = board[square];
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

function makePocket(material: Material): string {
  return ROLES.map(role => strRepeat(roleToChar(role), material[role])).join('');
}

function makePockets(pocket: Colored<Material>): string {
  return makePocket(pocket.white).toUpperCase() + makePocket(pocket.black);
}

function makeCastlingFen(setup: Setup, opts?: FenOpts): string {
  let result = '';
  for (const color of COLORS) {
    let side = '', foundKing = false;
    for (const direction of 'kq') {
      let outer = true;
      for (const file of (direction == 'k' ? HGFEDCBA : ABCDEFGH)) {
        const cr = file + (color == 'white' ? '1' : '8') as Square;
        const piece = setup.board[cr];
        if (!piece || piece.color != color) continue;
        if (piece.role == 'king') {
          foundKing = true;
          break;
        }
        if (piece.role == 'rook') {
          if (setup.castlingRights.indexOf(cr) != -1) side += outer ? direction : file;
          outer = false;
        }
      }
    }
    if (!foundKing) side = '';
    result += color == 'white' ? side.toUpperCase() : side;
  }
  return result || '-';
}

export function makeFen(setup: Setup, opts?: FenOpts): string {
  const parts = [
    makeBoardFen(setup.board, opts) + (setup.pockets ? ('/' + makePockets(setup.pockets)) : ''),
    setup.turn[0],
    makeCastlingFen(setup),
    setup.epSquare || '-',
    setup.halfmoves,
    setup.fullmoves
  ];
  if (setup.remainingChecks) parts.push(`+${3 - setup.remainingChecks.white}+${3 - setup.remainingChecks.black}`);
  return parts.join(' ');
}
