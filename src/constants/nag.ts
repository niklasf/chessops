/**
 * Enum representing Numeric Annotation Glyphs (NAG) values in chess.
 * NAGs are used to annotate chess moves with specific meanings.
 * For more info: https://www.saremba.de/chessgml/standards/pgn/pgn-complete.htm#c10
 */
export enum NAG_VALUES {
  ONE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
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
