import { COLORS, ROLES } from './types';
import { defined } from './util';
import { Board } from './board';
import { Setup, MaterialSide, Material, RemainingChecks } from './setup';

function rol32(n: number, left: number): number {
  return (n << left) | (n >>> (32 - left));
}

export function fxhash32(word: number, state = 0): number {
  return Math.imul(rol32(state, 5) ^ word, 0x9e3779b9);
}

export function hashBoard(board: Board, state = 0): number {
  state = fxhash32(board.white.lo, fxhash32(board.white.hi, state));
  for (const role of ROLES) state = fxhash32(board[role].lo, fxhash32(board[role].hi, state));
  return state;
}

export function hashMaterialSide(side: MaterialSide, state = 0): number {
  for (const role of ROLES) state = fxhash32(side[role], state);
  return state;
}

export function hashMaterial(material: Material, state = 0): number {
  for (const color of COLORS) state = hashMaterialSide(material[color], state);
  return state;
}

export function hashRemainingChecks(checks: RemainingChecks, state = 0): number {
  return fxhash32(checks.white, fxhash32(checks.black, state));
}

export function hashSetup(setup: Setup, state = 0): number {
  state = hashBoard(setup.board, state);
  if (setup.pockets) state = hashMaterial(setup.pockets, state);
  if (setup.turn === 'white') state = fxhash32(1, state);
  state = fxhash32(setup.unmovedRooks.lo, fxhash32(setup.unmovedRooks.hi, state));
  if (defined(setup.epSquare)) state = fxhash32(setup.epSquare, state);
  if (setup.remainingChecks) state = hashRemainingChecks(setup.remainingChecks, state);
  return state;
}
