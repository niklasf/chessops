import { parseFen, makeFen } from 'chessops/fen';
import { boardEquals } from 'chessops/board';

export const fuzz = (data: Buffer): void => {
  parseFen(data.toString()).map(setup => {
    const roundtripped = parseFen(makeFen(setup)).unwrap();
    if (!boardEquals(setup.board, roundtripped.board)) throw 'board not equal';
    // TODO: check pockets
    if (setup.turn !== roundtripped.turn) throw 'turn not equal';
    // TODO: if (!setup.unmovedRooks.equals(roundtripped.unmovedRooks)) throw 'unmoved rooks not equal';
    if (setup.epSquare !== roundtripped.epSquare) throw 'ep square not equal';
    // TODO: check remaining checks
    if (setup.halfmoves !== roundtripped.halfmoves) throw 'halfmoves not equal';
    if (setup.fullmoves !== roundtripped.fullmoves) throw 'fullmoves not equal';
  });
};
