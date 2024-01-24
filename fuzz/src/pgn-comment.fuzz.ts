import { Comment, CommentShape, isMate, isPawns, makeComment, parseComment } from 'chessops/pgn';

const mate = (comment: Comment): number | undefined =>
  comment.evaluation && isMate(comment.evaluation) ? comment.evaluation.mate : undefined;

const pawns = (comment: Comment): number | undefined =>
  comment.evaluation && isPawns(comment.evaluation) ? comment.evaluation.pawns : undefined;

const compareShape = (left: CommentShape, right: CommentShape): number => {
  if (left.from !== right.from) return left.from - right.from;
  if (left.to !== right.to) return left.to - right.to;
  if (left.color < right.color) return -1;
  if (left.color > right.color) return 1;
  return 0;
};

export const fuzz = (data: Buffer): void => {
  const comment = parseComment(data.toString());
  const rountripped = parseComment(makeComment(comment));
  if (comment.text !== rountripped.text) throw 'text not equal';
  if (mate(comment) !== mate(rountripped)) throw 'mate not equal';
  if (pawns(comment) !== pawns(rountripped)) throw 'pawns not equal';
  if (comment.emt !== rountripped.emt) throw 'emt not equal';
  if (comment.clock !== rountripped.clock) throw 'clock not equal';
  if (comment.shapes.length !== rountripped.shapes.length) throw 'shapes not equal';
  comment.shapes.sort(compareShape);
  rountripped.shapes.sort(compareShape);
  for (let i = 0; i < comment.shapes.length; i++) {
    if (compareShape(comment.shapes[i], rountripped.shapes[i])) throw 'shape not equal';
  }
};
