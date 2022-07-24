import { parseUci, makeUci } from 'chessops/util';
import { isDrop, isNormal } from 'chessops/types';

export const fuzz = (data: Buffer): void => {
  const move = parseUci(data.toString());
  if (move) {
    const roundtripped = parseUci(makeUci(move));
    if (!roundtripped) throw 'roundtrip';
    if (move.to !== roundtripped.to) throw 'to not equal';
    if (isDrop(move) && isDrop(roundtripped)) {
      if (move.role !== roundtripped.role) throw 'role not equal';
    } else if (isNormal(move) && isNormal(roundtripped)) {
      if (move.from !== roundtripped.from) throw 'from not equal';
      if (move.promotion !== roundtripped.promotion) throw 'promotion not equal';
    } else throw 'move type not equal';
  }
};
