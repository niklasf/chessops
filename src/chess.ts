import { CastlingSide, Color, Square, ByColor, ByCastlingSide, Material, RemainingChecks } from './types';
import { SquareSet } from './squareSet';
import { Board, ReadonlyBoard } from './board';
import { bishopAttacks, rookAttacks, queenAttacks, KNIGHT_ATTACKS, KING_ATTACKS, PAWN_ATTACKS, BETWEEN, RAYS } from './attacks';
import { opposite, defined } from './util';

function attacksTo(square: Square, attacker: Color, board: Board, occupied: SquareSet): SquareSet {
  return board.byColor(attacker).intersect(
    rookAttacks(square, occupied).intersect(board.rooksAndQueens())
      .union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens()))
      .union(KNIGHT_ATTACKS[square].intersect(board.knights()))
      .union(KING_ATTACKS[square].intersect(board.kings()))
      .union(PAWN_ATTACKS[opposite(attacker)][square].intersect(board.pawns())));
}

type BySquare<T> = { [square: number]: T };

export interface Setup {
  board: Board;
  pockets: Material | undefined;
  turn: Color;
  unmovedRooks: SquareSet;
  epSquare: Square | number;
  remainingChecks: RemainingChecks | undefined;
  halfmoves: number;
  fullmoves: number;
}

function kingCastlesTo(color: Color, side: CastlingSide) {
  return color == 'white' ? (side == 'a' ? 2 : 6) : (side == 'a' ? 58 : 62);
}

function rookCastlesTo(color: Color, side: CastlingSide) {
  return color == 'white' ? (side == 'a' ? 3 : 5) : (side == 'a' ? 59 : 61);
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

interface Context {
  king: Square,
  blockers: SquareSet,
  checkers: SquareSet,
}

export class Chess {
  private _board: Board;
  private _castles: Castles;
  private _turn: Color;
  private _epSquare: Square | undefined;
  private _halfmoves: number;
  private _fullmoves: number;

  private constructor() { }

  static default(): Chess {
    const pos = new Chess();
    pos._board = Board.default();
    pos._turn = 'white';
    pos._castles = Castles.default();
    pos._epSquare = undefined;
    pos._halfmoves = 0;
    pos._fullmoves = 1;
    return pos;
  }

  clone(): Chess {
    const pos = new Chess();
    pos._board = this._board.clone();
    pos._castles = this._castles.clone();
    pos._turn = this._turn;
    pos._epSquare = this._epSquare;
    pos._halfmoves = this._halfmoves;
    pos._fullmoves = this._fullmoves;
    return pos;
  }

  static fromSetup(setup: Setup): Chess {
    // TODO: Validate
    const pos = new Chess();
    pos._board = setup.board.clone();
    pos._turn = setup.turn;
    pos._castles = Castles.fromSetup(setup);
    pos._epSquare = setup.epSquare;
    pos._halfmoves = setup.halfmoves;
    pos._fullmoves = setup.fullmoves;
    return pos;
  }

  board(): ReadonlyBoard {
    return this._board;
  }

  pockets(): Material | undefined {
    return undefined;
  }

  turn(): Color {
    return this._turn;
  }

  castles(): Castles {
    return this._castles;
  }

  epSquare(): Square | undefined {
    return this._epSquare;
  }

  remainingChecks(): RemainingChecks | undefined {
    return undefined;
  }

  halfmoves(): number {
    return this._halfmoves;
  }

  fullmoves(): number {
    return this._fullmoves;
  }

  protected kingAttackers(square: Square, attacker: Color, occupied: SquareSet): SquareSet {
    return attacksTo(square, attacker, this._board, occupied);
  }

  ctx(): Context {
    const king = this._board.kingOf(this._turn)!;
    const snipers = rookAttacks(king, SquareSet.empty()).intersect(this._board.rooksAndQueens())
      .union(bishopAttacks(king, SquareSet.empty()).intersect(this._board.bishopsAndQueens()))
      .intersect(this._board.byColor(opposite(this._turn)));
    let blockers = SquareSet.empty();
    for (const sniper of snipers) {
      const b = BETWEEN[king][sniper].intersect(this._board.occupied());
      if (!b.moreThanOne()) blockers = blockers.union(b);
    }
    const checkers = this.kingAttackers(king, opposite(this._turn), this._board.occupied());
    return {
      king,
      blockers,
      checkers
    };
  }

  private castlingDest(side: CastlingSide, ctx: Context): SquareSet {
    if (ctx.checkers) return SquareSet.empty();
    const rook = this._castles.rook(this._turn, side);
    if (!defined(rook)) return SquareSet.empty();
    if (this._castles.path(this._turn, side).intersects(this._board.occupied())) return SquareSet.empty();

    const kingPath = BETWEEN[ctx.king][kingCastlesTo(this._turn, side)];
    for (const sq of kingPath) {
      if (this.kingAttackers(sq, opposite(this._turn), this._board.occupied().without(ctx.king)).nonEmpty()) {
        return SquareSet.empty();
      }
    }

    return SquareSet.fromSquare(rook);
  }

  dests(square: Square, ctx: Context): SquareSet {
    const piece = this._board.get(square);
    if (!piece || piece.color != this._turn) return SquareSet.empty();

    let pseudo;
    if (piece.role == 'pawn') {
      pseudo = PAWN_ATTACKS[this._turn][square].intersect(this._board.byColor(opposite(this._turn)));
      const delta = this._turn == 'white' ? 8 : -8;
      const step = square + delta;
      if (0 <= step && step < 64 && !this._board.occupied().has(step)) {
        pseudo = pseudo.with(step);
        const canDoubleStep = this._turn == 'white' ? (square < 16) : (square >= 64 - 16);
        const doubleStep = step + delta;
        if (canDoubleStep && !this._board.occupied().has(doubleStep)) {
          pseudo = pseudo.with(doubleStep);
        }
      }
      // TODO: en passant
    }
    else if (piece.role == 'bishop') pseudo = bishopAttacks(square, this._board.occupied());
    else if (piece.role == 'knight') pseudo = KNIGHT_ATTACKS[square];
    else if (piece.role == 'rook') pseudo = rookAttacks(square, this._board.occupied());
    else if (piece.role == 'queen') pseudo = queenAttacks(square, this._board.occupied());
    else {
      pseudo = KING_ATTACKS[square].diff(this._board.byColor(this._turn));
      for (const square of pseudo) {
        if (this.kingAttackers(square, opposite(this._turn), this._board.occupied().without(ctx.king)).nonEmpty()) {
          pseudo = pseudo.without(square);
        }
      }

      return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
    }

    if (ctx.checkers.nonEmpty()) {
      const checker = ctx.checkers.singleSquare();
      if (!checker) return SquareSet.empty();
      pseudo = pseudo.intersect(BETWEEN[checker][ctx.king].with(checker));
    } else {
      if (ctx.blockers.has(square)) pseudo = pseudo.intersect(RAYS[square][ctx.king]);
    }

    return pseudo.diff(this._board.byColor(this._turn));
  }

  allDests(): BySquare<SquareSet> {
    const ctx = this.ctx();
    const d: BySquare<SquareSet> = {};
    for (const square of this._board.byColor(this._turn)) {
      d[square] = this.dests(square, ctx);
    }
    return d;
  }

  playMove(uci: string) {
  }
}

export interface ReadonlyChess {
  clone(): Chess;
  board(): ReadonlyBoard;
  pockets(): Material | undefined;
  turn(): Color;
  castles(): ReadonlyCastles;
  epSquare(): Square | undefined;
  remainingChecks(): RemainingChecks | undefined;
  halfmoves(): number;
  fullmoves(): number;
}
