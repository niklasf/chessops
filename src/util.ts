import { Color, Square, Role, Uci, isDrop } from './types';

export function opposite(color: Color): Color {
  return color == 'white' ? 'black' : 'white';
}

export function defined<A>(v: A | undefined): v is A {
  return typeof v !== 'undefined';
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

export function roleToChar(role: Role): string {
  switch (role) {
    case 'pawn': return 'p';
    case 'knight': return 'n';
    case 'bishop': return 'b';
    case 'rook': return 'r';
    case 'queen': return 'q';
    case 'king': return 'k';
  }
}

export function charToRole(ch: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'): Role;
export function charToRole(ch: string): Role | undefined;
export function charToRole(ch: string): Role | undefined {
  switch (ch) {
    case 'p': return 'pawn';
    case 'n': return 'knight';
    case 'b': return 'bishop';
    case 'r': return 'rook';
    case 'q': return 'queen';
    case 'k': return 'king';
    default: return;
  }
}

export function parseSquare(str: string): Square | undefined {
  if (!/^[a-h][1-8]$/.test(str)) return;
  return str.charCodeAt(0) - 'a'.charCodeAt(0) + 8 * (str.charCodeAt(1) - '1'.charCodeAt(0));
}

export function makeSquare(square: Square): string {
  return 'abcdefgh'[square & 0x7] + '12345678'[square >> 3];
}

export function makeUci(uci: Uci): string {
  if (isDrop(uci)) return `${roleToChar(uci.role).toUpperCase()}@${makeSquare(uci.to)}`;
  return makeSquare(uci.from) + makeSquare(uci.to) + (uci.promotion ? roleToChar(uci.promotion) : '');
}
