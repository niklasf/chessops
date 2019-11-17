import { Square, Outcome, Color, COLORS } from './types';
import { defined } from './util';
import { between } from './attacks';
import { SquareSet } from './squareSet';
import { Setup, RemainingChecks, Material } from './setup';
import { Position, Context, Chess } from './chess';

export { Position, Chess };

// Atomic

// Giveaway

export class KingOfTheHill extends Chess {
  clone(): KingOfTheHill {
    return super.clone() as KingOfTheHill;
  }

  hasInsufficientMaterial(color: Color): boolean {
    return false;
  }

  isVariantEnd(): boolean {
    return this.board.king.intersects(SquareSet.center());
  }

  variantOutcome(): Outcome | undefined {
    for (const color of COLORS) {
      if (this.board.pieces(color, 'king').intersects(SquareSet.center())) return { winner: color };
    }
    return;
  }
}

export class ThreeCheck extends Chess {
  constructor(setup?: Setup) {
    super(setup);
    this.remainingChecks = setup ? setup.remainingChecks : RemainingChecks.default();
  }

  clone(): ThreeCheck {
    return super.clone() as ThreeCheck;
  }

  hasInsufficientMaterial(color: Color): boolean {
    return this.board.pieces(color, 'king').equals(this.board[color]);
  }

  isVariantEnd(): boolean {
    return !!this.remainingChecks && (this.remainingChecks.white <= 0 || this.remainingChecks.black <= 0);
  }

  variantOutcome(): Outcome | undefined {
    if (this.remainingChecks) {
      for (const color of COLORS) {
        if (this.remainingChecks[color] <= 0) return { winner: color };
      }
    }
    return;
  }
}

export class Crazyhouse extends Chess {
  constructor(setup?: Setup) {
    super(setup);
    this.pockets = setup ? setup.pockets : Material.empty();
  }

  clone(): Crazyhouse {
    return super.clone() as Crazyhouse;
  }

  hasInsufficientMaterial(color: Color): boolean {
    return false; // TODO: maybe check anyway
  }

  dropDests(ctx: Context): SquareSet {
    const mask = this.board.occupied.complement().intersect(
      (this.pockets && this.pockets[this.turn].hasNonPawn()) ? SquareSet.full() :
      (this.pockets && this.pockets[this.turn].pawn) ? SquareSet.backranks().complement() : SquareSet.empty());

    if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
      const checker = ctx.checkers.singleSquare();
      if (!defined(checker)) return SquareSet.empty();
      return mask.intersect(between(checker, ctx.king));
    } else return mask;
  }
}

// RacingKings

export class Horde extends Chess {
  constructor(setup?: Setup) {
    super(setup);
    if (!setup) {
      this.board = Board.horde();
    }
  }

  clone(): Horde {
    return super.clone() as Horde;
  }

  hasInsufficientMaterial(color: Color): boolean {
    return false; // TODO: detect when the horde cannot mate
  }

  isVariantEnd(): boolean {
    return this.board.white.isEmpty() || this.board.black.isEmpty();
  }

  variantOutcome(): Outcome | undefined {
    if (this.board.occupied.isEmpty()) return { winner: undefined };
    else if (this.board.white.isEmpty()) return { winner: 'black' };
    else if (this.board.black.isEmpty()) return { winner: 'white' };
    return;
  }
}
