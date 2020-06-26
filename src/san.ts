import { isDrop, Move } from './types';
import { roleToChar, makeSquare, squareFile, squareRank } from './util';
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
      const capture = pos.board.occupied.has(move.to) || (role === 'pawn' && squareFile(move.from) !== squareFile(move.to));
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
            let column = others.intersects(SquareSet.fromRank(squareRank(move.from)));
            if (others.intersects(SquareSet.fromFile(squareFile(move.from)))) row = true;
            else column = true;
            if (column) san += 'abcdefgh'[squareFile(move.from)];
            if (row) san += '12345678'[squareRank(move.from)];
          }
        }
      } else if (capture) san = 'abcdefgh'[squareFile(move.from)];

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
  if (pos.outcome()?.winner) return san + '#';
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
    if (i === variation.length - 1 && pos.outcome()?.winner) line += '#';
    else if (pos.isCheck()) line += '+';
  }
  return line;
}

export function makeSan(pos: Position, move: Move): string {
  return makeSanAndPlay(pos.clone(), move);
}
