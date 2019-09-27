import { Board } from '../src/board';

test('empty board', () => {
  expect(new Board().get(0)).toBeUndefined();
});
