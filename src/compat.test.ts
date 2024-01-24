import { expect, test } from '@jest/globals';
import { Chess } from './chess.js';
import { chessgroundDests, scalachessCharPair } from './compat.js';
import { parseFen } from './fen.js';
import { parseUci } from './util.js';

test('chessground dests with Kh8', () => {
  const setup = parseFen('r1bq1r2/3n2k1/p1p1pp2/3pP2P/8/PPNB2Q1/2P2P2/R3K3 b Q - 1 22').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const dests = chessgroundDests(pos);
  expect(dests.get('g7')).toContain('h8');
  expect(dests.get('g7')).not.toContain('g8');
});

test('chessground dests with regular castle', () => {
  const setup = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1').unwrap();
  const wtm = Chess.fromSetup(setup).unwrap();
  expect(chessgroundDests(wtm).get('e1')!.sort()).toEqual(['a1', 'c1', 'd1', 'd2', 'e2', 'f1', 'f2', 'g1', 'h1']);
  expect(chessgroundDests(wtm).get('e8')).toBeUndefined();

  setup.turn = 'black';
  const btm = Chess.fromSetup(setup).unwrap();
  expect(chessgroundDests(btm).get('e8')!.sort()).toEqual(['a8', 'c8', 'd7', 'd8', 'e7', 'f7', 'f8', 'g8', 'h8']);
  expect(chessgroundDests(btm).get('e1')).toBeUndefined();
});

test('chessground dests with chess960 castle', () => {
  const setup = parseFen('rk2r3/pppbnppp/3p2n1/P2Pp3/4P2q/R5NP/1PP2PP1/1KNQRB2 b Kkq - 0 1').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  expect(chessgroundDests(pos).get('b8')!.sort()).toEqual(['a8', 'c8', 'e8']);
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
