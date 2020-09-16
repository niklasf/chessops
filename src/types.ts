export type Square = number;

export type SquareName = 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1' |
                         'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' |
                         'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' |
                         'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' |
                         'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' |
                         'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' |
                         'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' |
                         'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8';

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
