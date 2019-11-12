import { CastlingSide, Color, COLORS, ROLES, Square, ByCastlingSide, ByColor } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';

export class MaterialSide {
  public pawn: number;
  public knight: number
  public bishop: number;
  public rook: number
  public queen: number;
  public king: number;

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
  public white: MaterialSide;
  public black: MaterialSide;

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
  public white: number;
  public black: number;

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

export class Castles {
  private _unmovedRooks: SquareSet;
  private _rook: ByColor<ByCastlingSide<Square | undefined>>;
  private _path: ByColor<ByCastlingSide<SquareSet>>;

  private constructor() { }

  static default(): Castles {
    const castles = new Castles();
    castles._unmovedRooks = SquareSet.corners();
    castles._rook = {
      white: { a: 0, h: 7 },
      black: { a: 56 , h: 63 },
    };
    castles._path = {
      white: { a: new SquareSet(0x60, 0), h: new SquareSet(0, 0xe) },
      black: { a: new SquareSet(0, 0x60000000), h: new SquareSet(0, 0x0e000000) },
    };
    return castles;
  }

  static empty(): Castles {
    const castles = new Castles();
    castles._unmovedRooks = SquareSet.empty();
    castles._rook = {
      white: { a: undefined, h: undefined },
      black: { a: undefined, h: undefined },
    };
    castles._path = {
      white: { a: SquareSet.empty(), h: SquareSet.empty() },
      black: { a: SquareSet.empty(), h: SquareSet.empty() },
    };
    return castles;
  }

  clone(): Castles {
    const castles = new Castles();
    castles._unmovedRooks = this._unmovedRooks;
    castles._rook = {
      white: { a: this._rook.white.a, h: this._rook.white.h },
      black: { a: this._rook.black.a, h: this._rook.black.h },
    };
    castles._path = {
      white: { a: this._path.white.a, h: this._path.white.h },
      black: { a: this._path.black.a, h: this._path.black.h },
    };
    return castles;
  }

  static fromSetup(setup: Setup): Castles {
    return Castles.empty(); // TODO
  }

  unmovedRooks(): SquareSet {
    return this._unmovedRooks;
  }

  rook(color: Color, side: CastlingSide): Square | undefined {
    return this._rook[color][side];
  }

  path(color: Color, side: CastlingSide): SquareSet {
    return this._path[color][side];
  }
}

export interface ReadonlyCastles {
  clone(): Castles;
  unmovedRooks(): SquareSet;
  rook(color: Color, side: CastlingSide): Square | undefined;
  path(color: Color, side: CastlingSide): SquareSet;
}

export type Rules = 'chess';

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
