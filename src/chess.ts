import { CastlingSide, Color, Square, ByColor, ByCastlingSide } from './types';
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

/* export interface Setup {
  board: Board,
  turn: Color,
  castles: Castles,
  epSquare: Square | undefined,
  halfmoves: number,
  fullmoves: number,
} */

function kingCastlesTo(color: Color, side: CastlingSide) {
  return color == 'white' ? (side == 'a' ? 2 : 6) : (side == 'a' ? 58 : 62);
}

function rookCastlesTo(color: Color, side: CastlingSide) {
  return color == 'white' ? (side == 'a' ? 3 : 5) : (side == 'a' ? 59 : 61);
}

export class Castles {
  private mask: SquareSet;
  private _rook: ByColor<ByCastlingSide<Square | undefined>>;
  private _path: ByColor<ByCastlingSide<SquareSet>>;

  private constructor() { }

  static default(): Castles {
    const castles = new Castles();
    castles.mask = SquareSet.corners();
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
    castles.mask = SquareSet.empty();
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

  rook(color: Color, side: CastlingSide): Square | undefined {
    return this._rook[color][side];
  }

  path(color: Color, side: CastlingSide): SquareSet {
    return this._path[color][side];
  }
}

interface Context {
  king: Square,
  blockers: SquareSet,
  checkers: SquareSet,
}

export class Chess {
  private _board: Board;
  private castles: Castles;
  private turn: Color;
//  private castles: Castles;
  private epSquare: Square | undefined;
  private halfmoves: number;
  private fullmoves: number;

  private constructor() { }

  static default(): Chess {
    const pos = new Chess();
    pos._board = Board.default();
    pos.turn = 'white';
    pos.castles = Castles.default();
    pos.epSquare = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  board(): ReadonlyBoard {
    return this._board;
  }

  clone(): Chess {
    const pos = new Chess();
    pos._board = this._board.clone();
    pos.turn = this.turn;
    pos.epSquare = this.epSquare;
    pos.halfmoves = this.halfmoves;
    pos.fullmoves = this.fullmoves;
    return pos;
  }

  protected kingAttackers(square: Square, attacker: Color, occupied: SquareSet): SquareSet {
    return attacksTo(square, attacker, this._board, occupied);
  }

  ctx(): Context {
    const king = this._board.kings().intersect(this._board.byColor(this.turn)).last()!;
    const snipers = rookAttacks(king, SquareSet.empty()).intersect(this._board.rooksAndQueens())
      .union(bishopAttacks(king, SquareSet.empty()).intersect(this._board.bishopsAndQueens()))
      .intersect(this._board.byColor(opposite(this.turn)));
    let blockers = SquareSet.empty();
    for (const sniper of snipers) {
      const b = BETWEEN[king][sniper].intersect(this._board.occupied());
      if (!b.moreThanOne()) blockers = blockers.union(b);
    }
    const checkers = this.kingAttackers(king, opposite(this.turn), this._board.occupied());
    return {
      king,
      blockers,
      checkers
    };
  }

  private castlingDest(side: CastlingSide, ctx: Context): SquareSet {
    if (ctx.checkers) return SquareSet.empty();
    const rook = this.castles.rook(this.turn, side);
    if (!defined(rook)) return SquareSet.empty();
    if (this.castles.path(this.turn, side).intersects(this._board.occupied())) return SquareSet.empty();

    const kingPath = BETWEEN[ctx.king][kingCastlesTo(this.turn, side)];
    for (const sq of kingPath) {
      if (this.kingAttackers(sq, opposite(this.turn), this._board.occupied().without(ctx.king)).nonEmpty()) {
        return SquareSet.empty();
      }
    }

    return SquareSet.fromSquare(rook);
  }

  dests(square: Square, ctx: Context): SquareSet {
    const piece = this._board.get(square);
    if (!piece || piece.color != this.turn) return SquareSet.empty();

    let pseudo;
    if (piece.role == 'pawn') {
      pseudo = PAWN_ATTACKS[this.turn][square].intersect(this._board.byColor(opposite(this.turn)));
      const delta = this.turn == 'white' ? 8 : -8;
      const step = square + delta;
      if (0 <= step && step < 64 && !this._board.occupied().has(step)) {
        pseudo = pseudo.with(step);
        const canDoubleStep = this.turn == 'white' ? (square < 16) : (square >= 64 - 16);
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
      pseudo = KING_ATTACKS[square].diff(this._board.byColor(this.turn));
      for (const square of pseudo) {
        if (this.kingAttackers(square, opposite(this.turn), this._board.occupied().without(ctx.king)).nonEmpty()) {
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

    return pseudo.diff(this._board.byColor(this.turn));
  }

  allDests(): BySquare<SquareSet> {
    const ctx = this.ctx();
    const d: BySquare<SquareSet> = {};
    for (const square of this._board.byColor(this.turn)) {
      d[square] = this.dests(square, ctx);
    }
    return d;
  }

  playMove(uci: string) {
  }
}
