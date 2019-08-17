import { Rules, Position } from './types';

export function read(rules: Rules, fen: string): Position | undefined {
  const parts = fen.split(/ /);
  let boardPart = parts.shift()!, pocketPart;
  const pocketStart = boardPart.indexOf('[');
  if (pocketStart > -1 && boardPart.endsWith(']')) {
    pocketPart = boardPart.substr(pocketStart + 1, boardPart.length - 1 - (pocketStart + 1));
    boardPart = boardPart.substr(0, pocketStart);
  }
  return;
}
