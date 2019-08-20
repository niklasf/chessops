import { Color, Role, Board, Square, SQUARES } from './types';
import { defined, pp } from './util';

function squareDist(a: number, b: number): number {
  const x1 = a & 7, x2 = b & 7;
  const y1 = a >> 3, y2 = b >> 3;
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

// build some lookup tables
type ShiftTable = { [sq in Square]: Square | undefined };
const NORTH = {} as ShiftTable;
const SOUTH = {} as ShiftTable;
const WEST = {} as ShiftTable;
const EAST = {} as ShiftTable;
const NORTH_WEST = {} as ShiftTable;
const NORTH_EAST = {} as ShiftTable;
const SOUTH_WEST = {} as ShiftTable;
const SOUTH_EAST = {} as ShiftTable;
const KNIGHT_MOVES = {} as { [sq in Square]: Array<Square> };
const KING_MOVES = {} as { [sq in Square]: Array<Square> };
for (let s = 0; s < 64; s++) {
  NORTH[SQUARES[s]] = SQUARES[s + 8];
  SOUTH[SQUARES[s]] = SQUARES[s - 8];
  WEST[SQUARES[s]] = (s & 7) > 0 ?  SQUARES[s - 1] : undefined;
  EAST[SQUARES[s]] = (s & 7) < 7 ?  SQUARES[s + 1] : undefined;
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

function slidingMovesTo(board: Board, square: Square, deltas: ShiftTable[]): Square[] {
  let result = [];
  for (const delta of deltas) {
    for (let s = delta[square]; s; s = delta[s]) {
      result.push(s);
      if (board[s]) break;
    }
  }
  return result as Square[];
}

function pawnAttacksTo(color: Color, square: Square): Square[] {
  const forward = (color == 'white' ? NORTH : SOUTH)[square];
  return [WEST[forward!], EAST[forward!]].filter(s => s) as Square[];
}

function isAt(board: Board, square: Square, turn: Color, role: Role): boolean {
  const piece = board[square];
  return !!(piece && piece.role == role && piece.color == turn);
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

export function attacksTo(board: Board, by: Color, s: Square): Square[] {
  return pp([
    ...KING_MOVES[s].filter(o => isAt(board, o, by, 'king')),
    ...KNIGHT_MOVES[s].filter(o => isAt(board, o, by, 'knight')),
    ...pawnAttacksTo(by, s).filter(o => isAt(board, o, by, 'pawn')),
    ...slidingMovesTo(board, s, [WEST, EAST, NORTH, SOUTH]).filter(o => isAt(board, o, by, 'rook') || isAt(board, o, by, 'queen')),
    ...slidingMovesTo(board, s, [NORTH_WEST, NORTH_EAST, SOUTH_WEST, SOUTH_EAST]).filter(o => isAt(board, o, by, 'bishop') || isAt(board, o, by, 'queen'))
  ], 'attacksTo');
}
