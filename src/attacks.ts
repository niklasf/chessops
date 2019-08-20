import { Color, Role, Board, Sq } from './types';
import { defined, pp } from './util';

const ROOK_DELTAS = [1, -1, 8, -8];
const BISHOP_DELTAS = [7, -7, 9, -9];

function squareDist(a: Sq, b: Sq): number {
  const x1 = a & 7, x2 = b & 7;
  const y1 = a >> 3, y2 = b >> 3;
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

function slidingMovesTo(board: Board, square: Sq, deltas: number[]): Sq[] {
  let result = [];
  for (const delta of deltas) {
    for (let s = square + delta; s >= 0 && s < 64 && squareDist(s, s - delta) == 1; s += delta) {
      result.push(s);
      if (board[s]) break;
    }
  }
  return result;
}

function kingMovesTo(s: Sq): Sq[] {
  return [s - 1, s - 9, s - 8, s - 7, s + 1, s + 9, s + 8, s + 7].filter(
    o => o >= 0 && o < 64 && squareDist(s, o) == 1);
}

function knightMovesTo(s: Sq): Sq[] {
  return [s + 17, s + 15, s + 10, s + 6, s - 6, s - 10, s - 15, s - 17].filter(
    o => o >= 0 && o < 64 && squareDist(s, o) <= 2);
}

function pawnAttacksTo(color: Color, s: Sq): Sq[] {
  const left = color == 'white' ? 7 : -7;
  const right = color == 'black' ? 9 : -9;
  return [s + left, s + right].filter(
    o => o >= 0 && o < 64 && squareDist(s, 0) == 1);
}

function isAt(board: Board, s: Sq, turn: Color, role: Role): boolean {
  const piece = board[s];
  return !!(piece && piece.role == role && piece.color == turn);
}

export function findKing(board: Board, color: Color): Sq | undefined {
  let king: Sq | undefined;
  board.forEach((piece, sq: Sq) => {
    if (piece && piece.role == 'king' && piece.color == color && !piece.promoted) {
      console.log(piece, sq);
      king = sq;
    }
  });
  return king;
}

export function attacksTo(board: Board, by: Color, s: Sq): Sq[] {
  return pp([
    ...kingMovesTo(s).filter(o => isAt(board, o, by, 'king')),
    ...knightMovesTo(s).filter(o => isAt(board, o, by, 'knight')),
    ...pawnAttacksTo(by, s).filter(o => isAt(board, o, by, 'pawn')),
    ...slidingMovesTo(board, s, ROOK_DELTAS).filter(o => isAt(board, o, by, 'rook') || isAt(board, o, by, 'queen')),
    ...slidingMovesTo(board, s, BISHOP_DELTAS).filter(o => isAt(board, o, by, 'bishop') || isAt(board, o, by, 'queen'))
  ], 'attacksTo');
}
