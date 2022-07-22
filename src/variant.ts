import { Result } from '@badrap/result';
import { Square, Outcome, Color, COLORS, Piece, Rules } from './types.js';
import { defined, opposite } from './util.js';
import { between, pawnAttacks, kingAttacks } from './attacks.js';
import { SquareSet } from './squareSet.js';
import { Board } from './board.js';
import { Setup, RemainingChecks, Material } from './setup.js';
import {
  PositionError,
  Position,
  IllegalSetup,
  Context,
  Chess,
  Castles,
  FromSetupOpts,
  castlingSide,
  equalsIgnoreMoves,
  normalizeMove,
  isStandardMaterialSide,
  pseudoDests,
} from './chess.js';

export {
  Position,
  PositionError,
  IllegalSetup,
  Context,
  Chess,
  Castles,
  equalsIgnoreMoves,
  castlingSide,
  normalizeMove,
};

export class Crazyhouse extends Position {
  private constructor() {
    super('crazyhouse');
  }

  reset() {
    super.reset();
    this.pockets = Material.empty();
  }

  protected setupUnchecked(setup: Setup) {
    super.setupUnchecked(setup);
    this.board.promoted = setup.board.promoted
      .intersect(setup.board.occupied)
      .diff(setup.board.king)
      .diff(setup.board.pawn);
    this.pockets = setup.pockets ? setup.pockets.clone() : Material.empty();
  }

  static default(): Crazyhouse {
    const pos = new this();
    pos.reset();
    return pos;
  }

  static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<Crazyhouse, PositionError> {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate(opts).map(_ => pos);
  }

  clone(): Crazyhouse {
    return super.clone() as Crazyhouse;
  }

  protected validate(opts: FromSetupOpts | undefined): Result<undefined, PositionError> {
    return super.validate(opts).chain(_ => {
      if (this.pockets?.count('king')) {
        return Result.err(new PositionError(IllegalSetup.Kings));
      }
      if ((this.pockets?.size() || 0) + this.board.occupied.size() > 64) {
        return Result.err(new PositionError(IllegalSetup.Variant));
      }
      return Result.ok(undefined);
    });
  }

  hasInsufficientMaterial(color: Color): boolean {
    // No material can leave the game, but we can easily check this for
    // custom positions.
    if (!this.pockets) return super.hasInsufficientMaterial(color);
    return (
      this.board.occupied.size() + this.pockets.size() <= 3 &&
      this.board.pawn.isEmpty() &&
      this.board.promoted.isEmpty() &&
      this.board.rooksAndQueens().isEmpty() &&
      this.pockets.count('pawn') <= 0 &&
      this.pockets.count('rook') <= 0 &&
      this.pockets.count('queen') <= 0
    );
  }

  dropDests(ctx?: Context): SquareSet {
    const mask = this.board.occupied
      .complement()
      .intersect(
        this.pockets?.[this.turn].hasNonPawns()
          ? SquareSet.full()
          : this.pockets?.[this.turn].hasPawns()
          ? SquareSet.backranks().complement()
          : SquareSet.empty()
      );

    ctx = ctx || this.ctx();
    if (defined(ctx.king) && ctx.checkers.nonEmpty()) {
      const checker = ctx.checkers.singleSquare();
      if (!defined(checker)) return SquareSet.empty();
      return mask.intersect(between(checker, ctx.king));
    } else return mask;
  }
}

export class Atomic extends Position {
  private constructor() {
    super('atomic');
  }

  static default(): Atomic {
    const pos = new this();
    pos.reset();
    return pos;
  }

  static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<Atomic, PositionError> {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate(opts).map(_ => pos);
  }

  clone(): Atomic {
    return super.clone() as Atomic;
  }

  protected validate(opts: FromSetupOpts | undefined): Result<undefined, PositionError> {
    // Like chess, but allow our king to be missing.
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
    return opts?.ignoreImpossibleCheck ? Result.ok(undefined) : this.validateCheckers();
  }

  protected validateCheckers(): Result<undefined, PositionError> {
    // Other king moving away can cause many checks to be given at the
    // same time. Not checking details or even that the king is close enough.
    return defined(this.epSquare) ? Result.ok(undefined) : super.validateCheckers();
  }

  kingAttackers(square: Square, attacker: Color, occupied: SquareSet): SquareSet {
    const attackerKings = this.board.pieces(attacker, 'king');
    if (attackerKings.isEmpty() || kingAttacks(square).intersects(attackerKings)) {
      return SquareSet.empty();
    }
    return super.kingAttackers(square, attacker, occupied);
  }

  protected playCaptureAt(square: Square, captured: Piece): void {
    super.playCaptureAt(square, captured);
    this.board.take(square);
    for (const explode of kingAttacks(square).intersect(this.board.occupied).diff(this.board.pawn)) {
      const piece = this.board.take(explode);
      if (piece?.role === 'rook') this.castles.discardRook(explode);
      if (piece?.role === 'king') this.castles.discardColor(piece.color);
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
    if (this.board.knight.union(this.board.bishop).union(this.board.rook).size() === 1) return true;

    // If only knights, more than two are required to mate bare king.
    if (this.board.occupied.equals(this.board.knight.union(this.board.king))) {
      return this.board.knight.size() <= 2;
    }

    return false;
  }

  dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    let dests = SquareSet.empty();
    for (const to of pseudoDests(this, square, ctx)) {
      const after = this.clone();
      after.play({ from: square, to });
      const ourKing = after.board.kingOf(this.turn);
      if (
        defined(ourKing) &&
        (!defined(after.board.kingOf(after.turn)) ||
          after.kingAttackers(ourKing, after.turn, after.board.occupied).isEmpty())
      ) {
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

export class Antichess extends Position {
  private constructor() {
    super('antichess');
  }

  reset() {
    super.reset();
    this.castles = Castles.empty();
  }

  protected setupUnchecked(setup: Setup) {
    super.setupUnchecked(setup);
    this.castles = Castles.empty();
  }

  static default(): Antichess {
    const pos = new this();
    pos.reset();
    return pos;
  }

  static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<Antichess, PositionError> {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate(opts).map(_ => pos);
  }

  clone(): Antichess {
    return super.clone() as Antichess;
  }

  protected validate(_opts: FromSetupOpts | undefined): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (SquareSet.backranks().intersects(this.board.pawn))
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
    return Result.ok(undefined);
  }

  kingAttackers(_square: Square, _attacker: Color, _occupied: SquareSet): SquareSet {
    return SquareSet.empty();
  }

  ctx(): Context {
    const ctx = super.ctx();
    if (
      defined(this.epSquare) &&
      pawnAttacks(opposite(this.turn), this.epSquare).intersects(this.board.pieces(this.turn, 'pawn'))
    ) {
      ctx.mustCapture = true;
      return ctx;
    }
    const enemy = this.board[opposite(this.turn)];
    for (const from of this.board[this.turn]) {
      if (pseudoDests(this, from, ctx).intersects(enemy)) {
        ctx.mustCapture = true;
        return ctx;
      }
    }
    return ctx;
  }

  dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    const dests = pseudoDests(this, square, ctx);
    const enemy = this.board[opposite(this.turn)];
    return dests.intersect(
      ctx.mustCapture
        ? defined(this.epSquare) && this.board.getRole(square) === 'pawn'
          ? enemy.with(this.epSquare)
          : enemy
        : SquareSet.full()
    );
  }

  hasInsufficientMaterial(color: Color): boolean {
    if (this.board[color].isEmpty()) return false;
    if (this.board[opposite(color)].isEmpty()) return true;
    if (this.board.occupied.equals(this.board.bishop)) {
      const weSomeOnLight = this.board[color].intersects(SquareSet.lightSquares());
      const weSomeOnDark = this.board[color].intersects(SquareSet.darkSquares());
      const theyAllOnDark = this.board[opposite(color)].isDisjoint(SquareSet.lightSquares());
      const theyAllOnLight = this.board[opposite(color)].isDisjoint(SquareSet.darkSquares());
      return (weSomeOnLight && theyAllOnDark) || (weSomeOnDark && theyAllOnLight);
    }
    if (this.board.occupied.equals(this.board.knight) && this.board.occupied.size() === 2) {
      return (
        (this.board.white.intersects(SquareSet.lightSquares()) !==
          this.board.black.intersects(SquareSet.darkSquares())) !==
        (this.turn === color)
      );
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

export class KingOfTheHill extends Position {
  private constructor() {
    super('kingofthehill');
  }

  static default(): KingOfTheHill {
    const pos = new this();
    pos.reset();
    return pos;
  }

  static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<KingOfTheHill, PositionError> {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate(opts).map(_ => pos);
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

export class ThreeCheck extends Position {
  private constructor() {
    super('3check');
  }

  reset() {
    super.reset();
    this.remainingChecks = RemainingChecks.default();
  }

  protected setupUnchecked(setup: Setup) {
    super.setupUnchecked(setup);
    this.remainingChecks = setup.remainingChecks?.clone() || RemainingChecks.default();
  }

  static default(): ThreeCheck {
    const pos = new this();
    pos.reset();
    return pos;
  }

  static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<ThreeCheck, PositionError> {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate(opts).map(_ => pos);
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

const racingKingsBoard = (): Board => {
  const board = Board.empty();
  board.occupied = new SquareSet(0xffff, 0);
  board.promoted = SquareSet.empty();
  board.white = new SquareSet(0xf0f0, 0);
  board.black = new SquareSet(0x0f0f, 0);
  board.pawn = SquareSet.empty();
  board.knight = new SquareSet(0x1818, 0);
  board.bishop = new SquareSet(0x2424, 0);
  board.rook = new SquareSet(0x4242, 0);
  board.queen = new SquareSet(0x0081, 0);
  board.king = new SquareSet(0x8100, 0);
  return board;
};

export class RacingKings extends Position {
  private constructor() {
    super('racingkings');
  }

  reset() {
    this.board = racingKingsBoard();
    this.pockets = undefined;
    this.turn = 'white';
    this.castles = Castles.empty();
    this.epSquare = undefined;
    this.remainingChecks = undefined;
    this.halfmoves = 0;
    this.fullmoves = 1;
  }

  setupUnchecked(setup: Setup) {
    super.setupUnchecked(setup);
    this.castles = Castles.empty();
  }

  static default(): RacingKings {
    const pos = new this();
    pos.reset();
    return pos;
  }

  static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<RacingKings, PositionError> {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate(opts).map(_ => pos);
  }

  clone(): RacingKings {
    return super.clone() as RacingKings;
  }

  protected validate(opts: FromSetupOpts | undefined): Result<undefined, PositionError> {
    if (this.isCheck() || this.board.pawn.nonEmpty()) return Result.err(new PositionError(IllegalSetup.Variant));
    return super.validate(opts);
  }

  dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();

    // Kings cannot give check.
    if (square === ctx.king) return super.dests(square, ctx);

    // Do not allow giving check.
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

const hordeBoard = (): Board => {
  const board = Board.empty();
  board.occupied = new SquareSet(0xffff_ffff, 0xffff_0066);
  board.promoted = SquareSet.empty();
  board.white = new SquareSet(0xffff_ffff, 0x0000_0066);
  board.black = new SquareSet(0, 0xffff_0000);
  board.pawn = new SquareSet(0xffff_ffff, 0x00ff_0066);
  board.knight = new SquareSet(0, 0x4200_0000);
  board.bishop = new SquareSet(0, 0x2400_0000);
  board.rook = new SquareSet(0, 0x8100_0000);
  board.queen = new SquareSet(0, 0x0800_0000);
  board.king = new SquareSet(0, 0x1000_0000);
  return board;
};

export class Horde extends Position {
  private constructor() {
    super('horde');
  }

  reset() {
    this.board = hordeBoard();
    this.pockets = undefined;
    this.turn = 'white';
    this.castles = Castles.default();
    this.castles.discardColor('white');
    this.epSquare = undefined;
    this.remainingChecks = undefined;
    this.halfmoves = 0;
    this.fullmoves = 1;
  }

  static default(): Horde {
    const pos = new this();
    pos.reset();
    return pos;
  }

  static fromSetup(setup: Setup, opts?: FromSetupOpts): Result<Horde, PositionError> {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate(opts).map(_ => pos);
  }

  clone(): Horde {
    return super.clone() as Horde;
  }

  protected validate(opts: FromSetupOpts | undefined): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board.king.size() !== 1) return Result.err(new PositionError(IllegalSetup.Kings));

    const otherKing = this.board.kingOf(opposite(this.turn));
    if (defined(otherKing) && this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));
    for (const color of COLORS) {
      const backranks = this.board.pieces(color, 'king').isEmpty()
        ? SquareSet.backrank(opposite(color))
        : SquareSet.backranks();
      if (this.board.pieces(color, 'pawn').intersects(backranks)) {
        return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));
      }
    }
    return opts?.ignoreImpossibleCheck ? Result.ok(undefined) : this.validateCheckers();
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

export const defaultPosition = (rules: Rules): Position => {
  switch (rules) {
    case 'chess':
      return Chess.default();
    case 'antichess':
      return Antichess.default();
    case 'atomic':
      return Atomic.default();
    case 'horde':
      return Horde.default();
    case 'racingkings':
      return RacingKings.default();
    case 'kingofthehill':
      return KingOfTheHill.default();
    case '3check':
      return ThreeCheck.default();
    case 'crazyhouse':
      return Crazyhouse.default();
  }
};

export const setupPosition = (rules: Rules, setup: Setup, opts?: FromSetupOpts): Result<Position, PositionError> => {
  switch (rules) {
    case 'chess':
      return Chess.fromSetup(setup, opts);
    case 'antichess':
      return Antichess.fromSetup(setup, opts);
    case 'atomic':
      return Atomic.fromSetup(setup, opts);
    case 'horde':
      return Horde.fromSetup(setup, opts);
    case 'racingkings':
      return RacingKings.fromSetup(setup, opts);
    case 'kingofthehill':
      return KingOfTheHill.fromSetup(setup, opts);
    case '3check':
      return ThreeCheck.fromSetup(setup, opts);
    case 'crazyhouse':
      return Crazyhouse.fromSetup(setup, opts);
  }
};

export const isStandardMaterial = (pos: Position): boolean => {
  switch (pos.rules) {
    case 'chess':
    case 'antichess':
    case 'atomic':
    case 'kingofthehill':
    case '3check':
      return COLORS.every(color => isStandardMaterialSide(pos.board, color));
    case 'crazyhouse': {
      const promoted = pos.board.promoted;
      return (
        promoted.size() + pos.board.pawn.size() + (pos.pockets?.count('pawn') || 0) <= 16 &&
        pos.board.knight.diff(promoted).size() + (pos.pockets?.count('knight') || 0) <= 4 &&
        pos.board.bishop.diff(promoted).size() + (pos.pockets?.count('bishop') || 0) <= 4 &&
        pos.board.rook.diff(promoted).size() + (pos.pockets?.count('rook') || 0) <= 4 &&
        pos.board.queen.diff(promoted).size() + (pos.pockets?.count('queen') || 0) <= 2
      );
    }
    case 'horde':
      return COLORS.every(color =>
        pos.board.pieces(color, 'king').nonEmpty()
          ? isStandardMaterialSide(pos.board, color)
          : pos.board[color].size() <= 36
      );
    case 'racingkings':
      return COLORS.every(
        color =>
          pos.board.pieces(color, 'knight').size() <= 2 &&
          pos.board.pieces(color, 'bishop').size() <= 2 &&
          pos.board.pieces(color, 'rook').size() <= 2 &&
          pos.board.pieces(color, 'queen').size() <= 1
      );
  }
};
