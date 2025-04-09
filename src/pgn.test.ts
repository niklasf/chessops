import { expect, jest, test } from '@jest/globals';
import { createReadStream } from 'fs';
import { Position } from './chess.js';
import { makeFen } from './fen.js';
import {
  ChildNode,
  defaultGame,
  emptyHeaders,
  extend,
  Game,
  isChildNode,
  makeComment,
  makePgn,
  Node,
  parseComment,
  parsePgn,
  PgnError,
  PgnNodeData,
  PgnParser,
  startingPosition,
  transform,
} from './pgn.js';
import { parseSan } from './san.js';

interface GameCallback {
  (game: Game<PgnNodeData>, err: PgnError | undefined): Error | void;
}

function testPgnFile({ fileName = '', numberOfGames = 1, allValid = true } = {}, ...callbacks: GameCallback[]) {
  test(`pgn file - ${fileName}`, done => {
    const stream = createReadStream(`./data/${fileName}.pgn`, { encoding: 'utf-8' });
    const gameCallback = jest.fn((game: Game<PgnNodeData>, err: PgnError | undefined) => {
      if (err) stream.destroy(err);
      if (allValid) expect(err).toBe(undefined);
      callbacks.forEach(callback => {
        expect(callback(game, err)).toBe(undefined);
      });
    });
    const parser = new PgnParser(gameCallback, emptyHeaders);
    stream
      .on('data', (chunk) => parser.parse(chunk as string, { stream: true }))
      .on('close', () => {
        parser.parse('');
        expect(gameCallback).toHaveBeenCalledTimes(numberOfGames);
        done!();
      });
  });
}

test('make pgn', () => {
  const root = new Node<PgnNodeData>();
  expect(isChildNode(root)).toBe(false);

  const e4 = new ChildNode<PgnNodeData>({
    san: 'e4',
    nags: [7],
  });
  expect(isChildNode(e4)).toBe(true);
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
    '1. e4 $7 ( 1. e3 ) 1... e5 ( 1... e6 2. Nf3 { a comment } ) 2. c4 *\n',
  );
});

test('extend mainline', () => {
  const game: Game<PgnNodeData> = defaultGame(emptyHeaders);
  extend(game.moves.end(), 'e4 d5 a3 h6 Bg5'.split(' ').map(san => ({ san })));
  expect(makePgn(game)).toEqual('1. e4 d5 2. a3 h6 3. Bg5 *\n');
});

test('parse headers', () => {
  const games = parsePgn(
    [
      '[Black "black player"]',
      '[White " white  player   "]',
      '[Escaped "quote: \\", backslashes: \\\\\\\\, trailing text"]',
      '[Multiple "on"] [the "same line"]',
      '[Incomplete',
    ].join('\r\n'),
  );
  expect(games).toHaveLength(1);
  expect(games[0].headers.get('Black')).toBe('black player');
  expect(games[0].headers.get('White')).toBe(' white  player   ');
  expect(games[0].headers.get('Escaped')).toBe('quote: ", backslashes: \\\\, trailing text');
  expect(games[0].headers.get('Multiple')).toBe('on');
  expect(games[0].headers.get('the')).toBe('same line');
  expect(games[0].headers.get('Result')).toBe('*');
  expect(games[0].headers.get('Event')).toBe('?');
});

test('parse pgn', () => {
  const callback = jest.fn((game: Game<PgnNodeData>) => {
    expect(makePgn(game)).toBe('[Result "1-0"]\n\n1. e4 e5 2. Nf3 { foo\n  bar baz } 1-0\n');
  });
  const parser = new PgnParser(callback, emptyHeaders);
  parser.parse('1. e4 \ne5', { stream: true });
  parser.parse('\nNf3 {foo\n', { stream: true });
  parser.parse('  bar baz } 1-', { stream: true });
  parser.parse('', { stream: true });
  parser.parse('0', { stream: true });
  parser.parse('');
  expect(callback).toHaveBeenCalledTimes(1);
});

test('transform pgn', () => {
  interface TransformResult extends PgnNodeData {
    fen: string;
  }

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
    },
  );
  expect(res.children[0].data.fen).toBe('rnbqkbnr/pppppppp/8/8/P7/8/1PPPPPPP/RNBQKBNR b KQkq - 0 1');
  expect(res.children[0].children[0].data.fen).toBe('rnbqkbnr/1ppppppp/8/p7/P7/8/1PPPPPPP/RNBQKBNR w KQkq - 0 2');
  expect(res.children[1].data.fen).toBe('rnbqkbnr/pppppppp/8/8/1P6/8/P1PPPPPP/RNBQKBNR b KQkq - 0 1');
  expect(res.children[1].children[0].data.fen).toBe('rnbqkbnr/p1pppppp/8/1p6/1P6/8/P1PPPPPP/RNBQKBNR w KQkq - 0 2');
});

testPgnFile({
  fileName: 'kasparov-deep-blue-1997',
  numberOfGames: 6,
  allValid: true,
});
testPgnFile(
  {
    fileName: 'headers-and-moves-on-the-same-line',
    numberOfGames: 3,
    allValid: true,
  },
  game => {
    expect(game.headers.get('Variant')).toBe('Antichess');
    expect(Array.from(game.moves.mainline()).map(move => move.san)).toStrictEqual(['e3', 'e6', 'b4', 'Bxb4', 'Qg4']);
  },
);
testPgnFile(
  {
    fileName: 'pathological-headers',
    numberOfGames: 1,
    allValid: true,
  },
  game => {
    expect(game.headers.get('A')).toBe('b"');
    expect(game.headers.get('B')).toBe('b"');
    expect(game.headers.get('C')).toBe('A]]');
    expect(game.headers.get('D')).toBe('A]][');
    expect(game.headers.get('E')).toBe('"A]]["');
    expect(game.headers.get('F')).toBe('"A]]["\\');
    expect(game.headers.get('G')).toBe('"]');
  },
);

testPgnFile(
  {
    fileName: 'leading-whitespace',
    numberOfGames: 4,
    allValid: true,
  },
  game => {
    expect(Array.from(game.moves.mainline()).map(move => move.san)).toStrictEqual(['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']);
  },
);

test('tricky tokens', () => {
  const steps = Array.from(parsePgn('O-O-O !! 0-0-0# ??')[0].moves.mainline());
  expect(steps[0].san).toBe('O-O-O');
  expect(steps[0].nags).toEqual([3]);
  expect(steps[1].san).toBe('O-O-O#');
  expect(steps[1].nags).toEqual([4]);
});

test('en/em dash', () => {
  const game = parsePgn('14...0–0–0 15. O—O 1—0')[0];
  const steps = Array.from(game.moves.mainline());
  expect(game.headers.get('Result')).toBe('1-0');
  expect(steps[0].san).toBe('O-O-O');
  expect(steps[1].san).toBe('O-O');
});

test('parse comment', () => {
  expect(parseComment('prefix [%emt 1:02:03.4]')).toEqual({
    text: 'prefix',
    emt: 3723.4,
    shapes: [],
  });
  expect(parseComment('[%csl Ya1][%cal Ra1a1,Be1e2]commentary [%csl Gh8]')).toEqual({
    text: 'commentary',
    shapes: [
      { color: 'yellow', from: 0, to: 0 },
      { color: 'red', from: 0, to: 0 },
      { color: 'blue', from: 4, to: 12 },
      { color: 'green', from: 63, to: 63 },
    ],
  });
  expect(parseComment('[%eval -0.42] suffix')).toEqual({
    text: 'suffix',
    evaluation: { pawns: -0.42 },
    shapes: [],
  });
  expect(parseComment('prefix [%eval .99,23]')).toEqual({
    text: 'prefix',
    evaluation: { pawns: 0.99, depth: 23 },
    shapes: [],
  });
  expect(parseComment('[%eval #-3] suffix')).toEqual({
    text: 'suffix',
    evaluation: { mate: -3 },
    shapes: [],
  });
  expect(parseComment('[%csl Ga1]foo')).toEqual({
    text: 'foo',
    shapes: [{ from: 0, to: 0, color: 'green' }],
  });
  expect(parseComment('foo [%bar] [%csl Ga1] [%cal Ra1h1,Gb1b8] [%clk 3:25:45]').text).toBe('foo [%bar]');
});

test('make comment', () => {
  expect(
    makeComment({
      text: 'text',
      emt: 3723.4,
      evaluation: { pawns: 10 },
      clock: 1,
      shapes: [
        { color: 'yellow', from: 0, to: 0 },
        { color: 'red', from: 0, to: 1 },
        { color: 'red', from: 0, to: 2 },
      ],
    }),
  ).toBe('text [%csl Ya1] [%cal Ra1b1,Ra1c1] [%eval 10.00] [%emt 1:02:03.4] [%clk 0:00:01]');

  expect(
    makeComment({
      evaluation: { mate: -4, depth: 5 },
    }),
  ).toBe('[%eval #-4,5]');
});

test.each([
  '[%csl[%eval 0.2] Ga1]',
  '[%c[%csl [%csl Ga1[%csl Ga1][%[%csl Ga1][%cal[%csl Ga1]Ra1]',
  '[%csl Ga1][%cal Ra1h1,Gb1b8] foo [%clk 3:ê5: [%eval 450752] [%evaÿTæ<92>ÿÿ^?,7]',
])('roundtrip comment', str => {
  const comment = parseComment(str);
  const rountripped = parseComment(makeComment(comment));
  expect(comment).toEqual(rountripped);
});
