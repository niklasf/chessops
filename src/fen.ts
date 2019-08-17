import { Board, Rules, Position } from './types';

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

  let turn;
  const turnPart = parts.shift();
  if (typeof turnPart == 'undefined' || turnPart == 'w') turn = 'white';
  else if (turnPart) turn = 'black';
  else return; // invalid turn

  let castlingRights = [];
  const castlingPart = parts.shift();
  if (typeof castlingPart != 'undefined' && castlingPart != '-') {
    // TODO
  }

  let epSquare;
  const epPart = parts.shift();
  if (typeof epPart != 'undefined' && epPart != '-') {
    // TODO
  }

  let halfmoves = 0, fullmoves = 1, remainingChecks;
  let halfmovePart = parts.shift();
  if (typeof halfmovePart != 'undefined' && part.includes('+')) {
    remainingChecks = readReaminingChecks(halfmovePart);
    halfmovePart = parts.shift();
  }
  if (typeof halfmovePart != 'undefined') halfmoves = parseInt(halfmovePart, 10);
  if (halfmoves < 0) return; // invalid halfmoves part

  const fullmovesPart = parts.shift();
  if (typeof fullmovesPart != undefined) {
    if (fullmovesPart.includes('+') || fullmovesPart.includes('-')) return; // invalid fullmoves part
  }

  const remainingChecksPart = parts.shift();
  if (typeof remainingChecksPart != 'undefined') {
    remainingChecks = readRemainingChecks(remainingChecksPart);
    if (!remainingChecks) return; // invalid remaining checks
  }

  return {
    board,
    pockets,
    turn,
    epSquare,
    castlingRights,
    remainingChecks,
    halfmoves,
    fullmoves
  };
}
