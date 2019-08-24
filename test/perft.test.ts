import { unwrap } from '../src/fp';
import { Position } from '../src/types';
import { parseFen, INITIAL_FEN} from '../src/fen';
import { setup } from '../src/setup';
import { makeMove } from '../src/makeMove';
import { moveDests } from '../src/dests';

function copyPosition(pos: Position): Position {
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
    for (const from in dests) {
      for (const to of (dests[from] || [])) {
        const uci = from + to;
        const child = copyPosition(pos);
        makeMove(child, uci);
        nodes += perft(child, depth - 1);
      }
    }
  }
  return nodes;
}

test('initial perft', () => {
  const pos = unwrap(setup(unwrap(parseFen(INITIAL_FEN))));
  expect(perft(pos, 1)).toBe(20);
  expect(perft(pos, 2)).toBe(400);
  expect(perft(pos, 3)).toBe(8902);
});
