import { ByColor, ByRole, Color, Role, ROLES, Square } from './types.js';
import { SquareSet } from './squareSet.js';
import { ReadonlyBoard, Board, boardEquals } from './board.js';

export interface ReadonlyMaterialSide extends Readonly<ByRole<number>> {
  clone(): MaterialSide;
  equals(other: ReadonlyMaterialSide): boolean;
  add(other: ReadonlyMaterialSide): MaterialSide;
  nonEmpty(): boolean;
  isEmpty(): boolean;
  hasPawns(): boolean;
  hasNonPawns(): boolean;
  size(): number;
}

export class MaterialSide implements ReadonlyMaterialSide {
  pawn: number;
  knight: number;
  bishop: number;
  rook: number;
  queen: number;
  king: number;

  private constructor() {}

  static empty(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = 0;
    return m;
  }

  static fromBoard(board: ReadonlyBoard, color: Color): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = board.pieces(color, role).size();
    return m;
  }

  clone(): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role];
    return m;
  }

  equals(other: ReadonlyMaterialSide): boolean {
    return ROLES.every(role => this[role] === other[role]);
  }

  add(other: ReadonlyMaterialSide): MaterialSide {
    const m = new MaterialSide();
    for (const role of ROLES) m[role] = this[role] + other[role];
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

  size(): number {
    return this.pawn + this.knight + this.bishop + this.rook + this.queen + this.king;
  }
}

export interface ReadonlyMaterial extends Readonly<ByColor<ReadonlyMaterialSide>> {
  clone(): Material;
  equals(other: ReadonlyMaterial): boolean;
  add(other: ReadonlyMaterial): Material;
  count(role: Role): number;
  size(): number;
  isEmpty(): boolean;
  nonEmpty(): boolean;
  hasPawns(): boolean;
  hasNonPawns(): boolean;
}

export class Material implements ReadonlyMaterial {
  constructor(public white: MaterialSide, public black: MaterialSide) {}

  static empty(): Material {
    return new Material(MaterialSide.empty(), MaterialSide.empty());
  }

  static fromBoard(board: ReadonlyBoard): Material {
    return new Material(MaterialSide.fromBoard(board, 'white'), MaterialSide.fromBoard(board, 'black'));
  }

  clone(): Material {
    return new Material(this.white.clone(), this.black.clone());
  }

  equals(other: ReadonlyMaterial): boolean {
    return this.white.equals(other.white) && this.black.equals(other.black);
  }

  add(other: ReadonlyMaterial): Material {
    return new Material(this.white.add(other.white), this.black.add(other.black));
  }

  count(role: Role): number {
    return this.white[role] + this.black[role];
  }

  size(): number {
    return this.white.size() + this.black.size();
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

export interface ReadonlyRemainingChecks extends Readonly<ByColor<number>> {
  clone(): RemainingChecks;
  equals(other: ReadonlyRemainingChecks): boolean;
}

export class RemainingChecks implements ReadonlyRemainingChecks {
  constructor(public white: number, public black: number) {}

  static default(): RemainingChecks {
    return new RemainingChecks(3, 3);
  }

  clone(): RemainingChecks {
    return new RemainingChecks(this.white, this.black);
  }

  equals(other: ReadonlyRemainingChecks): boolean {
    return this.white === other.white && this.black === other.black;
  }
}

export interface ReadonlySetup {
  readonly board: ReadonlyBoard;
  readonly pockets: ReadonlyMaterial | undefined;
  readonly turn: Color;
  readonly unmovedRooks: SquareSet;
  readonly epSquare: Square | undefined;
  readonly remainingChecks: ReadonlyRemainingChecks | undefined;
  readonly halfmoves: number;
  readonly fullmoves: number;
}

/**
 * A not necessarily legal chess or chess variant position.
 */
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

export const defaultSetup = (): Setup => ({
  board: Board.default(),
  pockets: undefined,
  turn: 'white',
  unmovedRooks: SquareSet.corners(),
  epSquare: undefined,
  remainingChecks: undefined,
  halfmoves: 0,
  fullmoves: 1,
});

export const setupClone = (setup: ReadonlySetup): Setup => ({
  board: setup.board.clone(),
  pockets: setup.pockets?.clone(),
  turn: setup.turn,
  unmovedRooks: setup.unmovedRooks,
  epSquare: setup.epSquare,
  remainingChecks: setup.remainingChecks?.clone(),
  halfmoves: setup.halfmoves,
  fullmoves: setup.fullmoves,
});

export const setupEquals = (left: ReadonlySetup, right: ReadonlySetup): boolean =>
  boardEquals(left.board, right.board) &&
  ((right.pockets && left.pockets?.equals(right.pockets)) || (!left.pockets && !right.pockets)) &&
  left.turn === right.turn &&
  left.unmovedRooks.equals(right.unmovedRooks) &&
  left.epSquare === right.epSquare &&
  ((right.remainingChecks && left.remainingChecks?.equals(right.remainingChecks)) ||
    (!left.remainingChecks && !right.remainingChecks)) &&
  left.halfmoves === right.halfmoves &&
  left.fullmoves === right.fullmoves;
