Changelog for chessops
======================

v0.8.1
------

* Moved `FILES` and `RANKS` from `chessops/util` to `chessops/types`, renamed
  to `FILE_NAMES` and `RANK_NAMES`, and added corresponding `FileName` and
  `RankName` string literal types.
* Also reject positions where a checker is aligned with the en passant square
  and the king as `IllegalSetup.ImpossibleCheck`.

v0.7.4
------

* Added `IllegalSetup.ImpossibleCheck` and will now reject setups with too many
  checkers or aligned sliding checkers. These positions are impossible to reach
  and Stockfish does not work properly on them.
* Added `equals()` to most classes, `Board.equalsIgnorePromoted()`, and
  `Position.equalsIgnoreMoves()`.

v0.7.3
------

* Fixed `parseSan()` to properly interpret moves like `bxc6` as a pawn capture
  instead of a bishop move. Lowercase piece letters are no longer accepted,
  e.g., `nf3` must be `Nf3`.
* Fixed `Position.isLegal()` was not accepting the king-moves-two-squares
  encoding for castling castling moves.

v0.7.2
------

* Fixed insufficient material with same-color bishops on both sides.

v0.7.1
------

* Fixed `parseSan` with regard to pawn captures, promotions and some
  disambiguated moves.

v0.7.0
------

* Added `parseSan`.
* Added `chessgroundMove` compatibility.
* Added `FILES` and `RANKS` constants.
* Fix spelling of export: `transfrom` -> `transform`.
* Added `{MaterialSide,Material}.{fromBoard,add}()`.
* Clamp move counters in FEN export for guaranteed reparsability.
* Reject promotions not on backrank.
* Micro-optimizations.

v0.6.0
------

* Updated `chessgroundDests` for chessground 7.8 compatibility.
* Added `chessgroundDests(pos, {chess960: true})` to generate only
  Chess960-style castling moves.
* Renamed `scalachessId` to `scalachessCharPair`.

v0.5.0
------

* Removed `util.squareDist()`.
* Further optimized initialization.
* Packaged source map.

v0.4.2
------

* Performance optimizations, significantly faster initilization.
* Added `SquareSet.withoutFirst()`.
* Bumped target to ES2016.

v0.4.1
------

* Added `lichessVariantRules` compatibility.

v0.4.0
------

* Renamed `Uci` to `Move`, `UciMove` to `NormalMove`, `UciDrop` to `DropMove`,
  and `isMove` to `isNormal`.
* Renamed `uciCharPair` to `scalachessId`.
* All `ctx` parameters are now optional.
* Added `index` module with re-exports.

v0.3.6
------

* Fixed alternative queenside castling moves (king moved by two squares instead
  of onto rook). These moves were not correctly classified, normalized or
  played.

v0.3.5
------

* Added `compat` module for
  [chessground](https://github.com/ornicar/chessground) and
  [scalachess](https://github.com/ornicar/scalachess) interoperability.
* Added `Position.castlingSide()`.
* Added `Position.normalizeMove()`.
* Overloaded `parseSquare()` for known valid `SquareName`.

v0.3.4
------

* Fixed castling paths in `Castles.default()` and `Chess.default()`, leading
  to illegal king moves.

v0.3.3
------

* Fixed Racing Kings move generation with king near goal.
* Pawn drops in Crazyhouse reset `pos.halfmoves`.

v0.3.2
------

* Fixed SAN of en passant captures.

v0.3.1
------

* Optimize SAN disambiguation by adding a fast path for unambiguous moves.

v0.3.0
------

* Renamed `san.makeVariationSan()` to `san.makeSanVariation()`.
* Fixed SAN disambiguation on b and c file.

v0.2.0
------

* Fixed check from a1.
* Fixed insufficient material with same-color bishops.
* Fixed Crazyhouse validation and limit pocket size.
* Fixed `Position.fromSetup()` entangles position with setup.
* Made `Position.rules()` a read-only property `Position.rules`.
* Removed `SquareSet.subsets()`.
* Removed `utils.strRepeat()`.
* Micro optimizations and misc non-functional tweaks.

v0.1.0
------

* First release.
