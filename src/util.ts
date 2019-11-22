import { Color, Square, Role, Uci, isDrop } from './types';

export function defined<A>(v: A | undefined): v is A {
  return typeof v !== 'undefined';
}

export function nthIndexOf(haystack: string, needle: string, n: number): number {
  let index = haystack.indexOf(needle);
  while (n-- > 0) {
    if (index === -1) break;
    index = haystack.indexOf(needle, index + 1);
  }
  return index;
}

export function opposite(color: Color): Color {
  return color === 'white' ? 'black' : 'white';
}

export function squareDist(a: Square, b: Square): number {
  const x1 = a & 7, x2 = b & 7;
  const y1 = a >> 3, y2 = b >> 3;
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

export function squareRank(square: Square): number {
  return square >> 3;
}

export function squareFile(square: Square): number {
  return square & 7;
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

export function charToRole(ch: 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K'): Role;
export function charToRole(ch: string): Role | undefined;
export function charToRole(ch: string): Role | undefined {
  switch (ch) {
  case 'P': case 'p': return 'pawn';
  case 'N': case 'n': return 'knight';
  case 'B': case 'b': return 'bishop';
  case 'R': case 'r': return 'rook';
  case 'Q': case 'q': return 'queen';
  case 'K': case 'k': return 'king';
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

export function parseUci(str: string): Uci | undefined {
  if (str[1] === '@' && str.length === 4) {
    const role = charToRole(str[0]);
    const to = parseSquare(str.slice(2));
    if (role && defined(to)) return { role, to };
  } else if (str.length === 4 || str.length === 5) {
    const from = parseSquare(str.slice(0, 2));
    const to = parseSquare(str.slice(2, 4));
    let promotion: Role | undefined;
    if (str.length === 5) {
      promotion = charToRole(str[4]);
      if (!promotion) return;
    }
    if (defined(from) && defined(to)) return { from, to, promotion };
  }
  return;
}

export function makeUci(uci: Uci): string {
  if (isDrop(uci)) return `${roleToChar(uci.role).toUpperCase()}@${makeSquare(uci.to)}`;
  return makeSquare(uci.from) + makeSquare(uci.to) + (uci.promotion ? roleToChar(uci.promotion) : '');
}
