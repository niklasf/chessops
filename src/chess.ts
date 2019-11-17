import { CastlingSide, CASTLING_SIDES, Color, COLORS, Square, ByColor, ByCastlingSide, BySquare, Uci, isDrop, Piece, Outcome } from './types';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Setup, Material, RemainingChecks } from './setup';
import { bishopAttacks, rookAttacks, queenAttacks, knightAttacks, kingAttacks, pawnAttacks, between, ray } from './attacks';
import { opposite, defined } from './util';

export class PositionError extends Error { }

function attacksTo(square: Square, attacker: Color, board: Board, occupied: SquareSet): SquareSet {
  return board[attacker].intersect(
    rookAttacks(square, occupied).intersect(board.rooksAndQueens())
      .union(bishopAttacks(square, occupied).intersect(board.bishopsAndQueens()))
      .union(knightAttacks(square).intersect(board.knight))
      .union(kingAttacks(square).intersect(board.king))
      .union(pawnAttacks(opposite(attacker), square).intersect(board.pawn)));
}

function kingCastlesTo(color: Color, side: CastlingSide) {
  return color == 'white' ? (side == 'a' ? 2 : 6) : (side == 'a' ? 58 : 62);
}

function rookCastlesTo(color: Color, side: CastlingSide) {
  return color == 'white' ? (side == 'a' ? 3 : 5) : (side == 'a' ? 59 : 61);
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
      white: { a: new SquareSet(0x60, 0), h: new SquareSet(0, 0xe) },
      black: { a: new SquareSet(0, 0x60000000), h: new SquareSet(0, 0x0e000000) },
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

  private add(color: Color, side: CastlingSide, king: Square, rook: Square) {
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
      const backrank = color == 'white' ? 0 : 7;
      const king = setup.board.kingOf(color);
      if (!defined(king) || (king >> 3) != backrank) continue;
      const side = rooks.intersect(setup.board[color]).intersect(SquareSet.fromRank(backrank));
      const aSide = side.first();
      if (defined(aSide) && (aSide & 0x7) < (king & 0x7)) castles.add(color, 'a', king, aSide);
      const hSide = side.last();
      if (defined(hSide) && (king & 0x7) < (hSide & 0x7)) castles.add(color, 'h', king, hSide);
    }
    return castles;
  }

  discardRook(square: Square) {
    if (this.unmovedRooks.has(square)) {
      this.unmovedRooks = this.unmovedRooks.without(square);
      for (const color of COLORS) {
        for (const side of CASTLING_SIDES) {
          if (this.rook[color][side] == square) this.rook[color][side] = undefined;
        }
      }
    }
  }

  discardSide(color: Color) {
    const otherBackrank = SquareSet.fromRank(color == 'white' ? 7 : 0);
    this.unmovedRooks = this.unmovedRooks.intersect(otherBackrank);
    this.rook[color].a = undefined;
    this.rook[color].h = undefined;
  }
}

export interface Context {
  king: Square | undefined,
  blockers: SquareSet,
  checkers: SquareSet,
}

abstract class Position {
  board: Board;
  pockets: Material | undefined;
  turn: Color;
  castles: Castles;
  epSquare: Square | undefined;
  remainingChecks: RemainingChecks | undefined;
  halfmoves: number;
  fullmoves: number;

  abstract clone(): Position;
  abstract ctx(): Context;
  abstract dests(square: Square, ctx: Context): SquareSet;
  abstract variantOutcome(): Outcome | undefined;
  abstract hasInsufficientMaterial(color: Color): boolean;

  toSetup(): Setup {
    return {
      board: this.board.clone(),
      pockets: this.pockets && this.pockets.clone(),
      turn: this.turn,
      unmovedRooks: this.castles.unmovedRooks,
      epSquare: this.hasLegalEp() ? this.epSquare : undefined,
      remainingChecks: this.remainingChecks && this.remainingChecks.clone(),
      halfmoves: this.halfmoves,
      fullmoves: this.fullmoves,
    };
  }

  private hasLegalEp() {
    // TODO
    return !!this.epSquare;
  }

  protected kingAttackers(square: Square, attacker: Color, occupied: SquareSet): SquareSet {
    return attacksTo(square, attacker, this.board, occupied);
  }

  isInsufficientMaterial() {
    return COLORS.every(color => this.hasInsufficientMaterial(color));
  }

  isCheckmate(): boolean {
    const ctx = this.ctx();
    if (ctx.checkers.isEmpty()) return false;
    for (const square of this.board[this.turn]) {
      if (this.dests(square, ctx).nonEmpty()) return false;
    }
    return true;
  }

  isStalemate(): boolean {
    const ctx = this.ctx();
    if (ctx.checkers.nonEmpty()) return false;
    for (const square of this.board[this.turn]) {
      if (this.dests(square, ctx).nonEmpty()) return false;
    }
    return true;
  }


  outcome() {
    const variantOutcome = this.variantOutcome();
    if (variantOutcome) return variantOutcome;
    else if (this.isCheckmate()) return { winner: opposite(this.turn) };
    else if (this.isInsufficientMaterial() || this.isStalemate()) return { winner: undefined };
    else return;
  }

  allDests(): Map<Square, SquareSet> {
    const ctx = this.ctx();
    const d = new Map();
    for (const square of this.board[this.turn]) {
      d.set(square, this.dests(square, ctx));
    }
    return d;
  }

  protected playCaptureAt(square: Square, captured: Piece) {
    this.halfmoves = 0;
    if (captured && captured.role == 'rook') this.castles.discardRook(square);
    if (this.pockets && captured) this.pockets[opposite(captured.color)][captured.role]++;
  }

  playMove(uci: Uci) {
    const turn = this.turn, epSquare = this.epSquare;
    this.epSquare = undefined;
    this.halfmoves += 1;
    if (turn == 'black') this.fullmoves += 1;
    this.turn = opposite(turn);

    if (isDrop(uci)) {
      this.board.set(uci.to, { role: uci.role, color: turn });
      if (this.pockets) this.pockets[turn][uci.role]--;
    } else {
      const piece = this.board.take(uci.from);
      if (!piece) return;

      if (piece.role == 'pawn') {
        this.halfmoves = 0;
        if (uci.to == epSquare) {
          const pawn = this.board.take(uci.to + (turn == 'white' ? -8 : 8));
          if (pawn) this.playCaptureAt(epSquare, pawn);
        }
        const delta = uci.from - uci.to;
        if (Math.abs(delta) == 16) this.epSquare = (uci.from + uci.to) >> 1;
        if (uci.promotion) {
          piece.role = uci.promotion;
          piece.promoted = true;
        }
      } else if (piece.role == 'rook') {
         this.castles.discardRook(uci.from)
      } else if (piece.role == 'king') {
        const delta = uci.to - uci.from;
        const isCastling = Math.abs(delta) == 2 || this.board[turn].has(uci.to);
        if (isCastling) {
          const side = delta > 0 ? 'h' : 'a';
          const rookFrom = this.castles.rook[turn][side];
          if (defined(rookFrom)) {
            const rook = this.board.take(rookFrom);
            this.board.set(kingCastlesTo(turn, side), piece);
            if (rook) this.board.set(rookCastlesTo(turn, side), rook);
          }
        }
        this.castles.discardSide(turn);
        if (isCastling) return;
      }

      const capture = this.board.set(uci.to, piece);
      if (capture) this.playCaptureAt(uci.to, capture);
    }
  }
}

export class Chess extends Position {
  private constructor() {
    super();
  }

  clone(): Chess {
    const pos = new Chess();
    pos.board = this.board.clone();
    pos.pockets = this.pockets && this.pockets.clone();
    pos.turn = this.turn;
    pos.castles = this.castles && this.castles.clone();
    pos.epSquare = this.epSquare;
    pos.remainingChecks = this.remainingChecks && this.remainingChecks.clone();
    pos.halfmoves = this.halfmoves;
    pos.fullmoves = this.fullmoves;
    return pos;
  }

  static default(): Chess {
    const pos = new Chess();
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

  protected validate(): void {
    if (this.board.occupied.isEmpty()) throw new PositionError('empty board');
    if (this.board.king.size() != 2) throw new PositionError('need exactly two kings');
    if (!defined(this.board.kingOf(this.turn))) throw new PositionError('stm has no king');
    const otherKing = this.board.kingOf(opposite(this.turn));
    if (!defined(otherKing)) throw new PositionError('other side has no king');
    if (this.kingAttackers(otherKing, this.turn, this.board.occupied).nonEmpty()) throw new PositionError('other side in check');
    if (SquareSet.backranks().intersects(this.board.pawn)) throw new PositionError('pawns on backrank');
    for (const color of COLORS) {
      if (this.board.pieces(color, 'pawn').size() > 8) throw new PositionError('more than 8 pawns');
      if (this.board[color].size() > 16) throw new PositionError('more than 16 pieces');
    }
  }

  private validEpSquare(square: Square | undefined): Square | undefined {
    if (!square) return;
    const epRank = this.turn == 'white' ? 5 : 2;
    const forward = this.turn == 'white' ? 8 : -8;
    if ((square >> 3) != epRank) return;
    if (this.board.occupied.has(square + forward)) return;
    const pawn = square - forward;
    if (!this.board.pawn.has(pawn) || !this.board[opposite(this.turn)].has(pawn)) return;
    return square;
  }

  static fromSetup(setup: Setup): Chess {
    const pos = new Chess();
    pos.board = setup.board.clone();
    pos.pockets = undefined;
    pos.turn = setup.turn;
    pos.castles = Castles.fromSetup(setup);
    pos.epSquare = pos.validEpSquare(setup.epSquare);
    pos.remainingChecks = undefined;
    pos.halfmoves = setup.halfmoves;
    pos.fullmoves = setup.fullmoves;
    pos.validate();
    return pos;
  }

  ctx(): Context {
    const king = this.board.kingOf(this.turn)!;
    if (!defined(king)) return { king, blockers: SquareSet.empty(), checkers: SquareSet.empty() };
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
      checkers
    };
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
    const captured = this.epSquare + ((this.turn == 'white') ? -8 : 8);
    const occupied = this.board.occupied.toggle(pawn).toggle(this.epSquare).toggle(captured);
    return !this.kingAttackers(ctx.king, opposite(this.turn), occupied).intersects(occupied);
  }

  dests(square: Square, ctx: Context): SquareSet {
    const piece = this.board.get(square);
    if (!piece || piece.color != this.turn) return SquareSet.empty();

    let pseudo, legal;
    if (piece.role == 'pawn') {
      pseudo = pawnAttacks(this.turn, square).intersect(this.board[opposite(this.turn)]);
      const delta = this.turn == 'white' ? 8 : -8;
      const step = square + delta;
      if (0 <= step && step < 64 && !this.board.occupied.has(step)) {
        pseudo = pseudo.with(step);
        const canDoubleStep = this.turn == 'white' ? (square < 16) : (square >= 64 - 16);
        const doubleStep = step + delta;
        if (canDoubleStep && !this.board.occupied.has(doubleStep)) {
          pseudo = pseudo.with(doubleStep);
        }
      }
      if (defined(this.epSquare) && this.canCaptureEp(square, ctx)) {
        const pawn = this.epSquare - delta;
        if (ctx.checkers.isEmpty() || ctx.checkers.singleSquare() == pawn) {
          legal = SquareSet.fromSquare(this.epSquare);
        }
      }
    }
    else if (piece.role == 'bishop') pseudo = bishopAttacks(square, this.board.occupied);
    else if (piece.role == 'knight') pseudo = knightAttacks(square);
    else if (piece.role == 'rook') pseudo = rookAttacks(square, this.board.occupied);
    else if (piece.role == 'queen') pseudo = queenAttacks(square, this.board.occupied);
    else pseudo = kingAttacks(square);

    pseudo = pseudo.diff(this.board[this.turn]);

    if (defined(ctx.king)) {
      if (piece.role == 'king') {
        const occ = this.board.occupied.without(square);
        for (const to of pseudo) {
          if (this.kingAttackers(to, opposite(this.turn), occ).nonEmpty()) pseudo = pseudo.without(to);
        }
        return pseudo.union(this.castlingDest('a', ctx)).union(this.castlingDest('h', ctx));
      }

      if (ctx.checkers.nonEmpty()) {
        const checker = ctx.checkers.singleSquare();
        if (!checker) return SquareSet.empty();
        pseudo = pseudo.intersect(between(checker, ctx.king).with(checker));
      }

      if (ctx.blockers.has(square)) pseudo = pseudo.intersect(ray(square, ctx.king));
    }

    if (legal) pseudo = pseudo.union(legal);
    return pseudo;
  }

  variantOutcome(): Outcome | undefined {
    return;
  }

  hasInsufficientMaterial(color: Color): boolean {
    return false; // TODO
  }
}
