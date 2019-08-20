import { opposite, nthIndexOf } from '../src/util';

test('opposite color', () => {
  expect(opposite('white')).toBe('black');
  expect(opposite('black')).toBe('white');
});

test('nth index', () => {
  expect(nthIndexOf('aa', 'b', 0)).toBe(-1);
  expect(nthIndexOf('aa', 'b', 1)).toBe(-1);

  expect(nthIndexOf('aa', 'a', 0)).toBe(0);
  expect(nthIndexOf('aa', 'a', 1)).toBe(1);
  expect(nthIndexOf('aa', 'a', 2)).toBe(-1);
});
