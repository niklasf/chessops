import { Color, Board, Square, Rules, Position } from './types';

function nthIndexOf(haystack: string, needle: string, n: number): number {
  let index = haystack.indexOf(needle);
  while (n-- > 0) {
    if (index == -1) break;
    index = haystack.indexOf(needle, index + 1);
  }
  return index;
}

function readPockets(pocketPart: string): any | undefined {
}

function readBoard(boardPart: string): Board | undefined {
  let x = 0, y = 7;
  return {};
}

function readUnsignedInt(str: string): number | undefined {
  if (str.includes('+') || str.includes('-')) return;
  const n = parseInt(str, 10);
  return typeof n == 'number' ? n : undefined;
}

function readRemainingChecks(part: string): any | undefined {
  return;
}

export function read(rules: Rules, fen: string): Position | undefined {
  const parts = fen.split(' ');
  const boardPart = parts.shift()!;

  let board, pockets;
  if (boardPart.endsWith(']')) {
    const pocketStart = boardPart.indexOf('[');
    if (pocketStart == -1) return; // no matching '[' for ']'
    board = readBoard(boardPart.substr(0, pocketStart));
    pockets = readPockets(boardPart.substr(pocketStart + 1, boardPart.length - 1 - pocketStart - 1));
    if (!pockets) return; // invalid pocket
  } else {
    const pocketStart = nthIndexOf(boardPart, '/', 8);
    if (pocketStart == -1) board = readBoard(boardPart);
    else {
      board = readBoard(boardPart.substr(0, pocketStart));
      pockets = readPockets(boardPart.substr(pocketStart + 1));
      if (!pockets) return; // invalid pocket
    }
  }
  if (!board) return; // invalid board

  let turn: Color;
  const turnPart = parts.shift();
  if (typeof turnPart == 'undefined' || turnPart == 'w') turn = 'white';
  else if (turnPart) turn = 'black';
  else return; // invalid turn

  let castlingRights: Square[] = [];
  const castlingPart = parts.shift();
  if (typeof castlingPart != 'undefined' && castlingPart != '-') {
    // TODO
  }

  let epSquare;
  const epPart = parts.shift();
  if (typeof epPart != 'undefined' && epPart != '-') {
    // TODO
  }

  let halfmoves, remainingChecks;
  let halfmovePart = parts.shift();
  if (typeof halfmovePart != 'undefined' && halfmovePart.includes('+')) {
    remainingChecks = readRemainingChecks(halfmovePart);
    if (!remainingChecks) return; // invalid remaining checks
    halfmovePart = parts.shift();
  }
  if (typeof halfmovePart != 'undefined') {
    halfmoves = readUnsignedInt(halfmovePart);
    if (typeof halfmoves == 'undefined') return; // invalid halfmoves
  }

  let fullmoves;
  const fullmovesPart = parts.shift();
  if (typeof fullmovesPart != 'undefined') {
    fullmoves = readUnsignedInt(fullmovesPart);
    if (typeof fullmoves == 'undefined') return; // invalid fullmoves
  }

  const remainingChecksPart = parts.shift();
  if (typeof remainingChecksPart != 'undefined') {
    if (remainingChecks) return; // already got this part
    remainingChecks = readRemainingChecks(remainingChecksPart);
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
