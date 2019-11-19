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

  nonEmpty(): boolean {
    return ROLES.some(role => this[role] > 0);
  }

  isEmpty(): boolean {
    return !this.nonEmpty();
  }

  hasPawns(): boolean {
    return this.pawn > 0;
  }

  hasNonPawns(): boolean {
    return this.knight > 0 || this.bishop > 0 || this.rook > 0 || this.queen > 0 || this.king > 0;
  }

  count(): number {
    return this.pawn + this.knight + this.bishop + this.rook + this.queen + this.king;
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

  count(): number {
    return this.white.count() + this.black.count();
  }

  isEmpty(): boolean {
    return this.white.isEmpty() && this.black.isEmpty();
  }

  nonEmpty(): boolean {
    return !this.isEmpty();
  }

  hasPawns(): boolean {
    return this.white.hasPawns() || this.black.hasPawns();
  }

  hasNonPawns(): boolean {
    return this.white.hasNonPawns() || this.black.hasNonPawns();
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

export default interface Setup {
  board: Board;
  pockets: Material | undefined;
  turn: Color;
  unmovedRooks: SquareSet;
  epSquare: Square | undefined;
  remainingChecks: RemainingChecks | undefined;
  halfmoves: number;
  fullmoves: number;
}

export { Setup }

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
