import { Color, Role, Board, Square, SQUARES } from './types';
import { defined, opposite } from './util';

function squareDist(a: number, b: number): number {
  const x1 = a & 7, x2 = b & 7;
  const y1 = a >> 3, y2 = b >> 3;
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

// build some lookup tables
type ShiftTable = { [sq in Square]: Square | undefined };
export const NORTH = {} as ShiftTable;
export const SOUTH = {} as ShiftTable;
const WEST = {} as ShiftTable;
const EAST = {} as ShiftTable;
const NORTH_WEST = {} as ShiftTable;
const NORTH_EAST = {} as ShiftTable;
const SOUTH_WEST = {} as ShiftTable;
const SOUTH_EAST = {} as ShiftTable;
export const KNIGHT_MOVES = {} as { [sq in Square]: Array<Square> };
export const KING_MOVES = {} as { [sq in Square]: Array<Square> };
for (let s = 0; s < 64; s++) {
  NORTH[SQUARES[s]] = SQUARES[s + 8];
  SOUTH[SQUARES[s]] = SQUARES[s - 8];
  WEST[SQUARES[s]] = (s & 7) > 0 ?  SQUARES[s - 1] : undefined;
  EAST[SQUARES[s]] = (s & 7) < 7 ?  SQUARES[s + 1] : undefined;
}
for (let s = 0; s < 64; s++) {
  NORTH_WEST[SQUARES[s]] = NORTH[WEST[SQUARES[s]]!];
  NORTH_EAST[SQUARES[s]] = NORTH[EAST[SQUARES[s]]!];
  SOUTH_WEST[SQUARES[s]] = SOUTH[WEST[SQUARES[s]]!];
  SOUTH_EAST[SQUARES[s]] = SOUTH[EAST[SQUARES[s]]!];
  KNIGHT_MOVES[SQUARES[s]] = [s + 17, s + 15, s + 10, s + 6, s - 6, s - 10, s - 15, s - 17].filter(
    to => to >= 0 && to < 64 && squareDist(s, to) <= 2
  ).map(to => SQUARES[to]);
  KING_MOVES[SQUARES[s]] = [s - 1, s - 9, s - 8, s - 7, s + 1, s + 9, s + 8, s + 7].filter(
    to => to >= 0 && to < 64 && squareDist(s, to) <= 2
  ).map(to => SQUARES[to]);
}

function genBetween(a: Square, b: Square, delta: ShiftTable): Square[] | undefined {
  const result = [];
  for (let s = delta[a]; s; s = delta[s]) {
    if (s == b) return result as Square[];
    result.push(s);
  }
  return;
}

export const BETWEEN = {} as { [sq in Square]: { [sq in Square]: Square[] } };
for (const a of SQUARES) {
  BETWEEN[a] = {} as { [sq in Square]: Square[] };
  for (const b of SQUARES) {
    BETWEEN[a][b] = (
      genBetween(a, b, NORTH) ||
      genBetween(a, b, SOUTH) ||
      genBetween(a, b, EAST) ||
      genBetween(a, b, WEST) ||
      genBetween(a, b, NORTH_EAST) ||
      genBetween(a, b, NORTH_WEST) ||
      genBetween(a, b, SOUTH_EAST) ||
      genBetween(a, b, SOUTH_WEST) ||
      []
    );
  }
}

export function aligned(a: Square, b: Square, c: Square): boolean {
  return BETWEEN[a][b].indexOf(c) != -1;
}

function slidingMovesTo(board: Board, square: Square, deltas: ShiftTable[]): Square[] {
  const result = [];
  for (const delta of deltas) {
    for (let s = delta[square]; s; s = delta[s]) {
      result.push(s);
      if (board[s]) break;
    }
  }
  return result as Square[];
}

function blockersAtRay(board: Board, square: Square, turn: Color, deltas: ShiftTable[], snipers: Role[]): Square[] {
  const result = [];
  for (const delta of deltas) {
    let blocker;
    for (let s = delta[square]; s; s = delta[s]) {
      const piece = board[s];
      if (!piece) continue;
      if (piece.color == turn) {
        if (!defined(blocker)) blocker = s;
        else break;
      } else if (snipers.indexOf(piece.role) != -1) {
        if (defined(blocker)) result.push(blocker);
        break;
      } else break;
    }
  }
  return result as Square[];
}

export function sliderBlockers(board: Board, square: Square, turn: Color): Square[] {
  return [
    ...blockersAtRay(board, square, turn, [EAST, WEST, NORTH, SOUTH], ['rook', 'queen']),
    ...blockersAtRay(board, square, turn, [NORTH_EAST, NORTH_WEST, SOUTH_EAST, SOUTH_WEST], ['bishop', 'queen'])
  ]
}

export function pawnAttacks(square: Square, color: Color): Square[] {
  const forward = (color == 'white' ? NORTH : SOUTH)[square];
  return [WEST[forward!], EAST[forward!]].filter(s => s) as Square[];
}

function isAt(board: Board, square: Square, turn: Color, role: Role): boolean {
  const piece = board[square];
  return !!(piece && piece.role == role && piece.color == turn);
}

function isAtRay(board: Board, square: Square, turn: Color, roles: Role[], delta: ShiftTable): boolean {
  for (let s = delta[square]; s; s = delta[s]) {
    const piece = board[s];
    if (piece && piece.color == turn && roles.indexOf(piece.role) != -1) return true;
    if (piece) break;
  }
  return false;
}

export function rookAttacks(board: Board, square: Square): Square[] {
  return slidingMovesTo(board, square, [WEST, EAST, NORTH, SOUTH]);
}

export function bishopAttacks(board: Board, square: Square): Square[] {
  return slidingMovesTo(board, square, [NORTH_WEST, NORTH_EAST, SOUTH_WEST, SOUTH_EAST]);
}

export function attacksTo(board: Board, by: Color, s: Square): Square[] {
  return [
    ...KING_MOVES[s].filter(o => isAt(board, o, by, 'king')),
    ...KNIGHT_MOVES[s].filter(o => isAt(board, o, by, 'knight')),
    ...pawnAttacks(s, opposite(by)).filter(o => isAt(board, o, by, 'pawn')),
    ...(rookAttacks(board, s).filter(o => isAt(board, o, by, 'rook') || isAt(board, o, by, 'queen'))),
    ...(bishopAttacks(board, s).filter(o => isAt(board, o, by, 'bishop') || isAt(board, o, by, 'queen')))
  ];
}

export function isAttacked(board: Board, by: Color, s: Square): boolean {
  return (
    KING_MOVES[s].some(o => isAt(board, o, by, 'king')) ||
    KNIGHT_MOVES[s].some(o => isAt(board, o, by, 'knight')) ||
    pawnAttacks(s, opposite(by)).some(o => isAt(board, o, by, 'pawn')) ||
    isAtRay(board, s, by, ['bishop', 'queen'], SOUTH_EAST) ||
    isAtRay(board, s, by, ['bishop', 'queen'], SOUTH_WEST) ||
    isAtRay(board, s, by, ['bishop', 'queen'], NORTH_EAST) ||
    isAtRay(board, s, by, ['bishop', 'queen'], NORTH_WEST) ||
    isAtRay(board, s, by, ['rook', 'queen'], NORTH) ||
    isAtRay(board, s, by, ['rook', 'queen'], SOUTH) ||
    isAtRay(board, s, by, ['rook', 'queen'], EAST) ||
    isAtRay(board, s, by, ['rook', 'queen'], WEST)
  );
}

export function findKing(board: Board, color: Color): Square | undefined {
  let king: Square | undefined;
  for (const square in board) {
    const piece = board[square];
    if (piece && piece.role == 'king' && piece.color == color && !piece.promoted) {
      if (defined(king)) return; // not unique
      else king = square as Square;
    }
  }
  return king;
}
