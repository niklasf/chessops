import { defined, nthIndexOf } from './util';
import { Color, Board, Square, Rules, Piece, Position } from './types';

function parsePockets(pocketPart: string): any | undefined {
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

function parseBoard(boardPart: string): Board | undefined {
  let rank = 7, file = 0, board: Board = {};
  for (const c of boardPart) {
    if (c == '/' && file == 8) {
      file = 0;
      rank--;
    } else {
      const step = parseInt(c, 10);
      if (step) file += step;
      else {
        const piece = parsePiece(c);
        if (!piece) return;
        const square = "abcdefgh"[file] + (rank + 1);
        board[square as Square] = piece;
        file++;
      }
    }
  }
  return (rank == 0 && file == 8) ? board : undefined;
}

function parseUnsignedInt(str: string): number | undefined {
  if (str.includes('+') || str.includes('-')) return;
  const n = parseInt(str, 10);
  return typeof n == 'number' ? n : undefined;
}

function parseRemainingChecks(part: string): any | undefined {
  // TODO
  return;
}

export function parse(rules: Rules, fen: string): Position | undefined {
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

  let castlingRights: Square[] = [];
  const castlingPart = parts.shift();
  if (defined(castlingPart) && castlingPart != '-') {
    // TODO
  }

  let epSquare;
  const epPart = parts.shift();
  if (defined(epPart) && epPart != '-') {
    // TODO
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
    fullmoves: Math.max(1, fullmoves || 1),
    rules
  };
}
