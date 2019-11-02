import { Color, Square } from './types';
import { SquareSet } from './squareSet';
import { Board, ReadonlyBoard } from './board';
import { bishopAttacks, rookAttacks, queenAttacks, KNIGHT_ATTACKS, KING_ATTACKS, PAWN_ATTACKS, BETWEEN, RAYS } from './attacks';
import { opposite } from './util';

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

interface Context {
  king: Square,
  blockers: SquareSet,
  checkers: SquareSet,
}

export class Chess {
  private board: Board;
  private turn: Color;
//  private castles: Castles;
  private epSquare: Square | undefined;
  private halfmoves: number;
  private fullmoves: number;

  private constructor() { }

  static default(): Chess {
    const pos = new Chess();
    pos.board = Board.default();
    pos.turn = 'white';
    pos.epSquare = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  brd(): ReadonlyBoard {
    return this.board;
  }

  clone(): Chess {
    const pos = new Chess();
    pos.board = this.board.clone();
    pos.turn = this.turn;
    pos.epSquare = this.epSquare;
    pos.halfmoves = this.halfmoves;
    pos.fullmoves = this.fullmoves;
    return pos;
  }

  protected kingAttackers(square: Square, attacker: Color, occupied: SquareSet): SquareSet {
    return attacksTo(square, attacker, this.board, occupied);
  }

  ctx(): Context {
    const king = this.board.kings().intersect(this.board.byColor(this.turn)).last()!;
    const snipers = rookAttacks(king, SquareSet.empty()).intersect(this.board.rooksAndQueens())
      .union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens()))
      .intersect(this.board.byColor(opposite(this.turn)));
    let blockers = SquareSet.empty();
    for (const sniper of snipers) {
      const b = BETWEEN[king][sniper].intersect(this.board.occupied());
      if (!b.moreThanOne()) blockers = blockers.union(b);
    }
    const checkers = this.kingAttackers(king, opposite(this.turn), this.board.occupied());
    return {
      king,
      blockers,
      checkers
    };
  }

  dests(square: Square, ctx: Context): SquareSet {
    const piece = this.board.get(square);
    if (!piece || piece.color != this.turn) return SquareSet.empty();

    let pseudo;
    if (piece.role == 'pawn') {
      pseudo = PAWN_ATTACKS[this.turn][square].intersect(this.board.byColor(opposite(this.turn)));
      const delta = this.turn == 'white' ? 8 : -8;
      const step = square + delta;
      if (0 <= step && step < 64 && !this.board.occupied().has(step)) {
        pseudo = pseudo.with(step);
        const canDoubleStep = this.turn == 'white' ? (square < 16) : (square >= 64 - 16);
        const doubleStep = step + delta;
        if (canDoubleStep && !this.board.occupied().has(doubleStep)) {
          pseudo = pseudo.with(doubleStep);
        }
      }
      // TODO: en passant
    }
    else if (piece.role == 'bishop') pseudo = bishopAttacks(square, this.board.occupied());
    else if (piece.role == 'knight') pseudo = KNIGHT_ATTACKS[square];
    else if (piece.role == 'rook') pseudo = rookAttacks(square, this.board.occupied());
    else if (piece.role == 'queen') pseudo = queenAttacks(square, this.board.occupied());
    else {
      // TODO: castling
      pseudo = KING_ATTACKS[square].diff(this.board.byColor(this.turn));
      for (const square of pseudo) {
        if (this.kingAttackers(square, opposite(this.turn), this.board.occupied().without(ctx.king)).nonEmpty()) {
          pseudo = pseudo.without(square);
        }
      }
      return pseudo;
    }

    if (ctx.checkers.nonEmpty()) {
      const checker = ctx.checkers.singleSquare();
      if (!checker) return SquareSet.empty();
      pseudo = pseudo.intersect(BETWEEN[checker][ctx.king].with(checker));
    } else {
      if (ctx.blockers.has(square)) pseudo = pseudo.intersect(RAYS[square][ctx.king]);
    }

    return pseudo.diff(this.board.byColor(this.turn));
  }

  allDests(): BySquare<SquareSet> {
    const ctx = this.ctx();
    const d: BySquare<SquareSet> = {};
    for (const square of this.board.byColor(this.turn)) {
      d[square] = this.dests(square, ctx);
    }
    return d;
  }

  playMove(uci: string) {
  }
}
