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

export interface Piece {
  role: Role;
  color: Color;
  promoted?: boolean;
}
