import { isDrop, Uci } from './types';
import { roleToChar, makeSquare } from './util';
import { SquareSet } from './squareSet';
import { Position } from './chess';
import { kingAttacks, queenAttacks, rookAttacks, bishopAttacks, knightAttacks } from './attacks';

function makeSanWithoutSuffix(pos: Position, uci: Uci): string {
  let san = '';
  if (isDrop(uci)) {
    if (uci.role !== 'pawn') san = roleToChar(uci.role).toUpperCase();
    san += '@' + makeSquare(uci.to);
  } else {
    const role = pos.board.getRole(uci.from);
    if (!role) return '--';
    if (role === 'king' && (pos.board[pos.turn].has(uci.to) || Math.abs(uci.to - uci.from) === 2)) {
      san = uci.to > uci.from ? 'O-O' : 'O-O-O';
    } else {
      const capture = pos.board.occupied.has(uci.to) || (role === 'pawn' && (uci.from & 0x7) != (uci.to & 0x7));
      if (role !== 'pawn') {
        san = roleToChar(role).toUpperCase();

        // Disambiguation
        let others;
        if (role === 'king') others = kingAttacks(uci.to).intersect(pos.board.king);
        else if (role === 'queen') others = queenAttacks(uci.to, pos.board.occupied).intersect(pos.board.queen);
        else if (role === 'rook') others = rookAttacks(uci.to, pos.board.occupied).intersect(pos.board.rook);
        else if (role === 'bishop') others = bishopAttacks(uci.to, pos.board.occupied).intersect(pos.board.bishop);
        else others = knightAttacks(uci.to).intersect(pos.board.knight);
        others = others.intersect(pos.board[pos.turn]).without(uci.from);
        if (others.nonEmpty()) {
          const ctx = pos.ctx();
          for (const from of others) {
            if (!pos.dests(from, ctx).has(uci.to)) others = others.without(from);
          }
          if (others.nonEmpty()) {
            let row = false;
            let column = others.intersects(SquareSet.fromRank(uci.from >> 3));
            if (others.intersects(SquareSet.fromFile(uci.from & 0x7))) row = true;
            else column = true;
            if (column) san += 'abcdefgh'[uci.from & 0x7];
            if (row) san += '12345678'[uci.from >> 3];
          }
        }
      } else if (capture) san = 'abcdefgh'[uci.from & 0x7];

      if (capture) san += 'x';
      san += makeSquare(uci.to);
      if (uci.promotion) san += '=' + roleToChar(uci.promotion).toUpperCase();
    }
  }
  return san;
}

export function makeSanAndPlay(pos: Position, uci: Uci): string {
  const san = makeSanWithoutSuffix(pos, uci);
  pos.play(uci);
  const outcome = pos.outcome();
  if (outcome && outcome.winner) return san + '#';
  else if (pos.isCheck()) return san + '+';
  else return san;
}

export function makeSanVariation(pos: Position, variation: Uci[]): string {
  pos = pos.clone();
  let line = '';
  for (let i = 0; i < variation.length; i++) {
    if (i !== 0) line += ' ';
    if (pos.turn === 'white') line += pos.fullmoves + '. ';
    else if (i === 0) line = pos.fullmoves + '... ';
    const san = makeSanWithoutSuffix(pos, variation[i]);
    pos.play(variation[i]);
    line += san;
    if (san === '--') return line;
    let over = false;
    if (i === variation.length - 1) {
      const outcome = pos.outcome();
      over = !!(outcome && outcome.winner);
    }
    if (over) line += '#';
    else if (pos.isCheck()) line += '+';
  }
  return line;
}

export function makeSan(pos: Position, uci: Uci): string {
  return makeSanAndPlay(pos.clone(), uci);
}
