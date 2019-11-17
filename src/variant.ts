import { Square, Outcome, Color, COLORS } from './types';
import { SquareSet } from './squareSet';
import { Position, Context, Chess } from './chess';

export { Position, Chess };

// Atomic

// Giveaway

export class KingOfTheHill extends Chess {
  dests(square: Square, ctx: Context): SquareSet {
    if (this.board.king.intersects(SquareSet.center())) SquareSet.empty();
    return super.dests(square, ctx);
  }

  hasInsufficientMaterial(color: Color): boolean {
    return false;
  }

  variantOutcome(): Outcome | undefined {
    for (const color of COLORS) {
      if (this.board.pieces(color, 'king').intersects(SquareSet.center())) return { winner: color };
    }
    return;
  }
}

// ThreeCheck

// Crazyhouse

// RacingKings

// Horde
