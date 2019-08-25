import { Square, Position, Dests } from './types';
import { opposite } from './util';
import { findKing, pawnAttacks, bishopAttacks, rookAttacks, isAttacked, sliderBlockers, aligned, attacksTo, KING_MOVES, KNIGHT_MOVES, NORTH, SOUTH, BETWEEN } from './attacks';

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
      return (capture && capture.color != pos.turn);
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

function enPassant(pos: Position, king: Square): Dests {
  const dests: Dests = {};
  if (pos.epSquare) {
    for (const from of pawnAttacks(pos.epSquare, opposite(pos.turn))) {
      const piece = pos.board[from];
      if (!piece || piece.role != 'pawn' || piece.color != pos.turn) continue;
      const capturedPawn = pos.epSquare[0] + from[1] as Square;
      if (isAttacked(pos.board, opposite(pos.turn), king, [from, capturedPawn], [pos.epSquare])) continue;
      dests[from] = [pos.epSquare];
    }
  }
  return dests;
}

function evasions(pos: Position, king: Square, checkers: Square[], blockers: Square[]): Dests {
  const dests: Dests = enPassant(pos, king);
  dests[king] = KING_MOVES[king].filter(to => {
    const capture = pos.board[to];
    if (capture && capture.color == pos.turn) return false;
    return !isAttacked(pos.board, opposite(pos.turn), to, [king]);
  });
  if (checkers.length == 1) {
    const checker = checkers[0];
    for (const s in pos.board) {
      const from = s as Square;
      if (s == king) continue;
      const piece = pos.board[from];
      if (!piece || piece.color != pos.turn) continue;
      if (!dests[from]) dests[from] = [];
      for (const to of destsFrom(pos, from)) {
        if (blockers.indexOf(from) != -1 && !aligned(from, to, king)) continue;
        if (to == checker || BETWEEN[checker][king].indexOf(to) != -1) dests[from]!.push(to);
      }
    }
  }
  return dests;
}

export function moveDests(pos: Position): Dests {
  const king = findKing(pos.board, pos.turn)!;
  const blockers = sliderBlockers(pos.board, king, pos.turn);
  const checkers = attacksTo(pos.board, opposite(pos.turn), king);
  if (checkers.length > 0) return evasions(pos, king, checkers, blockers);

  const dests: Dests = enPassant(pos, king);
  for (const s in pos.board) {
    const from = s as Square;
    const piece = pos.board[from];
    if (piece && piece.color == pos.turn) {
      let d = destsFrom(pos, from);
      if (blockers.indexOf(from) != -1) d = d.filter(to => {
        return aligned(from, to, king);
      });
      if (!dests[from]) dests[from] = [];
      for (const to of d) dests[from]!.push(to);
    }
  }

  for (const rook of pos.castlingRights) {
    const backrank = pos.turn == 'white' ? '1' : '8';
    if (rook[1] != backrank) continue;
    const aSide = rook < king;
    const rookTo = (aSide ? 'd' : 'f') + backrank as Square;
    const kingTo = (aSide ? 'c' : 'g') + backrank as Square;
    if (rookTo != rook && rookTo != king && pos.board[rookTo]) continue;
    if (kingTo != king && kingTo != rook && pos.board[kingTo]) continue;
    if (BETWEEN[rook][rookTo].some(o => o != king && pos.board[o])) continue;
    if (BETWEEN[king][kingTo].some(o => o != rook && pos.board[o])) continue;
    if ([kingTo, ...BETWEEN[king][kingTo]].some(o => {
      return isAttacked(pos.board, opposite(pos.turn), o, [rook, king]);
    })) continue;
    dests[king]!.push(rook);
  }

  return dests;
}
