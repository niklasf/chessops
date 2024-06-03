import { SquareSet } from './squareSet.js';
import { ByColor, ByRole, Color, COLORS, Piece, Role, ROLES, Square } from './types.js';

/**
 * Piece positions on a board.
 *
 * Properties are sets of squares, like `board.occupied` for all occupied
 * squares, `board[color]` for all pieces of that color, and `board[role]`
 * for all pieces of that role. When modifying the properties directly, take
 * care to keep them consistent.
 */
export class Board implements Iterable<[Square, Piece]>, ByRole<SquareSet>, ByColor<SquareSet> {
  /**
   * All occupied squares.
   * @type {SquareSet}
   */
  occupied: SquareSet;

  /**
   * All squares occupied by pieces known to be promoted.
   * This information is relevant in chess variants like Crazyhouse.
   * @type {SquareSet}
   */
  promoted: SquareSet;

  /** @type {SquareSet} */
  white: SquareSet;
  /** @type {SquareSet} */
  black: SquareSet;

  /** @type {SquareSet} */
  pawn: SquareSet;
  /** @type {SquareSet} */
  knight: SquareSet;
  /** @type {SquareSet} */
  bishop: SquareSet;
  /** @type {SquareSet} */
  rook: SquareSet;
  /** @type {SquareSet} */
  queen: SquareSet;
  /** @type {SquareSet} */
  king: SquareSet;

  private constructor() { }

  /**
   * Creates a new board with the default starting position for standard chess.
   * @returns {Board} The default board.
   */
  static default(): Board {
    const board = new Board();
    board.reset();
    return board;
  }

  /**
   * Resets all pieces to the default starting position for standard chess.
   */
  reset(): void {
    this.occupied = new SquareSet(0xffff, 0xffff_0000);
    this.promoted = SquareSet.empty();
    this.white = new SquareSet(0xffff, 0);
    this.black = new SquareSet(0, 0xffff_0000);
    this.pawn = new SquareSet(0xff00, 0x00ff_0000);
    this.knight = new SquareSet(0x42, 0x4200_0000);
    this.bishop = new SquareSet(0x24, 0x2400_0000);
    this.rook = new SquareSet(0x81, 0x8100_0000);
    this.queen = new SquareSet(0x8, 0x0800_0000);
    this.king = new SquareSet(0x10, 0x1000_0000);
  }

  /**
   * Creates a new empty board.
   * @returns {Board} The empty board.
   */
  static empty(): Board {
    const board = new Board();
    board.clear();
    return board;
  }

  /**
   * Clears the board by removing all pieces.
   */
  clear(): void {
    this.occupied = SquareSet.empty();
    this.promoted = SquareSet.empty();
    for (const color of COLORS) this[color] = SquareSet.empty();
    for (const role of ROLES) this[role] = SquareSet.empty();
  }

  /**
   * Creates a clone of the current board.
   * @returns {Board} The cloned board.
   */
  clone(): Board {
    const board = new Board();
    board.occupied = this.occupied;
    board.promoted = this.promoted;
    for (const color of COLORS) board[color] = this[color];
    for (const role of ROLES) board[role] = this[role];
    return board;
  }

  /**
   * Gets the color of the piece on the given square.
   * @param {Square} square The square to check.
   * @returns {Color | undefined} The color of the piece on the square, or undefined if the square is empty.
   */
  getColor(square: Square): Color | undefined {
    if (this.white.has(square)) return 'white';
    if (this.black.has(square)) return 'black';
    return;
  }

  /**
   * Gets the role of the piece on the given square.
   * @param {Square} square The square to check.
   * @returns {Role | undefined} The role of the piece on the square, or undefined if the square is empty.
   */
  getRole(square: Square): Role | undefined {
    for (const role of ROLES) {
      if (this[role].has(square)) return role;
    }
    return;
  }

  /**
   * Gets the piece on the given square.
   * @param {Square} square The square to check.
   * @returns {Piece | undefined} The piece on the square, or undefined if the square is empty.
   */
  get(square: Square): Piece | undefined {
    const color = this.getColor(square);
    if (!color) return;
    const role = this.getRole(square)!;
    const promoted = this.promoted.has(square);
    return { color, role, promoted };
  }

  /**
   * Removes and returns the piece from the given square, if any.
   * @param {Square} square The square to remove the piece from.
   * @returns {Piece | undefined} The removed piece, or undefined if the square was empty.
   */
  take(square: Square): Piece | undefined {
    const piece = this.get(square);
    if (piece) {
      this.occupied = this.occupied.without(square);
      this[piece.color] = this[piece.color].without(square);
      this[piece.role] = this[piece.role].without(square);
      if (piece.promoted) this.promoted = this.promoted.without(square);
    }
    return piece;
  }

  /**
   * Puts a piece onto the given square, potentially replacing an existing piece.
   * @param {Square} square The square to put the piece on.
   * @param {Piece} piece The piece to put on the square.
   * @returns {Piece | undefined} The replaced piece, or undefined if the square was empty.
   */
  set(square: Square, piece: Piece): Piece | undefined {
    const old = this.take(square);
    this.occupied = this.occupied.with(square);
    this[piece.color] = this[piece.color].with(square);
    this[piece.role] = this[piece.role].with(square);
    if (piece.promoted) this.promoted = this.promoted.with(square);
    return old;
  }

  /**
   * Checks if the given square is occupied by a piece.
   * @param {Square} square The square to check.
   * @returns {boolean} True if the square is occupied, false otherwise.
   */
  has(square: Square): boolean {
    return this.occupied.has(square);
  }

  /**
   * Iterates over all occupied squares and their corresponding pieces.
   * @yields {[Square, Piece]} The square and piece for each occupied square.
   */
  *[Symbol.iterator](): Iterator<[Square, Piece]> {
    for (const square of this.occupied) {
      yield [square, this.get(square)!];
    }
  }

  /**
   * Gets the set of squares occupied by pieces of the given color and role.
   * @param {Color} color The color of the pieces.
   * @param {Role} role The role of the pieces.
   * @returns {SquareSet} The set of squares occupied by pieces of the given color and role.
   */
  pieces(color: Color, role: Role): SquareSet {
    return this[color].intersect(this[role]);
  }

  /**
   * Gets the set of squares occupied by rooks and queens.
   * @returns {SquareSet} The set of squares occupied by rooks and queens.
   */
  rooksAndQueens(): SquareSet {
    return this.rook.union(this.queen);
  }

  /**
   * Gets the set of squares occupied by bishops and queens.
   * @returns {SquareSet} The set of squares occupied by bishops and queens.
   */
  bishopsAndQueens(): SquareSet {
    return this.bishop.union(this.queen);
  }

  /**
   * Finds the unique king of the given color, if any.
   * @param {Color} color The color of the king.
   * @returns {Square | undefined} The square of the king, or undefined if the king is not on the board.
   */
  kingOf(color: Color): Square | undefined {
    return this.pieces(color, 'king').singleSquare();
  }
}

/**
 * Checks if two boards are equal.
 * @param {Board} left The first board.
 * @param {Board} right The second board.
 * @returns {boolean} True if the boards are equal, false otherwise.
 */
export const boardEquals = (left: Board, right: Board): boolean =>
  left.white.equals(right.white)
  && left.promoted.equals(right.promoted)
  && ROLES.every(role => left[role].equals(right[role]));