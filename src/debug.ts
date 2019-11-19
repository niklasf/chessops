import { Square, Piece, Role, ROLES, ByRole, BySquare } from './types';
import { makeSquare, makeUci } from './util';
import { makePiece } from './fen';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Position } from './chess';

export function squareSet(squares: SquareSet): string {
  let r = '';
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = x + y * 8;
      r += squares.has(square) ? '1' : '.';
      r += x < 7 ? ' ' : '\n';
    }
  }
  return r;
}

export function piece(piece: Piece): string {
  return makePiece(piece);
}

export function board(board: Board): string {
  let r = '';
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = x + y * 8;
      const p = board.get(square);
      const col = p ? piece(p) : '.';
      r += col;
      r += x < 7 ? (col.length < 2 ? ' ' : '') : '\n';
    }
  }
  return r;
}

export function square(sq: Square): string {
  return makeSquare(sq);
}

export function dests(dests: Map<Square, SquareSet>) {
  const lines = [];
  for (const [from, to] of dests) {
    lines.push(`${makeSquare(from)}: ${to.toArray().map(square).join(' ')}`);
  }
  return lines.join('\n');
}

export function perft(pos: Position, depth: number, outer: boolean = false): number {
  if (depth < 1) return 1;

  const promotionRoles: Role[] = ['queen', 'knight', 'rook', 'bishop'];
  if (pos.rules() == 'antichess') promotionRoles.push('king');

  const dropDests = pos.dropDests(pos.ctx());

  if (!outer && depth == 1 && dropDests.isEmpty()) {
    // Optimization for leaf nodes.
    let nodes = 0;
    for (const [from, to] of pos.allDests()) {
      nodes += to.size();
      if (pos.board.pawn.has(from)) {
        const backrank = SquareSet.fromRank(pos.turn == 'white' ? 7 : 0);
        nodes += to.intersect(backrank).size() * (promotionRoles.length - 1);
      }
    }
    return nodes;
  } else {
    let nodes = 0;
    for (const [from, dests] of pos.allDests()) {
      const promotions: Array<Role | undefined> =
        ((from >> 3) == (pos.turn == 'white' ? 6 : 1) && pos.board.pawn.has(from)) ?
          promotionRoles : [undefined];
      for (const to of dests) {
        for (const promotion of promotions) {
          const child = pos.clone();
          const uci = { from, to, promotion };
          child.play(uci);
          const children = perft(child, depth - 1, false);
          if (outer) console.log(makeUci(uci), children);
          nodes += children;
        }
      }
    }
    if (pos.pockets) {
      for (const role of ROLES) {
        if (pos.pockets[pos.turn][role] > 0) {
          for (const to of (role == 'pawn' ? dropDests.diff(SquareSet.backranks()) : dropDests)) {
            const child = pos.clone();
            const uci = { role, to };
            child.play(uci);
            const children = perft(child, depth - 1, false);
            if (outer) console.log(makeUci(uci), children);
            nodes += children;
          }
        }
      }
    }
    return nodes;
  }
}
