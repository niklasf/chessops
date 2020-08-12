import { Square, Piece, Role, ROLES } from './types';
import { opposite, squareRank, makeSquare, makeUci } from './util';
import { makePiece } from './fen';
import { SquareSet } from './squareSet';
import { Board } from './board';
import { Position } from './chess';

export function squareSet(squares: SquareSet): string {
  const r = [];
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = x + y * 8;
      r.push(squares.has(square) ? '1' : '.');
      r.push(x < 7 ? ' ' : '\n');
    }
  }
  return r.join('');
}

export function piece(piece: Piece): string {
  return makePiece(piece);
}

export function board(board: Board): string {
  const r = [];
  for (let y = 7; y >= 0; y--) {
    for (let x = 0; x < 8; x++) {
      const square = x + y * 8;
      const p = board.get(square);
      const col = p ? piece(p) : '.';
      r.push(col);
      r.push(x < 7 ? (col.length < 2 ? ' ' : '') : '\n');
    }
  }
  return r.join('');
}

export function square(sq: Square): string {
  return makeSquare(sq);
}

export function dests(dests: Map<Square, SquareSet>): string {
  const lines = [];
  for (const [from, to] of dests) {
    lines.push(`${makeSquare(from)}: ${Array.from(to, square).join(' ')}`);
  }
  return lines.join('\n');
}

export function perft(pos: Position, depth: number, log = false): number {
  if (depth < 1) return 1;

  const promotionRoles: Role[] = ['queen', 'knight', 'rook', 'bishop'];
  if (pos.rules === 'antichess') promotionRoles.push('king');

  const ctx = pos.ctx();
  const dropDests = pos.dropDests(ctx);

  if (!log && depth === 1 && dropDests.isEmpty()) {
    // Optimization for leaf nodes.
    let nodes = 0;
    for (const [from, to] of pos.allDests(ctx)) {
      nodes += to.size();
      if (pos.board.pawn.has(from)) {
        const backrank = SquareSet.backrank(opposite(pos.turn));
        nodes += to.intersect(backrank).size() * (promotionRoles.length - 1);
      }
    }
    return nodes;
  } else {
    let nodes = 0;
    for (const [from, dests] of pos.allDests(ctx)) {
      const promotions: Array<Role | undefined> =
        (squareRank(from) === (pos.turn === 'white' ? 6 : 1) && pos.board.pawn.has(from)) ?
          promotionRoles : [undefined];
      for (const to of dests) {
        for (const promotion of promotions) {
          const child = pos.clone();
          const move = { from, to, promotion };
          child.play(move);
          const children = perft(child, depth - 1, false);
          if (log) console.log(makeUci(move), children);
          nodes += children;
        }
      }
    }
    if (pos.pockets) {
      for (const role of ROLES) {
        if (pos.pockets[pos.turn][role] > 0) {
          for (const to of (role === 'pawn' ? dropDests.diff(SquareSet.backranks()) : dropDests)) {
            const child = pos.clone();
            const move = { role, to };
            child.play(move);
            const children = perft(child, depth - 1, false);
            if (log) console.log(makeUci(move), children);
            nodes += children;
          }
        }
      }
    }
    return nodes;
  }
}
