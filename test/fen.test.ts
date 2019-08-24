import { Result } from '../src/types';
import { isOk } from '../src/util';
import { parseFen, makeFen, INITIAL_FEN } from '../src/fen';

function unwrap<V, E>(result: Result<V, E>): V {
  if (isOk(result)) return result.value;
  else throw result.error;
}

test('parse fen', () => {
  const pos = unwrap(parseFen(INITIAL_FEN));
  expect(pos.board['e2']).toEqual({role: 'pawn', color: 'white'});
  expect(pos.turn).toBe('white');
  expect(pos.epSquare).toBeUndefined();
  expect(pos.halfmoves).toBe(0);
  expect(pos.fullmoves).toBe(1);
});

test('parse invalid fen', () => {
  expect(parseFen('').value).toBeUndefined();
  expect(parseFen('x').value).toBeUndefined();
  expect(parseFen('8/8/8/8/8/8/8/8[x] w - - 0 1').value).toBeUndefined();
  expect(parseFen('8/8/8/8/8/8/8/8 w - e3 a82 1').value).toBeUndefined();
  expect(parseFen('8/8/8/8/8/8/8/8 w - e6 0 -2').value).toBeUndefined();
  expect(parseFen('8/8/8/8/8/8/8/8 w - a99 0 1').value).toBeUndefined();
  expect(parseFen('8/8/8/8/8/8/8/8 w · - 0 1').value).toBeUndefined();
});

test('parse remaining checks', () => {
  const pos = unwrap(parseFen('8/8/8/8/8/8/8/8 w - - 1+2 12 42'));
  expect(pos.remainingChecks).toEqual({white: 1, black: 2});
  expect(pos.halfmoves).toBe(12);
  expect(pos.fullmoves).toBe(42);
});

test('parse lichess remaining checks', () => {
  const pos = unwrap(parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 1 2 +0+0'));
  expect(pos.remainingChecks).toEqual({white: 3, black: 3});
  expect(pos.halfmoves).toBe(1);
  expect(pos.fullmoves).toBe(2);
});

test('make fen', () => {
  const pos = parseFen(INITIAL_FEN).value!;
  expect(makeFen(pos)).toBe(INITIAL_FEN);
});

test('read and write crazyhouse fen', () => {
  const fen = 'rnbqk1nQ~/ppppp3/8/5p2/8/5N2/PPPPPPP1/RNBQKB1R/PPBRq b KQq - 0 6';
  const pos = unwrap(parseFen(fen));
  expect(pos).toBeDefined();
  expect(makeFen(pos, {promoted: true})).toBe(fen);
});

test('read and write xfen', () => {
  const fen = 'rn2k1r1/ppp1pp1p/3p2p1/5bn1/P7/2N2B2/1PPPPP2/2BNK1RR w Gkq - 4 11';
  const pos = parseFen(fen).value!;
  expect(pos).toBeDefined();
  expect(makeFen(pos)).toBe(fen);
});
