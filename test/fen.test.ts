import { read } from '../src/fen';

test('read fen', () => {
  const pos = read('chess', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')!;
  expect(pos).toBeDefined();
  expect(pos.turn).toBe('white');
});
