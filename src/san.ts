import { isDrop, Uci } from './types';
import { Position } from './chess';

export function makeSanAndPlay(pos: Position, uci: Uci): string {
  if (isDrop(uci)) {

  }
  pos.play(uci);
  return ''; // TODO
}

export function makeSan(pos: Position, uci: Uci): string {
  return makeSanAndPlay(pos.clone(), uci);
}
