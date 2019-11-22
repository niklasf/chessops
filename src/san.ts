import { isDrop, Uci } from './types';
import { defined, roleToChar, makeSquare } from './util';
import { SquareSet } from './squareSet';
import { Position } from './chess';
import { kingAttacks, queenAttacks, rookAttacks, bishopAttacks, knightAttacks } from './attacks';

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
      const capture = pos.board.occupied.has(uci.to);
      if (role != 'pawn') {
        san = roleToChar(role).toUpperCase();

        // Sloppy disambiguation
        let others;
        if (role == 'king') others = kingAttacks(uci.to).intersect(pos.board.king);
        else if (role == 'queen') others = queenAttacks(uci.to, pos.board.occupied).intersect(pos.board.queen);
        else if (role == 'rook') others = rookAttacks(uci.to, pos.board.occupied).intersect(pos.board.rook);
        else if (role == 'bishop') others = bishopAttacks(uci.to, pos.board.occupied).intersect(pos.board.bishop);
        else others = knightAttacks(uci.to).intersect(pos.board.knight);
        others = others.intersect(pos.board[pos.turn]).without(uci.from);
        if (others.nonEmpty()) {
          let row = false;
          let column = others.intersects(SquareSet.fromRank(uci.from >> 3));
          if (others.intersects(SquareSet.fromFile(uci.from & 0x7))) row = true;
          else column = true;
          if (column) san += 'acbdefgh'[uci.from & 0x7];
          if (row) san += '12345678'[uci.from >> 3];
        }
      } else if (capture) san = 'abcdefgh'[uci.from & 0x7];

      if (capture) san += 'x';
      san += makeSquare(uci.to);
      if (uci.promotion) san += '=' + roleToChar(uci.promotion).toUpperCase();
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
