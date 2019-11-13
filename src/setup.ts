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

  private constructor() { }

  static default(): RemainingChecks {
    const r = new RemainingChecks();
    r.white = 3;
    r.black = 3;
    return r;
  }

  clone(): RemainingChecks {
    const r = new RemainingChecks();
    for (const color of COLORS) r[color] = this[color];
    return r;
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
  rules: Rules;
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
    rules: 'chess',
  };
}
