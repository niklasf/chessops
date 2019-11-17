chessops
========

Chess and chess variant rules and operations.

:warning: Not ready for production :warning:

Features
--------

* Read and write FEN
* Vocabulary (Color, Role, Piece, Board, Castles, Setup)
* Variant rules: Standard chess, ~Crazyhouse, King of the Hill, Three-check,
  Antichess, Atomic,Horde, Racing Kings~
  - Move making
  - Legal move and drop move generation
  - Game end and outcome
  - Insufficient material
* Supports Chess960
* ~Read and write SAN~
* ~Read and write PGN~
* ~Position hashing~
* Transformations: Mirroring and rotating

Roadmap
-------

### 0.1.0-alpha.0

* [x] square set
* [x] attacks
* [x] board representation

### 0.1.0-alpha.1

* [x] board to fen
* [x] castling to fen
* [x] setup to fen
* [x] fen to board
* [x] fen to castling
* [x] fen to setup
* [x] validate setup
* [x] move making
* [x] en passant dests
* [x] castling dests
* [x] normal dests
* [x] perft test
* [x] transformations
* [x] insufficient material
* [x] game end
* [ ] chess variants

### 0.1.0-alpha.2

* [ ] san writing

### 0.1.0-alpha.3

* [ ] san parsing
* [ ] pgn parsing

License
-------

chessops is licensed under the GNU General Public License 3 or any later
version at your choice. See LICENSE.txt for details.
