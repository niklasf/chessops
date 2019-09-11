import { SquareSet } from './squareSet';

type Square = number;

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
  const h = SquareSet.fromRank(0).union(SquareSet.fromRank(7)).difference(SquareSet.fromRank(square >> 3));
  const v = SquareSet.fromFile(0).union(SquareSet.fromFile(7)).difference(SquareSet.fromFile(square & 7));
  return h.union(v);
}

type BySquare<T> = { [square: number]: T };
type Attacks = { [lo: number]: { [hi : number]: SquareSet } };

function slidingAttackTable(deltas: number[]): [BySquare<SquareSet>, BySquare<Attacks>] {
  const masks = [];
  const table = [];
  for (let square = 0; square < 64; square++) {
    const mask = slidingAttacks(square, SquareSet.empty(), deltas).difference(edges(square));
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

export const KING_ATTACKS = stepAttackTable([-9, -8, -7, -1, 1, 7, 8, 9]);
export const KNIGHT_ATTACKS = stepAttackTable([-17, -15, -10, -6, 6, 10, 15, 17]);
export const PAWN_ATTACKS = {
  white: stepAttackTable([7, 9]),
  black: stepAttackTable([-7, -9])
};

const [DIAG_MASKS, DIAG_ATTACKS] = slidingAttackTable([-9, -7, 7, 9]);
const [ROOK_MASKS, ROOK_ATTACKS] = slidingAttackTable([-8, -1, 1, 8]);

export function bishopAttacks(square: Square, occupied: SquareSet): SquareSet {
  const occ = DIAG_MASKS[square].intersection(occupied);
  return DIAG_ATTACKS[square][occ.lo][occ.hi];
}

export function rookAttacks(square: Square, occupied: SquareSet): SquareSet {
  const occ = ROOK_MASKS[square].intersection(occupied);
  return ROOK_ATTACKS[square][occ.lo][occ.hi];
}

export function queenAttacks(square: Square, occupied: SquareSet): SquareSet {
  return bishopAttacks(square, occupied).xor(rookAttacks(square, occupied));
}

function rayTables(): [BySquare<BySquare<SquareSet>>, BySquare<BySquare<SquareSet>>] {
  const rays = {}, between = {};
  for (let a = 0; a < 64; a++) {
    rays[a] = [];
    between[a] = [];
    for (let b = 0; b < 64; b++) {
      if (DIAG_ATTACKS[a][0][0].has(b)) {
        rays[a][b] = DIAG_ATTACKS[a][0][0].intersection(DIAG_ATTACKS[b][0][0]).with(a).with(b);
        between[a][b] = bishopAttacks(a, SquareSet.fromSquare(b)).intersection(bishopAttacks(b, SquareSet.fromSquare(a)));
      } else if (ROOK_ATTACKS[a][0][0].has(b)) {
        rays[a][b] = ROOK_ATTACKS[a][0][0].intersection(ROOK_ATTACKS[b][0][0]).with(a).with(b);
        between[a][b] = rookAttacks(a, SquareSet.fromSquare(b)).intersection(rookAttacks(b, SquareSet.fromSquare(a)));
      } else {
        rays[a][b] = SquareSet.empty();
        between[a][b] = SquareSet.empty();
      }
    }
  }
  return [rays, between];
}

export const [RAYS, BETWEEN] = rayTables();
