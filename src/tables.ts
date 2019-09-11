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

function attackTable(deltas: number[]): [BySquare<SquareSet>, BySquare<Attacks>] {
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

const [DIAG_MASKS, DIAG_ATTACKS] = attackTable([-9, -7, 7, 9]);
const [ROOK_MASKS, ROOK_ATTACKS] = attackTable([-8, -1, 1, 8]);
