import { Result } from '@badrap/result';
import { Rules, CastlingSide, CASTLING_SIDES, Color, COLORS, Square, ByColor, ByCastlingSide, Move, NormalMove, isDrop, Piece, Outcome } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, Material, RemainingChecks } from './setup';
import { attacks, bishopAttacks, rookAttacks, queenAttacks, knightAttacks, kingAttacks, pawnAttacks, between, ray } from './attacks';
import { opposite, defined, squareRank } from './util';

export enum IllegalSetup {
  Empty = 'ERR_EMPTY',
  OppositeCheck = 'ERR_OPPOSITE_CHECK',
  ImpossibleCheck = 'ERR_IMPOSSIBLE_CHECK',
  PawnsOnBackrank = 'ERR_PAWNS_ON_BACKRANK',
  Kings = 'ERR_KINGS',
  Variant = 'ERR_VARIANT',
}

export class PositionError extends Error { }

function attacksTo(square: Square, attacker: Color, board: Board, occupied: SquareSet): SquareSet {
  return board[attacker].intersect(
    rookAttacks(square, occupied).intersect(board.rooksAndQueens())
      .union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens()))
      .union(knightAttacks(square).intersect(board.knight))
      .union(kingAttacks(square).intersect(board.king))
      .union(pawnAttacks(opposite(attacker), square).intersect(board.pawn)));
}

function kingCastlesTo(color: Color, side: CastlingSide): Square {
  return color === 'white' ? (side === 'a' ? 2 : 6) : (side === 'a' ? 58 : 62);
}

function rookCastlesTo(color: Color, side: CastlingSide): Square {
  return color === 'white' ? (side === 'a' ? 3 : 5) : (side === 'a' ? 59 : 61);
}

export class Castles {
  unmovedRooks: SquareSet;
  rook: ByColor<ByCastlingSide<Square | undefined>>;
  path: ByColor<ByCastlingSide<SquareSet>>;

  private constructor() { }

  static default(): Castles {
    const castles = new Castles();
    castles.unmovedRooks = SquareSet.corners();
    castles.rook = {
      white: { a: 0, h: 7 },
      black: { a: 56 , h: 63 },
    };
    castles.path = {
      white: { a: new SquareSet(0xe, 0), h: new SquareSet(0x60, 0) },
      black: { a: new SquareSet(0, 0x0e000000), h: new SquareSet(0, 0x60000000) },
    };
    return castles;
  }

  static empty(): Castles {
    const castles = new Castles();
    castles.unmovedRooks = SquareSet.empty();
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

  clone(): Castles {
    const castles = new Castles();
    castles.unmovedRooks = this.unmovedRooks;
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

  private add(color: Color, side: CastlingSide, king: Square, rook: Square): void {
    const kingTo = kingCastlesTo(color, side);
    const rookTo = rookCastlesTo(color, side);
    this.unmovedRooks = this.unmovedRooks.with(rook);
    this.rook[color][side] = rook;
    this.path[color][side] = between(rook, rookTo).with(rookTo)
      .union(between(king, kingTo).with(kingTo))
      .without(king).without(rook);
  }

  static fromSetup(setup: Setup): Castles {
    const castles = Castles.empty();
    const rooks = setup.unmovedRooks.intersect(setup.board.rook);
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

  discardRook(square: Square): void {
    if (this.unmovedRooks.has(square)) {
      this.unmovedRooks = this.unmovedRooks.without(square);
      for (const color of COLORS) {
        for (const side of CASTLING_SIDES) {
          if (this.rook[color][side] === square) this.rook[color][side] = undefined;
        }
      }
    }
  }

  discardSide(color: Color): void {
    this.unmovedRooks = this.unmovedRooks.diff(SquareSet.backrank(color));
    this.rook[color].a = undefined;
    this.rook[color].h = undefined;
  }
}

export interface Context {
  king: Square | undefined;
  blockers: SquareSet;
  checkers: SquareSet;
  variantEnd: boolean;
  mustCapture: boolean;
}

export abstract class Position {
  board: Board;
  pockets: Material | undefined;
  turn: Color;
  castles: Castles;
  epSquare: Square | undefined;
  remainingChecks: RemainingChecks | undefined;
  halfmoves: number;
  fullmoves: number;

  protected constructor(readonly rules: Rules) { }

  // When subclassing:
  // - static default()
  // - static fromSetup()
  // - Proper signature for clone()

  abstract dests(square: Square, ctx?: Context): SquareSet;
  abstract isVariantEnd(): boolean;
  abstract variantOutcome(ctx?: Context): Outcome | undefined;
  abstract hasInsufficientMaterial(color: Color): boolean;

  protected kingAttackers(square: Square, attacker: Color, occupied: SquareSet): SquareSet {
    return attacksTo(square, attacker, this.board, occupied);
  }

  dropDests(_ctx?: Context): SquareSet {
    return SquareSet.empty();
  }

  protected playCaptureAt(square: Square, captured: Piece): void {
    this.halfmoves = 0;
    if (captured.role === 'rook') this.castles.discardRook(square);
    if (this.pockets) this.pockets[opposite(captured.color)][captured.role]++;
  }

  ctx(): Context {
    const variantEnd = this.isVariantEnd();
    const king = this.board.kingOf(this.turn);
    if (!defined(king)) return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty(), variantEnd, mustCapture: false };
    const snipers = rookAttacks(king, SquareSet.empty()).intersect(this.board.rooksAndQueens())
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

  // The following should be identical in all subclasses

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

  equalsIgnoreMoves(other: Position): boolean {
    return this.rules === other.rules &&
      (this.pockets ? this.board.equals(other.board) : this.board.equalsIgnorePromoted(other.board)) &&
      ((other.pockets && this.pockets?.equals(other.pockets)) || (!this.pockets && !other.pockets)) &&
      this.turn === other.turn &&
      this.castles.unmovedRooks.equals(other.castles.unmovedRooks) &&
      this.legalEpSquare() === other.legalEpSquare() &&
      ((other.remainingChecks && this.remainingChecks?.equals(other.remainingChecks)) || (!this.remainingChecks && !other.remainingChecks));
  }

  toSetup(): Setup {
    return {
      board: this.board.clone(),
      pockets: this.pockets?.clone(),
      turn: this.turn,
      unmovedRooks: this.castles.unmovedRooks,
      epSquare: this.legalEpSquare(),
      remainingChecks: this.remainingChecks?.clone(),
      halfmoves: Math.min(this.halfmoves, 150),
      fullmoves: Math.min(Math.max(this.fullmoves, 1), 9999),
    };
  }

  isInsufficientMaterial(): boolean {
    return COLORS.every(color => this.hasInsufficientMaterial(color));
  }

  hasDests(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    for (const square of this.board[this.turn]) {
      if (this.dests(square, ctx).nonEmpty()) return true;
    }
    return this.dropDests(ctx).nonEmpty();
  }

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
      return dests.has(move.to) || dests.has(this.normalizeMove(move).to);
    }
  }

  isCheck(): boolean {
    const king = this.board.kingOf(this.turn);
    return defined(king) && this.kingAttackers(king, opposite(this.turn), this.board.occupied).nonEmpty();
  }

  isEnd(ctx?: Context): boolean {
    if (ctx ? ctx.variantEnd : this.isVariantEnd()) return true;
    return this.isInsufficientMaterial() || !this.hasDests(ctx);
  }

  isCheckmate(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    return !ctx.variantEnd && ctx.checkers.nonEmpty() && !this.hasDests(ctx);
  }

  isStalemate(ctx?: Context): boolean {
    ctx = ctx || this.ctx();
    return !ctx.variantEnd && ctx.checkers.isEmpty() && !this.hasDests(ctx);
  }

  outcome(ctx?: Context): Outcome | undefined {
    const variantOutcome = this.variantOutcome(ctx);
    if (variantOutcome) return variantOutcome;
    ctx = ctx || this.ctx();
    if (this.isCheckmate(ctx)) return { winner: opposite(this.turn) };
    else if (this.isInsufficientMaterial() || this.isStalemate(ctx)) return { winner: undefined };
    else return;
  }

  allDests(ctx?: Context): Map<Square, SquareSet> {
    ctx = ctx || this.ctx();
    const d = new Map();
    if (ctx.variantEnd) return d;
    for (const square of this.board[this.turn]) {
      d.set(square, this.dests(square, ctx));
    }
    return d;
  }

  castlingSide(move: Move): CastlingSide | undefined {
    if (isDrop(move)) return;
    const delta = move.to - move.from;
    if (Math.abs(delta) !== 2 && !this.board[this.turn].has(move.to)) return;
    if (!this.board.king.has(move.from)) return;
    return delta > 0 ? 'h' : 'a';
  }

  normalizeMove(move: Move): Move {
    const castlingSide = this.castlingSide(move);
    if (!castlingSide) return move;
    const rookFrom = this.castles.rook[this.turn][castlingSide];
    return {
      from: (move as NormalMove).from,
      to: defined(rookFrom) ? rookFrom : move.to,
    };
  }

  play(move: Move): void {
    const turn = this.turn;
    const epSquare = this.epSquare;
    const castlingSide = this.castlingSide(move);

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
          piece.promoted = true;
        }
      } else if (piece.role === 'rook') {
        this.castles.discardRook(move.from);
      } else if (piece.role === 'king') {
        if (castlingSide) {
          const rookFrom = this.castles.rook[turn][castlingSide];
          if (defined(rookFrom)) {
            const rook = this.board.take(rookFrom);
            this.board.set(kingCastlesTo(turn, castlingSide), piece);
            if (rook) this.board.set(rookCastlesTo(turn, castlingSide), rook);
          }
        }
        this.castles.discardSide(turn);
        if (castlingSide) return;
      }

      const capture = this.board.set(move.to, piece) || epCapture;
      if (capture) this.playCaptureAt(move.to, capture);
    }
  }

  private legalEpSquare(ctx?: Context): Square | undefined {
    if (!defined(this.epSquare)) return;
    ctx = ctx || this.ctx();
    const ourPawns = this.board.pieces(this.turn, 'pawn');
    const candidates = ourPawns.intersect(pawnAttacks(opposite(this.turn), this.epSquare));
    for (const candidate of candidates) {
      if (this.dests(candidate, ctx).has(this.epSquare)) return this.epSquare;
    }
    return;
  }
}

export class Chess extends Position {
  protected constructor(rules?: Rules) {
    super(rules || 'chess');
  }

  static default(): Chess {
    const pos = new this();
    pos.board = Board.default();
    pos.pockets = undefined;
    pos.turn = 'white';
    pos.castles = Castles.default();
    pos.epSquare = undefined;
    pos.remainingChecks = undefined;
    pos.halfmoves = 0;
    pos.fullmoves = 1;
    return pos;
  }

  static fromSetup(setup: Setup): Result<Chess, PositionError> {
    const pos = new this();
    pos.board = setup.board.clone();
    pos.pockets = undefined;
    pos.turn = setup.turn;
    pos.castles = Castles.fromSetup(setup);
    pos.epSquare = pos.validEpSquare(setup.epSquare);
    pos.remainingChecks = undefined;
    pos.halfmoves = setup.halfmoves;
    pos.fullmoves = setup.fullmoves;
    return pos.validate().map(_ => pos);
  }

  clone(): Chess {
    return super.clone() as Chess;
  }

  protected validate(): Result<undefined, PositionError> {
    if (this.board.occupied.isEmpty()) return Result.err(new PositionError(IllegalSetup.Empty));
    if (this.board.king.size() !== 2) return Result.err(new PositionError(IllegalSetup.Kings));

    if (!defined(this.board.kingOf(this.turn))) return Result.err(new PositionError(IllegalSetup.Kings));

    const otherKing = this.board.kingOf(opposite(this.turn));
    if (!defined(otherKing)) return Result.err(new PositionError(IllegalSetup.Kings));
    if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty())
      return Result.err(new PositionError(IllegalSetup.OppositeCheck));

    if (SquareSet.backranks().intersects(this.board.pawn))
      return Result.err(new PositionError(IllegalSetup.PawnsOnBackrank));

    return this.validateCheckers();
  }

  protected validateCheckers(): Result<undefined, PositionError> {
    const ourKing = this.board.kingOf(this.turn);
    if (defined(ourKing)) {
      // Multiple sliding checkers aligned with king.
      const checkers = this.kingAttackers(ourKing, opposite(this.turn), this.board.occupied);
      if (checkers.size() > 2 || (checkers.size() === 2 && ray(checkers.first()!, checkers.last()!).has(ourKing)))
        return Result.err(new PositionError(IllegalSetup.ImpossibleCheck));

      // En passant square aligned with checker and king.
      if (defined(this.epSquare)) {
        for (const checker of checkers) {
          if (ray(checker, this.epSquare).has(ourKing)) return Result.err(new PositionError(IllegalSetup.ImpossibleCheck));
        }
      }
    }
    return Result.ok(undefined);
  }

  private validEpSquare(square: Square | undefined): Square | undefined {
    if (!defined(square)) return;
    const epRank = this.turn === 'white' ? 5 : 2;
    const forward = this.turn === 'white' ? 8 : -8;
    if (squareRank(square) !== epRank) return;
    if (this.board.occupied.has(square + forward)) return;
    const pawn = square - forward;
    if (!this.board.pawn.has(pawn) || !this.board[opposite(this.turn)].has(pawn)) return;
    return square;
  }

  private castlingDest(side: CastlingSide, ctx: Context): SquareSet {
    if (!defined(ctx.king) || ctx.checkers.nonEmpty()) return SquareSet.empty();
    const rook = this.castles.rook[this.turn][side];
    if (!defined(rook)) return SquareSet.empty();
    if (this.castles.path[this.turn][side].intersects(this.board.occupied)) return SquareSet.empty();

    const kingTo = kingCastlesTo(this.turn, side);
    const kingPath = between(ctx.king, kingTo);
    const occ = this.board.occupied.without(ctx.king);
    for (const sq of kingPath) {
      if (this.kingAttackers(sq, opposite(this.turn), occ).nonEmpty()) return SquareSet.empty();
    }

    const rookTo = rookCastlesTo(this.turn, side);
    const after = this.board.occupied.toggle(ctx.king).toggle(rook).toggle(rookTo);
    if (this.kingAttackers(kingTo, opposite(this.turn), after).nonEmpty()) return SquareSet.empty();

    return SquareSet.fromSquare(rook);
  }

  private canCaptureEp(pawn: Square, ctx: Context): boolean {
    if (!defined(this.epSquare)) return false;
    if (!pawnAttacks(this.turn, pawn).has(this.epSquare)) return false;
    if (!defined(ctx.king)) return true;
    const captured = this.epSquare + ((this.turn === 'white') ? -8 : 8);
    const occupied = this.board.occupied.toggle(pawn).toggle(this.epSquare).toggle(captured);
    return !this.kingAttackers(ctx.king, opposite(this.turn), occupied).intersects(occupied);
  }

  protected pseudoDests(square: Square, ctx: Context): SquareSet {
    if (ctx.variantEnd) return SquareSet.empty();
    const piece = this.board.get(square);
    if (!piece || piece.color !== this.turn) return SquareSet.empty();

    let pseudo = attacks(piece, square, this.board.occupied);
    if (piece.role === 'pawn') {
      let captureTargets = this.board[opposite(this.turn)];
      if (defined(this.epSquare)) captureTargets = captureTargets.with(this.epSquare);
      pseudo = pseudo.intersect(captureTargets);
      const delta = this.turn === 'white' ? 8 : -8;
      const step = square + delta;
      if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
        pseudo = pseudo.with(step);
        const canDoubleStep = this.turn === 'white' ? (square < 16) : (square >= 64 - 16);
        const doubleStep = step + delta;
        if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
          pseudo = pseudo.with(doubleStep);
        }
      }
      return pseudo;
    } else {
      pseudo = pseudo.diff(this.board[this.turn]);
    }
    if (square === ctx.king) return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
    else return pseudo;
  }

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
        const canDoubleStep = this.turn === 'white' ? (square < 16) : (square >= 64 - 16);
        const doubleStep = step + delta;
        if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
          pseudo = pseudo.with(doubleStep);
        }
      }
      if (defined(this.epSquare) && this.canCaptureEp(square, ctx)) {
        const pawn = this.epSquare - delta;
        if (ctx.checkers.isEmpty() || ctx.checkers.singleSquare() === pawn) {
          legal = SquareSet.fromSquare(this.epSquare);
        }
      }
    }
    else if (piece.role === 'bishop') pseudo = bishopAttacks(square, this.board.occupied);
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
        return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
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

  isVariantEnd(): boolean {
    return false;
  }

  variantOutcome(_ctx?: Context): Outcome | undefined {
    return;
  }

  hasInsufficientMaterial(color: Color): boolean {
    if (this.board[color].intersect(this.board.pawn.union(this.board.rooksAndQueens())).nonEmpty()) return false;
    if (this.board[color].intersects(this.board.knight)) {
      return this.board[color].size() <= 2 &&
        this.board[opposite(color)].diff(this.board.king).diff(this.board.queen).isEmpty();
    }
    if (this.board[color].intersects(this.board.bishop)) {
      const sameColor =
        !this.board.bishop.intersects(SquareSet.darkSquares()) ||
        !this.board.bishop.intersects(SquareSet.lightSquares());
      return sameColor && this.board.pawn.isEmpty() && this.board.knight.isEmpty();
    }
    return true;
  }
}
