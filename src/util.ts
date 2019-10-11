import { Color } from './types';

export function opposite(color: Color): Color {
  return color == 'white' ? 'black' : 'white';
}
