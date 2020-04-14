import { isDrop, Move } from './types';
import { roleToChar, makeSquare } from './util';
import { SquareSet } from './squareSet';
import { Position } from './chess';
import { kingAttacks, queenAttacks, rookAttacks, bishopAttacks, knightAttacks } from './attacks';

function makeSanWithoutSuffix(pos: Position, move: Move): string {
  let san = '';
  if (isDrop(move)) {
    if (move.role !== 'pawn') san = roleToChar(move.role).toUpperCase();
    san += '@' + makeSquare(move.to);
  } else {
    const role = pos.board.getRole(move.from);
    if (!role) return '--';
    if (role === 'king' && (pos.board[pos.turn].has(move.to) || Math.abs(move.to - move.from) === 2)) {
      san = move.to > move.from ? 'O-O' : 'O-O-O';
    } else {
      const capture = pos.board.occupied.has(move.to) || (role === 'pawn' && (move.from & 0x7) !== (move.to & 0x7));
      if (role !== 'pawn') {
        san = roleToChar(role).toUpperCase();

        // Disambiguation
        let others;
        if (role === 'king') others = kingAttacks(move.to).intersect(pos.board.king);
        else if (role === 'queen') others = queenAttacks(move.to, pos.board.occupied).intersect(pos.board.queen);
        else if (role === 'rook') others = rookAttacks(move.to, pos.board.occupied).intersect(pos.board.rook);
        else if (role === 'bishop') others = bishopAttacks(move.to, pos.board.occupied).intersect(pos.board.bishop);
        else others = knightAttacks(move.to).intersect(pos.board.knight);
        others = others.intersect(pos.board[pos.turn]).without(move.from);
        if (others.nonEmpty()) {
          const ctx = pos.ctx();
          for (const from of others) {
            if (!pos.dests(from, ctx).has(move.to)) others = others.without(from);
          }
          if (others.nonEmpty()) {
            let row = false;
            let column = others.intersects(SquareSet.fromRank(move.from >> 3));
            if (others.intersects(SquareSet.fromFile(move.from & 0x7))) row = true;
            else column = true;
            if (column) san += 'abcdefgh'[move.from & 0x7];
            if (row) san += '12345678'[move.from >> 3];
          }
        }
      } else if (capture) san = 'abcdefgh'[move.from & 0x7];

      if (capture) san += 'x';
      san += makeSquare(move.to);
      if (move.promotion) san += '=' + roleToChar(move.promotion).toUpperCase();
    }
  }
  return san;
}

export function makeSanAndPlay(pos: Position, move: Move): string {
  const san = makeSanWithoutSuffix(pos, move);
  pos.play(move);
  const outcome = pos.outcome();
  if (outcome && outcome.winner) return san + '#';
  else if (pos.isCheck()) return san + '+';
  else return san;
}

export function makeSanVariation(pos: Position, variation: Move[]): string {
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

export function makeSan(pos: Position, move: Move): string {
  return makeSanAndPlay(pos.clone(), move);
}
