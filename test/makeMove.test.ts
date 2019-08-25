import { unwrap } from '../src/fp';
import { parseFen, makeFen, INITIAL_FEN } from '../src/fen';
import { setup } from '../src/setup';
import { makeMove } from '../src/makeMove';

test('setup initial position', () => {
  // TODO: reconsider ep squares
  const pos = unwrap(setup(unwrap(parseFen(INITIAL_FEN))));
  makeMove(pos, 'e2e4');
  expect(makeFen(pos)).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
  makeMove(pos, 'e7e5');
  expect(makeFen(pos)).toBe('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2');
  makeMove(pos, 'f1c4');
  expect(makeFen(pos)).toBe('rnbqkbnr/pppp1ppp/8/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR b KQkq - 1 2');
  makeMove(pos, 'b8c6');
  expect(makeFen(pos)).toBe('r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/8/PPPP1PPP/RNBQK1NR w KQkq - 2 3');
  makeMove(pos, 'c4f7');
  expect(makeFen(pos)).toBe('r1bqkbnr/pppp1Bpp/2n5/4p3/4P3/8/PPPP1PPP/RNBQK1NR b KQkq - 0 3');
  makeMove(pos, 'e8f7');
  expect(makeFen(pos)).toBe('r1bq1bnr/pppp1kpp/2n5/4p3/4P3/8/PPPP1PPP/RNBQK1NR w KQ - 0 4');
});

test('king capturing on backrank', () => {
  const pos = unwrap(setup(unwrap(parseFen('rnbqkbr1/pppp1ppp/8/4p3/P2PPB2/3Q4/1PP2PPP/RN2KnNR w KQq - 0 1'))));
  makeMove(pos, 'e1f1');
  expect(makeFen(pos)).toBe('rnbqkbr1/pppp1ppp/8/4p3/P2PPB2/3Q4/1PP2PPP/RN3KNR b q - 0 1');
});

test('en passant capture', () => {
  const pos = unwrap(setup(unwrap(parseFen('rnbqk1nr/p2p3p/1p5b/2pPppp1/8/P7/1PPQPPPP/RNB1KBNR w KQkq c6 0 1'))));
  makeMove(pos, 'd5c6');
  expect(makeFen(pos)).toBe('rnbqk1nr/p2p3p/1pP4b/4ppp1/8/P7/1PPQPPPP/RNB1KBNR b KQkq - 0 1');
});

test('long castle', () => {
  const pos = unwrap(setup(unwrap(parseFen('rnbq1br1/p2p4/1pp2pkp/1P1Np1p1/3Pn3/P2N3P/2PB4/R3KBQR w KQ - 0 1'))));
  makeMove(pos, 'e1c1');
  expect(makeFen(pos)).toBe('rnbq1br1/p2p4/1pp2pkp/1P1Np1p1/3Pn3/P2N3P/2PB4/2KR1BQR b - - 1 1');
});
