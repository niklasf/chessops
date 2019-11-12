import { SquareSet } from './squareSet';

export function flipVertical(s: SquareSet): SquareSet {
  const k1 = new SquareSet(0x00ff00ff, 0x00ff00ff);
  const k2 = new SquareSet(0x0000ffff, 0x0000ffff);
  s = s.shr(8).intersect(k1).union(s.intersect(k1).shl(8));
  s = s.shr(16).intersect(k2).union(s.intersect(k2).shl(16));
  return new SquareSet(s.hi, s.lo);
}

export function flipHorizontal(s: SquareSet): SquareSet {
  const k1 = new SquareSet(0x55555555, 0x55555555);
  const k2 = new SquareSet(0x33333333, 0x33333333);
  const k4 = new SquareSet(0x0f0f0f0f, 0x0f0f0f0f);
  s = s.shr(1).intersect(k1).union(s.intersect(k1).shl(1));
  s = s.shr(2).intersect(k2).union(s.intersect(k2).shl(2));
  s = s.shr(4).intersect(k4).union(s.intersect(k4).shl(4));
  return s;
}

export function flipDiagonal(s: SquareSet): SquareSet {
  let t = s.xor(s.shl(28)).intersect(new SquareSet(0, 0x0f0f0f0f));
  s = s.xor(t.xor(t.shr(28)));
  t = s.xor(s.shl(14)).intersect(new SquareSet(0x33330000, 0x33330000));
  s = s.xor(t.xor(t.shr(14)));
  t = s.xor(s.shl(7)).intersect(new SquareSet(0x55005500, 0x55005500));
  s = s.xor(t.xor(t.shr(7)));
  return s;
}
