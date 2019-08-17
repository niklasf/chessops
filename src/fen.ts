import { defined, nthIndexOf } from './util';
import { Color, Board, Square, Piece, Position, ByColor, Material, Setup } from './types';

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
  if (square.length != 2) return;
  if ('a'.charCodeAt(0) > square.charCodeAt(0) || square.charCodeAt(0) > 'h'.charCodeAt(0)) return;
  if ('1'.charCodeAt(0) > square.charCodeAt(1) || square.charCodeAt(1) > '8'.charCodeAt(0)) return;
  return square as Square;
}

function parsePockets(pocketPart: string): ByColor<Material> | undefined {
  const pockets = { white: emptyMaterial(), black: emptyMaterial() };
  for (const c of pocketPart) {
    const piece = parsePiece(c);
    if (!piece) return;
    pockets[piece.color][piece.role]++;
  }
  return pockets;
}

function parsePiece(c: string): Piece | undefined {
  const color = c.toLowerCase() == c ? 'black' : 'white';
  switch (c.toLowerCase()) {
    case 'p': return { role: 'pawn', color };
    case 'n': return { role: 'knight', color };
    case 'b': return { role: 'bishop', color };
    case 'r': return { role: 'rook', color };
    case 'q': return { role: 'queen', color };
    case 'k': return { role: 'king', color };
    default: return;
  }
}

export function parseBoard(boardPart: string): Board | undefined {
  let rank = 7, file = 0, board: Board = {};
  for (const c of boardPart) {
    if (c == '/' && file == 8) {
      file = 0;
      rank--;
    } else {
      const step = parseInt(c, 10);
      if (step) file += step;
      else {
        const square = 'abcdefgh'[file] + (rank + 1);
        if (c == '~' && board[square as Square]) board[square as Square]!.promoted = true;
        else {
          const piece = parsePiece(c);
          if (!piece) return;
          board[square as Square] = piece;
          file++;
        }
      }
    }
  }
  return (rank == 0 && file == 8) ? board : undefined;
}

export function parseCastlingRights(board: Board, castlingPart: string): Square[] | undefined {
  const castlingRights: Square[] = [];
  if (castlingPart == '-') return castlingRights;
  for (const c of castlingPart) {
    const color = c == c.toLowerCase() ? 'black' : 'white';
    const rank = color == 'white' ? '1' : '8';
    const files =
      (c == 'q' || c == 'Q') ? 'abcdefgh' :
      (c == 'k' || c == 'K') ? 'hgfedcba' : c.toLowerCase();
    for (const file of files) {
      const square = parseSquare(file + rank);
      if (!square) return; // invalid castling part
      const piece = board[square];
      if (piece && piece.role == 'rook' && piece.color == color) castlingRights.push(square);
    }
  }
  return castlingRights;
}

function parseUnsignedInt(str: string): number | undefined {
  if (str.includes('+') || str.includes('-')) return;
  const n = parseInt(str, 10);
  return Number.isInteger(n) ? n : undefined;
}

function parseRemainingChecks(part: string): ByColor<number> | undefined {
  const parts = part.split('+');
  if (parts.length == 3 && parts[0] === '') {
    const white = parseUnsignedInt(parts[1]), black = parseUnsignedInt(parts[2]);
    if (!defined(white) || white > 3 || !defined(black) || black > 3) return;
    return { white: 3 - white, black: 3 - black };
  } else if (parts.length == 2) {
    const white = parseUnsignedInt(parts[0]), black = parseUnsignedInt(parts[1]);
    if (!defined(white) || white > 3 || !defined(black) || black > 3) return;
    return { white, black };
  } else return;
}

export function parse(fen: string): Setup | undefined {
  const parts = fen.split(' ');
  const boardPart = parts.shift()!;

  let board, pockets;
  if (boardPart.endsWith(']')) {
    const pocketStart = boardPart.indexOf('[');
    if (pocketStart == -1) return; // no matching '[' for ']'
    board = parseBoard(boardPart.substr(0, pocketStart));
    pockets = parsePockets(boardPart.substr(pocketStart + 1, boardPart.length - 1 - pocketStart - 1));
    if (!pockets) return; // invalid pocket
  } else {
    const pocketStart = nthIndexOf(boardPart, '/', 8);
    if (pocketStart == -1) board = parseBoard(boardPart);
    else {
      board = parseBoard(boardPart.substr(0, pocketStart));
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
    castlingRights = parseCastlingRights(board, castlingPart);
    if (!castlingRights) return; // invalid castling rights
  }

  let epSquare: Square | undefined;
  const epPart = parts.shift();
  if (defined(epPart) && epPart != '-') {
    epSquare = parseSquare(epPart);
    if (!epSquare) return; // invalid ep square
  }

  let halfmoves, remainingChecks;
  let halfmovePart = parts.shift();
  if (defined(halfmovePart) && halfmovePart.includes('+')) {
    remainingChecks = parseRemainingChecks(halfmovePart);
    if (!remainingChecks) return; // invalid remaining checks
    halfmovePart = parts.shift();
  }
  if (defined(halfmovePart)) {
    halfmoves = parseUnsignedInt(halfmovePart);
    if (!defined(halfmoves)) return; // invalid halfmoves
  }

  let fullmoves;
  const fullmovesPart = parts.shift();
  if (defined(fullmovesPart)) {
    fullmoves = parseUnsignedInt(fullmovesPart);
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
