import { Square, Color, Role, Piece, COLORS, ROLES } from './types';
import { SquareSet } from './squareSet';

export class Board implements Iterable<[Square, Piece]> {
  occupied: SquareSet;
  promoted: SquareSet;

  white: SquareSet;
  black: SquareSet;

  pawn: SquareSet;
  knight: SquareSet;
  bishop: SquareSet;
  rook: SquareSet;
  queen: SquareSet;
  king: SquareSet;

  private constructor() { }

  static default(): Board {
    const board = new Board();
    board.reset();
    return board;
  }

  static racingKings(): Board {
    const board = new Board();
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
  }

  static horde(): Board {
    const board = new Board();
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
  }

  reset(): void {
    this.occupied = new SquareSet(0xffff, 0xffff_0000);
    this.promoted = SquareSet.empty();
    this.white = new SquareSet(0xffff, 0);
    this.black = new SquareSet(0, 0xffff_0000);
    this.pawn = new SquareSet(0xff00, 0x00ff_0000);
    this.knight = new SquareSet(0x42, 0x4200_0000);
    this.bishop = new SquareSet(0x24, 0x2400_0000);
    this.rook = new SquareSet(0x81, 0x8100_0000);
    this.queen = new SquareSet(0x8, 0x0800_0000);
    this.king = new SquareSet(0x10, 0x1000_0000);
  }

  static empty(): Board {
    const board = new Board();
    board.clear();
    return board;
  }

  clear(): void {
    this.occupied = SquareSet.empty();
    this.promoted = SquareSet.empty();
    for (const color of COLORS) this[color] = SquareSet.empty();
    for (const role of ROLES) this[role] = SquareSet.empty();
  }

  clone(): Board {
    const board = new Board();
    board.occupied = this.occupied;
    board.promoted = this.promoted;
    for (const color of COLORS) board[color] = this[color];
    for (const role of ROLES) board[role] = this[role];
    return board;
  }

  equalsIgnorePromoted(other: Board): boolean {
    if (!this.white.equals(other.white)) return false;
    return ROLES.every(role => this[role].equals(other[role]));
  }

  equals(other: Board): boolean {
    return this.equalsIgnorePromoted(other) && this.promoted.equals(other.promoted);
  }

  getColor(square: Square): Color | undefined {
    if (this.white.has(square)) return 'white';
    if (this.black.has(square)) return 'black';
    return;
  }

  getRole(square: Square): Role | undefined {
    for (const role of ROLES) {
      if (this[role].has(square)) return role;
    }
    return;
  }

  get(square: Square): Piece | undefined {
    const color = this.getColor(square);
    if (!color) return;
    const role = this.getRole(square)!;
    const promoted = this.promoted.has(square);
    return { color, role, promoted };
  }

  take(square: Square): Piece | undefined {
    const piece = this.get(square);
    if (piece) {
      this.occupied = this.occupied.without(square);
      this[piece.color] = this[piece.color].without(square);
      this[piece.role] = this[piece.role].without(square);
      if (piece.promoted) this.promoted = this.promoted.without(square);
    }
    return piece;
  }

  set(square: Square, piece: Piece): Piece | undefined {
    const old = this.take(square);
    this.occupied = this.occupied.with(square);
    this[piece.color] = this[piece.color].with(square);
    this[piece.role] = this[piece.role].with(square);
    if (piece.promoted) this.promoted = this.promoted.with(square);
    return old;
  }

  has(square: Square): boolean {
    return this.occupied.has(square);
  }

  *[Symbol.iterator](): Iterator<[Square, Piece]> {
    for (const square of this.occupied) {
      yield [square, this.get(square)!];
    }
  }

  pieces(color: Color, role: Role): SquareSet {
    return this[color].intersect(this[role]);
  }

  rooksAndQueens(): SquareSet {
    return this.rook.union(this.queen);
  }

  bishopsAndQueens(): SquareSet {
    return this.bishop.union(this.queen);
  }

  kingOf(color: Color): Square | undefined {
    return this.king.intersect(this[color]).diff(this.promoted).singleSquare();
  }
}
