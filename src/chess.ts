import { Color, Square } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { bishopAttacks, rookAttacks, BETWEEN } from './attacks';
import { opposite } from './util';

/* export interface Setup {
  board: Board,
  turn: Color,
  castles: Castles,
  epSquare: Square | undefined,
  halfmoves: number,
  fullmoves: number,
} */

interface Context {
  king: Square | undefined,
  blockers: SquareSet,
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

  ctx(): Context {
    const king = this.board.kings().intersect(this.board.byColor(this.turn)).last()!;
    const snipers = rookAttacks(king, SquareSet.empty()).intersect(this.board.rooksAndQueens())
      .union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens()))
      .intersect(this.board.byColor(opposite(this.turn)));
    let blockers = SquareSet.empty();
    for (const sniper of snipers) {
      const b = BETWEEN[king][sniper].intersect(this.board.occ());
      if (!b.moreThanOne()) {
        blockers = blockers.union(b);
      }
    }
    return {
      king,
      blockers
    };
  }
}
