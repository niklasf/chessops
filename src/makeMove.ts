import { Position, Role, Piece, Uci, Square } from './types';
import { opposite, charToRole, arrayRemove } from './util';
import { findKing, isAttacked, KING_MOVES } from './attacks';

export function copyPosition(pos: Position): Position {
  return {
    rules: pos.rules,
    board: { ...pos.board },
    turn: pos.turn,
    epSquare: pos.epSquare,
    castlingRights: [...pos.castlingRights],
    pockets: pos.pockets && { white: { ...pos.pockets.white }, black: { ... pos.pockets.black } },
    remainingChecks: pos.remainingChecks && { ...pos.remainingChecks },
    halfmoves: pos.halfmoves,
    fullmoves: pos.fullmoves
  };
}

export function makeMove(pos: Position, uci: Uci) {
  pos.epSquare = undefined;
  if (pos.turn == 'black') pos.fullmoves++;
  const turn = pos.turn;
  pos.turn = opposite(turn);
  if (uci == '0000') return;

  let to = uci.slice(2, 4) as Square;

  // drop
  if (uci.includes('@')) {
    const dropped: Piece = { role: charToRole(uci[0]).value!, color: turn };
    pos.board[to] = dropped;
    if (pos.pockets) pos.pockets[dropped.color][dropped.role]--;
    return;
  }

  const from = uci.slice(0, 2);
  let piece = pos.board[from];
  if (!piece) return;

  let capture = pos.board[to];
  if (capture || piece.role == 'pawn') pos.halfmoves = 0;
  else pos.halfmoves++;

  let isCastling = false;
  if (piece.role == 'rook') arrayRemove(pos.castlingRights, from);
  else if (piece.role == 'king') {
    const backrank = piece.color == 'white' ? '1' : '8';
    if (from[1] == backrank && to[1] == backrank) {
      if (from[0] == 'e' && to[0] == 'g') to = 'h' + to[1] as Square;
      else if (from[0] == 'e' && to[0] == 'c') to = 'a' + to[1] as Square;
    }
    isCastling = pos.castlingRights.indexOf(to) != -1;
    pos.castlingRights = pos.castlingRights.filter(rook => rook[1] != backrank);
  } else if (piece.role == 'pawn') {
    // en passant
    if (!capture && from[0] != to[0]) {
      const fifthRank = to[0] + from[1] as Square;
      capture = pos.board[fifthRank];
      delete pos.board[fifthRank];
    }

    // set en passant square
    if (from[1] == '2' && to[1] == '4') pos.epSquare = from[0] + '3' as Square;
    else if (from[1] == '7' && to[1] == '5') pos.epSquare = from[0] + '6' as Square;
  }

  // promotion
  if (uci[4]) piece = { role: charToRole(uci[4]).value!, color: turn, promoted: true };

  // update board
  if (isCastling) {
    const rook = pos.board[to]!;
    delete pos.board[to];
    delete pos.board[from];
    pos.board[(to < from ? 'c' : 'g') + to[1]] = piece;
    pos.board[(to < from ? 'd' : 'f') + to[1]] = rook;
  } else {
    delete pos.board[from];
    if (capture) arrayRemove(pos.castlingRights, to);
    pos.board[to] = piece;

    // update pockets
    if (pos.pockets && capture) {
      pos.pockets[opposite(turn)][capture.promoted ? 'pawn' : capture.role]++;
    }

    // atomic explosion
    if (pos.rules == 'atomic' && capture) {
      delete pos.board[to];
      for (const ring of KING_MOVES[to as Square]) {
        const exploded = pos.board[ring];
        if (exploded && exploded.role != 'pawn') {
          arrayRemove(pos.castlingRights, ring);
          delete pos.board[ring];
        }
      }
    }
  }

  // update remaining checks in three check
  if (pos.remainingChecks) {
    const king = findKing(pos.board, pos.turn)!;
    if (isAttacked(pos.board, turn, king)) pos.remainingChecks[turn]--;
  }
}
