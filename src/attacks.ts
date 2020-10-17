import { squareFile, squareRank } from './util';
import { Square, Piece, Color, BySquare } from './types';
import { SquareSet } from './squareSet';

function computeRange(square: Square, deltas: number[]): SquareSet {
  let range = SquareSet.empty();
  for (const delta of deltas) {
    const sq = square + delta;
    if (0 <= sq && sq < 64 && Math.abs(squareFile(square) - squareFile(sq)) <= 2) {
      range = range.with(sq);
    }
  }
  return range;
}

function tabulate<T>(f: (square: Square) => T): BySquare<T> {
  const table = [];
  for (let square = 0; square < 64; square++) table[square] = f(square);
  return table;
}

const KING_ATTACKS = tabulate(sq => computeRange(sq, [-9, -8, -7, -1, 1, 7, 8, 9]));
const KNIGHT_ATTACKS = tabulate(sq => computeRange(sq, [-17, -15, -10, -6, 6, 10, 15, 17]));
const PAWN_ATTACKS = {
  white: tabulate(sq => computeRange(sq, [7, 9])),
  black: tabulate(sq => computeRange(sq, [-7, -9])),
};

export function kingAttacks(square: Square): SquareSet {
  return KING_ATTACKS[square];
}

export function knightAttacks(square: Square): SquareSet {
  return KNIGHT_ATTACKS[square];
}

export function pawnAttacks(color: Color, square: Square): SquareSet {
  return PAWN_ATTACKS[color][square];
}

const FILE_RANGE = tabulate(sq => SquareSet.fromFile(squareFile(sq)).without(sq));
const RANK_RANGE = tabulate(sq => SquareSet.fromRank(squareRank(sq)).without(sq));

const DIAG_RANGE = tabulate(sq => {
  const diag = new SquareSet(0x0804_0201, 0x8040_2010);
  const shift = 8 * (squareRank(sq) - squareFile(sq));
  return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});

const ANTI_DIAG_RANGE = tabulate(sq => {
  const diag = new SquareSet(0x1020_4080, 0x0102_0408);
  const shift = 8 * (squareRank(sq) + squareFile(sq) - 7);
  return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});

function hyperbola(bit: SquareSet, range: SquareSet, occupied: SquareSet): SquareSet {
  let forward = occupied.intersect(range);
  let reverse = forward.bswap64(); // Assumes no more than 1 bit per rank
  forward = forward.minus64(bit);
  reverse = reverse.minus64(bit.bswap64());
  return forward.xor(reverse.bswap64()).intersect(range);
}

function fileAttacks(square: Square, occupied: SquareSet): SquareSet {
  return hyperbola(SquareSet.fromSquare(square), FILE_RANGE[square], occupied);
}

function rankAttacks(square: Square, occupied: SquareSet): SquareSet {
  const range = RANK_RANGE[square];
  let forward = occupied.intersect(range);
  let reverse = forward.rbit64();
  forward = forward.minus64(SquareSet.fromSquare(square));
  reverse = reverse.minus64(SquareSet.fromSquare(63 - square));
  return forward.xor(reverse.rbit64()).intersect(range);
}

export function bishopAttacks(square: Square, occupied: SquareSet): SquareSet {
  const bit = SquareSet.fromSquare(square);
  return hyperbola(bit, DIAG_RANGE[square], occupied).xor(hyperbola(bit, ANTI_DIAG_RANGE[square], occupied));
}

export function rookAttacks(square: Square, occupied: SquareSet): SquareSet {
  return fileAttacks(square, occupied).xor(rankAttacks(square, occupied));
}

export function queenAttacks(square: Square, occupied: SquareSet): SquareSet {
  return bishopAttacks(square, occupied).xor(rookAttacks(square, occupied));
}

export function attacks(piece: Piece, square: Square, occupied: SquareSet): SquareSet {
  switch (piece.role) {
  case 'pawn': return pawnAttacks(piece.color, square);
  case 'knight': return knightAttacks(square);
  case 'bishop': return bishopAttacks(square, occupied);
  case 'rook': return rookAttacks(square, occupied);
  case 'queen': return queenAttacks(square, occupied);
  case 'king': return kingAttacks(square);
  }
}

export function ray(a: Square, b: Square): SquareSet {
  const other = SquareSet.fromSquare(b);
  if (RANK_RANGE[a].intersects(other)) return RANK_RANGE[a].with(a);
  if (ANTI_DIAG_RANGE[a].intersects(other)) return ANTI_DIAG_RANGE[a].with(a);
  if (DIAG_RANGE[a].intersects(other)) return DIAG_RANGE[a].with(a);
  if (FILE_RANGE[a].intersects(other)) return FILE_RANGE[a].with(a);
  return SquareSet.empty();
}

export function between(a: Square, b: Square): SquareSet {
  return ray(a, b).intersect(SquareSet.full().shl64(a).xor(SquareSet.full().shl64(b))).withoutFirst();
}
