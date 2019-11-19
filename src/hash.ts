import { COLORS, ROLES } from './types';
import { defined } from './util';
import { Board } from './board';
import { Setup, MaterialSide, Material, RemainingChecks } from './setup';

function rol32(n: number, left: number): number {
  return (n << left) | (n >>> (32 - left));
}

export function fxhash(word: number, state: number = 0) {
  return Math.imul(rol32(state, 5) ^ word, 0x9e3779b9);
}

export function hashBoard(board: Board, state: number = 0): number {
  state = fxhash(board.promoted.lo, fxhash(board.promoted.hi, state));
  state = fxhash(board.white.lo, fxhash(board.white.hi, state));
  for (const role of ROLES) state = fxhash(board[role].lo, fxhash(board[role].hi, state));
  return state;
}

export function hashMaterialSide(side: MaterialSide, state: number = 0): number {
  for (const role of ROLES) state = fxhash(side[role], state);
  return state;
}

export function hashMaterial(material: Material, state: number = 0): number {
  for (const color of COLORS) state = hashMaterialSide(material[color], state);
  return state;
}

export function hashRemainingChecks(checks: RemainingChecks, state: number = 0): number {
  return fxhash(checks.white, fxhash(checks.black, state));
}

export function hashSetup(setup: Setup, state: number = 0): number {
  state = hashBoard(setup.board, state);
  if (setup.pockets) state = hashMaterial(setup.pockets, state);
  if (setup.turn == 'white') state = fxhash(1, state);
  state = fxhash(setup.unmovedRooks.lo, fxhash(setup.unmovedRooks.hi, state));
  if (defined(setup.epSquare)) state = fxhash(setup.epSquare, state);
  if (setup.remainingChecks) state = hashRemainingChecks(setup.remainingChecks, state);
  return state;
}
