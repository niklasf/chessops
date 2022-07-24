import { parseFen } from 'chessops/fen';

export const fuzz = (data: Buffer): void => {
  parseFen(data.toString()).map(console.log);
};
