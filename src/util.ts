import { Err, isErr, Color, Square } from './types';

export function opposite(color: Color): Color {
  return color == 'white' ? 'black' : 'white';
}

export function defined<A>(v: A | undefined): v is A {
  return typeof v !== 'undefined';
}

export function unwrap<T>(v: T | Err<any>): T {
  if (isErr(v)) throw new Error(v.err);
  return v;
}

export function strRepeat(str: string, num: number): string {
  let r = '';
  for (let i = 0; i < num; i++) r += str;
  return r;
}

export function nthIndexOf(haystack: string, needle: string, n: number): number {
  let index = haystack.indexOf(needle);
  while (n-- > 0) {
    if (index == -1) break;
    index = haystack.indexOf(needle, index + 1);
  }
  return index;
}

export function parseSquare(str: string): Square | undefined {
  if (!/^[a-h][1-8]$/.test(str)) return;
  return str.charCodeAt(0) - 'a'.charCodeAt(0) + 8 * (str.charCodeAt(1) - '1'.charCodeAt(0));
}

export function makeSquare(square: Square): string {
  return 'abcdefgh'[square & 0x7] + '12345678'[square >> 3];
}
