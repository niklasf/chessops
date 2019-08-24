import { Square, Position, Dests } from './types';
import { opposite } from './util';
import { findKing, pawnAttacks, bishopAttacks, rookAttacks, isAttacked, sliderBlockers, aligned, KING_MOVES, KNIGHT_MOVES, NORTH, SOUTH } from './attacks';

export function destsFrom(pos: Position, square: Square): Square[] {
  const v = (to: Square) => {
    const capture = pos.board[to];
    return !capture || capture.color != pos.turn;
  };
  const piece = pos.board[square];
  if (!piece || piece.color != pos.turn) return [];
  if (piece.role == 'king') return KING_MOVES[square].filter(v).filter(to => {
    return !isAttacked(pos.board, opposite(pos.turn), to);
  });
  else if (piece.role == 'knight') return KNIGHT_MOVES[square].filter(v);
  else if (piece.role == 'bishop') return bishopAttacks(pos.board, square).filter(v);
  else if (piece.role == 'rook') return rookAttacks(pos.board, square).filter(v);
  else if (piece.role == 'queen') return [...rookAttacks(pos.board, square), ...bishopAttacks(pos.board, square)].filter(v);
  else {
    const captures = pawnAttacks(square, pos.turn).filter(to => {
      const capture = pos.board[to];
      return (capture && capture.color != pos.turn) || pos.epSquare == to;
    });
    const forward = pos.turn == 'white' ? NORTH : SOUTH;
    const firstTwoRanks = pos.turn == 'white' ? ['1', '2'] : ['7', '8'];
    const step = (!pos.board[forward[square]!]) ? forward[square] : undefined;
    const doubleStep = (firstTwoRanks.indexOf(square[1]) != -1 && !pos.board[forward[step!]!]) ? forward[step!]! : undefined;
    return [
      ...captures,
      ...(step ? [step] : []),
      ...(doubleStep ? [doubleStep] : [])
    ];
  }
}

export function moveDests(pos: Position): Dests {
  const king = findKing(pos.board, pos.turn)!;
  const blockers = sliderBlockers(pos.board, king, pos.turn);

  const dests: Dests = {};
  for (const s in pos.board) {
    const from = s as Square;
    const piece = pos.board[from];
    if (piece && piece.color == pos.turn) {
      let d = destsFrom(pos, from);
      if (blockers.indexOf(from) != -1) d = d.filter(to => {
        return aligned(from, to, king);
      });
      dests[from] = d;
    }
  }
  return dests;
}
