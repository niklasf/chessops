import { Square, Piece } from './types';
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

export const KING_ATTACKS = stepAttackTable([-9, -8, -7, -1, 1, 7, 8, 9]);
export const KNIGHT_ATTACKS = stepAttackTable([-17, -15, -10, -6, 6, 10, 15, 17]);
export const PAWN_ATTACKS = {
  white: stepAttackTable([7, 9]),
  black: stepAttackTable([-7, -9])
};

const [DIAG_MASKS, DIAG_ATTACKS] = slidingAttackTable([-9, -7, 7, 9]);
const [RANK_MASKS, RANK_ATTACKS] = slidingAttackTable([-1, 1]);
const [FILE_MASKS, FILE_ATTACKS] = slidingAttackTable([-8, 8]);

export function bishopAttacks(square: Square, occupied: SquareSet): SquareSet {
  const occ = DIAG_MASKS[square].intersect(occupied);
  return DIAG_ATTACKS[square][occ.lo][occ.hi];
}

function rankAttacks(square: Square, occupied: SquareSet): SquareSet {
  const occ = RANK_MASKS[square].intersect(occupied);
  return RANK_ATTACKS[square][occ.lo][occ.hi];
}

function fileAttacks(square: Square, occupied: SquareSet): SquareSet {
  const occ = FILE_MASKS[square].intersect(occupied);
  return FILE_ATTACKS[square][occ.lo][occ.hi];
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
  const rays: BySquare<BySquare<SquareSet>> = [], between: BySquare<BySquare<SquareSet>> = [];
  for (let a = 0; a < 64; a++) {
    rays[a] = [];
    between[a] = [];
    for (let b = 0; b < 64; b++) {
      if (DIAG_ATTACKS[a][0][0].has(b)) {
        rays[a][b] = DIAG_ATTACKS[a][0][0].intersect(DIAG_ATTACKS[b][0][0]).with(a).with(b);
        between[a][b] = bishopAttacks(a, SquareSet.fromSquare(b)).intersect(bishopAttacks(b, SquareSet.fromSquare(a)));
      } else if (RANK_ATTACKS[a][0][0].has(b)) {
        rays[a][b] = RANK_ATTACKS[a][0][0].with(a);
        between[a][b] = rankAttacks(a, SquareSet.fromSquare(b)).intersect(rankAttacks(b, SquareSet.fromSquare(a)));
      } else if (FILE_ATTACKS[a][0][0].has(b)) {
        rays[a][b] = FILE_ATTACKS[a][0][0].with(b);
        between[a][b] = fileAttacks(a, SquareSet.fromSquare(b)).intersect(fileAttacks(b, SquareSet.fromSquare(a)));
      } else {
        rays[a][b] = SquareSet.empty();
        between[a][b] = SquareSet.empty();
      }
    }
  }
  return [rays, between];
}

export const [RAYS, BETWEEN] = rayTables();

export function aligned(a: Square, b: Square, c: Square): boolean {
  return RAYS[a][b].has(c);
}
