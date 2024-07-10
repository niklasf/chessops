import { Board, boardEquals } from './board.js';
import { SquareSet } from './squareSet.js';
import { ByColor, ByRole, Color, Role, ROLES, Square } from './types.js';

/**
 * Represents the material configuration for one side (color) in a chess position.
 * @implements {ByRole<number>}
 * @property {number} pawn The number of pawns on the side.
 * @property {number} knight The number of knights on the side.
 * @property {number} bishop The number of bishops on the side.
 * @property {number} rook The number of rooks on the side.
 * @property {number} queen The number of queens on the side.
 * @property {number} king The number of kings on the side.
 */
export class MaterialSide implements ByRole<number> {
  /**
   * The number of pawns.
   */
  pawn: number;

  /**
   * The number of knights.
   */
  knight: number;

  /**
   * The number of bishops.
   */
  bishop: number;

  /**
   * The number of rooks.
   */
  rook: number;

  /**
   * The number of queens.
   */
  queen: number;

  /**
   * The number of kings.
   */
  king: number;

  private constructor() {}

  /**
   * Creates an empty MaterialSide instance.
   * @returns {MaterialSide} The empty MaterialSide instance.
   */
  static empty(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = 0;
    return m;
  }

  /**
   * Creates a MaterialSide instance from a Board for a specific color.
   * @param {Board} board The Board to create the MaterialSide from.
   * @param {Color} color The color to create the MaterialSide for.
   * @returns {MaterialSide} The MaterialSide instance derived from the Board.
   */
  static fromBoard(board: Board, color: Color): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = board.pieces(color, role).size();
    return m;
  }

  /**
   * Creates a clone of the MaterialSide instance.
   * @returns {MaterialSide} The cloned MaterialSide instance.
   */
  clone(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role];
    return m;
  }

  /**
   * Checks if the MaterialSide instance is equal to another MaterialSide instance.
   * @param {MaterialSide} other The other MaterialSide instance to compare.
   * @returns {boolean} `true` if the MaterialSide instances are equal, `false` otherwise.
   */
  equals(other: MaterialSide): boolean {
    return ROLES.every(role => this[role] === other[role]);
  }

  /**
   * Adds another MaterialSide instance to the current MaterialSide instance.
   * @param {MaterialSide} other The MaterialSide instance to add.
   * @returns {MaterialSide} A new MaterialSide instance representing the sum.
   */
  add(other: MaterialSide): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role] + other[role];
    return m;
  }

  /**
   * Subtracts another MaterialSide instance from the current MaterialSide instance.
   * @param {MaterialSide} other The MaterialSide instance to subtract.
   * @returns {MaterialSide} A new MaterialSide instance representing the difference.
   */
  subtract(other: MaterialSide): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role] - other[role];
    return m;
  }

  /**
   * Checks if the MaterialSide is not empty (has pieces).
   * @returns {boolean} `true` if the MaterialSide is not empty, `false` otherwise.
   */
  nonEmpty(): boolean {
    return ROLES.some(role => this[role] > 0);
  }

  /**
   * Checks if the MaterialSide is empty (no pieces).
   * @returns {boolean} `true` if the MaterialSide is empty, `false` otherwise.
   */
  isEmpty(): boolean {
    return !this.nonEmpty();
  }

  /**
   * Checks if the MaterialSide has pawns.
   * @returns {boolean} `true` if the MaterialSide has pawns, `false` otherwise.
   */
  hasPawns(): boolean {
    return this.pawn > 0;
  }

  /**
   * Checks if the MaterialSide has non-pawn pieces.
   * @returns {boolean} `true` if the MaterialSide has non-pawn pieces, `false` otherwise.
   */
  hasNonPawns(): boolean {
    return this.knight > 0 || this.bishop > 0 || this.rook > 0 || this.queen > 0 || this.king > 0;
  }

  /**
   * Calculates the total size of the MaterialSide (number of pieces).
   * @returns {number} The total size of the MaterialSide.
   */
  size(): number {
    return this.pawn + this.knight + this.bishop + this.rook + this.queen + this.king;
  }
}

/**
 * Represents the material configuration of a chess position.
 * @implements {ByColor<MaterialSide>}
 * @property {MaterialSide} white The material configuration for white.
 * @property {MaterialSide} black The material configuration for black.
 */
export class Material implements ByColor<MaterialSide> {
  /**
   * Creates a new Material instance.
   * @param {MaterialSide} white The material configuration for white.
   * @param {MaterialSide} black The material configuration for black.
   */
  constructor(
    public white: MaterialSide,
    public black: MaterialSide,
  ) {}

  /**
   * Creates an empty Material instance.
   * @returns {Material} The empty Material instance.
   */
  static empty(): Material {
    return new Material(MaterialSide.empty(), MaterialSide.empty());
  }

  /**
   * Creates a Material instance from a Board.
   * @param {Board} board The Board to create the Material from.
   * @returns {Material} The Material instance derived from the Board.
   */
  static fromBoard(board: Board): Material {
    return new Material(MaterialSide.fromBoard(board, 'white'), MaterialSide.fromBoard(board, 'black'));
  }

  /**
   * Creates a clone of the Material instance.
   * @returns {Material} The cloned Material instance.
   */
  clone(): Material {
    return new Material(this.white.clone(), this.black.clone());
  }

  /**
   * Checks if the Material instance is equal to another Material instance.
   * @param {Material} other The other Material instance to compare.
   * @returns {boolean} `true` if the Material instances are equal, `false` otherwise.
   */
  equals(other: Material): boolean {
    return this.white.equals(other.white) && this.black.equals(other.black);
  }

  /**
   * Adds another Material instance to the current Material instance.
   * @param {Material} other The Material instance to add.
   * @returns {Material} A new Material instance representing the sum.
   */
  add(other: Material): Material {
    return new Material(this.white.add(other.white), this.black.add(other.black));
  }

  /**
   * Subtracts another Material instance from the current Material instance.
   * @param {Material} other The Material instance to subtract.
   * @returns {Material} A new Material instance representing the difference.
   */
  subtract(other: Material): Material {
    return new Material(this.white.subtract(other.white), this.black.subtract(other.black));
  }

  /**
   * Counts the number of pieces of a specific role.
   * @param {Role} role The role to count.
   * @returns {number} The count of pieces with the specified role.
   */
  count(role: Role): number {
    return this.white[role] + this.black[role];
  }

  /**
   * Calculates the total size of the Material (number of pieces).
   * @returns {number} The total size of the Material.
   */
  size(): number {
    return this.white.size() + this.black.size();
  }

  /**
   * Checks if the Material is empty (no pieces).
   * @returns {boolean} `true` if the Material is empty, `false` otherwise.
   */
  isEmpty(): boolean {
    return this.white.isEmpty() && this.black.isEmpty();
  }

  /**
   * Checks if the Material is not empty (has pieces).
   * @returns {boolean} `true` if the Material is not empty, `false` otherwise.
   */
  nonEmpty(): boolean {
    return !this.isEmpty();
  }

  /**
   * Checks if the Material has pawns.
   * @returns {boolean} `true` if the Material has pawns, `false` otherwise.
   */
  hasPawns(): boolean {
    return this.white.hasPawns() || this.black.hasPawns();
  }

  /**
   * Checks if the Material has non-pawn pieces.
   * @returns {boolean} `true` if the Material has non-pawn pieces, `false` otherwise.
   */
  hasNonPawns(): boolean {
    return this.white.hasNonPawns() || this.black.hasNonPawns();
  }
}

/**
 * Represents the remaining checks count for each color.
 * @implements {ByColor<number>}
 */
export class RemainingChecks implements ByColor<number> {
  /**
   * Creates a new instance of the RemainingChecks class.
   * @param {number} white The remaining checks count for the white player.
   * @param {number} black The remaining checks count for the black player.
   */
  constructor(
    public white: number,
    public black: number,
  ) {}

  /**
   * Returns the default remaining checks count for each color.
   * @returns {RemainingChecks} The default remaining checks count.
   */
  static default(): RemainingChecks {
    return new RemainingChecks(3, 3);
  }

  /**
   * Creates a clone of the RemainingChecks instance.
   * @returns {RemainingChecks} A new instance with the same remaining checks count.
   */
  clone(): RemainingChecks {
    return new RemainingChecks(this.white, this.black);
  }

  /**
   * Checks if the RemainingChecks instance is equal to another instance.
   * @param {RemainingChecks} other The other RemainingChecks instance to compare.
   * @returns {boolean} `true` if the instances are equal, `false` otherwise.
   */
  equals(other: RemainingChecks): boolean {
    return this.white === other.white && this.black === other.black;
  }
}

/**
 * Represents the setup of a chess position.
 * @interface Setup
 * @property {Board} board The chess board.
 * @property {Material | undefined} pockets The material in the pockets.
 * @property {Color} turn The color of the side to move.
 * @property {SquareSet} castlingRights The castling rights.
 * @property {Square | undefined} epSquare A square where en passant is possible.
 * @property {RemainingChecks | undefined} remainingChecks The remaining checks.
 * @property {number} halfmoves The number of halfmoves since the last pawn advance or capture.
 * @property {number} fullmoves The number of fullmoves.
 */
export interface Setup {
  /**
   * The chess board.
   */
  board: Board;
  /**
   * The material in the pockets.
   */
  pockets: Material | undefined;
  /**
   * The color of the side to move.
   */
  turn: Color;
  /**
   * The castling rights.
   */
  castlingRights: SquareSet;
  /**
   * A square where en passant is possible.
   */
  epSquare: Square | undefined;

  /**
   * The remaining checks. Used in multi-check variants.
   */
  remainingChecks: RemainingChecks | undefined;

  /**
   * The number of halfmoves since the last pawn advance or capture.
   *
   * A halfmove is when a side makes a move.
   */
  halfmoves: number;

  /**
   * The number of fullmoves.
   *
   * A fullmove is when both sides make a move.
   */
  fullmoves: number;
}

/**
 * Creates a default setup for a standard chess position.
 * @returns {Setup} The default setup.
 */
export const defaultSetup = (): Setup => ({
  board: Board.default(),
  pockets: undefined,
  turn: 'white',
  castlingRights: SquareSet.corners(),
  epSquare: undefined,
  remainingChecks: undefined,
  halfmoves: 0,
  fullmoves: 1,
});

/**
 * Creates a clone of a given setup.
 * @param {Setup} setup The setup to clone.
 * @returns {Setup} The cloned setup.
 */
export const setupClone = (setup: Setup): Setup => ({
  board: setup.board.clone(),
  pockets: setup.pockets?.clone(),
  turn: setup.turn,
  castlingRights: setup.castlingRights,
  epSquare: setup.epSquare,
  remainingChecks: setup.remainingChecks?.clone(),
  halfmoves: setup.halfmoves,
  fullmoves: setup.fullmoves,
});

/**
 * Checks if two setups are equal.
 * @param {Setup} left The first setup.
 * @param {Setup} right The second setup.
 * @returns {boolean} `true` if the setups are equal, `false` otherwise.
 */
export const setupEquals = (left: Setup, right: Setup): boolean =>
  boardEquals(left.board, right.board)
  && ((right.pockets && left.pockets?.equals(right.pockets)) || (!left.pockets && !right.pockets))
  && left.turn === right.turn
  && left.castlingRights.equals(right.castlingRights)
  && left.epSquare === right.epSquare
  && ((right.remainingChecks && left.remainingChecks?.equals(right.remainingChecks))
    || (!left.remainingChecks && !right.remainingChecks))
  && left.halfmoves === right.halfmoves
  && left.fullmoves === right.fullmoves;
