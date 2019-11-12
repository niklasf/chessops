export type Square = number;

export type Color = 'white' | 'black';

export const COLORS: Color[] = ['white', 'black'];

export type ByColor<T> = {
  [color in Color]: T;
};

export type Role = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export const ROLES: Role[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

export type ByRole<T> = {
  [role in Role]: T;
};

export type CastlingSide = 'a' | 'h';

export const CASTLING_SIDES: CastlingSide[] = ['a', 'h'];

export type ByCastlingSide<T> = {
  [side in CastlingSide]: T;
};

export interface Piece {
  role: Role;
  color: Color;
  promoted?: boolean;
}

export interface UciMove {
  from: Square;
  to: Square;
  promotion?: Role;
}

export interface UciDrop {
  role: Role;
  to: Square;
}

export type Uci = UciMove | UciDrop;

export function isDrop(v: Uci): v is UciDrop {
  return 'role' in v;
}

export type Rules = 'chess';

export const RULES = ['chess'];
