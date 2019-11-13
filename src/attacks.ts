import { Square, Piece, Color } from './types';
import { SquareSet } from './squareSet';

function squareDist(a: Square, b: Square): number {
  const x1 = a & 7, x2 = b & 7;
  const y1 = a >> 3, y2 = b >> 3;
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

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

function edges(square: Square): SquareSet {
  const h = SquareSet.fromRank(0).union(SquareSet.fromRank(7)).diff(SquareSet.fromRank(square >> 3));
  const v = SquareSet.fromFile(0).union(SquareSet.fromFile(7)).diff(SquareSet.fromFile(square & 7));
  return h.union(v);
}

type BySquare<T> = { [square: number]: T };
type Attacks = { [lo: number]: { [hi : number]: SquareSet } };

function slidingRangeTable(deltas: number[]): BySquare<SquareSet> {
  const table = [];
  for (let square = 0; square < 64; square++) {
    table[square] = slidingAttacks(square, SquareSet.empty(), deltas);
  }
  return table;
}

function slidingAttackTable(deltas: number[]): [BySquare<SquareSet>, BySquare<Attacks>] {
  const masks = [];
  const table = [];
  for (let square = 0; square < 64; square++) {
    const mask = slidingAttacks(square, SquareSet.empty(), deltas).diff(edges(square));
    const attacks: Attacks = {};
    for (const subset of mask.subsets()) {
      attacks[subset.lo] = attacks[subset.lo] || {};
      attacks[subset.lo][subset.hi] = slidingAttacks(square, subset, deltas);
    }
    masks[square] = mask;
    table[square] = attacks;
  }
  return [masks, table];
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

const [RANK_MASKS, RANK_ATTACKS] = slidingAttackTable([-1, 1]);

const FILE_RANGE = slidingRangeTable([-8, 8]);
const DIAG_RANGE = slidingRangeTable([-9, 9]);
const ANTI_DIAG_RANGE = slidingRangeTable([-7, 7]);

function rankAttacks(square: Square, occupied: SquareSet): SquareSet {
  const occ = RANK_MASKS[square].intersect(occupied);
  return RANK_ATTACKS[square][occ.lo][occ.hi];
}

function hyperbola(bit: SquareSet, range: SquareSet, occupied: SquareSet): SquareSet {
  let forward = occupied.intersect(range);
  let reverse = forward.bswap();
  forward = forward.minus(bit);
  reverse = reverse.minus(bit.bswap());
  forward = forward.xor(reverse.bswap());
  return forward.intersect(range);
}

function fileAttacks(square: Square, occupied: SquareSet): SquareSet {
  return hyperbola(SquareSet.fromSquare(square), FILE_RANGE[square], occupied);
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
    case 'pawn': return PAWN_ATTACKS[piece.color][square];
    case 'knight': return KNIGHT_ATTACKS[square];
    case 'bishop': return bishopAttacks(square, occupied);
    case 'rook': return rookAttacks(square, occupied);
    case 'queen': return queenAttacks(square, occupied);
    case 'king': return KING_ATTACKS[square];
  }
}

function rayTables(): [BySquare<BySquare<SquareSet>>, BySquare<BySquare<SquareSet>>] {
  const ray: BySquare<BySquare<SquareSet>> = [], between: BySquare<BySquare<SquareSet>> = [];
  for (let a = 0; a < 64; a++) {
    ray[a] = [];
    between[a] = [];
    for (let b = 0; b < a; b++) {
      if (DIAG_RANGE[a].has(b)) {
        ray[a][b] = DIAG_RANGE[a].with(b);
        between[a][b] = diagAttacks(a, SquareSet.fromSquare(b)).intersect(diagAttacks(b, SquareSet.fromSquare(a)));
      } else if (ANTI_DIAG_RANGE[a].has(b)) {
        ray[a][b] = ANTI_DIAG_RANGE[a].with(b);
        between[a][b] = antiDiagAttacks(a, SquareSet.fromSquare(b)).intersect(diagAttacks(b, SquareSet.fromSquare(a)));
      } else if (RANK_ATTACKS[a][0][0].has(b)) {
        ray[a][b] = RANK_ATTACKS[a][0][0].with(a);
        between[a][b] = rankAttacks(a, SquareSet.fromSquare(b)).intersect(rankAttacks(b, SquareSet.fromSquare(a)));
      } else if (FILE_RANGE[a].has(b)) {
        ray[a][b] = FILE_RANGE[a].with(a);
        between[a][b] = fileAttacks(a, SquareSet.fromSquare(b)).intersect(fileAttacks(b, SquareSet.fromSquare(a)));
      } else {
        ray[a][b] = SquareSet.empty();
        between[a][b] = SquareSet.empty();
      }
    }
  }
  for (let a = 0; a < 64; a++) {
    for (let b = 0; b < a; b++) {
      ray[b][a] = ray[a][b];
      between[b][a] = between[a][b];
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
