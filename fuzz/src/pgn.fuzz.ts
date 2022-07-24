import { parsePgn } from 'chessops/pgn';

export const fuzz = (data: Buffer): void => {
  parsePgn(data.toString(), () => new Map());
};
