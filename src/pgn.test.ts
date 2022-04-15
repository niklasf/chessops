import { makePgn, Node, ChildNode, PgnNodeData } from './pgn.js';

test('make pgn', () => {
  const root = new Node<PgnNodeData>();

  const e4 = new ChildNode({
    san: 'e4',
  });
  root.children.push(e4);

  const e5 = new ChildNode({
    san: 'e5',
  });
  e4.children.push(e5);

  const c4 = new ChildNode({
    san: 'c4',
  });
  e5.children.push(c4);

  expect(makePgn({ headers: new Map(), moves: root })).toEqual('1. e4 e5 2. c4 *');
});
