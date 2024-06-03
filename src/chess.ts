import { Result } from '@badrap/result';
import {
  attacks,
  between,
  bishopAttacks,
  kingAttacks,
  knightAttacks,
  pawnAttacks,
  queenAttacks,
  ray,
  rookAttacks,
} from './attacks.js';
import { Board, boardEquals } from './board.js';
import { Material, RemainingChecks, Setup } from './setup.js';
import { SquareSet } from './squareSet.js';
import {
  ByCastlingSide,
  ByColor,
  CASTLING_SIDES,
  CastlingSide,
  Color,
  COLORS,
  isDrop,
  Move,
  NormalMove,
  Outcome,
  Piece,
  Rules,
  Square,
} from './types.js';
import { defined, kingCastlesTo, opposite, rookCastlesTo, squareRank } from './util.js';

/**
 * Enum representing illegal setup states.
 * @readonly
 * @enum {string}
 */
export enum IllegalSetup {
  Empty = 'ERR_EMPTY',
  OppositeCheck = 'ERR_OPPOSITE_CHECK',
  PawnsOnBackrank = 'ERR_PAWNS_ON_BACKRANK',
  Kings = 'ERR_KINGS',
  Variant = 'ERR_VARIANT',
}

/**
 * Custom error class for position errors.
 * @extends Error
 */
export class PositionError extends Error { }

/**
 * Calculates the attacking squares for a given square and attacker color.
 * @param {Square} square - The target square.
 * @param {Color} attacker - The attacking color.
 * @param {Board} board - The chess board.
 * @param {SquareSet} occupied - The occupied squares on the board.
 * @returns {SquareSet} The squares from which the target square is attacked.
 */
const attacksTo = (square: Square, attacker: Color, board: Board, occupied: SquareSet): SquareSet =>
  board[attacker].intersect(
    rookAttacks(square, occupied)
      .intersect(board.rooksAndQueens())
      .union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens()))
      .union(knightAttacks(square).intersect(board.knight))
      .union(kingAttacks(square).intersect(board.king))
      .union(pawnAttacks(opposite(attacker), square).intersect(board.pawn)),
  );

/**
* TODO: Not sure what this is
*/
export class Castles {
  /** @type {SquareSet} */
  castlingRights: SquareSet;
  /** @type {ByColor<ByCastlingSide<Square | undefined>>} */
  rook: ByColor<ByCastlingSide<Square | undefined>>;
  /** @type {ByColor<ByCastlingSide<SquareSet>>} */
  path: ByColor<ByCastlingSide<SquareSet>>;

  private constructor() { }

  /**
   * Creates a new Castles instance with default castling rights.
   * @returns {Castles} The default Castles instance.
   */
  static default(): Castles {
    const castles = new Castles();
    castles.castlingRights = SquareSet.corners();
    castles.rook = {
      white: { a: 0, h: 7 },
      black: { a: 56, h: 63 },
    };
    castles.path = {
      white: { a: new SquareSet(0xe, 0), h: new SquareSet(0x60, 0) },
      black: { a: new SquareSet(0, 0x0e000000), h: new SquareSet(0, 0x60000000) },
    };
    return castles;
  }

  /**
   * Creates a new empty Castles instance.
   * @returns {Castles} The empty Castles instance.
   */
  static empty(): Castles {
    const castles = new Castles();
    castles.castlingRights = SquareSet.empty();
    castles.rook = {
      white: { a: undefined, h: undefined },
      black: { a: undefined, h: undefined },
    };
    castles.path = {
      white: { a: SquareSet.empty(), h: SquareSet.empty() },
      black: { a: SquareSet.empty(), h: SquareSet.empty() },
    };
    return castles;
  }

  /**
   * Creates a clone of the current Castles instance.
   * @returns {Castles} The cloned Castles instance.
   */
  clone(): Castles {
    const castles = new Castles();
    castles.castlingRights = this.castlingRights;
    castles.rook = {
      white: { a: this.rook.white.a, h: this.rook.white.h },
      black: { a: this.rook.black.a, h: this.rook.black.h },
    };
    castles.path = {
      white: { a: this.path.white.a, h: this.path.white.h },
      black: { a: this.path.black.a, h: this.path.black.h },
    };
    return castles;
  }

  /**
   * Adds castling rights for the given color and side.
   * @param {Color} color - The color.
   * @param {CastlingSide} side - The castling side.
   * @param {Square} king - The king's square.
   * @param {Square} rook - The rook's square.
   */
  private add(color: Color, side: CastlingSide, king: Square, rook: Square): void {
    const kingTo = kingCastlesTo(color, side);
    const rookTo = rookCastlesTo(color, side);
    this.castlingRights = this.castlingRights.with(rook);
    this.rook[color][side] = rook;
    this.path[color][side] = between(rook, rookTo)
      .with(rookTo)
      .union(between(king, kingTo).with(kingTo))
      .without(king)
      .without(rook);
  }

  /**
  * Creates a Castles instance from the given setup.
  * @param {Setup} setup - The chess setup.
  * @returns {Castles} The Castles instance derived from the setup.
  */
  static fromSetup(setup: Setup): Castles {
    const castles = Castles.empty();
    const rooks = setup.castlingRights.intersect(setup.board.rook);
    for (const color of COLORS) {
      const backrank = SquareSet.backrank(color);
      const king = setup.board.kingOf(color);
      if (!defined(king) || !backrank.has(king)) continue;
      const side = rooks.intersect(setup.board[color]).intersect(backrank);
      const aSide = side.first();
      if (defined(aSide) && aSide < king) castles.add(color, 'a', king, aSide);
      const hSide = side.last();
      if (defined(hSide) && king < hSide) castles.add(color, 'h', king, hSide);
    }
    return castles;
  }

  /**
   * Discards castling rights for the rook on the given square.
   * @param {Square} square - The square of the rook.
   */
  discardRook(square: Square): void {
    if (this.castlingRights.has(square)) {
      this.castlingRights = this.castlingRights.without(square);
      for (const color of COLORS) {
        for (const side of CASTLING_SIDES) {
          if (this.rook[color][side] === square) this.rook[color][side] = undefined;
        }
      }
    }
  }

  /**
   * Discards castling rights for the given color.
   * @param {Color} color - The color to discard castling rights for.
   */
  discardColor(color: Color): void {
    this.castlingRights = this.castlingRights.diff(SquareSet.backrank(color));
    this.rook[color].a = undefined;
    this.rook[color].h = undefined;
  }
}

/**
 * TODO: Not sure what this is
 * Represents the context of a chess position.
 * @interface
 * @property {Square | undefined} king - The square of the king.
 * @property {SquareSet} blockers - The set of blocking squares.
 * @property {SquareSet} checkers - The set of checking squares.
 * @property {boolean} variantEnd - Whether the variant has ended.
 * @property {boolean} mustCapture - Whether a capture is required.
 */
export interface Context {
  king: Square | undefined;
  blockers: SquareSet;
  checkers: SquareSet;
  variantEnd: boolean;
  mustCapture: boolean;
}

/**
 * Abstract base class for chess positions.
 * @abstract
 */
export abstract class Position {
  /**
   * The current Board.
   */
  board: Board;

  /**
   * Represents the taken pieces.
   */
  pockets: Material | undefined;

  /**
   * The current turn.
   */
  turn: Color;

  /**
   * TODO: Not sure what this is
   */
  castles: Castles;

  /**
   * TODO: Not sure what this is
   */
  epSquare: Square | undefined;

  /**
   * TODO: Not sure what this is
   */
  remainingChecks: RemainingChecks | undefined;
  /**
   * Number of times pieces have been moved.
   * For example: 1.e4 is a halfmove, but 1.e4 e5 is a fullmove.
   */
  halfmoves: number;
  /**
   * Number of times both sides have played a move.
   * For example: 1.e4 e5 1.e5 is a fullmove, but 1.e4 e5 1.e5 e6 is two fullmoves.
   */
  fullmoves: number;

  /**
   * Creates a new Position instance.
   * @param {Rules} rules - The chess rules.
   */
  protected constructor(readonly rules: Rules) { }

  /**
   * Resets the position to the starting position.
   */
  reset() {
    this.board = Board.default();
    this.pockets = undefined;
    this.turn = 'white';
    this.castles = Castles.default();
    this.epSquare = undefined;
    this.remainingChecks = undefined;
    this.halfmoves = 0;
    this.fullmoves = 1;
  }

  /**
   * Sets up the position from the given setup without validation.
   * @param {Setup} setup - The chess setup.
   * @protected
   */
  protected setupUnchecked(setup: Setup) {
    this.board = setup.board.clone();
    this.board.promoted = SquareSet.empty();
    this.pockets = undefined;
    this.turn = setup.turn;
    this.castles = Castles.fromSetup(setup);
    this.epSquare = validEpSquare(this, setup.epSquare);
    this.remainingChecks = undefined;
    this.halfmoves = setup.halfmoves;
    this.fullmoves = setup.fullmoves;
  }

  // When subclassing overwrite at least:
  //
  // - static default()
  // - static fromSetup()
  // - static clone()
  //
  // - dests()
  // - isVariantEnd()
  // - variantOutcome()
  // - hasInsufficientMaterial()
  // - isStandardMaterial()

  /**
   * Calculates the attacking squares for the king on the given square by the given color.
   * @param {Square} square - The square of the king.
   * @param {Color} attacker - The attacking color.
   * @param {SquareSet} occupied - The occupied squares on the board.
   * @returns {SquareSet} The squares from which the king is attacked.
   */
  kingAttackers(square: Square, attacker: Color, occupied: SquareSet): SquareSet {
    return attacksTo(square, attacker, this.board, occupied);
  }

  /**
   * Executes a capture at the given square.
   * @param {Square} square - The square where the capture occurs.
   * @param {Piece} captured - The captured piece.
   * @protected
   */
  protected playCaptureAt(square: Square, captured: Piece): void {
    this.halfmoves = 0;
    if (captured.role === 'rook') this.castles.discardRook(square);
    if (this.pockets) this.pockets[opposite(captured.color)][captured.promoted ? 'pawn' : captured.role]++;
  }

  /**
   * Returns the context of the current position.
   * @returns {Context} The position context.
   */
  ctx(): Context {
    const variantEnd = this.isVariantEnd();
    const king = this.board.kingOf(this.turn);
    if (!defined(king)) {
      return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty(), variantEnd, mustCapture: false };
    }
    const snipers = rookAttacks(king, SquareSet.empty())
      .intersect(this.board.rooksAndQueens())
      .union(bishopAttacks(king, SquareSet.empty()).intersect(this.board.bishopsAndQueens()))
      .intersect(this.board[opposite(this.turn)]);
    let blockers = SquareSet.empty();
    for (const sniper of snipers) {
      const b = between(king, sniper).intersect(this.board.occupied);
      if (!b.moreThanOne()) blockers = blockers.union(b);
    }
    const checkers = this.kingAttackers(king, opposite(this.turn), this.board.occupied);
    return {
      king,
      blockers,
      checkers,
      variantEnd,
      mustCapture: false,
    };
  }

  /**
   * Creates a clone of the current position.
   * @returns {Position} The cloned position.
   */
  clone(): Position {
    const pos = new (this as any).constructor();
    pos.board = this.board.clone();
    pos.pockets = this.pockets?.clone();
    pos.turn = this.turn;
    pos.castles = this.castles.clone();
    pos.epSquare = this.epSquare;
    pos.remainingChecks = this.remainingChecks?.clone();
    pos.halfmoves = this.halfmoves;
    pos.fullmoves = this.fullmoves;
    return pos;
  }

  /**
   * Validates the current position.
   * @returns {Result<undefined, PositionError>} The validation result.
   * @protected
   */
  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board.king.size() !== 2) return Result.err(new PositionError(IllegalSetup.Kings));

    if (!defined(this.board.kingOf(this.turn))) return Result.err(new PositionError(IllegalSetup.Kings));

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

  /**
  * Calculates the possible destination squares for a drop move.
  * @param {Context} [_ctx] The optional context for the move generation.
  * @returns {SquareSet} The set of possible destination squares for a drop move.
  */
  dropDests(_ctx?: Context): SquareSet {
    return SquareSet.empty();
  }

  /**
  * Calculates the possible destination squares for a piece on a given square.
  * @param {Square} square The square of the piece.
  * @param {Context} [ctx] The optional context for the move generation.
  * @returns {SquareSet} The set of possible destination squares.
  */
  dests(square: Square, ctx?: Context): SquareSet {
    ctx = ctx || this.ctx();
    if (ctx.variantEnd) return SquareSet.empty();
    const piece = this.board.get(square);
    if (!piece || piece.color !== this.turn) return SquareSet.empty();

    let pseudo, legal;
    if (piece.role === 'pawn') {
      pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite(this.turn)]);
      const delta = this.turn === 'white' ? 8 : -8;
      const step = square + delta;
      if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
        pseudo = pseudo.with(step);
        const canDoubleStep = this.turn === 'white' ? square < 16 : square >= 64 - 16;
        const doubleStep = step + delta;
        if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
          pseudo = pseudo.with(doubleStep);
        }
      }
      if (defined(this.epSquare) && canCaptureEp(this, square, ctx)) {
        legal = SquareSet.fromSquare(this.epSquare);
      }
    } else if (piece.role === 'bishop') pseudo = bishopAttacks(square, this.board.occupied);
    else if (piece.role === 'knight') pseudo = knightAttacks(square);
    else if (piece.role === 'rook') pseudo = rookAttacks(square, this.board.occupied);
    else if (piece.role === 'queen') pseudo = queenAttacks(square, this.board.occupied);
    else pseudo = kingAttacks(square);

    pseudo = pseudo.diff(this.board[this.turn]);

    if (defined(ctx.king)) {
      if (piece.role === 'king') {
        const occ = this.board.occupied.without(square);
        for (const to of pseudo) {
          if (this.kingAttackers(to, opposite(this.turn), occ).nonEmpty()) pseudo = pseudo.without(to);
        }
        return pseudo.union(castlingDest(this, 'a', ctx)).union(castlingDest(this, 'h', ctx));
      }

      if (ctx.checkers.nonEmpty()) {
        const checker = ctx.checkers.singleSquare();
        if (!defined(checker)) return SquareSet.empty();
        pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
      }

      if (ctx.blockers.has(square)) pseudo = pseudo.intersect(ray(square, ctx.king));
    }

    if (legal) pseudo = pseudo.union(legal);
    return pseudo;
  }

  /**
   * TODO: Not sure what this is
   * @returns {boolean} Whether the position is a variant end.
   */
  isVariantEnd(): boolean {
    return false;
  }

  /**
   * TODO: Not sure what this is
   * @param _ctx 
   * @returns 
   */
  variantOutcome(_ctx?: Context): Outcome | undefined {
    return;
  }

  /**
   * Returns whether the given side has insufficient material to continue the game.
   * @param {Color} color the side to check
   * @returns {boolean} `true` if the side has insufficient material, `false` otherwise.
   */
  hasInsufficientMaterial(color: Color): boolean {
    if (this.board[color].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty()) return false;
    if (this.board[color].intersects(this.board.knight)) {
      return (
        this.board[color].size() <= 2
        && this.board[opposite(color)].diff(this.board.king).diff(this.board.queen).isEmpty()
      );
    }
    if (this.board[color].intersects(this.board.bishop)) {
      const sameColor = !this.board.bishop.intersects(SquareSet.darkSquares())
        || !this.board.bishop.intersects(SquareSet.lightSquares());
      return sameColor && this.board.pawn.isEmpty() && this.board.knight.isEmpty();
    }
    return true;
  }

  // The following should be identical in all subclasses

  /**
   * Returns a `Setup` instance representing the current position.
   * @returns {Setup} The setup instance.
   */
  toSetup(): Setup {
    return {
      board: this.board.clone(),
      pockets: this.pockets?.clone(),
      turn: this.turn,
      castlingRights: this.castles.castlingRights,
      epSquare: legalEpSquare(this),
      remainingChecks: this.remainingChecks?.clone(),
      halfmoves: Math.min(this.halfmoves, 150),
      fullmoves: Math.min(Math.max(this.fullmoves, 1), 9999),
    };
  }

  /**
   * Returns whether both sides have insufficient material to continue the game.
   * @returns {boolean} `true` if both sides have insufficient material to continue the game, `false` otherwise.
   */
  isInsufficientMaterial(): boolean {
    return COLORS.every(color => this.hasInsufficientMaterial(color));
  }

  /**
  * Checks if there are any possible destination squares for the current player's moves.
  * @param {Context} [ctx] The optional context for the move generation.
  * @returns {boolean} `true` if there are possible destination squares, `false` otherwise.
  */
  hasDests(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    for (const square of this.board[this.turn]) {
      if (this.dests(square, ctx).nonEmpty()) return true;
    }
    return this.dropDests(ctx).nonEmpty();
  }
  /**
  * Checks if a given move is legal in the current position.
  * @param {Move} move The move to check for legality.
  * @param {Context} [ctx] The optional context for the move generation.
  * @returns {boolean} `true` if the move is legal, `false` otherwise.
  */
  isLegal(move: Move, ctx?: Context): boolean {
    if (isDrop(move)) {
      if (!this.pockets || this.pockets[this.turn][move.role] <= 0) return false;
      if (move.role === 'pawn' && SquareSet.backranks().has(move.to)) return false;
      return this.dropDests(ctx).has(move.to);
    } else {
      if (move.promotion === 'pawn') return false;
      if (move.promotion === 'king' && this.rules !== 'antichess') return false;
      if (!!move.promotion !== (this.board.pawn.has(move.from) && SquareSet.backranks().has(move.to))) return false;
      const dests = this.dests(move.from, ctx);
      return dests.has(move.to) || dests.has(normalizeMove(this, move).to);
    }
  }

  /**
  * Checks if the current position is a check.
  * @returns {boolean} `true` if the current position is a check, `false` otherwise.
  */
  isCheck(): boolean {
    const king = this.board.kingOf(this.turn);
    return defined(king) && this.kingAttackers(king, opposite(this.turn), this.board.occupied).nonEmpty();
  }

  /**
  * Checks if the current position is an end position.
  * @param {Context} [ctx] The optional context for the move generation.
  * @returns {boolean} `true` if the current position is an end position, `false` otherwise.
  */
  isEnd(ctx?: Context): boolean {
    if (ctx ? ctx.variantEnd : this.isVariantEnd()) return true;
    return this.isInsufficientMaterial() || !this.hasDests(ctx);
  }

  /**
  * Checks if the current position is a checkmate.
  * @param {Context} [ctx] The optional context for the move generation.
  * @returns {boolean} `true` if the current position is a checkmate, `false` otherwise.
  */
  isCheckmate(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    return !ctx.variantEnd && ctx.checkers.nonEmpty() && !this.hasDests(ctx);
  }

  /**
  * Checks if the current position is a stalemate.
  * @param {Context} [ctx] The optional context for the move generation.
  * @returns {boolean} `true` if the current position is a stalemate, `false` otherwise.
  */
  isStalemate(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    return !ctx.variantEnd && ctx.checkers.isEmpty() && !this.hasDests(ctx);
  }

  /**
  * Determines the outcome of the current position.
  * @param {Context} [ctx] The optional context for the move generation.
  * @returns {Outcome | undefined} The outcome of the current position, or undefined if the position is not an end position.
  */
  outcome(ctx?: Context): Outcome | undefined {
    const variantOutcome = this.variantOutcome(ctx);
    if (variantOutcome) return variantOutcome;
    ctx = ctx || this.ctx();
    if (this.isCheckmate(ctx)) return { winner: opposite(this.turn) };
    else if (this.isInsufficientMaterial() || this.isStalemate(ctx)) return { winner: undefined };
    else return;
  }

  /**
  * Calculates all possible destination squares for each piece of the current player.
  * @param {Context} [ctx] The optional context for the move generation.
  * @returns {Map<Square, SquareSet>} A map of source squares to their corresponding sets of possible destination squares.
  */
  allDests(ctx?: Context): Map<Square, SquareSet> {
    ctx = ctx || this.ctx();
    const d = new Map();
    if (ctx.variantEnd) return d;
    for (const square of this.board[this.turn]) {
      d.set(square, this.dests(square, ctx));
    }
    return d;
  }

  /**
   * Plays the given move to the board.
   * @param {Move} move A move to be played.
   * @returns {void}
   */
  play(move: Move): void {
    const turn = this.turn;
    const epSquare = this.epSquare;
    const castling = castlingSide(this, move);

    this.epSquare = undefined;
    this.halfmoves += 1;
    if (turn === 'black') this.fullmoves += 1;
    this.turn = opposite(turn);

    if (isDrop(move)) {
      this.board.set(move.to, { role: move.role, color: turn });
      if (this.pockets) this.pockets[turn][move.role]--;
      if (move.role === 'pawn') this.halfmoves = 0;
    } else {
      const piece = this.board.take(move.from);
      if (!piece) return;

      let epCapture: Piece | undefined;
      if (piece.role === 'pawn') {
        this.halfmoves = 0;
        if (move.to === epSquare) {
          epCapture = this.board.take(move.to + (turn === 'white' ? -8 : 8));
        }
        const delta = move.from - move.to;
        if (Math.abs(delta) === 16 && 8 <= move.from && move.from <= 55) {
          this.epSquare = (move.from + move.to) >> 1;
        }
        if (move.promotion) {
          piece.role = move.promotion;
          piece.promoted = !!this.pockets;
        }
      } else if (piece.role === 'rook') {
        this.castles.discardRook(move.from);
      } else if (piece.role === 'king') {
        if (castling) {
          const rookFrom = this.castles.rook[turn][castling];
          if (defined(rookFrom)) {
            const rook = this.board.take(rookFrom);
            this.board.set(kingCastlesTo(turn, castling), piece);
            if (rook) this.board.set(rookCastlesTo(turn, castling), rook);
          }
        }
        this.castles.discardColor(turn);
      }

      if (!castling) {
        const capture = this.board.set(move.to, piece) || epCapture;
        if (capture) this.playCaptureAt(move.to, capture);
      }
    }

    if (this.remainingChecks) {
      if (this.isCheck()) this.remainingChecks[turn] = Math.max(this.remainingChecks[turn] - 1, 0);
    }
  }
}

export class Chess extends Position {
  private constructor() {
    super('chess');
  }

  /**
   * Create a new chess game with a default setup.
   * @returns {Chess}
   */
  static default(): Chess {
    const pos = new this();
    pos.reset();
    return pos;
  }

  /**
   * Create a new, unchecked chess game from a setup.
   * TODO: There is validation, but I'm not sure what it is.
   * @param {Setup} setup - The chess setup.
   * @returns Chess or an error.
   */
  static fromSetup(setup: Setup): Result<Chess, PositionError> {
    const pos = new this();
    pos.setupUnchecked(setup);
    return pos.validate().map(_ => pos);
  }

  /**
   * Clone the current chess game.
   * @returns {Chess} The cloned chess game.
   */
  clone(): Chess {
    return super.clone() as Chess;
  }
}

/**
 * Returns the square the en passant can be played to from given position and square.
 * @param pos {Position}
 * @param square {Square}
 * @returns {Square | undefined} Any square the en passant can be played to.
 */
const validEpSquare = (pos: Position, square: Square | undefined): Square | undefined => {
  if (!defined(square)) return;
  const epRank = pos.turn === 'white' ? 5 : 2;
  const forward = pos.turn === 'white' ? 8 : -8;
  if (squareRank(square) !== epRank) return;
  if (pos.board.occupied.has(square + forward)) return;
  const pawn = square - forward;
  if (!pos.board.pawn.has(pawn) || !pos.board[opposite(pos.turn)].has(pawn)) return;
  return square;
};

/**
 * Finds and returns all legal en passant squares in the position.
 * @param {Position} pos 
 * @returns {Square | undefined}
 */
const legalEpSquare = (pos: Position): Square | undefined => {
  if (!defined(pos.epSquare)) return;
  const ctx = pos.ctx();
  const ourPawns = pos.board.pieces(pos.turn, 'pawn');
  const candidates = ourPawns.intersect(pawnAttacks(opposite(pos.turn), pos.epSquare));
  for (const candidate of candidates) {
    if (pos.dests(candidate, ctx).has(pos.epSquare)) return pos.epSquare;
  }
  return;
};

/**
 * TODO: Not sure what this does
 * @param {Position} pos 
 * @param {Square} pawnFrom
 * @param {Context} ctx
 * @returns {boolean} `true` if can capture, `false` otherwise
 */
const canCaptureEp = (pos: Position, pawnFrom: Square, ctx: Context): boolean => {
  if (!defined(pos.epSquare)) return false;
  if (!pawnAttacks(pos.turn, pawnFrom).has(pos.epSquare)) return false;
  if (!defined(ctx.king)) return true;
  const delta = pos.turn === 'white' ? 8 : -8;
  const captured = pos.epSquare - delta;
  return pos
    .kingAttackers(
      ctx.king,
      opposite(pos.turn),
      pos.board.occupied.toggle(pawnFrom).toggle(captured).with(pos.epSquare),
    )
    .without(captured)
    .isEmpty();
};


/**
 * Checks various castling conditions and returns a set of squares that can be castled to.
 * @param {Position} pos 
 * @param {CastlingSide} side 
 * @param {Context} ctx 
 * @returns {SquareSet} A set of squares that can be castled to. Can be empty.
 */
const castlingDest = (pos: Position, side: CastlingSide, ctx: Context): SquareSet => {
  if (!defined(ctx.king) || ctx.checkers.nonEmpty()) return SquareSet.empty();
  const rook = pos.castles.rook[pos.turn][side];
  if (!defined(rook)) return SquareSet.empty();

  // If any square in the castilng path is occupied, return an empty set
  if (pos.castles.path[pos.turn][side].intersects(pos.board.occupied)) return SquareSet.empty();

  // Find the castling square
  const kingTo = kingCastlesTo(pos.turn, side);

  // Find the path of the king to the castling square
  const kingPath = between(ctx.king, kingTo);

  // Remove the king position
  const occ = pos.board.occupied.without(ctx.king);


  for (const sq of kingPath) {
    if (pos.kingAttackers(sq, opposite(pos.turn), occ).nonEmpty()) return SquareSet.empty();
  }


  const rookTo = rookCastlesTo(pos.turn, side);
  const after = pos.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
  if (pos.kingAttackers(kingTo, opposite(pos.turn), after).nonEmpty()) return SquareSet.empty();

  return SquareSet.fromSquare(rook);
};

export const pseudoDests = (pos: Position, square: Square, ctx: Context): SquareSet => {
  if (ctx.variantEnd) return SquareSet.empty();
  const piece = pos.board.get(square);
  if (!piece || piece.color !== pos.turn) return SquareSet.empty();

  let pseudo = attacks(piece, square, pos.board.occupied);
  if (piece.role === 'pawn') {
    let captureTargets = pos.board[opposite(pos.turn)];
    if (defined(pos.epSquare)) captureTargets = captureTargets.with(pos.epSquare);
    pseudo = pseudo.intersect(captureTargets);
    const delta = pos.turn === 'white' ? 8 : -8;
    const step = square + delta;
    if (0 <= step && step < 64 && !pos.board.occupied.has(step)) {
      pseudo = pseudo.with(step);
      const canDoubleStep = pos.turn === 'white' ? square < 16 : square >= 64 - 16;
      const doubleStep = step + delta;
      if (canDoubleStep && !pos.board.occupied.has(doubleStep)) {
        pseudo = pseudo.with(doubleStep);
      }
    }
    return pseudo;
  } else {
    pseudo = pseudo.diff(pos.board[pos.turn]);
  }
  if (square === ctx.king) return pseudo.union(castlingDest(pos, 'a', ctx)).union(castlingDest(pos, 'h', ctx));
  else return pseudo;
};

export const equalsIgnoreMoves = (left: Position, right: Position): boolean =>
  left.rules === right.rules
  && boardEquals(left.board, right.board)
  && ((right.pockets && left.pockets?.equals(right.pockets)) || (!left.pockets && !right.pockets))
  && left.turn === right.turn
  && left.castles.castlingRights.equals(right.castles.castlingRights)
  && legalEpSquare(left) === legalEpSquare(right)
  && ((right.remainingChecks && left.remainingChecks?.equals(right.remainingChecks))
    || (!left.remainingChecks && !right.remainingChecks));

/**
 * TODO: unsure
 * 
 * I believe this takes in a move and a position, and from that determines what side is being castled to?
 * @param pos 
 * @param move 
 * @returns {CastlingSide | undefined}
 */
export const castlingSide = (pos: Position, move: Move): CastlingSide | undefined => {
  if (isDrop(move)) return;
  const delta = move.to - move.from;
  if (Math.abs(delta) !== 2 && !pos.board[pos.turn].has(move.to)) return;
  if (!pos.board.king.has(move.from)) return;
  return delta > 0 ? 'h' : 'a';
};

/**
 * TODO: unsure
 * @param pos 
 * @param move 
 * @returns 
 */
export const normalizeMove = (pos: Position, move: Move): Move => {
  const side = castlingSide(pos, move);
  if (!side) return move;
  const rookFrom = pos.castles.rook[pos.turn][side];
  return {
    from: (move as NormalMove).from,
    to: defined(rookFrom) ? rookFrom : move.to,
  };
};

/**
 * TODO: unsure
 * 
 * I think this determines whether a given side has more pieces than normal?
 * @param board 
 * @param color 
 * @returns 
 */
export const isStandardMaterialSide = (board: Board, color: Color): boolean => {
  const promoted = Math.max(board.pieces(color, 'queen').size() - 1, 0)
    + Math.max(board.pieces(color, 'rook').size() - 2, 0)
    + Math.max(board.pieces(color, 'knight').size() - 2, 0)
    + Math.max(board.pieces(color, 'bishop').intersect(SquareSet.lightSquares()).size() - 1, 0)
    + Math.max(board.pieces(color, 'bishop').intersect(SquareSet.darkSquares()).size() - 1, 0);
  return board.pieces(color, 'pawn').size() + promoted <= 8;
};

/**
 * TODO: unsure
 * 
 * I think this returns whether the total amount of material on the board is within the bounds
 * of what is expected in standard chess.
 * @param pos 
 * @returns 
 */
export const isStandardMaterial = (pos: Chess): boolean =>
  COLORS.every(color => isStandardMaterialSide(pos.board, color));

/**
 * TODO: no clue here
 * @param pos 
 * @returns 
 */
export const isImpossibleCheck = (pos: Position): boolean => {
  const ourKing = pos.board.kingOf(pos.turn);
  if (!defined(ourKing)) return false;
  const checkers = pos.kingAttackers(ourKing, opposite(pos.turn), pos.board.occupied);
  if (checkers.isEmpty()) return false;
  if (defined(pos.epSquare)) {
    // The pushed pawn must be the only checker, or it has uncovered
    // check by a single sliding piece.
    const pushedTo = pos.epSquare ^ 8;
    const pushedFrom = pos.epSquare ^ 24;
    return (
      checkers.moreThanOne()
      || (checkers.first()! !== pushedTo
        && pos
          .kingAttackers(ourKing, opposite(pos.turn), pos.board.occupied.without(pushedTo).with(pushedFrom))
          .nonEmpty())
    );
  } else if (pos.rules === 'atomic') {
    // Other king moving away can cause many checks to be given at the same
    // time. Not checking details, or even that the king is close enough.
    return false;
  } else {
    // Sliding checkers aligned with king.
    return checkers.size() > 2 || (checkers.size() === 2 && ray(checkers.first()!, checkers.last()!).has(ourKing));
  }
};
