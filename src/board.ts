import { Square, Color, Role, Piece, ROLES } from './types';
import { SquareSet } from './squareSet';

export class Board {
  private occupied: SquareSet = SquareSet.empty();
  private promoted: SquareSet = SquareSet.empty();
  private white: SquareSet = SquareSet.empty();
  private black: SquareSet = SquareSet.empty();
  private pawn: SquareSet = SquareSet.empty();
  private knight: SquareSet = SquareSet.empty();
  private bishop: SquareSet = SquareSet.empty();
  private rook: SquareSet = SquareSet.empty();
  private queen: SquareSet = SquareSet.empty();
  private king: SquareSet = SquareSet.empty();

  private getColor(square: Square): Color | undefined {
    if (this.white.has(square)) return 'white';
    else if (this.black.has(square)) return 'black';
    else return;
  }

  get(square: Square): Piece | undefined {
    const color = this.getColor(square);
    if (!color) return;
    const promoted = this.promoted.has(square);
    for (const role of ROLES) {
      if (this[role].has(square)) return { color, promoted, role };
    }
    return;
  }
}
