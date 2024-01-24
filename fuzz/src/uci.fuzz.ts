import { makeUci, moveEquals, parseUci } from 'chessops/util';

export const fuzz = (data: Buffer): void => {
  const move = parseUci(data.toString());
  if (move) {
    const roundtripped = parseUci(makeUci(move));
    if (!roundtripped) throw 'roundtrip failed';
    if (!moveEquals(move, roundtripped)) throw 'move not equal';
  }
};
