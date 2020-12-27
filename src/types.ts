import { FILES, RANKS } from './util';

export type File = typeof FILES[number];

export type Rank = typeof RANKS[number];

export type Square = number;

export type SquareName = `${File}${Rank}`;

export type BySquare<T> = T[];

export const COLORS = ['white', 'black'] as const;

export type Color = typeof COLORS[number];

export type ByColor<T> = {
  [color in Color]: T;
};

export const ROLES = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'] as const;

export type Role = typeof ROLES[number];

export type ByRole<T> = {
  [role in Role]: T;
};

export const CASTLING_SIDES = ['a', 'h'] as const;

export type CastlingSide = typeof CASTLING_SIDES[number];

export type ByCastlingSide<T> = {
  [side in CastlingSide]: T;
};

export interface Piece {
  role: Role;
  color: Color;
  promoted?: boolean;
}

export interface NormalMove {
  from: Square;
  to: Square;
  promotion?: Role;
}

export interface DropMove {
  role: Role;
  to: Square;
}

export type Move = NormalMove | DropMove;

export function isDrop(v: Move): v is DropMove {
  return 'role' in v;
}

export function isNormal(v: Move): v is NormalMove {
  return 'from' in v;
}

export const RULES = ['chess', 'antichess', 'kingofthehill', '3check', 'atomic', 'horde', 'racingkings', 'crazyhouse'] as const;

export type Rules = typeof RULES[number];

export interface Outcome {
  winner: Color | undefined;
}
