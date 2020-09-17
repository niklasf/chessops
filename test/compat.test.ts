import { parseUci } from '../src/util';
import { parseFen } from '../src/fen';
import { Chess } from '../src/chess';
import { chessgroundDests, scalachessCharPair } from '../src/compat';

test('chessground dests with Kh8', () => {
  const setup = parseFen('r1bq1r2/3n2k1/p1p1pp2/3pP2P/8/PPNB2Q1/2P2P2/R3K3 b Q - 1 22').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const dests = chessgroundDests(pos);
  expect(dests.get('g7')).toContain('h8');
  expect(dests.get('g7')).not.toContain('g8');
});

test('chessground dests with chess960 castle', () => {
  const setup = parseFen('rk2r3/pppbnppp/3p2n1/P2Pp3/4P2q/R5NP/1PP2PP1/1KNQRB2 b Kkq - 0 1').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  expect(chessgroundDests(pos).get('b8')).toEqual(['a8', 'c8', 'e8']);
});

test('uci char pair', () => {
  // regular moves
  expect(scalachessCharPair(parseUci('a1b1')!)).toBe('#$');
  expect(scalachessCharPair(parseUci('a1a2')!)).toBe('#+');
  expect(scalachessCharPair(parseUci('h7h8')!)).toBe('Zb');

  // promotions
  expect(scalachessCharPair(parseUci('b7b8q')!)).toBe('Td');
  expect(scalachessCharPair(parseUci('b7c8q')!)).toBe('Te');
  expect(scalachessCharPair(parseUci('b7c8n')!)).toBe('T}');

  // drops
  expect(scalachessCharPair(parseUci('P@a1')!)).toBe('#\x8f');
  expect(scalachessCharPair(parseUci('Q@h8')!)).toBe('b\x8b');
});
