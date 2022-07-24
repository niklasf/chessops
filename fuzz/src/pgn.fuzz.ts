import { PgnParser, emptyHeaders } from 'chessops/pgn';
import { writeFileSync } from 'fs';

export const fuzz = (data: Buffer): void => {
  //console.log(data.length);
  //writeFileSync('/tmp/fuzz', data);
  new PgnParser(() => {}, emptyHeaders).parse(data.toString());
};
