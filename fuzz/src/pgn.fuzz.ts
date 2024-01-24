import { emptyHeaders, PgnParser } from 'chessops/pgn';

export const fuzz = (data: Buffer): void => {
  new PgnParser(() => {}, emptyHeaders).parse(data.toString());
};
