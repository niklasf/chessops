import { squareDist } from './util';
import { Square, Piece, Color, BySquare } from './types';
import { SquareSet } from './squareSet';

function slidingAttacks(square: Square, occupied: SquareSet, deltas: number[]): SquareSet {
  let attacks = SquareSet.empty();
  for (const delta of deltas) {
    for (let sq = square + delta; 0 <= sq && sq < 64 && squareDist(sq, sq - delta) <= 2; sq += delta) {
      attacks = attacks.with(sq);
      if (occupied.has(sq)) break;
    }
  }
  return attacks;
}

function slidingRangeTable(deltas: number[]): BySquare<SquareSet> {
  const table = [];
  for (let square = 0; square < 64; square++) {
    table[square] = slidingAttacks(square, SquareSet.empty(), deltas);
  }
  return table;
}

function stepAttackTable(deltas: number[]): BySquare<SquareSet> {
  const table = [];
  for (let square = 0; square < 64; square++) {
    table[square] = slidingAttacks(square, SquareSet.full(), deltas);
  }
  return table;
}

const KING_ATTACKS = stepAttackTable([-9, -8, -7, -1, 1, 7, 8, 9]);
const KNIGHT_ATTACKS = stepAttackTable([-17, -15, -10, -6, 6, 10, 15, 17]);
const PAWN_ATTACKS = {
  white: stepAttackTable([7, 9]),
  black: stepAttackTable([-7, -9])
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

const FILE_RANGE = slidingRangeTable([-8, 8]);
const RANK_RANGE = slidingRangeTable([-1, 1]);
const DIAG_RANGE = slidingRangeTable([-9, 9]);
const ANTI_DIAG_RANGE = slidingRangeTable([-7, 7]);

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

function rayTables(): [BySquare<BySquare<SquareSet>>, BySquare<BySquare<SquareSet>>] {
  const ray: BySquare<BySquare<SquareSet>> = [];
  const between: BySquare<BySquare<SquareSet>> = [];
  const zero = SquareSet.empty();
  for (let a = 0; a < 64; a++) {
    ray[a] = [];
    between[a] = [];
    for (let b = 0; b < 64; b++) {
      ray[a][b] = zero;
      between[a][b] = zero;
    }
    for (const b of DIAG_RANGE[a]) {
      ray[a][b] = DIAG_RANGE[a].with(a);
      between[a][b] = diagAttacks(a, SquareSet.fromSquare(b)).intersect(diagAttacks(b, SquareSet.fromSquare(a)));
    }
    for (const b of ANTI_DIAG_RANGE[a]) {
      ray[a][b] = ANTI_DIAG_RANGE[a].with(a);
      between[a][b] = antiDiagAttacks(a, SquareSet.fromSquare(b)).intersect(antiDiagAttacks(b, SquareSet.fromSquare(a)));
    }
    for (const b of FILE_RANGE[a]) {
      ray[a][b] = FILE_RANGE[a].with(a);
      between[a][b] = fileAttacks(a, SquareSet.fromSquare(b)).intersect(fileAttacks(b, SquareSet.fromSquare(a)));
    }
    for (const b of RANK_RANGE[a]) {
      ray[a][b] = RANK_RANGE[a].with(a);
      between[a][b] = rankAttacks(a, SquareSet.fromSquare(b)).intersect(rankAttacks(b, SquareSet.fromSquare(a)));
    }
  }
  return [ray, between];
}

const [RAY, BETWEEN] = rayTables();

export function ray(a: Square, b: Square): SquareSet {
  return RAY[a][b];
}

export function between(a: Square, b: Square): SquareSet {
  return BETWEEN[a][b];
}

export function aligned(a: Square, b: Square, c: Square): boolean {
  return RAY[a][b].has(c);
}
