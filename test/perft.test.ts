import { unwrap } from '../src/fp';
import { Position } from '../src/types';
import { parseFen, INITIAL_FEN} from '../src/fen';
import { setup } from '../src/setup';
import { makeMove } from '../src/makeMove';
import { moveDests } from '../src/dests';

function copyPosition(pos: Position): Position {
  return {
    board: { ...pos.board },
    turn: pos.turn,
    castlingRights: [...pos.castlingRights],
    epSquare: pos.epSquare,
    rules: pos.rules,
    halfmoves: pos.halfmoves,
    fullmoves: pos.fullmoves
  };
}

function perft(pos: Position, depth: number): number {
  if (depth == 0) return 1;
  let nodes = 0;
  const dests = moveDests(pos);
  if (depth == 1) {
    for (const from in dests) {
      for (const to of (dests[from] || [])) {
        nodes += 1;
      }
    }
  } else {
    if (depth == 3) console.log(dests);
    for (const from in dests) {
      for (const to of (dests[from] || [])) {
        const uci = from + to;
        const child = copyPosition(pos);
        makeMove(child, uci);
        if (depth == 3) console.log(depth, '!', uci, perft(child, depth - 1));
        nodes += perft(child, depth - 1);
      }
    }
  }
  return nodes;
}

test('initial perft', () => {
  const now = performance.now();
  const pos = unwrap(setup(unwrap(parseFen(INITIAL_FEN))));
  expect(perft(pos, 1)).toBe(20);
  expect(perft(pos, 2)).toBe(400);
  expect(perft(pos, 3)).toBe(8902);
  //console.log(performance.now() - now);
});

/* test('perft after a4', () => {
  const pos = unwrap(setup(unwrap(parseFen(INITIAL_FEN))));
  makeMove(pos, 'a2a4');
  expect(perft(pos, 1)).toBe(20);
  expect(perft(pos, 2)).toBe(420);
}); */

/* test('initial dests', () => {
  const pos = unwrap(setup(unwrap(parseFen(INITIAL_FEN))));
  expect(pos.turn).toBe('white');
  expect(moveDests(pos)).toBe({
    b1: ['a3', 'c3'],
    g1: ['f3', 'h3'],
    a2: ['a3', 'a4'],
    b2: ['b3', 'b4'],
    c2: ['c3', 'c4'],
    d2: ['d3', 'd4'],
    e2: ['e3', 'e4'],
    f2: ['f3', 'f4'],
    g2: ['g3', 'g4'],
    h2: ['h3', 'h4']
  });
}); */
