import { Square } from './types';

function popcnt32(n: number): number {
  n = n - ((n >>> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  return ((n + (n >>> 4) & 0xf0f0f0f) * 0x1010101) >> 24;
}

function bswap32(n: number): number {
  n = (n >>> 8) & 0x00ff00ff | ((n & 0x00ff00ff) << 8);
  return (n >>> 16) & 0xffff | ((n & 0xffff) << 16);
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
    return new SquareSet(0xff, 0).shl(8 * rank);
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

  static corners(): SquareSet {
    return new SquareSet(0x81, 0x81000000);
  }

  static center(): SquareSet {
    return new SquareSet(0x18000000, 0x18);
  }

  static backranks(): SquareSet {
    return new SquareSet(0xff, 0xff000000);
  }

  constructor(lo: number, hi: number) {
    this.lo = lo | 0;
    this.hi = hi | 0;
  }

  complement(): SquareSet {
    return new SquareSet(~this.lo, ~this.hi);
  }

  xor(other: SquareSet): SquareSet {
    return new SquareSet(this.lo ^ other.lo, this.hi ^ other.hi);
  }

  union(other: SquareSet): SquareSet {
    return new SquareSet(this.lo | other.lo, this.hi | other.hi);
  }

  intersect(other: SquareSet): SquareSet {
    return new SquareSet(this.lo & other.lo, this.hi & other.hi);
  }

  diff(other: SquareSet): SquareSet {
    return new SquareSet(this.lo & ~other.lo, this.hi & ~other.hi);
  }

  intersects(other: SquareSet): boolean {
    return this.intersect(other).nonEmpty();
  }

  isDisjoint(other: SquareSet): boolean {
    return this.intersect(other).isEmpty();
  }

  supersetOf(other: SquareSet): boolean {
    return other.diff(this).isEmpty();
  }

  subsetOf(other: SquareSet): boolean {
    return this.diff(other).isEmpty();
  }

  shr(shift: number): SquareSet {
    if (shift >= 64) return SquareSet.empty();
    else if (shift >= 32) return new SquareSet(this.hi >>> (shift - 32), 0);
    else if (shift > 0) return new SquareSet((this.lo >>> shift) ^ (this.hi << (32 - shift)), this.hi >>> shift);
    else return this;
  }

  shl(shift: number): SquareSet {
    if (shift >= 64) return SquareSet.empty();
    else if (shift >= 32) return new SquareSet(0, this.lo << (shift - 32));
    else if (shift > 0) return new SquareSet(this.lo << shift, (this.hi << shift) ^ (this.lo >>> (32 - shift)));
    else return this;
  }

  bswap(): SquareSet {
    return new SquareSet(bswap32(this.hi), bswap32(this.lo));
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

  nonEmpty(): boolean {
    return this.lo != 0 || this.hi != 0;
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

  plusOne(): SquareSet {
    const lo = this.lo + 1;
    return new SquareSet(lo, lo ? this.hi : (this.hi + 1));
  }

  minus(other: SquareSet) {
    const lo = this.lo - other.lo;
    const c = ((lo & other.lo & 1) + (other.lo >>> 1) + (lo >>> 1)) >>> 31;
    return new SquareSet(lo, this.hi - (other.hi + c));
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
              subset = subset.union(complement).plusOne().intersect(mask);
              return { value, done: false };
            }
            return { done: true } as IteratorResult<SquareSet>;
          }
        }
      }
    };
  }
}
