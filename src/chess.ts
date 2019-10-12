import { Color, Square } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';
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
      const b = BETWEEN[king][sniper].intersect(this.board.occ());
      if (!b.moreThanOne()) blockers = blockers.union(b);
    }
    const checkers = this.kingAttackers(king, opposite(this.turn), this.board.occ());
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
      // TODO single step, double step, en passant
      pseudo = SquareSet.empty();
    }
    else if (piece.role == 'bishop') pseudo = bishopAttacks(square, this.board.occ());
    else if (piece.role == 'knight') pseudo = KNIGHT_ATTACKS[square];
    else if (piece.role == 'rook') pseudo = rookAttacks(square, this.board.occ());
    else if (piece.role == 'queen') pseudo = queenAttacks(square, this.board.occ());
    else pseudo = KING_ATTACKS[square];
    // TODO: castling, safe steps

    if (ctx.checkers.isEmpty()) {
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
}
