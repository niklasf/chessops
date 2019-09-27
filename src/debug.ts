import { Piece, ByRole } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';

export function squareSet(v: SquareSet): string {
  let r = '';
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = x + y * 8;
      r += v.has(square) ? '1' : '.';
      r += x < 7 ? ' ' : '\n';
    }
  }
  return r;
}

function piece(piece: Piece): string {
  const ch = {
    pawn: 'p',
    knight: 'n',
    bishop: 'b',
    rook: 'r',
    queen: 'q',
    king: 'k',
  }[piece.role];
  return piece.color == 'white' ? ch.toUpperCase() : ch;
}

export function board(v: Board): string {
  let r = '';
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = x + y * 8;
      const p = v.get(square);
      r += p ? piece(p) : '.';
      r += x < 7 ? ' ' : '\n';
    }
  }
  return r;
}
