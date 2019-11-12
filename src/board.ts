import { Square, Color, Role, Piece, COLORS, ROLES } from './types';
import { SquareSet } from './squareSet';

export class Board {
  private _occupied: SquareSet;

  private _promoted: SquareSet;

  private white: SquareSet;
  private black: SquareSet;

  private pawn: SquareSet;
  private knight: SquareSet;
  private bishop: SquareSet;
  private rook: SquareSet;
  private queen: SquareSet;
  private king: SquareSet;

  private constructor() { }

  static default(): Board {
    const board = new Board();
    board.reset();
    return board;
  }

  reset(): void {
    this._occupied = new SquareSet(0xffff, 0xffff0000);
    this._promoted = SquareSet.empty();
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
    this._occupied = SquareSet.empty();
    this._promoted = SquareSet.empty();
    for (const color of COLORS) this[color] = SquareSet.empty();
    for (const role of ROLES) this[role] = SquareSet.empty();
  }


  clone(): Board {
    const board = new Board();
    board._occupied = this._occupied;
    board._promoted = this._promoted;
    for (const color of COLORS) board[color] = this[color];
    for (const role of ROLES) board[role] = this[role];
    return board;
  }

  private getColor(square: Square): Color | undefined {
    if (this.white.has(square)) return 'white';
    else if (this.black.has(square)) return 'black';
    else return;
  }

  get(square: Square): Piece | undefined {
    const color = this.getColor(square);
    if (!color) return;
    const promoted = this._promoted.has(square);
    for (const role of ROLES) {
      if (this[role].has(square)) return { color, promoted, role };
    }
    return;
  }

  take(square: Square): Piece | undefined {
    const piece = this.get(square);
    if (piece) {
      this._occupied = this._occupied.without(square);
      this[piece.color] = this[piece.color].without(square);
      this[piece.role] = this[piece.role].without(square);
      if (piece.promoted) this._promoted = this._promoted.without(square);
    }
    return piece;
  }

  delete(square: Square): boolean {
    return !!this.take(square);
  }

  set(square: Square, piece: Piece): Piece | undefined {
    const old = this.take(square);
    this._occupied = this._occupied.with(square);
    this[piece.color] = this[piece.color].with(square);
    this[piece.role] = this[piece.role].with(square);
    if (piece.promoted) this._promoted = this._promoted.with(square);
    return old;
  }

  has(square: Square): boolean {
    return this._occupied.has(square);
  }

  [Symbol.iterator](): Iterator<[Square, Piece]> {
    const self = this;
    const keys = this._occupied[Symbol.iterator]();
    return {
      next(): IteratorResult<[Square, Piece]> {
        const entry = keys.next();
        if (entry.done) return { done: true } as IteratorResult<[Square, Piece]>;
        else return { value: [entry.value, self.get(entry.value)!], done: false };
      }
    };
  }

  occupied(): SquareSet {
    return this._occupied;
  }

  promoted(): SquareSet {
    return this._promoted;
  }

  pawns(): SquareSet {
    return this.pawn;
  }

  knights(): SquareSet {
    return this.knight;
  }

  bishops(): SquareSet {
    return this.bishop;
  }

  rooks(): SquareSet {
    return this.rook;
  }

  queens(): SquareSet {
    return this.queen;
  }

  kings(): SquareSet {
    return this.king;
  }

  byColor(color: Color): SquareSet {
    return this[color];
  }

  byRole(role: Role): SquareSet {
    return this[role];
  }

  rooksAndQueens(): SquareSet {
    return this.rook.union(this.queen);
  }

  bishopsAndQueens(): SquareSet {
    return this.bishop.union(this.queen);
  }

  kingOf(color: Color): Square | undefined {
    return this[color].intersect(this.king).diff(this._promoted).singleSquare();
  }
}

export interface ReadonlyBoard {
  clone(): Board;

  get(square: Square): Piece | undefined;
  has(square: Square): boolean;
  [Symbol.iterator](): Iterator<[Square, Piece]>;

  occupied(): SquareSet;
  promoted(): SquareSet;
  pawns(): SquareSet;
  knights(): SquareSet;
  bishops(): SquareSet;
  rooks(): SquareSet;
  queens(): SquareSet;
  kings(): SquareSet;
  byColor(color: Color): SquareSet;
  byRole(role: Role): SquareSet;
  rooksAndQueens(): SquareSet;
  bishopsAndQueens(): SquareSet;
  kingOf(color: Color): Square | undefined;
}
