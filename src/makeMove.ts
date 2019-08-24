import { Position, Role, Piece, Uci, Square } from './types';
import { opposite, charToRole, arrayRemove } from './util';
import { KING_MOVES } from './attacks';

export function makeMove(pos: Position, uci: Uci) {
  pos.epSquare = undefined;
  if (pos.turn == 'black') pos.fullmoves++;
  const turn = pos.turn;
  pos.turn = opposite(turn);
  if (uci == '0000') return;

  const to = uci.slice(2, 4);

  // drop
  if (uci.includes('@')) {
    const dropped: Piece = { role: charToRole(uci[0])!, color: turn };
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

  // TODO: castling

  if (piece.role == 'rook') arrayRemove(pos.castlingRights, from);
  else if (piece.role == 'king') {
    pos.castlingRights = pos.castlingRights.filter(rook => {
      rook[1] == (piece.color == 'white' ? '1' : '8')
    });
  } else if (piece.role == 'pawn') {
    // en passant
    if (!capture && from[1] != to[1]) {
      const fifthRank = to[0] + (turn == 'white' ? '6' : '4');
      capture = pos.board[fifthRank];
      delete pos.board[fifthRank];
    }

    // set en passant square
    if (from[1] == '2' && to[1] == '4') pos.epSquare = from[0] + '3' as Square;
    else if (from[1] == '7' && to[1] == '5') pos.epSquare = from[0] + '6' as Square;
  }

  // promotion
  if (uci[4]) piece = { role: charToRole(uci[4])!, color: turn, promoted: true };

  // update board
  if (capture) arrayRemove(pos.castlingRights, to);
  pos.board[to] = piece;

  // update pockets
  if (pos.pockets && capture) {
    pos.pockets[opposite(turn)][capture.promoted ? 'pawn' : capture.role]++;
  }

  // atomic explosion
  if (pos.rules == 'atomic' && capture) {
    removePiece(pos.board[to]);
    for (const ring of KING_MOVES[to as Square]) {
      const exploded = pos.board[ring];
      if (exploded && exploded.role != 'pawn') {
        arrayRemove(pos.castlingRights, ring);
        delete pos.board[ring];
      }
    }
  }
}
