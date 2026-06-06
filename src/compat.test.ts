import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Chess } from './chess.js';
import { chessgroundDests, scalachessCharPair } from './compat.js';
import { parseFen } from './fen.js';
import { parseUci } from './util.js';

test('chessground dests with Kh8', () => {
  const setup = parseFen('r1bq1r2/3n2k1/p1p1pp2/3pP2P/8/PPNB2Q1/2P2P2/R3K3 b Q - 1 22').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  const dests = chessgroundDests(pos);
  assert.ok(dests.get('g7')!.includes('h8'));
  assert.ok(!dests.get('g7')!.includes('g8'));
});

test('chessground dests with regular castle', () => {
  const setup = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1').unwrap();
  const wtm = Chess.fromSetup(setup).unwrap();
  assert.deepStrictEqual(chessgroundDests(wtm).get('e1')!.sort(), ['a1', 'c1', 'd1', 'd2', 'e2', 'f1', 'f2', 'g1', 'h1']);
  assert.strictEqual(chessgroundDests(wtm).get('e8'), undefined);

  setup.turn = 'black';
  const btm = Chess.fromSetup(setup).unwrap();
  assert.deepStrictEqual(chessgroundDests(btm).get('e8')!.sort(), ['a8', 'c8', 'd7', 'd8', 'e7', 'f7', 'f8', 'g8', 'h8']);
  assert.strictEqual(chessgroundDests(btm).get('e1'), undefined);
});

test('chessground dests with chess960 castle', () => {
  const setup = parseFen('rk2r3/pppbnppp/3p2n1/P2Pp3/4P2q/R5NP/1PP2PP1/1KNQRB2 b Kkq - 0 1').unwrap();
  const pos = Chess.fromSetup(setup).unwrap();
  assert.deepStrictEqual(chessgroundDests(pos).get('b8')!.sort(), ['a8', 'c8', 'e8']);
});

test('uci char pair', () => {
  assert.strictEqual(scalachessCharPair(parseUci('a1b1')!), '#$');
  assert.strictEqual(scalachessCharPair(parseUci('a1a2')!), '#+');
  assert.strictEqual(scalachessCharPair(parseUci('h7h8')!), 'Zb');

  assert.strictEqual(scalachessCharPair(parseUci('b7b8q')!), 'Td');
  assert.strictEqual(scalachessCharPair(parseUci('b7c8q')!), 'Te');
  assert.strictEqual(scalachessCharPair(parseUci('b7c8n')!), 'T}');

  assert.strictEqual(scalachessCharPair(parseUci('P@a1')!), '#\x8f');
  assert.strictEqual(scalachessCharPair(parseUci('Q@h8')!), 'b\x8b');
});
