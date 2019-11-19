import { ROLES, COLORS } from './types';
import { defined } from './util';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup } from './setup';

export function flipVertical(s: SquareSet): SquareSet {
  return s.bswap();
}

export function flipHorizontal(s: SquareSet): SquareSet {
  const k1 = new SquareSet(0x55555555, 0x55555555);
  const k2 = new SquareSet(0x33333333, 0x33333333);
  const k4 = new SquareSet(0x0f0f0f0f, 0x0f0f0f0f);
  s = s.shr(1).intersect(k1).union(s.intersect(k1).shl(1));
  s = s.shr(2).intersect(k2).union(s.intersect(k2).shl(2));
  s = s.shr(4).intersect(k4).union(s.intersect(k4).shl(4));
  return s;
}

export function flipDiagonal(s: SquareSet): SquareSet {
  let t = s.xor(s.shl(28)).intersect(new SquareSet(0, 0x0f0f0f0f));
  s = s.xor(t.xor(t.shr(28)));
  t = s.xor(s.shl(14)).intersect(new SquareSet(0x33330000, 0x33330000));
  s = s.xor(t.xor(t.shr(14)));
  t = s.xor(s.shl(7)).intersect(new SquareSet(0x55005500, 0x55005500));
  s = s.xor(t.xor(t.shr(7)));
  return s;
}

export function rotate180(s: SquareSet): SquareSet {
  return s.rbit();
}

export function transformBoard(board: Board, f: (s: SquareSet) => SquareSet): Board {
  const b = Board.empty();
  b.occupied = f(board.occupied);
  b.promoted = f(board.promoted);
  for (const color of COLORS) b[color] = f(board[color]);
  for (const role of ROLES) b[role] = f(board[role]);
  return b;
}

export function transformSetup(setup: Setup, f: (s: SquareSet) => SquareSet): Setup {
  return {
    board: transformBoard(setup.board, f),
    pockets: setup.pockets && setup.pockets.clone(),
    turn: setup.turn,
    unmovedRooks: f(setup.unmovedRooks),
    epSquare: defined(setup.epSquare) ? f(SquareSet.fromSquare(setup.epSquare)).first() : undefined,
    remainingChecks: setup.remainingChecks && setup.remainingChecks.clone(),
    halfmoves: setup.halfmoves,
    fullmoves: setup.fullmoves,
  };
}
