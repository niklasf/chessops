import { Comment, parseComment, makeComment, isMate, isPawns } from 'chessops/pgn';

const mate = (comment: Comment): number | undefined =>
  comment.evaluation && isMate(comment.evaluation) ? comment.evaluation.mate : undefined;

const pawns = (comment: Comment): number | undefined =>
  comment.evaluation && isPawns(comment.evaluation) ? comment.evaluation.pawns : undefined;

export const fuzz = (data: Buffer): void => {
  const comment = parseComment(data.toString());
  const rountripped = parseComment(makeComment(comment));
  if (comment.text !== rountripped.text) throw 'text not equal';
  if (comment.shapes.length !== rountripped.shapes.length) throw 'shapes not equal';
  for (let i = 0; i < comment.shapes.length; i++) {
    const left = comment.shapes[i];
    const right = rountripped.shapes[i];
    if (left.from !== right.from) throw 'shape from not equal';
    if (left.to !== right.to) throw 'shape to not equal';
    if (left.color !== right.color) throw 'shape color not equal';
  }
  if (mate(comment) !== mate(rountripped)) throw 'mate not equal';
  if (pawns(comment) !== pawns(rountripped)) throw 'pawns not equal';
  if (comment.emt !== rountripped.emt) throw 'emt not equal';
  if (comment.clock !== rountripped.clock) throw 'clock not equal';
};
