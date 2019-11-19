import { parseUci, makeUci } from '../src/util';

test('parse uci', () => {
  expect(parseUci('a1a2')).toEqual({ from: 0, to: 8 });
  expect(parseUci('h7h8k')).toEqual({ from: 55, to: 63, promotion: 'king' });
  expect(parseUci('P@h1')).toEqual({ role: 'pawn', to: 7 });
});

test('make uci', () => {
  expect(makeUci({ role: 'queen', to: 1 })).toBe('Q@b1');
  expect(makeUci({ from: 2, to: 3 })).toBe('c1d1');
  expect(makeUci({ from: 0, to: 0, promotion: 'pawn' })).toBe('a1a1p');
});
