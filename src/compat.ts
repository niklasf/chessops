import { Rules, SquareName, Move, isDrop } from './types';
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

export function scalachessId(move: Move): string {
  if (isDrop(move)) return String.fromCharCode(
    35 + move.to,
    35 + 64 + 8 * 5 + ['queen', 'rook', 'bishop', 'knight', 'pawn'].indexOf(move.role)
  );
  else return String.fromCharCode(
    35 + move.from,
    move.promotion ?
      (35 + 64 + 8 * ['queen', 'rook', 'bishop', 'knight', 'king'].indexOf(move.promotion) + squareFile(move.to)) :
      (35 + move.to)
  );
}

export function lichessVariantRules(variant: 'standard' | 'chess960' | 'antichess' | 'fromPosition' | 'kingOfTheHill' | 'threeCheck' | 'atomic' | 'horde' | 'racingKings' | 'crazyhouse'): Rules {
  switch (variant) {
  case 'standard':
  case 'chess960':
  case 'fromPosition':
    return 'chess';
  case 'threeCheck':
    return '3check';
  case 'kingOfTheHill':
    return 'kingofthehill';
  case 'racingKings':
    return 'racingkings';
  default:
    return variant;
  }
}
