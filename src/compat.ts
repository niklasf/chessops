import { SquareName, Uci, isDrop } from './types';
import { makeSquare, squareFile } from './util';
import { Position } from './chess';

export interface CgDests {
  [key: string]: SquareName[];
};

export function chessgroundDests(pos: Position): CgDests {
  const result: CgDests = {};
  const ctx = pos.ctx();
  for (const [from, squares] of pos.allDests(ctx)) {
    if (squares.isEmpty()) continue;
    const orig = makeSquare(from);
    result[orig] = Array.from(squares, makeSquare);
    if (from === ctx.king && squareFile(from) === 4) {
      if (squares.has(0)) result[orig].push('c1');
      else if (squares.has(56)) result[orig].push('c8');
      if (squares.has(7)) result[orig].push('g1');
      else if (squares.has(63)) result[orig].push('g8');
    }
  }
  return result;
}

export function uciCharPair(uci: Uci): string {
  if (isDrop(uci)) return String.fromCharCode(
    35 + uci.to,
    35 + 64 + 8 * 5 + ['queen', 'rook', 'bishop', 'knight', 'pawn'].indexOf(uci.role)
  );
  else return String.fromCharCode(
    35 + uci.from,
    uci.promotion ?
      (35 + 64 + 8 * ['queen', 'rook', 'bishop', 'knight', 'king'].indexOf(uci.promotion) + squareFile(uci.to)) :
      (35 + uci.to)
  );
}
