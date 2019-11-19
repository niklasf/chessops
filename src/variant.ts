import { Result } from '@badrap/result';
import { Square, Outcome, Color, COLORS, Rules } from './types';
import { defined, opposite } from './util';
import { between } from './attacks';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, RemainingChecks, Material } from './setup';
import { PositionError, Position, IllegalSetup, Context, Castles, Chess } from './chess';

export { Position, PositionError, IllegalSetup, Context, Chess, Castles };

export class Crazyhouse extends Chess {
  static default(): Crazyhouse {
    const pos = super.default();
    pos.pockets = Material.empty();
    return pos;
  }

  static fromSetup(setup: Setup): Result<Crazyhouse, PositionError> {
    return super.fromSetup(setup).chain(pos => {
      pos.pockets = setup.pockets ? setup.pockets.clone() : Material.empty();
      if (pos.pockets.white.king > 0 || pos.pockets.black.king > 0) {
        return Result.err(new PositionError(IllegalSetup.Kings));
      }
      return Result.ok(pos);
    });
  }

  clone(): Crazyhouse {
    return super.clone() as Crazyhouse;
  }

  rules(): Rules {
    return 'crazyhouse';
  }

  hasInsufficientMaterial(color: Color): boolean {
    // No material can leave the game, but we can easily check this for
    // custom positions.
    if (!this.pockets) return super.hasInsufficientMaterial(color);
    return this.board.occupied.size() + this.pockets.count() <= 3 &&
      this.board.pawn.isEmpty() &&
      this.board.promoted.isEmpty() &&
      this.board.rooksAndQueens().isEmpty() &&
      this.pockets.white.pawn <= 0 &&
      this.pockets.black.pawn <= 0 &&
      this.pockets.white.rook <= 0 &&
      this.pockets.black.rook <= 0 &&
      this.pockets.white.queen <= 0 &&
      this.pockets.black.queen <= 0;
  }

  dropDests(ctx: Context): SquareSet {
    const mask = this.board.occupied.complement().intersect(
      (this.pockets && this.pockets[this.turn].hasNonPawns()) ? SquareSet.full() :
      (this.pockets && this.pockets[this.turn].pawn) ? SquareSet.backranks().complement() : SquareSet.empty());

    if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
      const checker = ctx.checkers.singleSquare();
      if (!defined(checker)) return SquareSet.empty();
      return mask.intersect(between(checker, ctx.king));
    } else return mask;
  }
}

class Atomic extends Chess {
  clone(): Atomic {
    return super.clone() as Atomic;
  }

  rules(): Rules {
    return 'atomic';
  }
}

class Antichess extends Chess {
  clone(): Antichess {
    return super.clone() as Antichess;
  }

  rules(): Rules {
    return 'antichess';
  }
}

export class KingOfTheHill extends Chess {
  static default(): KingOfTheHill {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<KingOfTheHill, PositionError> {
    return super.fromSetup(setup);
  }

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

  static fromSetup(setup: Setup): Result<ThreeCheck, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.remainingChecks = setup.remainingChecks || RemainingChecks.default();
      return pos;
    });
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

class RacingKings extends Chess {
  static default(): RacingKings {
    const pos = new this();
    pos.board = Board.racingKings();
    pos.turn = 'white';
    pos.castles = Castles.empty();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static fromSetup(setup: Setup): Result<RacingKings, PositionError> {
    return super.fromSetup(setup) as Result<RacingKings, PositionError>;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.pawn.nonEmpty() || this.isCheck()) {
      return Result.err(new PositionError(IllegalSetup.Variant));
    }
    return super.validate();
  }

  clone(): RacingKings {
    return super.clone() as RacingKings;
  }

  rules(): Rules {
    return 'racingKings';
  }

  dests(square: Square, ctx: Context): SquareSet {
    // Kings cannot give check.
    if (square == ctx.king) return super.dests(square, ctx);

    // TODO: This could be optimized considerably.
    let dests = SquareSet.empty();
    for (const to of super.dests(square, ctx)) {
      // Valid, because there are no promotions (or even pawns).
      const uci = { from: square, to };

      const child = this.clone();
      child.play(uci);
      if (!child.isCheck()) dests = dests.with(to);
    }
    return dests;
  }

  hasInsufficientMaterial(color: Color): boolean {
    return false;
  }

  isVariantEnd(): boolean {
    const inGoal = this.board.king.intersect(SquareSet.fromRank(7));
    if (inGoal.isEmpty()) return false;
    if (this.turn == 'white' || inGoal.intersects(this.board.black)) return true;

    // White has reached the backrank, check if black can catch up.
    const ctx = this.ctx();
    return !defined(ctx.king) || !this.dests(ctx.king, ctx).intersects(SquareSet.fromRank(7));
  }

  variantOutcome(): Outcome | undefined {
    if (!this.isVariantEnd()) return;
    const blackInGoal = this.board.pieces('black', 'king').intersects(SquareSet.fromRank(7));
    const whiteInGoal = this.board.pieces('white', 'king').intersects(SquareSet.fromRank(7));
    if (blackInGoal && !whiteInGoal) return { winner: 'black' };
    if (whiteInGoal && !blackInGoal) return { winner: 'white' };
    return { winner: undefined };
  }
}

export class Horde extends Chess {
  static default(): Horde {
    const pos = new this();
    pos.board = Board.horde();
    pos.pockets = undefined;
    pos.turn = 'white';
    pos.castles = Castles.default();
    pos.castles.discardSide('white');
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static fromSetup(setup: Setup): Result<Horde, PositionError> {
    return super.fromSetup(setup) as Result<Horde, PositionError>;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board.king.size() != 1) return Result.err(new PositionError(IllegalSetup.Kings));
    if (this.board.king.diff(this.board.promoted).size() != 1) return Result.err(new PositionError(IllegalSetup.Kings));
    const otherKing = this.board.kingOf(opposite(this.turn));
    if (defined(otherKing) && this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }
    if (this.board.pieces('white', 'pawn').intersects(SquareSet.fromRank(7))) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }
    if (this.board.pieces('black', 'pawn').intersects(SquareSet.fromRank(0))) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }
    return Result.ok(undefined);
  }

  clone(): Horde {
    return super.clone() as Horde;
  }

  rules(): Rules {
    return 'horde';
  }

  hasInsufficientMaterial(color: Color): boolean {
    // TODO: Detect cases where the horde cannot mate.
    return false;
  }

  isVariantEnd(): boolean {
    return this.board.white.isEmpty() || this.board.black.isEmpty();
  }

  variantOutcome(): Outcome | undefined {
    if (this.board.white.isEmpty()) return { winner: 'black' };
    else if (this.board.black.isEmpty()) return { winner: 'white' };
    return;
  }
}

export function defaultPosition(rules: Rules): Position {
  switch (rules) {
    case 'chess': return Chess.default();
    case 'antichess': return Antichess.default();
    case 'atomic': return Atomic.default();
    case 'horde': return Horde.default();
    case 'racingKings': return RacingKings.default();
    case 'kingOfTheHill': return KingOfTheHill.default();
    case 'threeCheck': return ThreeCheck.default();
    case 'crazyhouse': return Crazyhouse.default();
  }
}

export function setupPosition(rules: Rules, setup: Setup): Result<Position, PositionError> {
  switch (rules) {
    case 'chess': return Chess.fromSetup(setup);
    case 'antichess': return Antichess.fromSetup(setup);
    case 'atomic': return Atomic.fromSetup(setup);
    case 'horde': return Horde.fromSetup(setup);
    case 'racingKings': return RacingKings.fromSetup(setup);
    case 'kingOfTheHill': return KingOfTheHill.fromSetup(setup);
    case 'threeCheck': return ThreeCheck.fromSetup(setup);
    case 'crazyhouse': return Crazyhouse.fromSetup(setup);
  }
}
