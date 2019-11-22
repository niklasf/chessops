import { isDrop, Uci } from './types';
import { defined, roleToChar, makeSquare } from './util';
import { Position } from './chess';

export function makeSanAndPlay(pos: Position, uci: Uci): string {
  let san = '';
  if (isDrop(uci)) {
    if (uci.role != 'pawn') san = roleToChar(uci.role).toUpperCase();
    san += '@' + makeSquare(uci.to);
  } else {
    const role = pos.board.getRole(uci.from);
    if (!role) return '--';
    if (role == 'king' && (pos.board[pos.turn].has(uci.to) || Math.abs(uci.to - uci.from) == 2)) {
      san = uci.to > uci.from ? 'O-O' : 'O-O-O';
    } else {
      if (role != 'pawn') san = roleToChar(role).toUpperCase();
      san += makeSquare(uci.from);
      san += pos.board.occupied.has(uci.to) ? 'x' : '-';
      san += makeSquare(uci.to);
    }
  }

  pos.play(uci);
  const outcome = pos.outcome();
  if (outcome && defined(outcome.winner)) san += '#';
  else if (pos.isCheck()) san += '+';
  return san;
}

export function makeVariationSan(pos: Position, variation: Uci[]): string {
  pos = pos.clone();
  let first = true;
  return variation.map(uci => {
    let prefix = '';
    if (pos.turn == 'white') prefix = pos.fullmoves + '. ';
    else if (first) prefix = pos.fullmoves + '... ';
    first = false;
    return prefix + makeSanAndPlay(pos, uci);
  }).join(' ');
}

export function makeSan(pos: Position, uci: Uci): string {
  return makeSanAndPlay(pos.clone(), uci);
}
