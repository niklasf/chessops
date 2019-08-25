import { eachLine } from 'line-reader';
import { unwrap } from '../src/fp';
import { Position } from '../src/types';
import { parseFen, makeFen, INITIAL_FEN} from '../src/fen';
import { setup } from '../src/setup';
import { copyPosition, makeMove } from '../src/makeMove';
import { moveDests } from '../src/dests';

function perft(pos: Position, depth: number): number {
  if (depth == 0) return 1;
  let nodes = 0;
  const dests = moveDests(pos);
  for (const from in dests) {
    for (const to of (dests[from] || [])) {
      for (const suffix  of ((pos.board[from]!.role == 'pawn' && (to[1] == '8' || to[1] == '1')) ? ['q', 'r', 'n', 'b'] : [''])) {
        const uci = from + to + suffix;
        const child = copyPosition(pos);
        makeMove(child, uci);
        if (depth == 5) nodes += d(from + to, perft(child, depth - 1));
        else nodes += perft(child, depth - 1);
      }
    }
  }
  return nodes;
}

function testPerftFile(path: string, done: () => void): void {
  let pos = unwrap(setup(unwrap(parseFen(INITIAL_FEN))));
  eachLine(path, (line, last) => {
    if (line) {
      const parts = line.split(' ');
      const command = parts.shift();
      if (command == 'id') console.log(parts.join(' '));
      if (command == 'epd') pos = unwrap(setup(unwrap(parseFen(parts.join(' ')))));
      if (command == 'perft') {
        const depth = parseInt(parts.shift()!, 10);
        if (depth <= 1) {
          const nodes = parseInt(parts.shift()!, 10);
          const perftNodes = perft(pos, depth);
          if (nodes != perftNodes) console.log(moveDests(pos));
          expect(perftNodes).toBe(nodes);
        }
      }
    }
    if (last) done();
  });
}

function d<T>(ctx: string, v: T): T {
  console.log(ctx, v);
  return v;
}

test('initial perft', () => {
  const pos = unwrap(setup(unwrap(parseFen(INITIAL_FEN))));
  expect(perft(pos, 1)).toBe(20);
  expect(perft(pos, 2)).toBe(400);
  expect(perft(pos, 3)).toBe(8902);
  expect(perft(pos, 4)).toBe(197281);
});

test('simple evasions', () => {
  const pos = unwrap(setup(unwrap(parseFen('r1bqkb1r/ppp2ppp/5n2/nB1Pp1N1/8/8/PPPP1PPP/RNBQK2R b KQkq - 2 6'))));
  const dests = moveDests(pos);
  expect(dests['e8']).toEqual(['e7']);
});

test('tricky perft', done => {
  testPerftFile('./perft/tricky.perft', done);
});

test('random perft', done => {
  jest.setTimeout(300000);
  testPerftFile('./perft/random.perft', done);
});
