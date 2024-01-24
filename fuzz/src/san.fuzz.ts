import { Chess } from 'chessops/chess';
import { parseFen } from 'chessops/fen';
import { makeSan, parseSan } from 'chessops/san';
import { moveEquals } from 'chessops/util';

const setup = parseFen('2rqk2r/1b2bppp/1p2p3/n1ppPn2/2PP4/PP3N2/1BpNQPPP/RB3RK1 b k - 0 1').unwrap();
const pos = Chess.fromSetup(setup).unwrap();

export const fuzz = (data: Buffer): void => {
  const move = parseSan(pos, data.toString());
  if (move) {
    const roundtripped = parseSan(pos, makeSan(pos, move));
    if (!roundtripped) throw 'roundtrip failed';
    if (!moveEquals(move, roundtripped)) throw 'move not equal';
  }
};
