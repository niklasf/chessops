import { Square, Position, Dests } from './types';
import { findKing, pawnAttacks, bishopAttacks, rookAttacks, KING_MOVES, KNIGHT_MOVES, NORTH, SOUTH } from './attacks';

export function destsFrom(pos: Position, square: Square): Square[] {
  const v = (to: Square) => {
    const capture = pos.board[to];
    return !capture || capture.color != pos.turn;
  };
  const piece = pos.board[square];
  if (!piece || piece.color != pos.turn) return [];
  if (piece.role == 'king') return KING_MOVES[square].filter(v);
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
  const king = findKing(pos.board, pos.turn);

  const dests: Dests = {};
  for (const square in pos.board) {
    const piece = pos.board[square];
    if (piece && piece.color == pos.turn) {
      const to = destsFrom(pos, square as Square);
      if (to.length) dests[square] = to;
    }
  }
  return dests;
}
