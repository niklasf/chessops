import { CastlingSide, Color, COLORS, ROLES, Square, ByCastlingSide, ByColor, Rules } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';

export class MaterialSide {
  pawn: number;
  knight: number
  bishop: number;
  rook: number
  queen: number;
  king: number;

  private constructor() { }

  static empty(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = 0;
    return m;
  }

  clone(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role];
    return m;
  }
}

export class Material {
  white: MaterialSide;
  black: MaterialSide;

  private constructor() { }

  static empty(): Material {
    const m = new Material();
    for (const color of COLORS) m[color] = MaterialSide.empty();
    return m;
  }

  clone(): Material {
    const m = new Material();
    for (const color of COLORS) m[color] = this[color].clone();
    return m;
  }
}

export class RemainingChecks {
  white: number;
  black: number;

  constructor(white: number, black: number) {
    this.white = white;
    this.black = black;
  }

  static default(): RemainingChecks {
    return new RemainingChecks(3, 3);
  }

  clone(): RemainingChecks {
    return new RemainingChecks(this.white, this.black);
  }
}

export interface Setup {
  board: Board;
  pockets: Material | undefined;
  turn: Color;
  unmovedRooks: SquareSet;
  epSquare: Square | undefined;
  remainingChecks: RemainingChecks | undefined;
  halfmoves: number;
  fullmoves: number;
}

export function defaultSetup(): Setup {
  return {
    board: Board.default(),
    pockets: undefined,
    turn: 'white',
    unmovedRooks: SquareSet.corners(),
    epSquare: undefined,
    remainingChecks: undefined,
    halfmoves: 0,
    fullmoves: 1,
  };
}
