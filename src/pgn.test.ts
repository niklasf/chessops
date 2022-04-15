import { makePgn, Node, ChildNode, PgnNodeData, PgnParser } from './pgn.js';

test('make pgn', () => {
  const root = new Node<PgnNodeData>();

  const e4 = new ChildNode<PgnNodeData>({
    san: 'e4',
    nags: [7],
  });
  const e3 = new ChildNode({ san: 'e3' });
  root.children.push(e4);
  root.children.push(e3);

  const e5 = new ChildNode({
    san: 'e5',
  });
  const e6 = new ChildNode({ san: 'e6' });
  e4.children.push(e5);
  e4.children.push(e6);

  const nf3 = new ChildNode({
    san: 'Nf3',
    comment: 'a comment',
  });
  e6.children.push(nf3);

  const c4 = new ChildNode({ san: 'c4' });
  e5.children.push(c4);

  expect(makePgn({ headers: new Map(), moves: root })).toEqual(
    '1. e4 $7 ( 1. e3 ) 1... e5 ( 1... e6 2. Nf3 { a comment } ) 2. c4 *'
  );
});

test('parse pgn', () => {
  const parser = new PgnParser(() => {});
  parser.parse('1. e4 e5');
  expect(true).toBe(false);
});
