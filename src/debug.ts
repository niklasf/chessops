import { Square, Piece, ByRole } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Chess } from './chess';

export function squareSet(squares: SquareSet): string {
  let r = '';
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = x + y * 8;
      r += squares.has(square) ? '1' : '.';
      r += x < 7 ? ' ' : '\n';
    }
  }
  return r;
}

export function piece(piece: Piece): string {
  const ch = {
    pawn: 'p',
    knight: 'n',
    bishop: 'b',
    rook: 'r',
    queen: 'q',
    king: 'k',
  }[piece.role];
  return (piece.color == 'white' ? ch.toUpperCase() : ch) + (piece.promoted ? '~' : '');
}

export function board(board: Board): string {
  let r = '';
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = x + y * 8;
      const p = board.get(square);
      const col = p ? piece(p) : '.';
      r += col;
      r += x < 7 ? (col.length < 2 ? ' ' : '') : '\n';
    }
  }
  return r;
}

export function square(sq: Square): string {
  return 'abcdefgh'[sq & 0x7] + '12345678'[sq >> 3];
}

export function perft(pos: Chess, depth: number, outer: boolean = true): number {
  if (depth < 1) return 1;
  else {
    let nodes = 0;
    const d = pos.allDests();
    for (const from in d) {
      for (const to of d[from]) {
        // TODO: Promotion
        const child = pos.clone();
        child.playMove(square(parseInt(from)) + square(to));
        const children = perft(child, depth - 1, false);
        if (outer) console.log(square(parseInt(from)), square(to), children);
        nodes += children;
      }
    }
    return nodes;
  }
}
