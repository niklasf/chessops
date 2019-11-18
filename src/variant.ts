import { Err, isErr, Square, Outcome, Color, COLORS, Rules } from './types';
import { defined } from './util';
import { between } from './attacks';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, RemainingChecks, Material } from './setup';
import { PositionError, Position, Context, Castles, Chess } from './chess';

export { Position, PositionError, Chess, Castles };

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
  static default(): ThreeCheck {
    const pos = super.default();
    pos.remainingChecks = RemainingChecks.default();
    return pos;
  }

  static fromSetup(setup: Setup): ThreeCheck | Err<PositionError> {
    const pos = super.fromSetup(setup);
    if (isErr(pos)) return pos;
    pos.remainingChecks = setup.remainingChecks || RemainingChecks.default();
    return pos;
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

export function setupPosition(rules: Rules): Position;
export function setupPosition(rules: Rules, setup?: Setup): Position | Err<PositionError> {
  switch (rules) {
    case 'chess': return setup ? Chess.fromSetup(setup) : Chess.default();
    case 'antichess': return setup ? Antichess.fromSetup(setup) : Antichess.default();
    case 'atomic': return setup ? Atomic.fromSetup(setup) : Atomic.default();
    case 'horde': return setup ? Horde.fromSetup(setup) : Horde.default();
    case 'racingKings': return setup ? RacingKings.fromSetup(setup) : RacingKings.default();
    case 'kingOfTheHill': return setup ? KingOfTheHill.fromSetup(setup) : KingOfTheHill.default();
    case 'threeCheck': return setup ? ThreeCheck.fromSetup(setup) : ThreeCheck.default();
    case 'crazyhouse': return setup ? Crazyhouse.fromSetup(setup) : Crazyhouse.default();
  }
}
