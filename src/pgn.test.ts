import {
  makePgn,
  Node,
  ChildNode,
  PgnNodeData,
  PgnParser,
  Game,
  parsePgn,
  transform,
  startingPosition,
  emptyHeaders,
} from './pgn.js';
import { parseSan } from './san.js';
import { Position } from './chess.js';
import { makeFen } from './fen.js';
import { jest } from '@jest/globals';
import { createReadStream } from 'fs';

test('make pgn', () => {
  const root = new Node<PgnNodeData>();

  const e4 = new ChildNode<PgnNodeData>({
    san: 'e4',
    nags: [7],
  });
  const e3 = new ChildNode<PgnNodeData>({ san: 'e3' });
  root.children.push(e4);
  root.children.push(e3);

  const e5 = new ChildNode<PgnNodeData>({
    san: 'e5',
  });
  const e6 = new ChildNode<PgnNodeData>({ san: 'e6' });
  e4.children.push(e5);
  e4.children.push(e6);

  const nf3 = new ChildNode<PgnNodeData>({
    san: 'Nf3',
    comments: ['a comment'],
  });
  e6.children.push(nf3);

  const c4 = new ChildNode<PgnNodeData>({ san: 'c4' });
  e5.children.push(c4);

  expect(makePgn({ headers: emptyHeaders(), moves: root })).toEqual(
    '1. e4 $7 ( 1. e3 ) 1... e5 ( 1... e6 2. Nf3 { a comment } ) 2. c4 *'
  );
});

test('parse headers', () => {
  const games = parsePgn(
    [
      '[Black "black player"]',
      '[White "white player"]',
      '[Escaped "quote: \\", backslashes: \\\\\\\\, trailing text"]',
    ].join('\r\n')
  );
  expect(games).toHaveLength(1);
  expect(games[0].headers.get('Black')).toBe('black player');
  expect(games[0].headers.get('White')).toBe('white player');
  expect(games[0].headers.get('Escaped')).toBe('quote: ", backslashes: \\\\, trailing text');
  expect(games[0].headers.get('Result')).toBe('*');
  expect(games[0].headers.get('Event')).toBe('?');
});

test('parse pgn', () => {
  const callback = jest.fn((game: Game<PgnNodeData>) => {
    expect(makePgn(game)).toBe('[Result "1-0"]\n\n1. e4 e5 2. Nf3 { foo } 1-0');
  });
  const parser = new PgnParser(callback, emptyHeaders);
  parser.parse('1. e4 \ne5', { stream: true });
  parser.parse('\nNf3 {f', { stream: true });
  parser.parse('oo } 1-', { stream: true });
  parser.parse('', { stream: true });
  parser.parse('0', { stream: true });
  parser.parse('');
  expect(callback).toHaveBeenCalledTimes(1);
});

interface TransformResult extends PgnNodeData {
  fen: string;
}

test('transform pgn', () => {
  const game = parsePgn('1. a4 ( 1. b4 b5 -- ) 1... a5')[0];
  const res = transform<PgnNodeData, TransformResult, Position>(
    game.moves,
    startingPosition(game.headers).unwrap(),
    (pos, data) => {
      const move = parseSan(pos, data.san);
      if (!move) return;
      pos.play(move);
      return {
        fen: makeFen(pos.toSetup()),
        ...data,
      };
    }
  );
  expect(res.children[0].data.fen).toBe('rnbqkbnr/pppppppp/8/8/P7/8/1PPPPPPP/RNBQKBNR b KQkq - 0 1');
  expect(res.children[0].children[0].data.fen).toBe('rnbqkbnr/1ppppppp/8/p7/P7/8/1PPPPPPP/RNBQKBNR w KQkq - 0 2');
  expect(res.children[1].data.fen).toBe('rnbqkbnr/pppppppp/8/8/1P6/8/P1PPPPPP/RNBQKBNR b KQkq - 0 1');
  expect(res.children[1].children[0].data.fen).toBe('rnbqkbnr/p1pppppp/8/1p6/1P6/8/P1PPPPPP/RNBQKBNR w KQkq - 0 2');
});

test('pgn file', done => {
  const callback = jest.fn();
  const parser = new PgnParser(callback, emptyHeaders);
  createReadStream('./data/kasparov-deep-blue-1997.pgn', { encoding: 'utf-8' })
    .on('data', (chunk: string) => parser.parse(chunk, { stream: true }))
    .on('close', () => {
      parser.parse('');
      expect(callback).toHaveBeenCalledTimes(6);
      done();
    });
});
