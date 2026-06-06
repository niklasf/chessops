import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createReadStream } from 'node:fs';
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
  test(`pgn file - ${fileName}`, () => new Promise<void>((resolve, reject) => {
    const stream = createReadStream(`./data/${fileName}.pgn`, { encoding: 'utf-8' });
    let callCount = 0;
    const gameCallback = (game: Game<PgnNodeData>, err: PgnError | undefined) => {
      callCount++;
      if (err) stream.destroy(err);
      if (allValid) assert.strictEqual(err, undefined);
      for (const callback of callbacks) {
        assert.strictEqual(callback(game, err), undefined);
      }
    };
    const parser = new PgnParser(gameCallback, emptyHeaders);
    stream
      .on('data', (chunk) => parser.parse(chunk as string, { stream: true }))
      .on('close', () => {
        parser.parse('');
        assert.strictEqual(callCount, numberOfGames);
        resolve();
      })
      .on('error', reject);
  }));
}

test('make pgn', () => {
  const root = new Node<PgnNodeData>();
  assert.strictEqual(isChildNode(root), false);

  const e4 = new ChildNode<PgnNodeData>({
    san: 'e4',
    nags: [7],
  });
  assert.strictEqual(isChildNode(e4), true);
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

  assert.strictEqual(
    makePgn({ headers: emptyHeaders(), moves: root }),
    '1. e4 $7 ( 1. e3 ) 1... e5 ( 1... e6 2. Nf3 { a comment } ) 2. c4 *\n',
  );
});

test('extend mainline', () => {
  const game: Game<PgnNodeData> = defaultGame(emptyHeaders);
  extend(game.moves.end(), 'e4 d5 a3 h6 Bg5'.split(' ').map(san => ({ san })));
  assert.strictEqual(makePgn(game), '1. e4 d5 2. a3 h6 3. Bg5 *\n');
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
  assert.strictEqual(games.length, 1);
  assert.strictEqual(games[0].headers.get('Black'), 'black player');
  assert.strictEqual(games[0].headers.get('White'), ' white  player   ');
  assert.strictEqual(games[0].headers.get('Escaped'), 'quote: ", backslashes: \\\\, trailing text');
  assert.strictEqual(games[0].headers.get('Multiple'), 'on');
  assert.strictEqual(games[0].headers.get('the'), 'same line');
  assert.strictEqual(games[0].headers.get('Result'), '*');
  assert.strictEqual(games[0].headers.get('Event'), '?');
});

test('parse pgn', () => {
  let callCount = 0;
  const callback = (game: Game<PgnNodeData>) => {
    callCount++;
    assert.strictEqual(makePgn(game), '[Result "1-0"]\n\n1. e4 e5 2. Nf3 { foo\n  bar baz } 1-0\n');
  };
  const parser = new PgnParser(callback, emptyHeaders);
  parser.parse('1. e4 \ne5', { stream: true });
  parser.parse('\nNf3 {foo\n', { stream: true });
  parser.parse('  bar baz } 1-', { stream: true });
  parser.parse('', { stream: true });
  parser.parse('0', { stream: true });
  parser.parse('');
  assert.strictEqual(callCount, 1);
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
  assert.strictEqual(res.children[0].data.fen, 'rnbqkbnr/pppppppp/8/8/P7/8/1PPPPPPP/RNBQKBNR b KQkq - 0 1');
  assert.strictEqual(res.children[0].children[0].data.fen, 'rnbqkbnr/1ppppppp/8/p7/P7/8/1PPPPPPP/RNBQKBNR w KQkq - 0 2');
  assert.strictEqual(res.children[1].data.fen, 'rnbqkbnr/pppppppp/8/8/1P6/8/P1PPPPPP/RNBQKBNR b KQkq - 0 1');
  assert.strictEqual(res.children[1].children[0].data.fen, 'rnbqkbnr/p1pppppp/8/1p6/1P6/8/P1PPPPPP/RNBQKBNR w KQkq - 0 2');
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
    assert.strictEqual(game.headers.get('Variant'), 'Antichess');
    assert.deepStrictEqual(Array.from(game.moves.mainline()).map(move => move.san), ['e3', 'e6', 'b4', 'Bxb4', 'Qg4']);
  },
);
testPgnFile(
  {
    fileName: 'pathological-headers',
    numberOfGames: 1,
    allValid: true,
  },
  game => {
    assert.strictEqual(game.headers.get('A'), 'b"');
    assert.strictEqual(game.headers.get('B'), 'b"');
    assert.strictEqual(game.headers.get('C'), 'A]]');
    assert.strictEqual(game.headers.get('D'), 'A]][');
    assert.strictEqual(game.headers.get('E'), '"A]]["');
    assert.strictEqual(game.headers.get('F'), '"A]]["\\');
    assert.strictEqual(game.headers.get('G'), '"]');
  },
);

testPgnFile(
  {
    fileName: 'leading-whitespace',
    numberOfGames: 4,
    allValid: true,
  },
  game => {
    assert.deepStrictEqual(Array.from(game.moves.mainline()).map(move => move.san), ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5']);
  },
);

test('tricky tokens', () => {
  const steps = Array.from(parsePgn('O-O-O !! 0-0-0# ??')[0].moves.mainline());
  assert.strictEqual(steps[0].san, 'O-O-O');
  assert.deepStrictEqual(steps[0].nags, [3]);
  assert.strictEqual(steps[1].san, 'O-O-O#');
  assert.deepStrictEqual(steps[1].nags, [4]);
});

test('en/em dash', () => {
  const game = parsePgn('14...0–0–0 15. O—O 1—0')[0];
  const steps = Array.from(game.moves.mainline());
  assert.strictEqual(game.headers.get('Result'), '1-0');
  assert.strictEqual(steps[0].san, 'O-O-O');
  assert.strictEqual(steps[1].san, 'O-O');
});

test('parse comment', () => {
  assert.deepStrictEqual(parseComment('prefix [%emt 1:02:03.4]'), {
    text: 'prefix',
    emt: 3723.4,
    clock: undefined,
    evaluation: undefined,
    shapes: [],
  });
  assert.deepStrictEqual(parseComment('[%csl Ya1][%cal Ra1a1,Be1e2]commentary [%csl Gh8]'), {
    text: 'commentary',
    emt: undefined,
    clock: undefined,
    evaluation: undefined,
    shapes: [
      { color: 'yellow', from: 0, to: 0 },
      { color: 'red', from: 0, to: 0 },
      { color: 'blue', from: 4, to: 12 },
      { color: 'green', from: 63, to: 63 },
    ],
  });
  assert.deepStrictEqual(parseComment('[%eval -0.42] suffix'), {
    text: 'suffix',
    emt: undefined,
    clock: undefined,
    evaluation: { pawns: -0.42, depth: undefined },
    shapes: [],
  });
  assert.deepStrictEqual(parseComment('prefix [%eval .99,23]'), {
    text: 'prefix',
    emt: undefined,
    clock: undefined,
    evaluation: { pawns: 0.99, depth: 23 },
    shapes: [],
  });
  assert.deepStrictEqual(parseComment('[%eval #-3] suffix'), {
    text: 'suffix',
    emt: undefined,
    clock: undefined,
    evaluation: { mate: -3, depth: undefined },
    shapes: [],
  });
  assert.deepStrictEqual(parseComment('[%csl Ga1]foo'), {
    text: 'foo',
    emt: undefined,
    clock: undefined,
    evaluation: undefined,
    shapes: [{ from: 0, to: 0, color: 'green' }],
  });
  assert.strictEqual(parseComment('foo [%bar] [%csl Ga1] [%cal Ra1h1,Gb1b8] [%clk 3:25:45]').text, 'foo [%bar]');
});

test('make comment', () => {
  assert.strictEqual(
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
    'text [%csl Ya1] [%cal Ra1b1,Ra1c1] [%eval 10.00] [%emt 1:02:03.4] [%clk 0:00:01]',
  );

  assert.strictEqual(
    makeComment({
      evaluation: { mate: -4, depth: 5 },
    }),
    '[%eval #-4,5]',
  );
});

for (const str of [
  '[%csl[%eval 0.2] Ga1]',
  '[%c[%csl [%csl Ga1[%csl Ga1][%[%csl Ga1][%cal[%csl Ga1]Ra1]',
  '[%csl Ga1][%cal Ra1h1,Gb1b8] foo [%clk 3:ê5: [%eval 450752] [%evaÿTæ<92>ÿÿ^?,7]',
]) {
  test(`roundtrip comment: ${str}`, () => {
    const comment = parseComment(str);
    const rountripped = parseComment(makeComment(comment));
    assert.deepStrictEqual(comment, rountripped);
  });
}
