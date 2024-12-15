/**
 * Enum representing Numeric Annotation Glyphs (NAG) values in chess.
 * NAGs are used to annotate chess moves with specific meanings.
 * For more info: https://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c10
 */
export enum NAG_VALUES {
  GOOD_MOVE = 1,
  POOR_MOVE = 2,
  BRILLIANT_MOVE = 3,
  BLUNDER_MOVE = 4,
  SPECULATIVE_MOVE = 5,
  DUBIOUS_MOVE = 6,
}

/**
 * Enum representing the interpretations of Numeric Annotation Glyphs (NAG) in chess.
 * These interpretations provide a shorthand notation for evaluating the quality of moves.
 * For more info: https://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c10
 */
export enum NAG_INTERPRETATIONS {
  GOOD_MOVE = '!',
  POOR_MOVE = '?',
  BRILLIANT_MOVE = '!!',
  BLUNDER_MOVE = '??',
  SPECULATIVE_MOVE = '!?',
  DUBIOUS_MOVE = '?!',
}

/**
 * Map combining NAG interpretations with their respective values.
 */
export const NAG_INTERPRETATION_MAP = new Map<NAG_INTERPRETATIONS, NAG_VALUES>([
  [NAG_INTERPRETATIONS.GOOD_MOVE, NAG_VALUES.GOOD_MOVE],
  [NAG_INTERPRETATIONS.POOR_MOVE, NAG_VALUES.POOR_MOVE],
  [NAG_INTERPRETATIONS.BRILLIANT_MOVE, NAG_VALUES.BRILLIANT_MOVE],
  [NAG_INTERPRETATIONS.BLUNDER_MOVE, NAG_VALUES.BLUNDER_MOVE],
  [NAG_INTERPRETATIONS.SPECULATIVE_MOVE, NAG_VALUES.SPECULATIVE_MOVE],
  [NAG_INTERPRETATIONS.DUBIOUS_MOVE, NAG_VALUES.DUBIOUS_MOVE],
]);
