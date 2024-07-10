/**
 * An array of file names in a chess board.
 * @constant
 */
export const FILE_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

/**
 * The type representing a file name in a chess board.
 */
export type FileName = (typeof FILE_NAMES)[number];

/**
 * An array of rank names in a chess board.
 * @constant
 */
export const RANK_NAMES = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

/**
 * The type representing a rank name in a chess board.
 */
export type RankName = (typeof RANK_NAMES)[number];

/**
 * The type representing a square on the chess board.
 *
 * A number between 0 and 63, inclusive.
 */
export type Square = number;

/**
 * The type representing the name of a square on the chess board.
 */
export type SquareName = `${FileName}${RankName}`;

/**
 * The type representing an array indexed by squares.
 * @template T
 */
export type BySquare<T> = T[];

/**
 * An array of chess piece colors.
 * @constant
 */
export const COLORS = ['white', 'black'] as const;

/**
 * The type representing a chess piece color.
 */
export type Color = (typeof COLORS)[number];

/**
 * The type representing an object indexed by colors.
 * @template T
 */
export type ByColor<T> = {
  [color in Color]: T;
};

/**
 * An array of chess piece roles.
 * @constant
 */
export const ROLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'] as const;

/**
 * The type representing a chess piece role.
 */
export type Role = (typeof ROLES)[number];

/**
 * The type representing an object indexed by roles.
 * @template T
 */
export type ByRole<T> = {
  [role in Role]: T;
};

/**
 * An array of castling sides.
 * @constant
 */
export const CASTLING_SIDES = ['a', 'h'] as const;

/**
 * The type representing a castling side.
 */
export type CastlingSide = (typeof CASTLING_SIDES)[number];

/**
 * The type representing an object indexed by castling sides.
 * @template T
 */
export type ByCastlingSide<T> = {
  [side in CastlingSide]: T;
};

/**
 * An interface representing a chess piece.
 * @interface Piece
 * @property {Role} role The role of the piece.
 * @property {Color} color The color of the piece.
 * @property {boolean} [promoted] Whether the piece is promoted (optional).
 */
export interface Piece {
  role: Role;
  color: Color;
  promoted?: boolean;
}

/**
 * An interface representing a normal chess move.
 * @interface NormalMove
 * @property {Square} from The starting square of the move.
 * @property {Square} to The destination square of the move.
 * @property {Role} [promotion] The role to promote the pawn to (optional).
 */
export interface NormalMove {
  from: Square;
  to: Square;
  promotion?: Role;
}

/**
 * An interface representing a drop move in chess variants.
 * @interface DropMove
 * @property {Role} role The role of the piece being dropped.
 * @property {Square} to The square where the piece is dropped.
 */
export interface DropMove {
  role: Role;
  to: Square;
}

/**
 * The type representing a chess move (either a normal move or a drop move).
 */
export type Move = NormalMove | DropMove;

/**
 * A type guard function to check if a move is a drop move.
 * @function isDrop
 * @param {Move} v The move to check.
 * @returns {v is DropMove} - Returns true if the move is a drop move.
 */
export const isDrop = (v: Move): v is DropMove => 'role' in v;

/**
 * A type guard function to check if a move is a normal move.
 * @function isNormal
 * @param {Move} v The move to check.
 * @returns {v is NormalMove} - Returns true if the move is a normal move.
 */
export const isNormal = (v: Move): v is NormalMove => 'from' in v;

/**
 * An array of chess variant rules.
 * @constant
 */
export const RULES = [
  'chess',
  'antichess',
  'kingofthehill',
  '3check',
  'atomic',
  'horde',
  'racingkings',
  'crazyhouse',
] as const;

/**
 * The type representing a chess variant rule.
 */
export type Rules = (typeof RULES)[number];

/**
 * An interface representing the outcome of a chess game.
 * @interface Outcome
 * @property {Color | undefined} winner The color of the winning side, or undefined if the game is a draw.
 */
export interface Outcome {
  winner: Color | undefined;
}
