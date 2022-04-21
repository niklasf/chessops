import { createReadStream } from 'fs';
import { parseSan } from 'chessops/san';
import { PgnParser, walk, startingPosition } from 'chessops/pgn';

const validate = true;

let games = 0;
let errors = 0;
let moves = 0;

function status() {
  console.log({ games, moves, errors });
}

const stream = createReadStream(process.argv[2], { encoding: 'utf-8' });

const parser = new PgnParser((game, err) => {
  games++;

  if (err) {
    errors++;
    stream.destroy(err);
  }

  if (validate)
    walk(game.moves, startingPosition(game.headers).unwrap(), (pos, node) => {
      const move = parseSan(pos, node.san);
      if (!move) {
        errors++;
        return false;
      } else {
        pos.play(move);
        moves++;
      }
      return true;
    });

  if (games % 1024 == 0) status();
});

stream.on('data', (chunk: string) => parser.parse(chunk, { stream: true }));
stream.on('close', () => {
  parser.parse('');
  status();
});
