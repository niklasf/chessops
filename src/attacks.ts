/**
 * Compute attacks and rays.
 *
 * These are low-level functions that can be used to implement chess rules.
 *
 * Implementation notes: Sliding attacks are computed using
 * [Hyperbola Quintessence](https://www.chessprogramming.org/Hyperbola_Quintessence).
 * Magic Bitboards would deliver slightly faster lookups, but also require
 * initializing considerably larger attack tables. On the web, initialization
 * time is important, so the chosen method may strike a better balance.
 *
 * @packageDocumentation
 */

import { SquareSet } from './squareSet.js';
import { BySquare, Color, Piece, Square } from './types.js';
import { squareFile, squareRank } from './util.js';

/**
 * Computes the range of squares that can be reached from a given square by a set of deltas.
 * @param {Square} square The starting square.
 * @param {number[]} deltas An array of deltas representing the offsets from the starting square.
 * @returns {SquareSet} The set of squares that can be reached from the starting square.
 */
const computeRange = (square: Square, deltas: number[]): SquareSet => {
  let range = SquareSet.empty();
  for (const delta of deltas) {
    const sq = square + delta;
    if (0 <= sq && sq < 64 && Math.abs(squareFile(square) - squareFile(sq)) <= 2) {
      range = range.with(sq);
    }
  }
  return range;
};

/**
 * Creates a table of values for each square on the chessboard by applying a given function.
 * @template T The type of the values in the table.
 * @param {(square: Square) => T} f The function to apply to each square.
 * @returns {BySquare<T>} The table of values for each square.
 */
const tabulate = <T>(f: (square: Square) => T): BySquare<T> => {
  const table = [];
  for (let square = 0; square < 64; square++) table[square] = f(square);
  return table;
};

/**
 * A pre-computed table of king attacks for each square on the chessboard.
 * @type {BySquare<SquareSet>}
 */
const KING_ATTACKS: BySquare<SquareSet> = tabulate(sq => computeRange(sq, [-9, -8, -7, -1, 1, 7, 8, 9]));

/**
 * A pre-computed table of knight attacks for each square on the chessboard.
 * @type {BySquare<SquareSet>}
 */
const KNIGHT_ATTACKS: BySquare<SquareSet> = tabulate(sq => computeRange(sq, [-17, -15, -10, -6, 6, 10, 15, 17]));

/**
 * A pre-computed table of pawn attacks for each square on the chessboard, separated by color.
 * @type {{ white: BySquare<SquareSet>; black: BySquare<SquareSet> }}
 */
const PAWN_ATTACKS: {
  white: BySquare<SquareSet>;
  black: BySquare<SquareSet>;
} = {
  white: tabulate(sq => computeRange(sq, [7, 9])),
  black: tabulate(sq => computeRange(sq, [-7, -9])),
};

/**
 * Returns the set of squares attacked by a king on a given square.
 * @param {Square} square The square occupied by the king.
 * @returns {SquareSet} The set of squares attacked by the king.
 */
export const kingAttacks = (square: Square): SquareSet => KING_ATTACKS[square];

/**
 * Returns the set of squares attacked by a knight on a given square.
 * @param {Square} square The square occupied by the knight.
 * @returns {SquareSet} The set of squares attacked by the knight.
 */
export const knightAttacks = (square: Square): SquareSet => KNIGHT_ATTACKS[square];

/**
 * Returns the set of squares attacked by a pawn of a given color on a given square.
 * @param {Color} color The color of the pawn.
 * @param {Square} square The square occupied by the pawn.
 * @returns {SquareSet} The set of squares attacked by the pawn.
 */
export const pawnAttacks = (color: Color, square: Square): SquareSet => PAWN_ATTACKS[color][square];

/**
 * A pre-computed table of file ranges for each square on the chessboard.
 */
const FILE_RANGE = tabulate(sq => SquareSet.fromFile(squareFile(sq)).without(sq));

/**
 * A pre-computed table of rank ranges for each square on the chessboard.
 */
const RANK_RANGE = tabulate(sq => SquareSet.fromRank(squareRank(sq)).without(sq));

/**
 * A pre-computed table of diagonal ranges for each square on the chessboard.
 */
const DIAG_RANGE = tabulate(sq => {
  const diag = new SquareSet(0x0804_0201, 0x8040_2010);
  const shift = 8 * (squareRank(sq) - squareFile(sq));
  return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});

/**
 * A pre-computed table of anti-diagonal ranges for each square on the chessboard.
 */
const ANTI_DIAG_RANGE = tabulate(sq => {
  const diag = new SquareSet(0x1020_4080, 0x0102_0408);
  const shift = 8 * (squareRank(sq) + squareFile(sq) - 7);
  return (shift >= 0 ? diag.shl64(shift) : diag.shr64(-shift)).without(sq);
});

/**
 * Computes the attacks on a given bit position using a hyperbola quintessence algorithm.
 * @param {SquareSet} bit The bit position to compute attacks for.
 * @param {SquareSet} range The range of squares to consider for attacks.
 * @param {SquareSet} occupied The set of occupied squares on the chessboard.
 * @returns {SquareSet} The set of squares that attack the given bit position.
 */
const hyperbola = (bit: SquareSet, range: SquareSet, occupied: SquareSet): SquareSet => {
  let forward = occupied.intersect(range);
  let reverse = forward.bswap64(); // Assumes no more than 1 bit per rank
  forward = forward.minus64(bit);
  reverse = reverse.minus64(bit.bswap64());
  return forward.xor(reverse.bswap64()).intersect(range);
};

/**
 * Computes the file attacks for a given square and occupied squares on the chessboard.
 * @param {Square} square The square to compute file attacks for.
 * @param {SquareSet} occupied The set of occupied squares on the chessboard.
 * @returns {SquareSet} The set of squares that attack the given square along the file.
 */
const fileAttacks = (square: Square, occupied: SquareSet): SquareSet =>
  hyperbola(SquareSet.fromSquare(square), FILE_RANGE[square], occupied);

/**
 * Computes the rank attacks for a given square and occupied squares on the chessboard.
 * @param {Square} square The square to compute rank attacks for.
 * @param {SquareSet} occupied The set of occupied squares on the chessboard.
 * @returns {SquareSet} The set of squares that attack the given square along the rank.
 */
const rankAttacks = (square: Square, occupied: SquareSet): SquareSet => {
  const range = RANK_RANGE[square];
  let forward = occupied.intersect(range);
  let reverse = forward.rbit64();
  forward = forward.minus64(SquareSet.fromSquare(square));
  reverse = reverse.minus64(SquareSet.fromSquare(63 - square));
  return forward.xor(reverse.rbit64()).intersect(range);
};

/**
 * Returns squares attacked or defended by a bishop on `square`, given `occupied` squares.
 *
 * @param {Square} square The bitboard square index where the bishop is located.
 * @param {SquareSet} occupied The set of occupied squares on the chessboard.
 * @returns {SquareSet} The set of squares attacked or defended by the bishop.
 * @description Uses `occupied` to determine blocked squares and exclude them from the result.
 * The hyperbola quintessence algorithm is used to efficiently compute the bishop attacks.
 */
export const bishopAttacks = (square: Square, occupied: SquareSet): SquareSet => {
  const bit = SquareSet.fromSquare(square);
  return hyperbola(bit, DIAG_RANGE[square], occupied).xor(hyperbola(bit, ANTI_DIAG_RANGE[square], occupied));
};

/**
 * Returns squares attacked or defended by a rook on `square`, given `occupied` squares.
 *
 * @param {Square} square The bitboard square index where the rook is located.
 * @param {SquareSet} occupied The set of occupied squares on the chessboard.
 * @returns {SquareSet} The set of squares attacked or defended by the rook.
 * @description Uses `occupied` to determine blocked squares and exclude them from the result.
 * The hyperbola quintessence algorithm is used to efficiently compute the rook attacks.
 */
export const rookAttacks = (square: Square, occupied: SquareSet): SquareSet =>
  fileAttacks(square, occupied).xor(rankAttacks(square, occupied));

/**
 * Returns squares attacked or defended by a queen on `square`, given `occupied` squares.
 *
 * @param {Square} square The bitboard square index where the queen is located.
 * @param {SquareSet} occupied The set of occupied squares on the chessboard.
 * @returns {SquareSet} The set of squares attacked or defended by the queen.
 * @description Uses `occupied` to determine blocked squares and exclude them from the result.
 * The hyperbola quintessence algorithm is used to efficiently compute the queen attacks.
 */
export const queenAttacks = (square: Square, occupied: SquareSet): SquareSet =>
  bishopAttacks(square, occupied).xor(rookAttacks(square, occupied));

/**
 * Returns squares attacked or defended by a `piece` on `square`, given `occupied` squares.
 *
 * @param {Piece} piece The chess piece object.
 * @param {Square} square The bitboard square index where the piece is located.
 * @param {SquareSet} occupied The set of occupied squares on the chessboard.
 * @returns {SquareSet} The set of squares attacked or defended by the piece.
 * @description Uses `occupied` to determine blocked squares and exclude them from the result.
 */
export const attacks = (piece: Piece, square: Square, occupied: SquareSet): SquareSet => {
  switch (piece.role) {
    case 'pawn':
      return pawnAttacks(piece.color, square);
    case 'knight':
      return knightAttacks(square);
    case 'bishop':
      return bishopAttacks(square, occupied);
    case 'rook':
      return rookAttacks(square, occupied);
    case 'queen':
      return queenAttacks(square, occupied);
    case 'king':
      return kingAttacks(square);
  }
};

/**
 * Returns all squares of the rank, file, or diagonal with the two squares `a` and `b`.
 *
 * @param {Square} a The first bitboard square index.
 * @param {Square} b The second bitboard square index.
 * @returns {SquareSet} The set of squares aligned with `a` and `b`.
 * @description Returns an empty set if `a` and `b` are not on the same rank, file, or diagonal.
 */
export const ray = (a: Square, b: Square): SquareSet => {
  const other = SquareSet.fromSquare(b);
  if (RANK_RANGE[a].intersects(other)) return RANK_RANGE[a].with(a);
  if (ANTI_DIAG_RANGE[a].intersects(other)) return ANTI_DIAG_RANGE[a].with(a);
  if (DIAG_RANGE[a].intersects(other)) return DIAG_RANGE[a].with(a);
  if (FILE_RANGE[a].intersects(other)) return FILE_RANGE[a].with(a);
  return SquareSet.empty();
};

/**
 * Returns all squares between `a` and `b` (bounds not included).
 * Works in all directions and diagonals.
 *
 * @param {Square} a The first bitboard square index.
 * @param {Square} b The second bitboard square index.
 * @returns {SquareSet} The set of squares between `a` and `b`.
 * @description Returns an empty set if `a` and `b` are not on the same rank, file, or diagonal.
 */
export const between = (a: Square, b: Square): SquareSet =>
  ray(a, b)
    .intersect(SquareSet.full().shl64(a).xor(SquareSet.full().shl64(b)))
    .withoutFirst();
