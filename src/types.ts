export type Square = 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1' |
                     'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' |
                     'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' |
                     'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' |
                     'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' |
                     'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' |
                     'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' |
                     'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8';

export const SQUARES: Square[] = [
    'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
    'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
    'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
    'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
    'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
    'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
    'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'
];

export type Color = 'white' | 'black';

export const COLORS: Color[] = ['white', 'black'];

export type Role = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';

export const ROLES: Role[] = ['pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

export interface Piece {
  role: Role;
  color: Color;
  promoted?: boolean;
}

export interface Board {
  [square: string]: Piece | undefined;
}

export interface Colored<T> {
  white: T,
  black: T,
}

export type Material = {
  [role in Role]: number;
}

export interface Setup {
  board: Board;
  turn: Color;
  epSquare?: Square;
  castlingRights: Square[];
  pockets?: Colored<Material>;
  remainingChecks?: Colored<number>;
  halfmoves: number;
  fullmoves: number;
}

export type Rules = 'chess' | 'antichess' | 'kingOfTheHill' | 'threeCheck' | 'atomic' | 'horde' | 'racingKings' | 'crazyhouse';

export interface Position extends Setup {
  rules: Rules;
}
