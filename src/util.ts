import { Square, Key } from './types';

export function keyToSquare(key: Key): Square {
  const file = key.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = key.charCodeAt(1) - '1'.charCodeAt(0);
  return file + rank * 8;
}

export function squareToKey(square: Square): Key {
  return ('abcdefgh'[square & 7] + (1 + square >> 3)) as Key;
}

export function defined<A>(v: A | undefined): v is A {
  return typeof v !== 'undefined';
}

export function nthIndexOf(haystack: string, needle: string, n: number): number {
  let index = haystack.indexOf(needle);
  while (n-- > 0) {
    if (index == -1) break;
    index = haystack.indexOf(needle, index + 1);
  }
  return index;
}
