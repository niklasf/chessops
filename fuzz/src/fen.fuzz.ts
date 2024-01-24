import { makeFen, parseFen } from 'chessops/fen';
import { setupEquals } from 'chessops/setup';

export const fuzz = (data: Buffer): void => {
  parseFen(data.toString()).map(setup => {
    const roundtripped = parseFen(makeFen(setup)).unwrap();
    if (!setupEquals(setup, roundtripped)) throw 'setup not equal';
  });
};
