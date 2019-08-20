import { Position, Role, Piece, Uci, Square } from './types';
import { opposite, charToRole } from './util';
import { KING_MOVES } from './attacks';

export function makeMove(pos: Position, uci: Uci) {
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

  // en passant
  if (piece.role == 'pawn') {
    if (to == pos.epSquare) {
      const fifthRank = to[0] + (turn == 'white' ? '6' : '4');
      capture = pos.board[fifthRank];
      delete pos.board[fifthRank];
    }

    if (from[1] == '2' && to[1] == '4') pos.epSquare = from[0] + '3' as Square;
    else if (from[1] == '7' && to[1] == '5') pos.epSquare = from[0] + '6' as Square;
  }

  // promotion
  if (uci[4]) piece = { role: charToRole(uci[4])!, color: turn, promoted: true };

  // update board
  pos.board[to] = piece;
  delete pos.board[from];

  // update pockets
  if (pos.pockets && capture) {
    pos.pockets[opposite(turn)][capture.promoted ? 'pawn' : capture.role]++;
  }

  // atomic explosion
  if (pos.rules == 'atomic' && capture) {
    delete pos.board[to];
    for (const ring of KING_MOVES[to as Square]) {
      const exploded = pos.board[ring];
      if (exploded && exploded.role != 'pawn') delete pos.board[ring];
    }
  }
}
