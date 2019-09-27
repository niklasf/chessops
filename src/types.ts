export type Square = number;

export type Role = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export const ROLES: Role[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

export type Color = 'white' | 'black';

export const COLORS: Color[] = ['white', 'black'];

export interface Piece {
  role: Role;
  color: Color;
  promoted?: boolean;
}
