# chessops

[![Test](https://github.com/niklasf/chessops/workflows/Test/badge.svg)](https://github.com/niklasf/chessops/actions)
[![npm](https://img.shields.io/npm/v/chessops)](https://www.npmjs.com/package/chessops)

Chess and chess variant rules and operations in TypeScript.

## Documentation

[View TypeDoc](https://niklasf.github.io/chessops/)

## Features

- [Read and write FEN](https://niklasf.github.io/chessops/modules/_fen_.html)
- Vocabulary (Square, SquareSet, Color, Role, Piece, Board, Castles, Setup,
  Position)
- [Variant rules](https://niklasf.github.io/chessops/modules/_variant_.html): Standard chess, Crazyhouse, King of the Hill, Three-check,
  Antichess, Atomic, Horde, Racing Kings
  - Move making
  - Legal move and drop move generation
  - Game end and outcome
  - Insufficient material
  - Setup validation
- Supports Chess960
- [Attacks and rays](https://niklasf.github.io/chessops/modules/_attacks_.html) using hyperbola quintessence
- Read and write UCI move notation
- [Read and write SAN](https://niklasf.github.io/chessops/modules/_san_.html)
- [Position hashing](https://niklasf.github.io/chessops/modules/_hash_.html)
- [Transformations](https://niklasf.github.io/chessops/modules/_transform_.html): Mirroring and rotating
- [Compatibility](https://niklasf.github.io/chessops/modules/_compat_.html): [chessground](https://github.com/ornicar/chessground) and [scalachess](https://github.com/ornicar/scalachess)

[File an issue](https://github.com/niklasf/chessops/issues/new) to request more.

## Example

```javascript
import { parseFen } from 'chessops/fen';
import { Chess } from 'chessops/chess';

const setup = parseFen('r1bqkbnr/ppp2Qpp/2np4/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4').unwrap();
const pos = Chess.fromSetup(setup).unwrap();
console.assert(pos.isCheckmate());
```

## License

chessops is licensed under the GNU General Public License 3 or any later
version at your choice. See LICENSE.txt for details.
