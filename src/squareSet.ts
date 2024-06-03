import { Color, Square } from './types.js';

const popcnt32 = (n: number): number => {
  n = n - ((n >>> 1) & 0x5555_5555);
  n = (n & 0x3333_3333) + ((n >>> 2) & 0x3333_3333);
  return Math.imul((n + (n >>> 4)) & 0x0f0f_0f0f, 0x0101_0101) >> 24;
};

const bswap32 = (n: number): number => {
  n = ((n >>> 8) & 0x00ff_00ff) | ((n & 0x00ff_00ff) << 8);
  return ((n >>> 16) & 0xffff) | ((n & 0xffff) << 16);
};

const rbit32 = (n: number): number => {
  n = ((n >>> 1) & 0x5555_5555) | ((n & 0x5555_5555) << 1);
  n = ((n >>> 2) & 0x3333_3333) | ((n & 0x3333_3333) << 2);
  n = ((n >>> 4) & 0x0f0f_0f0f) | ((n & 0x0f0f_0f0f) << 4);
  return bswap32(n);
};

/**
 * An immutable set of squares, implemented as a bitboard.
 */
export class SquareSet implements Iterable<Square> {
  readonly lo: number;
  readonly hi: number;

  constructor(lo: number, hi: number) {
    this.lo = lo | 0;
    this.hi = hi | 0;
  }

  /**
   * Returns a square set containing the given square.
   * @param square 
   * @returns 
   */
  static fromSquare(square: Square): SquareSet {
    return square >= 32 ? new SquareSet(0, 1 << (square - 32)) : new SquareSet(1 << square, 0);
  }

  /**
   * Returns a square set containing all squares on the given rank.
   * @param rank A rank number (0-7)
   * @returns {SquareSet}
   */
  static fromRank(rank: number): SquareSet {
    return new SquareSet(0xff, 0).shl64(8 * rank);
  }

  /**
   * Returns a square set containing all squares on the given file.
   * @param file A file number (0-7)
   * @returns {SquareSet}
   */
  static fromFile(file: number): SquareSet {
    return new SquareSet(0x0101_0101 << file, 0x0101_0101 << file);
  }

  /**
   * Returns an empty square set.
   * @returns {SquareSet}
   */
  static empty(): SquareSet {
    return new SquareSet(0, 0);
  }

  /**
   * Returns a square set containing all squares.
   * @returns {SquareSet}
   */
  static full(): SquareSet {
    return new SquareSet(0xffff_ffff, 0xffff_ffff);
  }

  /**
   * Returns a square set containing all corner squares.
   * @returns {SquareSet}
   */
  static corners(): SquareSet {
    return new SquareSet(0x81, 0x8100_0000);
  }

  /**
   * TODO: Not sure about this one.
   * Returns a square set containing the four center squares.
   * @returns {SquareSet}
   */
  static center(): SquareSet {
    return new SquareSet(0x1800_0000, 0x18);
  }

  /**
   * Returns a square set containing all squares on the back ranks of both sides.
   * @returns {SquareSet}
   */
  static backranks(): SquareSet {
    return new SquareSet(0xff, 0xff00_0000);
  }

  /**
   * Returns a square set containing all squares on the back rank of the given color.
   * @param color The color of the back rank
   * @returns {SquareSet}
   */
  static backrank(color: Color): SquareSet {
    return color === 'white' ? new SquareSet(0xff, 0) : new SquareSet(0, 0xff00_0000);
  }

  /**
   * Returns a square set containing all dark squares.
   * @returns {SquareSet}
   */
  static lightSquares(): SquareSet {
    return new SquareSet(0x55aa_55aa, 0x55aa_55aa);
  }

  /**
   * Returns a square set containing all light squares.
   * @returns {SquareSet}
   */
  static darkSquares(): SquareSet {
    return new SquareSet(0xaa55_aa55, 0xaa55_aa55);
  }

  /**
 * Returns the complement of the current SquareSet.
 *
 * The complement of a SquareSet is a new SquareSet that contains all the squares
 * that are not present in the original set.
 *
 * @returns {SquareSet} A new SquareSet representing the complement of the current set.
 */
  complement(): SquareSet {
    return new SquareSet(~this.lo, ~this.hi);
  }

  /**
  * Performs a bitwise XOR operation between the current SquareSet and another SquareSet.
  *
  * The XOR operation returns a new SquareSet that contains the squares that are present
  * in either the current set or the other set, but not both.
  *
  * @param {SquareSet} other The SquareSet to perform the XOR operation with.
  * @returns {SquareSet} A new SquareSet representing the result of the XOR operation.
  */
  xor(other: SquareSet): SquareSet {
    return new SquareSet(this.lo ^ other.lo, this.hi ^ other.hi);
  }

  /**
   * Performs a bitwise OR operation between the current SquareSet and another SquareSet.
   *
   * The OR operation returns a new SquareSet that contains the squares that are present
   * in either the current set or the other set, or both.
   *
   * @param {SquareSet} other The SquareSet to perform the OR operation with.
   * @returns {SquareSet} A new SquareSet representing the result of the OR operation.
   */
  union(other: SquareSet): SquareSet {
    return new SquareSet(this.lo | other.lo, this.hi | other.hi);
  }

  /**
   * Performs a bitwise AND operation between the current SquareSet and another SquareSet.
   *
   * The AND operation returns a new SquareSet that contains the squares that are present
   * in both the current set and the other set.
   *
   * @param {SquareSet} other The SquareSet to perform the AND operation with.
   * @returns {SquareSet} A new SquareSet representing the result of the AND operation.
   */
  intersect(other: SquareSet): SquareSet {
    return new SquareSet(this.lo & other.lo, this.hi & other.hi);
  }

  /**
   * Performs a bitwise AND NOT operation between the current SquareSet and another SquareSet.
   *
   * The AND NOT operation returns a new SquareSet that contains the squares that are present
   * in the current set, but not in the other set.
   *
   * @param {SquareSet} other The SquareSet to perform the AND NOT operation with.
   * @returns {SquareSet} A new SquareSet representing the result of the AND NOT operation.
   */
  diff(other: SquareSet): SquareSet {
    return new SquareSet(this.lo & ~other.lo, this.hi & ~other.hi);
  }

  /**
   * Checks if the current SquareSet intersects with another SquareSet.
   *
   * Two SquareSets are considered to intersect if they have at least one square in common.
   *
   * @param {SquareSet} other The SquareSet to check for intersection.
   * @returns {boolean} True if the current set intersects with the other set, false otherwise.
   */
  intersects(other: SquareSet): boolean {
    return this.intersect(other).nonEmpty();
  }

  /**
   * Checks if the current SquareSet is disjoint with another SquareSet.
   *
   * Two SquareSets are considered to be disjoint if they have no squares in common.
   *
   * @param {SquareSet} other The SquareSet to check for disjointness.
   * @returns {boolean} True if the current set is disjoint with the other set, false otherwise.
   */
  isDisjoint(other: SquareSet): boolean {
    return this.intersect(other).isEmpty();
  }

  /**
   * Checks if the current SquareSet is a superset of another SquareSet.
   * 
   * A SquareSet is a superset of another SquareSet if every square in the other set is also present in the current set.
   *
   * @param {SquareSet} other The SquareSet to check for supersetness.
   * @returns {boolean} True if the current set is a superset of the other set, false otherwise.
   */
  supersetOf(other: SquareSet): boolean {
    return other.diff(this).isEmpty();
  }

  /**
   * Checks if the current SquareSet is a subset of another SquareSet.
   *
   * A SquareSet is a subset of another SquareSet if every square in the current set is also present in the other set.
   *
   * @param {SquareSet} other The SquareSet to check for subsetness.
   * @returns {boolean} True if the current set is a subset of the other set, false otherwise.
   */
  subsetOf(other: SquareSet): boolean {
    return this.diff(other).isEmpty();
  }

  /**
   * Performs a logical right shift operation on the SquareSet by the specified number of positions.
   *
   * The right shift operation shifts the bits of the SquareSet towards the right by the given
   * number of positions. The vacated bits on the left side are filled with zeros.
   *
   * @param {number} shift The number of positions to shift the bits to the right.
   * @returns {SquareSet} A new SquareSet representing the result of the right shift operation.
   */
  shr64(shift: number): SquareSet {
    if (shift >= 64) return SquareSet.empty();
    if (shift >= 32) return new SquareSet(this.hi >>> (shift - 32), 0);
    if (shift > 0) return new SquareSet((this.lo >>> shift) ^ (this.hi << (32 - shift)), this.hi >>> shift);
    return this;
  }

  /**
   * Performs a logical left shift operation on the SquareSet by the specified number of positions.
   *
   * The left shift operation shifts the bits of the SquareSet towards the left by the given
   * number of positions. The vacated bits on the right side are filled with zeros.
   *
   * @param {number} shift The number of positions to shift the bits to the left.
   * @returns {SquareSet} A new SquareSet representing the result of the left shift operation.
   */
  shl64(shift: number): SquareSet {
    if (shift >= 64) return SquareSet.empty();
    if (shift >= 32) return new SquareSet(0, this.lo << (shift - 32));
    if (shift > 0) return new SquareSet(this.lo << shift, (this.hi << shift) ^ (this.lo >>> (32 - shift)));
    return this;
  }

  /**
  * Swaps the bytes of the SquareSet in a 64-bit manner.
  *
  * @returns {SquareSet} A new SquareSet with the bytes swapped.
  */
  bswap64(): SquareSet {
    return new SquareSet(bswap32(this.hi), bswap32(this.lo));
  }

  /**
  * Reverses the bits of the SquareSet in a 64-bit manner.
  *
  * @returns {SquareSet} A new SquareSet with the bits reversed.
  */
  rbit64(): SquareSet {
    return new SquareSet(rbit32(this.hi), rbit32(this.lo));
  }

  /**
  * Subtracts another SquareSet from the current SquareSet in a 64-bit manner.
  *
  * @param {SquareSet} other The SquareSet to subtract.
  * @returns {SquareSet} A new SquareSet representing the result of the subtraction.
  */
  minus64(other: SquareSet): SquareSet {
    const lo = this.lo - other.lo;
    const c = ((lo & other.lo & 1) + (other.lo >>> 1) + (lo >>> 1)) >>> 31;
    return new SquareSet(lo, this.hi - (other.hi + c));
  }

  /**
  * Checks if the current SquareSet is equal to another SquareSet.
  *
  * @param {SquareSet} other The SquareSet to compare with.
  * @returns {boolean} True if the SquareSets are equal, false otherwise.
  */
  equals(other: SquareSet): boolean {
    return this.lo === other.lo && this.hi === other.hi;
  }

  /**
  * Returns the number of squares in the SquareSet.
  *
  * @returns {number} The count of squares in the SquareSet.
  */
  size(): number {
    return popcnt32(this.lo) + popcnt32(this.hi);
  }

  /**
  * Checks if the SquareSet is empty.
  *
  * @returns {boolean} True if the SquareSet is empty, false otherwise.
  */
  isEmpty(): boolean {
    return this.lo === 0 && this.hi === 0;
  }

  /**
  * Checks if the SquareSet is not empty.
  *
  * @returns {boolean} True if the SquareSet is not empty, false otherwise.
  */
  nonEmpty(): boolean {
    return this.lo !== 0 || this.hi !== 0;
  }

  /**
  * Checks if the SquareSet contains a specific square.
  *
  * @param {Square} square The square to check for presence.
  * @returns {boolean} True if the SquareSet contains the square, false otherwise.
  */
  has(square: Square): boolean {
    return (square >= 32 ? this.hi & (1 << (square - 32)) : this.lo & (1 << square)) !== 0;
  }

  /**
  * Sets or unsets a square in the SquareSet.
  *
  * @param {Square} square The square to set or unset.
  * @param {boolean} on True to set the square, false to unset it.
  * @returns {SquareSet} A new SquareSet with the square set or unset.
  */
  set(square: Square, on: boolean): SquareSet {
    return on ? this.with(square) : this.without(square);
  }

  /**
   * Adds a square to the SquareSet.
   *
   * @param {Square} square The square to add.
   * @returns {SquareSet} A new SquareSet with the square added.
   */
  with(square: Square): SquareSet {
    return square >= 32
      ? new SquareSet(this.lo, this.hi | (1 << (square - 32)))
      : new SquareSet(this.lo | (1 << square), this.hi);
  }

  /**
   * Removes a square from the SquareSet.
   *
   * @param {Square} square The square to remove.
   * @returns {SquareSet} A new SquareSet with the square removed.
   */
  without(square: Square): SquareSet {
    return square >= 32
      ? new SquareSet(this.lo, this.hi & ~(1 << (square - 32)))
      : new SquareSet(this.lo & ~(1 << square), this.hi);
  }

  /**
   * Toggles the presence of a square in the SquareSet.
   *
   * @param {Square} square The square to toggle.
   * @returns {SquareSet} A new SquareSet with the square toggled.
   */
  toggle(square: Square): SquareSet {
    return square >= 32
      ? new SquareSet(this.lo, this.hi ^ (1 << (square - 32)))
      : new SquareSet(this.lo ^ (1 << square), this.hi);
  }

  /**
   * Returns the last square in the SquareSet.
   *
   * @returns {Square | undefined} The last square in the SquareSet, or undefined if the set is empty.
   */
  last(): Square | undefined {
    if (this.hi !== 0) return 63 - Math.clz32(this.hi);
    if (this.lo !== 0) return 31 - Math.clz32(this.lo);
    return;
  }

  /**
   * Returns the first square in the SquareSet.
   *
   * @returns {Square | undefined} The first square in the SquareSet, or undefined if the set is empty.
   */
  first(): Square | undefined {
    if (this.lo !== 0) return 31 - Math.clz32(this.lo & -this.lo);
    if (this.hi !== 0) return 63 - Math.clz32(this.hi & -this.hi);
    return;
  }

  /**
   * Returns a new SquareSet with the first square removed.
   *
   * @returns {SquareSet} A new SquareSet with the first square removed.
   */
  withoutFirst(): SquareSet {
    if (this.lo !== 0) return new SquareSet(this.lo & (this.lo - 1), this.hi);
    return new SquareSet(0, this.hi & (this.hi - 1));
  }

  /**
   * Checks if the SquareSet contains more than one square.
   *
   * @returns {boolean} True if the SquareSet contains more than one square, false otherwise.
   */
  moreThanOne(): boolean {
    return (this.hi !== 0 && this.lo !== 0) || (this.lo & (this.lo - 1)) !== 0 || (this.hi & (this.hi - 1)) !== 0;
  }

  /**
   * Returns the single square in the SquareSet if it contains only one square.
   *
   * @returns {Square | undefined} The single square in the SquareSet, or undefined if the set is empty or contains more than one square.
   */
  singleSquare(): Square | undefined {
    return this.moreThanOne() ? undefined : this.last();
  }

  *[Symbol.iterator](): Iterator<Square> {
    let lo = this.lo;
    let hi = this.hi;
    while (lo !== 0) {
      const idx = 31 - Math.clz32(lo & -lo);
      lo ^= 1 << idx;
      yield idx;
    }
    while (hi !== 0) {
      const idx = 31 - Math.clz32(hi & -hi);
      hi ^= 1 << idx;
      yield 32 + idx;
    }
  }

  *reversed(): Iterable<Square> {
    let lo = this.lo;
    let hi = this.hi;
    while (hi !== 0) {
      const idx = 31 - Math.clz32(hi);
      hi ^= 1 << idx;
      yield 32 + idx;
    }
    while (lo !== 0) {
      const idx = 31 - Math.clz32(lo);
      lo ^= 1 << idx;
      yield idx;
    }
  }
}
