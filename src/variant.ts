import { Square, Outcome, Color, COLORS, Rules } from './types';
import { defined } from './util';
import { between } from './attacks';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, RemainingChecks, Material } from './setup';
import { Position, Context, Castles, Chess } from './chess';

export { Position, Chess, Castles };

export class Atomic extends Chess {
  clone(): Atomic {
    return super.clone() as Atomic;
  }

  rules(): Rules {
    return 'atomic';
  }
}

export class Antichess extends Chess {
  clone(): Antichess {
    return super.clone() as Antichess;
  }

  rules(): Rules {
    return 'antichess';
  }
}

export class KingOfTheHill extends Chess {
  clone(): KingOfTheHill {
    return super.clone() as KingOfTheHill;
  }

  rules(): Rules {
    return 'kingOfTheHill';
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

  rules(): Rules {
    return 'threeCheck';
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

  rules(): Rules {
    return 'crazyhouse';
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

export class RacingKings extends Chess {
  constructor(setup?: Setup) {
    super(setup);
    if (!setup) {
      this.board = Board.racingKings();
      this.castles = Castles.empty();
    }
  }

  clone(): RacingKings {
    return super.clone() as RacingKings;
  }

  rules(): Rules {
    return 'racingKings';
  }

  hasInsufficientMaterial(color: Color): boolean {
    return false;
  }

  isVariantEnd(): boolean {
    const inGoal = this.board.king.intersect(SquareSet.fromRank(7));
    if (inGoal.isEmpty()) return false;
    if (this.turn == 'white' || inGoal.intersects(this.board.black)) return true;

    // TODO: White has reached the backrank, check if black can catch up

    return true;
  }

  variantOutcome(): Outcome | undefined {
    if (!this.isVariantEnd()) return;
    // TODO
    return;
  }
}

export class Horde extends Chess {
  constructor(setup?: Setup) {
    super(setup);
    if (!setup) {
      this.board = Board.horde();
      this.castles.discardSide('white');
    }
  }

  clone(): Horde {
    return super.clone() as Horde;
  }

  rules(): Rules {
    return 'horde';
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

export function setupPosition(rules: Rules, setup?: Setup): Position {
  switch (rules) {
    case 'chess': return new Chess(setup);
    case 'antichess': return new Antichess(setup);
    case 'atomic': return new Atomic(setup);
    case 'horde': return new Horde(setup);
    case 'racingKings': return new RacingKings(setup);
    case 'kingOfTheHill': return new KingOfTheHill(setup);
    case 'threeCheck': return new ThreeCheck(setup);
    case 'crazyhouse': return new Crazyhouse(setup);
  }
}
