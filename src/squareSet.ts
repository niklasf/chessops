type Square = number;

function popcount(n: number): number {
  n = n - ((n >>> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  return ((n + (n >>> 4) & 0xf0f0f0f) * 0x1010101) >> 24;
}

export class SquareSet {
  readonly lo: number;
  readonly hi: number;

  static fromSquare(square: Square): SquareSet {
    return square >= 32 ? new SquareSet(0, 1 << (square - 32)) : new SquareSet(1 << square, 0);
  }

  static empty(): SquareSet {
    return new SquareSet(0, 0);
  }

  static full(): SquareSet {
    return new SquareSet(0xffffffff, 0xffffffff);
  }

  constructor(lo: number, hi: number) {
    this.lo = lo;
    this.hi = hi;
  }

  complement(): SquareSet {
    return new SquareSet(this.lo ^ 0xffffffff, this.hi ^ 0xffffffff);
  }

  xor(other: SquareSet): SquareSet {
    return new SquareSet(this.lo ^ other.lo, this.hi ^ other.hi);
  }

  union(other: SquareSet): SquareSet {
    return new SquareSet(this.lo | other.lo, this.hi | other.hi);
  }

  intersection(other: SquareSet): SquareSet {
    return new SquareSet(this.lo & other.lo, this.hi & other.hi);
  }

  difference(other: SquareSet): SquareSet {
    return new SquareSet(this.lo & ~other.lo, this.hi & ~other.hi);
  }

  intersects(other: SquareSet): boolean {
    return !this.intersection(other).isEmpty();
  }

  isDisjoint(other: SquareSet): boolean {
    return this.intersection(other).isEmpty();
  }

  isSubset(other: SquareSet): boolean {
    return other.difference(this).isEmpty();
  }

  isSuperset(other: SquareSet): boolean {
    return this.difference(other).isEmpty();
  }

  equals(other: SquareSet): boolean {
    return this.lo == other.lo && this.hi == other.hi;
  }

  size(): number {
    return popcount(this.lo) + popcount(this.hi);
  }

  isEmpty(): boolean {
    return this.lo == 0 && this.hi == 0;
  }

  has(square: Square): boolean {
    return !!(square >= 32 ? this.hi & (1 << (square - 32)) : this.lo & (1 << square));
  }

  with(square: Square): SquareSet {
    return square >= 32 ?
      new SquareSet(this.lo, this.hi | (1 << (square - 32))) :
      new SquareSet(this.lo | (1 << square), this.hi);
  }

  without(square: Square): SquareSet {
    return square >= 32 ?
      new SquareSet(this.lo, this.hi & ~(1 << (square - 32))) :
      new SquareSet(this.lo & ~(1 << square), this.hi);
  }

  flip(square: Square): SquareSet {
    return square >= 32 ?
      new SquareSet(this.lo, this.hi ^ (1 << (square - 32))) :
      new SquareSet(this.lo ^ (1 << square), this.hi);
  }

  toggle(square: Square, on: boolean): SquareSet {
    return on ? this.with(square) : this.without(square);
  }

  last(): Square | undefined {
    if (this.hi != 0) return 63 - Math.clz32(this.hi);
    else if (this.lo != 0) return 31 - Math.clz32(this.lo);
    else return undefined;
  }

  first(): Square | undefined {
    if (this.lo != 0) return 31 - Math.clz32(this.lo & -this.lo);
    else if (this.hi != 0) return 63 - Math.clz32(this.hi & -this.hi);
    else return undefined;
  }

  moreThanOne(): boolean {
    return !!((this.hi && this.lo) || this.lo & (this.lo - 1) || this.hi & (this.hi - 1));
  }

  singleSquare(): Square | undefined {
    return this.moreThanOne() ? undefined : this.last();
  }

  [Symbol.iterator](): Iterator<Square> {
    let lo = this.lo, hi = this.hi;
    return {
      next(): IteratorResult<Square> {
        if (lo) {
          const idx = 31 - Math.clz32(lo & -lo);
          lo ^= 1 << idx;
          return { value: idx, done: false };
        }
        if (hi) {
          const idx = 31 - Math.clz32(hi & -hi);
          hi ^= 1 << idx;
          return { value: 32 + idx, done: false };
        }
        return { done: true } as IteratorResult<Square>;
      }
    };
  }
}
