import {
  CastlingSide,
  Color,
  FILE_NAMES,
  isDrop,
  isNormal,
  Move,
  RANK_NAMES,
  Role,
  Square,
  SquareName,
} from './types.js';

/**
 * A type guard function to check if a value is defined (not undefined).
 * @function defined
 * @template A
 * @param {A | undefined} v The value to check.
 * @returns {v is A} Returns true if the value is defined (not undefined).
 */
export const defined = <A>(v: A | undefined): v is A => v !== undefined;

/**
 * A function to get the opposite color of a given chess piece color.
 * @function opposite
 * @param {Color} color The color to get the opposite of.
 * @returns {Color} The opposite color.
 */
export const opposite = (color: Color): Color => (color === 'white' ? 'black' : 'white');

/**
 * A function to get the rank of a square on the chess board.
 * @function squareRank
 * @param {Square} square The square to get the rank of.
 * @returns {number} The rank of the square (0-7).
 */
export const squareRank = (square: Square): number => square >> 3;

/**
 * A function to get the file of a square on the chess board.
 * @function squareFile
 * @param {Square} square The square to get the file of.
 * @returns {number} The file of the square (0-7).
 */
export const squareFile = (square: Square): number => square & 0x7;

/**
 * A function to get the square corresponding to the given file and rank coordinates.
 * @function squareFromCoords
 * @param {number} file The file coordinate (0-7).
 * @param {number} rank The rank coordinate (0-7).
 * @returns {Square | undefined} The corresponding square if the coordinates are valid, or undefined if the coordinates are out of bounds.
 */
export const squareFromCoords = (file: number, rank: number): Square | undefined =>
  0 <= file && file < 8 && 0 <= rank && rank < 8 ? file + 8 * rank : undefined;

/**
 * A function to convert a chess piece role to its corresponding character representation.
 * @function roleToChar
 * @param {Role} role - The chess piece role.
 * @returns {string} - The character representation of the role.
 */
export const roleToChar = (role: Role): string => {
  switch (role) {
    case 'pawn':
      return 'p';
    case 'knight':
      return 'n';
    case 'bishop':
      return 'b';
    case 'rook':
      return 'r';
    case 'queen':
      return 'q';
    case 'king':
      return 'k';
  }
};

/**
 * A function to convert a character to its corresponding chess piece role.
 * @function charToRole
 * @param {string} ch - The character to convert.
 * @returns {Role | undefined} - The corresponding chess piece role, or undefined if the character is not valid.
 */
export function charToRole(ch: 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'): Role;
export function charToRole(ch: string): Role | undefined;
export function charToRole(ch: string): Role | undefined {
  switch (ch.toLowerCase()) {
    case 'p':
      return 'pawn';
    case 'n':
      return 'knight';
    case 'b':
      return 'bishop';
    case 'r':
      return 'rook';
    case 'q':
      return 'queen';
    case 'k':
      return 'king';
    default:
      return;
  }
}

/**
 * A function to parse a square name and return the corresponding square.
 * @function parseSquare
 * @param {string} str - The square name to parse.
 * @returns {Square | undefined} - The corresponding square, or undefined if the square name is not valid.
 */
export function parseSquare(str: SquareName): Square;
export function parseSquare(str: string): Square | undefined;
export function parseSquare(str: string): Square | undefined {
  if (str.length !== 2) return;
  return squareFromCoords(str.charCodeAt(0) - 'a'.charCodeAt(0), str.charCodeAt(1) - '1'.charCodeAt(0));
}

/**
 * A function to convert a square to its corresponding square name.
 * @function makeSquare
 * @param {Square} square - The square to convert.
 * @returns {SquareName} - The corresponding square name.
 */
export const makeSquare = (square: Square): SquareName =>
  (FILE_NAMES[squareFile(square)] + RANK_NAMES[squareRank(square)]) as SquareName;

/**
 * A function to parse a UCI (Universal Chess Interface) string and return the corresponding move.
 * @function parseUci
 * @param {string} str - The UCI string to parse.
 * @returns {Move | undefined} - The corresponding move, or undefined if the UCI string is not valid.
 */
export const parseUci = (str: string): Move | undefined => {
  if (str[1] === '@' && str.length === 4) {
    const role = charToRole(str[0]);
    const to = parseSquare(str.slice(2));
    if (role && defined(to)) return { role, to };
  } else if (str.length === 4 || str.length === 5) {
    const from = parseSquare(str.slice(0, 2));
    const to = parseSquare(str.slice(2, 4));
    let promotion: Role | undefined;
    if (str.length === 5) {
      promotion = charToRole(str[4]);
      if (!promotion) return;
    }
    if (defined(from) && defined(to)) return { from, to, promotion };
  }
  return;
};

/**
 * A function to check if two moves are equal.
 * @function moveEquals
 * @param {Move} left - The first move to compare.
 * @param {Move} right - The second move to compare.
 * @returns {boolean} - True if the moves are equal, false otherwise.
 */
export const moveEquals = (left: Move, right: Move): boolean => {
  if (left.to !== right.to) return false;
  if (isDrop(left)) return isDrop(right) && left.role === right.role;
  else return isNormal(right) && left.from === right.from && left.promotion === right.promotion;
};

/**
 * A function to convert a move to its corresponding UCI string representation.
 * @function makeUci
 * @param {Move} move - The move to convert.
 * @returns {string} - The corresponding UCI string representation of the move.
 */
export const makeUci = (move: Move): string =>
  isDrop(move)
    ? `${roleToChar(move.role).toUpperCase()}@${makeSquare(move.to)}`
    : makeSquare(move.from) + makeSquare(move.to) + (move.promotion ? roleToChar(move.promotion) : '');

/**
 * A function to get the square where the king castles to for a given color and castling side.
 * @function kingCastlesTo
 * @param {Color} color - The color of the king.
 * @param {CastlingSide} side - The castling side ('a' for queenside, 'h' for kingside).
 * @returns {Square} - The square where the king castles to.
 */
export const kingCastlesTo = (color: Color, side: CastlingSide): Square =>
  color === 'white' ? (side === 'a' ? 2 : 6) : side === 'a' ? 58 : 62;

/**
 * A function to get the square where the rook castles to for a given color and castling side.
 * @function rookCastlesTo
 * @param {Color} color - The color of the rook.
 * @param {CastlingSide} side - The castling side ('a' for queenside, 'h' for kingside).
 * @returns {Square} - The square where the rook castles to.
 */
export const rookCastlesTo = (color: Color, side: CastlingSide): Square =>
  color === 'white' ? (side === 'a' ? 3 : 5) : side === 'a' ? 59 : 61;