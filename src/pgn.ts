import { defined, makeSquare, parseSquare } from './util.js';
import { Rules, Outcome, Square } from './types.js';
import { parseFen, FenError, makeFen } from './fen.js';
import { Position, PositionError, FromSetupOpts, IllegalSetup } from './chess.js';
import { defaultPosition, setupPosition } from './variant.js';
import { Result } from '@badrap/result';

export interface Game<T> {
  headers: Map<string, string>;
  comments?: string[];
  moves: Node<T>;
}

export const defaultGame = <T>(initHeaders: () => Map<string, string> = defaultHeaders): Game<T> => ({
  headers: initHeaders(),
  moves: new Node(),
});

export class Node<T> {
  children: ChildNode<T>[] = [];

  *mainline(): Iterable<T> {
    let node: Node<T> = this;
    while (node.children.length) {
      const child = node.children[0];
      yield child.data;
      node = child;
    }
  }
}

export class ChildNode<T> extends Node<T> {
  constructor(public data: T) {
    super();
  }
}

export const transform = <T, U, C extends { clone(): C }>(
  node: Node<T>,
  ctx: C,
  f: (ctx: C, data: T, i: number) => U | undefined
): Node<U> => {
  const root = new Node<U>();
  const stack = [
    {
      before: node,
      after: root,
      ctx,
    },
  ];
  let frame;
  while ((frame = stack.pop())) {
    for (let i = 0; i < frame.before.children.length; i++) {
      const ctx = i < frame.before.children.length - 1 ? frame.ctx.clone() : frame.ctx;
      const childBefore = frame.before.children[i];
      const data = f(ctx, childBefore.data, i);
      if (defined(data)) {
        const childAfter = new ChildNode(data);
        frame.after.children.push(childAfter);
        stack.push({
          before: childBefore,
          after: childAfter,
          ctx,
        });
      }
    }
  }
  return root;
};

export const walk = <T, C extends { clone(): C }>(
  node: Node<T>,
  ctx: C,
  f: (ctx: C, data: T, i: number) => boolean | undefined
) => {
  const stack = [{ node, ctx }];
  let frame;
  while ((frame = stack.pop())) {
    for (let i = 0; i < frame.node.children.length; i++) {
      const ctx = i < frame.node.children.length - 1 ? frame.ctx.clone() : frame.ctx;
      const child = frame.node.children[i];
      if (f(ctx, child.data, i) !== false) stack.push({ node: child, ctx });
    }
  }
};

export interface PgnNodeData {
  san: string;
  startingComments?: string[];
  comments?: string[];
  nags?: number[];
}

export const makeOutcome = (outcome: Outcome | undefined): string => {
  if (!outcome) return '*';
  else if (outcome.winner === 'white') return '1-0';
  else if (outcome.winner === 'black') return '0-1';
  else return '1/2-1/2';
};

export const parseOutcome = (s: string | undefined): Outcome | undefined => {
  if (s === '1-0') return { winner: 'white' };
  else if (s === '0-1') return { winner: 'black' };
  else if (s === '1/2-1/2') return { winner: undefined };
  else return;
};

const escapeHeader = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const safeComment = (comment: string): string => comment.replace(/\}/g, '');

const enum MakePgnState {
  Pre = 0,
  Sidelines = 1,
  End = 2,
}

interface MakePgnFrame {
  state: MakePgnState;
  ply: number;
  node: ChildNode<PgnNodeData>;
  sidelines: Iterator<ChildNode<PgnNodeData>>;
  startsVariation: boolean;
  inVariation: boolean;
}

export const makePgn = (game: Game<PgnNodeData>): string => {
  const builder = [],
    tokens = [];

  if (game.headers.size) {
    for (const [key, value] of game.headers.entries()) {
      builder.push('[', key, ' "', escapeHeader(value), '"]\n');
    }
    builder.push('\n');
  }

  for (const comment of game.comments || []) tokens.push('{', safeComment(comment), '}');

  const fen = game.headers.get('FEN');
  const initialPly = fen
    ? parseFen(fen).unwrap(
        setup => (setup.fullmoves - 1) * 2 + (setup.turn === 'white' ? 0 : 1),
        _ => 0
      )
    : 0;

  const stack: MakePgnFrame[] = [];

  if (game.moves.children.length) {
    const variations = game.moves.children[Symbol.iterator]();
    stack.push({
      state: MakePgnState.Pre,
      ply: initialPly,
      node: variations.next().value,
      sidelines: variations,
      startsVariation: false,
      inVariation: false,
    });
  }

  let forceMoveNumber = true;
  while (stack.length) {
    const frame = stack[stack.length - 1];

    if (frame.inVariation) {
      tokens.push(')');
      frame.inVariation = false;
      forceMoveNumber = true;
    }

    switch (frame.state) {
      case MakePgnState.Pre:
        for (const comment of frame.node.data.startingComments || []) {
          tokens.push('{', safeComment(comment), '}');
          forceMoveNumber = true;
        }
        if (forceMoveNumber || frame.ply % 2 === 0) {
          tokens.push(Math.floor(frame.ply / 2) + 1 + (frame.ply % 2 ? '...' : '.'));
          forceMoveNumber = false;
        }
        tokens.push(frame.node.data.san);
        for (const nag of frame.node.data.nags || []) {
          tokens.push('$' + nag);
          forceMoveNumber = true;
        }
        for (const comment of frame.node.data.comments || []) {
          tokens.push('{', safeComment(comment), '}');
        }
        frame.state = MakePgnState.Sidelines; // fall through
      case MakePgnState.Sidelines: {
        const child = frame.sidelines.next();
        if (child.done) {
          if (frame.node.children.length) {
            const variations = frame.node.children[Symbol.iterator]();
            stack.push({
              state: MakePgnState.Pre,
              ply: frame.ply + 1,
              node: variations.next().value,
              sidelines: variations,
              startsVariation: false,
              inVariation: false,
            });
          }
          frame.state = MakePgnState.End;
        } else {
          tokens.push('(');
          forceMoveNumber = true;
          stack.push({
            state: MakePgnState.Pre,
            ply: frame.ply,
            node: child.value,
            sidelines: [][Symbol.iterator](),
            startsVariation: true,
            inVariation: false,
          });
          frame.inVariation = true;
        }
        break;
      }
      case MakePgnState.End:
        stack.pop();
    }
  }

  tokens.push(makeOutcome(parseOutcome(game.headers.get('Result'))));

  builder.push(tokens.join(' '), '\n');
  return builder.join('');
};

export const defaultHeaders = (): Map<string, string> =>
  new Map([
    ['Event', '?'],
    ['Site', '?'],
    ['Date', '????.??.??'],
    ['Round', '?'],
    ['White', '?'],
    ['Black', '?'],
    ['Result', '*'],
  ]);

export const emptyHeaders = (): Map<string, string> => new Map();

const BOM = '\ufeff';

const isWhitespace = (line: string): boolean => /^\s*$/.test(line);

const isCommentLine = (line: string): boolean => line.startsWith('%');

export interface ParseOptions {
  stream: boolean;
}

interface ParserFrame {
  parent: Node<PgnNodeData>;
  root: boolean;
  node?: ChildNode<PgnNodeData>;
  startingComments?: string[];
}

const enum ParserState {
  Bom = 0,
  Pre = 1,
  Headers = 2,
  Moves = 3,
  Comment = 4,
}

export class PgnError extends Error {}

export class PgnParser {
  private lineBuf: string[] = [];

  private budget: number;
  private found: boolean;
  private state: ParserState;
  private game: Game<PgnNodeData>;
  private consecutiveEmptyLines: number;
  private stack: ParserFrame[];
  private commentBuf: string[];

  constructor(
    private emitGame: (game: Game<PgnNodeData>, err: PgnError | undefined) => void,
    private initHeaders: () => Map<string, string> = defaultHeaders,
    private maxBudget = 1_000_000
  ) {
    this.resetGame();
    this.state = ParserState.Bom;
  }

  private resetGame() {
    this.budget = this.maxBudget;
    this.found = false;
    this.state = ParserState.Pre;
    this.game = defaultGame(this.initHeaders);
    this.consecutiveEmptyLines = 0;
    this.stack = [{ parent: this.game.moves, root: true }];
    this.commentBuf = [];
  }

  private consumeBudget(cost: number) {
    this.budget -= cost;
    if (this.budget < 0) throw new PgnError('ERR_PGN_BUDGET');
  }

  parse(data: string, options?: ParseOptions): void {
    if (this.budget < 0) return;
    try {
      let idx = 0;
      for (;;) {
        const nlIdx = data.indexOf('\n', idx);
        if (nlIdx === -1) {
          break;
        }
        const crIdx = nlIdx > idx && data[nlIdx - 1] === '\r' ? nlIdx - 1 : nlIdx;
        this.consumeBudget(nlIdx - idx);
        this.lineBuf.push(data.slice(idx, crIdx));
        idx = nlIdx + 1;
        this.handleLine();
      }
      this.consumeBudget(data.length - idx);
      this.lineBuf.push(data.slice(idx));

      if (!options?.stream) {
        this.handleLine();
        this.emit(undefined);
      }
    } catch (err: unknown) {
      this.emit(err as PgnError);
    }
  }

  private handleLine() {
    let freshLine = true;
    let line = this.lineBuf.join('');
    this.lineBuf = [];

    continuedLine: for (;;) {
      switch (this.state) {
        case ParserState.Bom:
          if (line.startsWith(BOM)) line = line.slice(BOM.length);
          this.state = ParserState.Pre; // fall through
        case ParserState.Pre:
          if (isWhitespace(line) || isCommentLine(line)) return;
          this.state = ParserState.Headers; // fall through
        case ParserState.Headers:
          if (isCommentLine(line)) return;
          if (this.consecutiveEmptyLines < 1 && isWhitespace(line)) {
            this.consecutiveEmptyLines++;
            return;
          }
          this.found = true;
          this.consecutiveEmptyLines = 0;
          if (line.startsWith('[')) {
            this.consumeBudget(200);
            const matches = line.match(/^\[([A-Za-z0-9_]+)\s+"(.*)"\]\s*$/);
            if (matches) this.game.headers.set(matches[1], matches[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
            return;
          }
          this.state = ParserState.Moves; // fall through
        case ParserState.Moves: {
          if (freshLine) {
            if (isCommentLine(line)) return;
            if (isWhitespace(line)) return this.emit(undefined);
          }
          const tokenRegex =
            /(?:[NBKRQ]?[a-h]?[1-8]?[-x]?[a-h][1-8](?:=?[nbrqkNBRQK])?|[pnbrqkPNBRQK]?@[a-h][1-8]|O-O-O|0-0-0|O-O|0-0)[+#]?|--|Z0|0000|@@@@|{|;|\$\d{1,4}|[?!]{1,2}|\(|\)|\*|1-0|0-1|1\/2-1\/2/g;
          let match;
          while ((match = tokenRegex.exec(line))) {
            const frame = this.stack[this.stack.length - 1];
            let token = match[0];
            if (token === ';') return;
            else if (token.startsWith('$')) this.handleNag(parseInt(token.slice(1), 10));
            else if (token === '!') this.handleNag(1);
            else if (token === '?') this.handleNag(2);
            else if (token === '!!') this.handleNag(3);
            else if (token === '??') this.handleNag(4);
            else if (token === '!?') this.handleNag(5);
            else if (token === '?!') this.handleNag(6);
            else if (token === '1-0' || token === '0-1' || token === '1/2-1/2' || token === '*') {
              if (this.stack.length === 1 && token !== '*') this.game.headers.set('Result', token);
            } else if (token === '(') {
              this.consumeBudget(100);
              this.stack.push({ parent: frame.parent, root: false });
            } else if (token === ')') {
              if (this.stack.length > 1) this.stack.pop();
            } else if (token === '{') {
              const openIndex = tokenRegex.lastIndex;
              const beginIndex = line[openIndex] === ' ' ? openIndex + 1 : openIndex;
              line = line.slice(beginIndex);
              this.state = ParserState.Comment;
              continue continuedLine;
            } else {
              this.consumeBudget(100);
              if (token === 'Z0' || token === '0000' || token === '@@@@') token = '--';
              else if (token.startsWith('0')) token = token.replace(/0/g, 'O');

              if (frame.node) frame.parent = frame.node;
              frame.node = new ChildNode({
                san: token,
                startingComments: frame.startingComments,
              });
              frame.startingComments = undefined;
              frame.root = false;
              frame.parent.children.push(frame.node);
            }
          }
          return;
        }
        case ParserState.Comment: {
          const closeIndex = line.indexOf('}');
          if (closeIndex === -1) {
            this.commentBuf.push(line);
            return;
          } else {
            const endIndex = closeIndex > 0 && line[closeIndex - 1] === ' ' ? closeIndex - 1 : closeIndex;
            this.commentBuf.push(line.slice(0, endIndex));
            this.handleComment();
            line = line.slice(closeIndex);
            this.state = ParserState.Moves;
            freshLine = false;
          }
        }
      }
    }
  }

  private handleNag(nag: number) {
    this.consumeBudget(50);
    const frame = this.stack[this.stack.length - 1];
    if (frame.node) {
      frame.node.data.nags ||= [];
      frame.node.data.nags.push(nag);
    }
  }

  private handleComment() {
    this.consumeBudget(100);
    const frame = this.stack[this.stack.length - 1];
    const comment = this.commentBuf.join('\n');
    this.commentBuf = [];
    if (frame.node) {
      frame.node.data.comments ||= [];
      frame.node.data.comments.push(comment);
    } else if (frame.root) {
      this.game.comments ||= [];
      this.game.comments.push(comment);
    } else {
      frame.startingComments ||= [];
      frame.startingComments.push(comment);
    }
  }

  private emit(err: PgnError | undefined) {
    if (this.state === ParserState.Comment) this.handleComment();
    if (err) return this.emitGame(this.game, err);
    if (this.found) this.emitGame(this.game, undefined);
    this.resetGame();
  }
}

export const parsePgn = (pgn: string, initHeaders: () => Map<string, string> = defaultHeaders): Game<PgnNodeData>[] => {
  const games: Game<PgnNodeData>[] = [];
  new PgnParser(game => games.push(game), initHeaders, NaN).parse(pgn);
  return games;
};

export const parseVariant = (variant: string | undefined): Rules | undefined => {
  switch ((variant || 'chess').toLowerCase()) {
    case 'chess':
    case 'chess960':
    case 'chess 960':
    case 'standard':
    case 'from position':
    case 'classical':
    case 'normal':
    case 'fischerandom': // Cute Chess
    case 'fischerrandom':
    case 'fischer random':
    case 'wild/0':
    case 'wild/1':
    case 'wild/2':
    case 'wild/3':
    case 'wild/4':
    case 'wild/5':
    case 'wild/6':
    case 'wild/7':
    case 'wild/8':
    case 'wild/8a':
      return 'chess';
    case 'crazyhouse':
    case 'crazy house':
    case 'house':
    case 'zh':
      return 'crazyhouse';
    case 'king of the hill':
    case 'koth':
    case 'kingofthehill':
      return 'kingofthehill';
    case 'three-check':
    case 'three check':
    case 'threecheck':
    case 'three check chess':
    case '3-check':
    case '3 check':
    case '3check':
      return '3check';
    case 'antichess':
    case 'anti chess':
    case 'anti':
      return 'antichess';
    case 'atomic':
    case 'atom':
    case 'atomic chess':
      return 'atomic';
    case 'horde':
    case 'horde chess':
      return 'horde';
    case 'racing kings':
    case 'racingkings':
    case 'racing':
    case 'race':
      return 'racingkings';
    default:
      return;
  }
};

export const makeVariant = (rules: Rules): string | undefined => {
  switch (rules) {
    case 'chess':
      return;
    case 'crazyhouse':
      return 'Crazyhouse';
    case 'racingkings':
      return 'Racing Kings';
    case 'horde':
      return 'Horde';
    case 'atomic':
      return 'Atomic';
    case 'antichess':
      return 'Antichess';
    case '3check':
      return 'Three-check';
    case 'kingofthehill':
      return 'King of the Hill';
  }
};

export const startingPosition = (
  headers: Map<string, string>,
  opts?: FromSetupOpts
): Result<Position, FenError | PositionError> => {
  const rules = parseVariant(headers.get('Variant'));
  if (!rules) return Result.err(new PositionError(IllegalSetup.Variant));
  const fen = headers.get('FEN');
  if (fen) return parseFen(fen).chain(setup => setupPosition(rules, setup, opts));
  else return Result.ok(defaultPosition(rules));
};

export const setStartingPosition = (headers: Map<string, string>, pos: Position) => {
  const variant = makeVariant(pos.rules);
  if (variant) headers.set('Variant', variant);
  else headers.delete('Variant');

  const fen = makeFen(pos.toSetup());
  const defaultFen = makeFen(defaultPosition(pos.rules).toSetup());
  if (fen !== defaultFen) headers.set('FEN', fen);
  else headers.delete('FEN');
};

export type CommentShapeColor = 'green' | 'red' | 'yellow' | 'blue';

export interface CommentShape {
  color: CommentShapeColor;
  from: Square;
  to: Square;
}

export interface Comment {
  text: string;
  shapes: CommentShape[];
  clock?: number;
  emt?: number;
}

// export const parseComment = (comment: string): Comment =>

const makeClk = (seconds: number): string => {
  seconds = Math.max(0, seconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  seconds = (seconds % 3600) % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toLocaleString('en', {
    minimumIntegerDigits: 2,
    maximumFractionDigits: 3,
  })}`;
};

const makeColor = (color: CommentShapeColor): 'G' | 'R' | 'Y' | 'B' => {
  switch (color) {
    case 'green':
      return 'G';
    case 'red':
      return 'R';
    case 'yellow':
      return 'Y';
    case 'blue':
      return 'B';
  }
};

const makeShape = (shape: CommentShape): string =>
  shape.to === shape.from
    ? `${makeColor(shape.color)}${makeSquare(shape.to)}`
    : `${makeColor(shape.color)}${makeSquare(shape.from)}${makeSquare(shape.to)}`;

export const makeComment = (comment: Partial<Comment>): string => {
  const builder = [];
  if (defined(comment.text)) builder.push(comment.text);
  const circles = (comment.shapes || []).filter(shape => shape.to === shape.from).map(makeShape);
  if (circles.length) builder.push(`[%csl ${circles.join(',')}]`);
  const arrows = (comment.shapes || []).filter(shape => shape.to !== shape.from).map(makeShape);
  if (arrows.length) builder.push(`[%cal ${arrows.join(',')}]`);
  if (defined(comment.emt)) builder.push(`[%emt ${makeClk(comment.emt)}]`);
  if (defined(comment.clock)) builder.push(`[%clk ${makeClk(comment.clock)}]`);
  return builder.join(' ');
};

export const parseComment = (comment: string): Comment => {
  let emt, clock;
  const shapes: CommentShape[] = [];
  const text = comment
    .replace(
      /(\s?)\[%(emt|clk)\s(\d{1,5}):(\d{1,2}):(\d{1,2}(?:\.\d{0,5})?)\](\s?)/g,
      (_, prefix, annotation, hours, minutes, seconds, suffix) => {
        const value = parseInt(hours, 10) * 3600 + parseInt(minutes, 10) * 60 + parseFloat(seconds);
        if (annotation == 'emt') emt = value;
        else if (annotation == 'clk') clock = value;
        return prefix && suffix;
      }
    )
    .replace(
      /(\s?)\[%(?:csl|cal)\s([RGYB][a-h][1-8](?:[a-h][1-8])?(?:,[RGYB][a-h][1-8](?:[a-h][1-8])?)*)\](\s?)/g,
      (_, prefix, arrows, suffix) => {
        for (const arrow of arrows.split(',')) {
          const from = parseSquare(arrow.slice(1, 3))!;
          shapes.push({
            color: arrow[0] == 'R' ? 'red' : arrow[0] == 'G' ? 'green' : arrow[0] == 'Y' ? 'yellow' : 'blue',
            from,
            to: arrow.length == 5 ? parseSquare(arrow.slice(3, 5))! : from,
          });
        }
        return prefix && suffix;
      }
    );
  return {
    text,
    shapes,
    emt,
    clock,
  };
};
