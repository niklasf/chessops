import { createReadStream } from 'fs';
import { parseSan } from '../san.js';
import { PgnParser, walk, startingPosition } from '../pgn.js';

const validate = true;

let games = 0;
let moves = 0;

function status() {
  console.log({ games, moves });
}

const parser = new PgnParser((game, err) => {
  if (err) throw err;

  if (validate)
    walk(game.moves, startingPosition(game.headers).unwrap(), (pos, node) => {
      const move = parseSan(pos, node.san);
      if (!move) throw Error('illegal move');
      else {
        pos.play(move);
        moves++;
      }
    });

  games++;
  if (games % 1024 == 0) status();
});

const stream = createReadStream(process.argv[2], { encoding: 'utf-8' });

stream.on('data', chunk => parser.parse(chunk, { stream: true }));
stream.on('close', () => {
  parser.parse('');
  status();
});
