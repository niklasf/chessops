import { createReadStream } from 'fs';
import { parseSan } from '../san.js';
import { PgnParser, walk, startingPosition } from '../pgn.js';

const validate = false;

let count = 0;
let errors = 0;
let moves = 0;

function status() {
  console.log({ count, errors, moves });
}

const parser = new PgnParser((game, err) => {
  if (err) console.error('parser error:', err);

  if (validate) walk(game.moves, startingPosition(game.headers).unwrap(), (pos, node) => {
    const move = parseSan(pos, node.san);
    if (!move) errors++;
    else {
      pos.play(move);
      moves++;
    }
  });

  count++;
  if (count % 1024 == 0) status();
});

const stream = createReadStream(process.argv[2], { encoding: 'utf-8' });

stream.on('data', chunk => parser.parse(chunk, { stream: true }));
stream.on('close', () => {
  parser.parse('');
  status();
});
