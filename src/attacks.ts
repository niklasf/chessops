import { squareDist } from './util';
import { Square, Piece, Color, BySquare } from './types';
import { SquareSet } from './squareSet';

function computeRange(square: Square, deltas: number[], stepper: boolean): SquareSet {
  let range = SquareSet.empty();
  for (const delta of deltas) {
    for (let sq = square + delta; 0 <= sq && sq < 64 && squareDist(sq, sq - delta) <= 2; sq += delta) {
      range = range.with(sq);
      if (stepper) break;
    }
  }
  return range;
}

function computeTable(deltas: number[], stepper: boolean): BySquare<SquareSet> {
  const table = [];
  for (let square = 0; square < 64; square++) {
    table[square] = computeRange(square, deltas, stepper);
  }
  return table;
}

const KING_ATTACKS = computeTable([-9, -8, -7, -1, 1, 7, 8, 9], true);
const KNIGHT_ATTACKS = computeTable([-17, -15, -10, -6, 6, 10, 15, 17], true);
const PAWN_ATTACKS = {
  white: computeTable([7, 9], true),
  black: computeTable([-7, -9], true),
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

const FILE_RANGE = computeTable([-8, 8], false);
const RANK_RANGE = computeTable([-1, 1], false);
const DIAG_RANGE = computeTable([-9, 9], false);
const ANTI_DIAG_RANGE = computeTable([-7, 7], false);

function hyperbola(bit: SquareSet, range: SquareSet, occupied: SquareSet): SquareSet {
  let forward = occupied.intersect(range);
  let reverse = forward.bswap64(); // Assumes no more than 1 bit per rank
  forward = forward.minus64(bit);
  reverse = reverse.minus64(bit.bswap64());
  forward = forward.xor(reverse.bswap64());
  return forward.intersect(range);
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
  forward = forward.xor(reverse.rbit64());
  return forward.intersect(range);
}

function diagAttacks(square: Square, occupied: SquareSet): SquareSet {
  return hyperbola(SquareSet.fromSquare(square), DIAG_RANGE[square], occupied);
}

function antiDiagAttacks(square: Square, occupied: SquareSet): SquareSet {
  return hyperbola(SquareSet.fromSquare(square), ANTI_DIAG_RANGE[square], occupied);
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

function computeRayTable(): BySquare<BySquare<SquareSet>> {
  const ray: BySquare<BySquare<SquareSet>> = [];
  const zero = SquareSet.empty();
  for (let a = 0; a < 64; a++) {
    ray[a] = [];
    for (let b = 0; b < 64; b++) ray[a][b] = zero;
    for (const b of DIAG_RANGE[a]) ray[a][b] = DIAG_RANGE[a].with(a);
    for (const b of ANTI_DIAG_RANGE[a]) ray[a][b] = ANTI_DIAG_RANGE[a].with(a);
    for (const b of FILE_RANGE[a]) ray[a][b] = FILE_RANGE[a].with(a);
    for (const b of RANK_RANGE[a]) ray[a][b] = RANK_RANGE[a].with(a);
  }
  return ray;
}

const RAY = computeRayTable();

export function ray(a: Square, b: Square): SquareSet {
  return RAY[a][b];
}

export function between(a: Square, b: Square): SquareSet {
  return RAY[a][b].intersect(SquareSet.full().shl64(a).xor(SquareSet.full().shl64(b))).withoutFirst();
}
