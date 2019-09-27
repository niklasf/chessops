import { Square } from './types';

function popcnt32(n: number): number {
  n = n - ((n >>> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  return ((n + (n >>> 4) & 0xf0f0f0f) * 0x1010101) >> 24;
}

export class SquareSet {
  readonly lo: number;
  readonly hi: number;

  static fromSquare(square: Square): SquareSet {
    return square >= 32 ?
      new SquareSet(0, 1 << (square - 32)) :
      new SquareSet(1 << square, 0);
  }

  static fromRank(rank: number): SquareSet {
    return rank >= 4 ?
      new SquareSet(0, 0xff << (8 * (rank - 4))) :
      new SquareSet(0xff << (8 * rank), 0);
  }

  static fromFile(file: number): SquareSet {
    return new SquareSet(0x01010101 << file, 0x01010101 << file);
  }

  static empty(): SquareSet {
    return new SquareSet(0, 0);
  }

  static full(): SquareSet {
    return new SquareSet(0xffffffff, 0xffffffff);
  }

  constructor(lo: number, hi: number) {
    this.lo = lo | 0;
    this.hi = hi | 0;
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
    return popcnt32(this.lo) + popcnt32(this.hi);
  }

  isEmpty(): boolean {
    return this.lo == 0 && this.hi == 0;
  }

  has(square: Square): boolean {
    return !!(square >= 32 ? this.hi & (1 << (square - 32)) : this.lo & (1 << square));
  }

  set(square: Square, on: boolean): SquareSet {
    return on ? this.with(square) : this.without(square);
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

  toggle(square: Square): SquareSet {
    return square >= 32 ?
      new SquareSet(this.lo, this.hi ^ (1 << (square - 32))) :
      new SquareSet(this.lo ^ (1 << square), this.hi);
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

  reversed(): Iterable<Square> {
    let lo = this.lo, hi = this.hi;
    return {
      [Symbol.iterator]() {
        return {
          next(): IteratorResult<Square> {
            if (hi) {
              const idx = 31 - Math.clz32(hi);
              hi ^= 1 << idx;
              return { value: 32 + idx, done: false };
            }
            if (lo) {
              const idx = 31 - Math.clz32(lo);
              lo ^= 1 << idx;
              return { value: idx, done: false };
            }
            return { done: true } as IteratorResult<Square>;
          }
        };
      }
    };
  }

  private plusOne(): SquareSet {
    if (this.lo != -1) return new SquareSet(this.lo + 1, this.hi);
    else if (this.hi != -1) return new SquareSet(0, this.hi + 1);
    else return new SquareSet(0, 0);
  }

  subsets(): Iterable<SquareSet> {
    const mask = this;
    const complement = this.complement();
    let subset = SquareSet.empty();
    let first = true;
    return {
      [Symbol.iterator]() {
        return {
          next(): IteratorResult<SquareSet> {
            if (first || !subset.isEmpty()) {
              first = false;
              const value = subset;
              subset = subset.union(complement).plusOne().intersection(mask);
              return { value, done: false };
            }
            return { done: true } as IteratorResult<SquareSet>;
          }
        }
      }
    };
  }
}
