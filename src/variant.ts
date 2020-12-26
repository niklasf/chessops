import { Result } from '@badrap/result';
import { Square, Outcome, Color, COLORS, Piece, Rules } from './types';
import { defined, opposite } from './util';
import { between, kingAttacks } from './attacks';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, RemainingChecks, Material } from './setup';
import { PositionError, Position, IllegalSetup, Context, Castles, Chess } from './chess';

export { Position, PositionError, IllegalSetup, Context, Chess, Castles };

export class Crazyhouse extends Chess {
  protected constructor() {
    super('crazyhouse');
  }

  static default(): Crazyhouse {
    const pos = super.default();
    pos.pockets = Material.empty();
    return pos as Crazyhouse;
  }

  static fromSetup(setup: Setup): Result<Crazyhouse, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.pockets = setup.pockets ? setup.pockets.clone() : Material.empty();
      return pos as Crazyhouse;
    });
  }

  protected validate(): Result<undefined, PositionError> {
    return super.validate().chain(_ => {
      if (this.pockets && (this.pockets.white.king > 0 || this.pockets.black.king > 0)) {
        return Result.err(new PositionError(IllegalSetup.Kings));
      }
      if ((this.pockets ? this.pockets.count() : 0) + this.board.occupied.size() > 64) {
        return Result.err(new PositionError(IllegalSetup.Variant));
      }
      return Result.ok(undefined);
    });
  }

  clone(): Crazyhouse {
    return super.clone() as Crazyhouse;
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

  dropDests(ctx?: Context): SquareSet {
    const mask = this.board.occupied.complement().intersect(
      this.pockets?.[this.turn].hasNonPawns() ? SquareSet.full() :
        this.pockets?.[this.turn].hasPawns() ? SquareSet.backranks().complement() :
          SquareSet.empty());

    ctx = ctx || this.ctx();
    if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
      const checker = ctx.checkers.singleSquare();
      if (!defined(checker)) return SquareSet.empty();
      return mask.intersect(between(checker, ctx.king));
    } else return mask;
  }
}

export class Atomic extends Chess {
  protected constructor() {
    super('atomic');
  }

  static default(): Atomic {
    return super.default() as Atomic;
  }

  static fromSetup(setup: Setup): Result<Atomic, PositionError> {
    return super.fromSetup(setup) as Result<Atomic, PositionError>;
  }

  clone(): Atomic {
    return super.clone() as Atomic;
  }

  protected validate(): Result<undefined, PositionError> {
    // Like chess, but allow our king to be missing and any number of checkers.
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board.king.size() > 2) return Result.err(new PositionError(IllegalSetup.Kings));
    const otherKing = this.board.kingOf(opposite(this.turn));
    if (!defined(otherKing)) return Result.err(new PositionError(IllegalSetup.Kings));
    if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) {
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    }
    if (SquareSet.backranks().intersects(this.board.pawn)) {
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    }
    return Result.ok(undefined);
  }

  protected kingAttackers(square: Square, attacker: Color, occupied: SquareSet): SquareSet {
    if (kingAttacks(square).intersects(this.board.pieces(attacker, 'king'))) {
      return SquareSet.empty();
    }
    return super.kingAttackers(square, attacker, occupied);
  }

  protected playCaptureAt(square: Square, captured: Piece): void {
    super.playCaptureAt(square, captured);
    this.board.take(square);
    for (const explode of kingAttacks(square).intersect(this.board.occupied).diff(this.board.pawn)) {
      const piece = this.board.take(explode);
      if (piece && piece.role === 'rook') this.castles.discardRook(explode);
      if (piece && piece.role === 'king') this.castles.discardSide(piece.color);
    }
  }

  hasInsufficientMaterial(color: Color): boolean {
    // Remaining material does not matter if the enemy king is already
    // exploded.
    if (this.board.pieces(opposite(color), 'king').isEmpty()) return false;

    // Bare king cannot mate.
    if (this.board[color].diff(this.board.king).isEmpty()) return true;

    // As long as the enemy king is not alone, there is always a chance their
    // own pieces explode next to it.
    if (this.board[opposite(color)].diff(this.board.king).nonEmpty()) {
      // Unless there are only bishops that cannot explode each other.
      if (this.board.occupied.equals(this.board.bishop.union(this.board.king))) {
        if (!this.board.bishop.intersect(this.board.white).intersects(SquareSet.darkSquares())) {
          return !this.board.bishop.intersect(this.board.black).intersects(SquareSet.lightSquares());
        }
        if (!this.board.bishop.intersect(this.board.white).intersects(SquareSet.lightSquares())) {
          return !this.board.bishop.intersect(this.board.black).intersects(SquareSet.darkSquares());
        }
      }
      return false;
    }

    // Queen or pawn (future queen) can give mate against bare king.
    if (this.board.queen.nonEmpty() || this.board.pawn.nonEmpty()) return false;

    // Single knight, bishop or rook cannot mate against bare king.
    if (this.board.knight.union(this.board.bishop).union(this.board.rook).isSingleSquare()) return true;

    // If only knights, more than two are required to mate bare king.
    if (this.board.occupied.equals(this.board.knight.union(this.board.king))) {
      return this.board.knight.size() <= 2;
    }

    return false;
  }

  dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    let dests = SquareSet.empty();
    for (const to of this.pseudoDests(square, ctx)) {
      const after = this.clone();
      after.play({ from: square, to });
      const ourKing = after.board.kingOf(this.turn);
      if (defined(ourKing) && (!defined(after.board.kingOf(after.turn)) || after.kingAttackers(ourKing, after.turn, after.board.occupied).isEmpty())) {
        dests = dests.with(to);
      }
    }
    return dests;
  }

  isVariantEnd(): boolean {
    return !!this.variantOutcome();
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    for (const color of COLORS) {
      if (this.board.pieces(color, 'king').isEmpty()) return { winner: opposite(color) };
    }
    return;
  }
}

export class Antichess extends Chess {
  protected constructor() {
    super('antichess');
  }

  static default(): Antichess {
    const pos = super.default();
    pos.castles = Castles.empty();
    return pos as Antichess;
  }

  static fromSetup(setup: Setup): Result<Antichess, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.castles = Castles.empty();
      return pos as Antichess;
    });
  }

  clone(): Antichess {
    return super.clone() as Antichess;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty())
      return Result.err(new PositionError(IllegalSetup.Empty));
    if (SquareSet.backranks().intersects(this.board.pawn))
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    return Result.ok(undefined);
  }

  protected kingAttackers(_square: Square, _attacker: Color, _occupied: SquareSet): SquareSet {
    return SquareSet.empty();
  }

  ctx(): Context {
    const ctx = super.ctx();
    const enemy = this.board[opposite(this.turn)];
    for (const from of this.board[this.turn]) {
      if (this.pseudoDests(from, ctx).intersects(enemy)) {
        ctx.mustCapture = true;
        break;
      }
    }
    return ctx;
  }

  dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    const dests = this.pseudoDests(square, ctx);
    if (!ctx.mustCapture) return dests;
    return dests.intersect(this.board[opposite(this.turn)]);
  }

  hasInsufficientMaterial(color: Color): boolean {
    if (this.board.occupied.equals(this.board.bishop)) {
      const weSomeOnLight = this.board[color].intersects(SquareSet.lightSquares());
      const weSomeOnDark = this.board[color].intersects(SquareSet.darkSquares());
      const theyAllOnDark = this.board[opposite(color)].isDisjoint(SquareSet.lightSquares());
      const theyAllOnLight = this.board[opposite(color)].isDisjoint(SquareSet.darkSquares());
      return (weSomeOnLight && theyAllOnDark) || (weSomeOnDark && theyAllOnLight);
    }
    return false;
  }

  isVariantEnd(): boolean {
    return this.board[this.turn].isEmpty();
  }

  variantOutcome(ctx?: Context): Outcome | undefined {
    ctx = ctx || this.ctx();
    if (ctx.variantEnd || this.isStalemate(ctx)) {
      return { winner: this.turn };
    }
    return;
  }
}

export class KingOfTheHill extends Chess {
  protected constructor() {
    super('kingofthehill');
  }

  static default(): KingOfTheHill {
    return super.default();
  }

  static fromSetup(setup: Setup): Result<KingOfTheHill, PositionError> {
    return super.fromSetup(setup);
  }

  clone(): KingOfTheHill {
    return super.clone() as KingOfTheHill;
  }

  hasInsufficientMaterial(_color: Color): boolean {
    return false;
  }

  isVariantEnd(): boolean {
    return this.board.king.intersects(SquareSet.center());
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    for (const color of COLORS) {
      if (this.board.pieces(color, 'king').intersects(SquareSet.center())) return { winner: color };
    }
    return;
  }
}

export class ThreeCheck extends Chess {
  protected constructor() {
    super('3check');
  }

  static default(): ThreeCheck {
    const pos = super.default();
    pos.remainingChecks = RemainingChecks.default();
    return pos;
  }

  static fromSetup(setup: Setup): Result<ThreeCheck, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.remainingChecks = setup.remainingChecks ? setup.remainingChecks.clone() : RemainingChecks.default();
      return pos;
    });
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

  variantOutcome(_ctx?: Context): Outcome | undefined {
    if (this.remainingChecks) {
      for (const color of COLORS) {
        if (this.remainingChecks[color] <= 0) return { winner: color };
      }
    }
    return;
  }
}

class RacingKings extends Chess {
  protected constructor() {
    super('racingkings');
  }

  static default(): RacingKings {
    const pos = new this();
    pos.board = Board.racingKings();
    pos.pockets = undefined;
    pos.turn = 'white';
    pos.castles = Castles.empty();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static fromSetup(setup: Setup): Result<RacingKings, PositionError> {
    return super.fromSetup(setup).map(pos => {
      pos.castles = Castles.empty();
      return pos as RacingKings;
    });
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.isCheck()) return Result.err(new PositionError(IllegalSetup.ImpossibleCheck));
    if (this.board.pawn.nonEmpty()) return Result.err(new PositionError(IllegalSetup.Variant));
    return super.validate();
  }

  clone(): RacingKings {
    return super.clone() as RacingKings;
  }

  dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();

    // Kings cannot give check.
    if (square === ctx.king) return super.dests(square, ctx);

    // TODO: This could be optimized considerably.
    let dests = SquareSet.empty();
    for (const to of super.dests(square, ctx)) {
      // Valid, because there are no promotions (or even pawns).
      const move = { from: square, to };
      const after = this.clone();
      after.play(move);
      if (!after.isCheck()) dests = dests.with(to);
    }
    return dests;
  }

  hasInsufficientMaterial(_color: Color): boolean {
    return false;
  }

  isVariantEnd(): boolean {
    const goal = SquareSet.fromRank(7);
    const inGoal = this.board.king.intersect(goal);
    if (inGoal.isEmpty()) return false;
    if (this.turn === 'white' || inGoal.intersects(this.board.black)) return true;

    // White has reached the backrank. Check if black can catch up.
    const blackKing = this.board.kingOf('black');
    if (defined(blackKing)) {
      const occ = this.board.occupied.without(blackKing);
      for (const target of kingAttacks(blackKing).intersect(goal).diff(this.board.black)) {
        if (this.kingAttackers(target, 'white', occ).isEmpty()) return false;
      }
    }
    return true;
  }

  variantOutcome(ctx?: Context): Outcome | undefined {
    if (ctx ? !ctx.variantEnd : !this.isVariantEnd()) return;
    const goal = SquareSet.fromRank(7);
    const blackInGoal = this.board.pieces('black', 'king').intersects(goal);
    const whiteInGoal = this.board.pieces('white', 'king').intersects(goal);
    if (blackInGoal && !whiteInGoal) return { winner: 'black' };
    if (whiteInGoal && !blackInGoal) return { winner: 'white' };
    return { winner: undefined };
  }
}

export class Horde extends Chess {
  protected constructor() {
    super('horde');
  }

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
    if (this.board.occupied.isEmpty())
      return Result.err(new PositionError(IllegalSetup.Empty));
    if (!this.board.king.isSingleSquare())
      return Result.err(new PositionError(IllegalSetup.Kings));
    if (!this.board.king.diff(this.board.promoted).isSingleSquare())
      return Result.err(new PositionError(IllegalSetup.Kings));

    const otherKing = this.board.kingOf(opposite(this.turn));
    if (defined(otherKing) && this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    for (const color of COLORS) {
      if (this.board.pieces(color, 'pawn').intersects(SquareSet.backrank(opposite(color)))) {
        return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
      }
    }
    return this.validateCheckers();
  }

  clone(): Horde {
    return super.clone() as Horde;
  }

  hasInsufficientMaterial(_color: Color): boolean {
    // TODO: Could detect cases where the horde cannot mate.
    return false;
  }

  isVariantEnd(): boolean {
    return this.board.white.isEmpty() || this.board.black.isEmpty();
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    if (this.board.white.isEmpty()) return { winner: 'black' };
    if (this.board.black.isEmpty()) return { winner: 'white' };
    return;
  }
}

export function defaultPosition(rules: Rules): Position {
  switch (rules) {
  case 'chess': return Chess.default();
  case 'antichess': return Antichess.default();
  case 'atomic': return Atomic.default();
  case 'horde': return Horde.default();
  case 'racingkings': return RacingKings.default();
  case 'kingofthehill': return KingOfTheHill.default();
  case '3check': return ThreeCheck.default();
  case 'crazyhouse': return Crazyhouse.default();
  }
}

export function setupPosition(rules: Rules, setup: Setup): Result<Position, PositionError> {
  switch (rules) {
  case 'chess': return Chess.fromSetup(setup);
  case 'antichess': return Antichess.fromSetup(setup);
  case 'atomic': return Atomic.fromSetup(setup);
  case 'horde': return Horde.fromSetup(setup);
  case 'racingkings': return RacingKings.fromSetup(setup);
  case 'kingofthehill': return KingOfTheHill.fromSetup(setup);
  case '3check': return ThreeCheck.fromSetup(setup);
  case 'crazyhouse': return Crazyhouse.fromSetup(setup);
  }
}
