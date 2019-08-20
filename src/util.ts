import { Board, Square, Color, Role } from './types';

export function opposite(color: Color): Color {
  return color == 'white' ? 'black' : 'white';
}

export function charToRole(c: string): Role | undefined {
  switch (c) {
    case 'p': case 'P': return 'pawn';
    case 'n': case 'N': return 'knight';
    case 'b': case 'B': return 'bishop';
    case 'r': case 'R': return 'rook';
    case 'q': case 'Q': return 'queen';
    case 'k': case 'K': return 'king';
    default: return;
  }
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

export function strRepeat(str: string, num: number): string {
  let r = '';
  for (let i = 0; i < num; i++) r += str;
  return r;
}

// TODO: remove
export function fail(str: string): undefined {
  console.log(str);
  return;
}

// TODO: remove
export function pp<A>(v: A, name?: string): A {
  if (name) console.log(name, v);
  else console.log(v);
  return v;
}
