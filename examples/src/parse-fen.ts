import { parseFen } from 'chessops/fen';

console.log(parseFen('4k3/8/8/8/8/8/5Q2/4K3 w - - 0 1').unwrap());
