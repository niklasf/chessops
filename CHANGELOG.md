# Changelog for chessops

## v0.14.2

- `chessops/pgn`: Allow and normalize en-dash and em-dash in `Result` header,
  result marker, and castling notation.

## v0.14.1

- Set `"type": "module"` in `package.json`.

## v0.14.0

- Change package layout to hybrid cjs/esm with subpath exports.
- `chessops/pgn`:
  - Add `Node.mainlineNodes()`.
  - Add `node.end()`.
  - Add `extend()`.

## v0.13.0

- `Position.fromSetup()` now only checks minimum validity requirements.
  Remove `FromSetupOpts`. In particular:
  - As before, bad `setup.castlingRights` (formerly `setup.unmovedRooks`)
    are silently dropped. But note changes to FEN parsing.
  - As before, a bad `setup.epSquare` is silently dropped.
  - As before, non-standard material is allowed.
    Use `isStandardMaterial()` if strict validation is needed.
  - As before, the side to move cannot be giving check.
  - Unlike before, some other positions involving impossibly many checkers
    are no longer rejected. Use `isImpossibleCheck()` if strict validation
    is needed. This is more consistent with the other relaxed choices above,
    more consistent with Lichess's behavior, and aids tree-shaking.
- The FEN parser and writer now preserve syntactically valid castling rights
  even if there is no matching rook or king. Rename `unmovedRooks` to
  `castlingRights`.
- Add `{Material,MaterialSide}.subtract()`.
- Add `squareFromCoords()` to `chessops/util`.
- Fix impossible checker validation for `Atomic`.
- Fix en passant in some impossible check situations.

## v0.12.8

Marked as deprecated on npm. Accidentally included semver-breaking changes.

## v0.12.7

- Implement insufficient material detection for `Horde`.

## v0.12.6

- Add `rookCastlesTo` to `chessops/util`.

## v0.12.5

- Changes to `chessops/pgn`:
  - Support multiple PGN headers and move text all on the same line.
  - Reject `%eval` with more than 2 decimals or more than 5 digits.
  - Reject `%clk` and `%emt` with more than 3 decimals.

## v0.12.4

- Support eval PGN comment annotations.
- Fix PGN comment roundtrip by leaving additional spaces in the text.

## v0.12.3

- Fix parsing X-FEN with file notation for black castling rights. Bug
  discovered using new fuzz-testing suite.
- Improvements for `chessops/pgn`:
  - Add `defaultGame()`.
  - Add `isChildNode()`.
  - Add `parseComment()` and `makeComment()`.
  - Add `Box` for wrapping immutable context in transformations.

## v0.12.2

- Detect Antichess insufficient material with two knights.

## v0.12.1

- Add more aliases for PGN `Variant` headers.
- Fix en passant in Antichess.

## v0.12.0

- Major performance optimizations (e.g. 40% speedup in read-pgn example).
- Refactor with tree-shaking in mind, for major code size improvements
  depending on the application. Do not find a method? It might now be
  a free-standing function.
- Chess variants directly extend `Position` instead of `Chess`.
- Remove `Board.horde()` and `Board.racingKings()`.
- Rename `Castles.discardSize()` to `discardColor()`.

## v0.11.0

- Introduce `chessops/pgn` module.
- Remove `chessops/hash` module.
- Fix capturing promoted Crazyhouse pieces.
- Rename `Material.count()` and `MaterialSide.count()` to `size()`.
  Add `Material.count(role)`.
- Add `Position.isStandardMaterial()`.
- Remove `FenOpts.shredder`.
- Track promoted pieces only in Crazyhouse. Remove `FenOpts.promoted`.
- Let `parseSan()` require the original file for pawn captures
  (good: `exd5`, bad: `d5` if capturing).
- Target ES2018.

## v0.10.5

- Check that en passant square and checkers are not in conflict.
- Accept castling flags in FEN in any order, duplicate flags, but no more
  than two distinct castling rights per side.
- Accept multiple spaces and underscores as FEN field seperators.

## v0.10.4

- Add `.js` ending to relative imports (required for ES modules).
- Introduce `FromSetupOpts` with `ignoreImpossibleCheck`.

## v0.10.3

- Fix `ThreeCheck` not updating remaining checks.

## v0.10.2

- Fix `Atomic` position validation, where the remaining king is attacked, but
  the other king has exploded.

## v0.10.1

- Export `RacingKings` from `chessops/variant`.
- Export `FenOpts` from `chessops/fen`.

## v0.10.0

- Renamed `lichessVariantRules()` to `lichessRules()`, added the inverse
  function `lichessVariant()`.

## v0.9.0

- Now built as ES module (instead of CommonJS).
- Made `kingCastlesTo()` public.

## v0.8.1

- Moved `FILES` and `RANKS` from `chessops/util` to `chessops/types`, renamed
  to `FILE_NAMES` and `RANK_NAMES`, and added corresponding `FileName` and
  `RankName` string literal types.
- Also reject positions where a checker is aligned with the en passant square
  and the king as `IllegalSetup.ImpossibleCheck`.

## v0.7.4

- Added `IllegalSetup.ImpossibleCheck` and will now reject setups with too many
  checkers or aligned sliding checkers. These positions are impossible to reach
  and Stockfish does not work properly on them.
- Added `equals()` to most classes, `Board.equalsIgnorePromoted()`, and
  `Position.equalsIgnoreMoves()`.

## v0.7.3

- Fixed `parseSan()` to properly interpret moves like `bxc6` as a pawn capture
  instead of a bishop move. Lowercase piece letters are no longer accepted,
  e.g., `nf3` must be `Nf3`.
- Fixed `Position.isLegal()` was not accepting the king-moves-two-squares
  encoding for castling castling moves.

## v0.7.2

- Fixed insufficient material with same-color bishops on both sides.

## v0.7.1

- Fixed `parseSan` with regard to pawn captures, promotions and some
  disambiguated moves.

## v0.7.0

- Added `parseSan()`.
- Added `chessgroundMove()` compatibility.
- Added `FILES` and `RANKS` constants.
- Fix spelling of export: `transfrom()` -> `transform()`.
- Added `{MaterialSide,Material}.{fromBoard,add}()`.
- Clamp move counters in FEN export for guaranteed reparsability.
- Reject promotions not on backrank.
- Micro-optimizations.

## v0.6.0

- Updated `chessgroundDests()` for chessground 7.8 compatibility.
- Added `chessgroundDests(pos, {chess960: true})` to generate only
  Chess960-style castling moves.
- Renamed `scalachessId()` to `scalachessCharPair()`.

## v0.5.0

- Removed `util.squareDist()`.
- Further optimized initialization.
- Packaged source map.

## v0.4.2

- Performance optimizations, significantly faster initilization.
- Added `SquareSet.withoutFirst()`.
- Bumped target to ES2016.

## v0.4.1

- Added `lichessVariantRules()` compatibility.

## v0.4.0

- Renamed `Uci` to `Move`, `UciMove` to `NormalMove`, `UciDrop` to `DropMove`,
  and `isMove()` to `isNormal()`.
- Renamed `uciCharPair()` to `scalachessId()`.
- All `ctx` parameters are now optional.
- Added `index` module with re-exports.

## v0.3.6

- Fixed alternative queenside castling moves (king moved by two squares instead
  of onto rook). These moves were not correctly classified, normalized or
  played.

## v0.3.5

- Added `compat` module for
  [chessground](https://github.com/ornicar/chessground) and
  [scalachess](https://github.com/ornicar/scalachess) interoperability.
- Added `Position.castlingSide()`.
- Added `Position.normalizeMove()`.
- Overloaded `parseSquare()` for known valid `SquareName`.

## v0.3.4

- Fixed castling paths in `Castles.default()` and `Chess.default()`, leading
  to illegal king moves.

## v0.3.3

- Fixed Racing Kings move generation with king near goal.
- Pawn drops in Crazyhouse reset `pos.halfmoves`.

## v0.3.2

- Fixed SAN of en passant captures.

## v0.3.1

- Optimize SAN disambiguation by adding a fast path for unambiguous moves.

## v0.3.0

- Renamed `san.makeVariationSan()` to `san.makeSanVariation()`.
- Fixed SAN disambiguation on b and c file.

## v0.2.0

- Fixed check from a1.
- Fixed insufficient material with same-color bishops.
- Fixed Crazyhouse validation and limit pocket size.
- Fixed `Position.fromSetup()` entangles position with setup.
- Made `Position.rules()` a read-only property `Position.rules`.
- Removed `SquareSet.subsets()`.
- Removed `utils.strRepeat()`.
- Micro optimizations and misc non-functional tweaks.

## v0.1.0

- First release.
