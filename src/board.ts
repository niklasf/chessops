import { Square, Color, Role, Piece, COLORS, ROLES } from './types';
import { SquareSet } from './squareSet';

export default class Board {
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
    board.occupied = new SquareSet(0xffffffff, 0xffff0066);
    board.promoted = SquareSet.empty();
    board.white = new SquareSet(0xffffffff, 0x00000066);
    board.black = new SquareSet(0, 0xffff0000);
    board.pawn = new SquareSet(0xffffffff, 0x00ff0066);
    board.knight = new SquareSet(0, 0x42000000);
    board.bishop = new SquareSet(0, 0x24000000);
    board.rook = new SquareSet(0, 0x81000000);
    board.queen = new SquareSet(0, 0x08000000);
    board.king = new SquareSet(0, 0x10000000);
    return board;
  }

  reset(): void {
    this.occupied = new SquareSet(0xffff, 0xffff0000);
    this.promoted = SquareSet.empty();
    this.white = new SquareSet(0xffff, 0);
    this.black = new SquareSet(0, 0xffff0000);
    this.pawn = new SquareSet(0xff00, 0xff0000);
    this.knight = new SquareSet(0x42, 0x42000000);
    this.bishop = new SquareSet(0x24, 0x24000000);
    this.rook = new SquareSet(0x81, 0x81000000);
    this.queen = new SquareSet(0x8, 0x8000000);
    this.king = new SquareSet(0x10, 0x10000000);
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

  getColor(square: Square): Color | undefined {
    if (this.white.has(square)) return 'white';
    else if (this.black.has(square)) return 'black';
    else return;
  }

  get(square: Square): Piece | undefined {
    const color = this.getColor(square);
    if (!color) return;
    const promoted = this.promoted.has(square);
    for (const role of ROLES) {
      if (this[role].has(square)) return { color, promoted, role };
    }
    return;
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

  delete(square: Square): boolean {
    return !!this.take(square);
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

  [Symbol.iterator](): Iterator<[Square, Piece]> {
    const keys = this.occupied[Symbol.iterator]();
    const next: () => IteratorResult<[Square, Piece]> = () => {
      const entry = keys.next();
      if (entry.done) return { done: true } as IteratorResult<[Square, Piece]>;
      else return { value: [entry.value, this.get(entry.value)!], done: false };
    };
    return { next };
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

export { Board };
