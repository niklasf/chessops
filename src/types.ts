export type Square = number;

export type SquareName = 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1' |
                         'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2' |
                         'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3' |
                         'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4' |
                         'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5' |
                         'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6' |
                         'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7' |
                         'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8';

export type BySquare<T> = { [square: number]: T };

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

export function isMove(v: Uci): v is UciMove {
  return 'from' in v;
}

export type Rules = 'chess' | 'antichess' | 'kingofthehill' | '3check' | 'atomic' | 'horde' | 'racingkings' | 'crazyhouse';

export const RULES: Rules[] = ['chess', 'antichess', 'kingofthehill', '3check', 'atomic', 'horde', 'racingkings', 'crazyhouse'];

export interface Outcome {
  winner: Color | undefined;
}
