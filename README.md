chessops
========

[![Test](https://github.com/niklasf/chessops/workflows/Test/badge.svg)](https://github.com/niklasf/chessops/actions)
[![npm](https://img.shields.io/npm/v/chessops)](https://www.npmjs.com/package/chessops)

Chess and chess variant rules and operations in TypeScript.

:warning: Not ready for production :warning:

Features
--------

* [Read and write FEN](https://niklasf.github.io/chessops/modules/_fen_.html)
* Vocabulary (Square, SquareSet, Color, Role, Piece, Board, Castles, Setup,
  Position)
* [Variant rules](https://niklasf.github.io/chessops/modules/_variant_.html): Standard chess, Crazyhouse, King of the Hill, Three-check,
  ~Antichess~, ~Atomic~, Horde, Racing Kings
  - Move making
  - Legal move and drop move generation
  - Game end and outcome
  - Insufficient material
  - Setup validation
* Supports Chess960
* [Attacks and rays](https://niklasf.github.io/chessops/modules/_attacks_.html) using hyperbola quintessence
* Read and write UCI move notation
* ~Read and write SAN~
* ~Read and write PGN~
* ~Position hashing~
* [Transformations](https://niklasf.github.io/chessops/modules/_transform_.html): Mirroring and rotating

Example
-------

```javascript
import { parseFen } from 'chessops/fen';
import { Chess } from 'chessops/chess';

const setup = parseFen('r1bqkbnr/ppp2Qpp/2np4/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4').unwrap();
const pos = Chess.fromSetup(setup).unwrap();
console.assert(pos.isCheckmate());
```

Documentation
-------------

[View TypeDoc](https://niklasf.github.io/chessops/)

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

### 0.1.0-alpha.2

* [ ] chess variants
* [ ] san writing

### 0.1.0-alpha.3

* [ ] san parsing
* [ ] pgn parsing

License
-------

chessops is licensed under the GNU General Public License 3 or any later
version at your choice. See LICENSE.txt for details.
