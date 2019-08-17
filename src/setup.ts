import { Setup, Position } from './types';

export function setup(setup: Setup): Position | undefined {
  return {
    rules: 'chess',
    ...setup
  };
}
