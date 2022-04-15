import { defined } from './util.js';
import { Outcome } from './types.js';
import { parseFen } from './fen.js';

export interface Game<T> {
  headers: Map<string, string>;
  comments?: string[];
  moves: Node<T>;
}

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

export function transform<T, U, C extends { clone(): C }>(
  node: Node<T>,
  ctx: C,
  f: (ctx: C, data: T, i: number) => U | undefined
): Node<U> {
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
}

export interface PgnNodeData {
  san: string;
  startingComments?: string[];
  comments?: string[];
  nags?: number[];
}

export function makeOutcome(outcome: Outcome | undefined): string {
  if (!outcome) return '*';
  else if (outcome.winner === 'white') return '1-0';
  else if (outcome.winner === 'black') return '0-1';
  else return '1/2-1/2';
}

export function parseOutcome(s: string | undefined): Outcome | undefined {
  if (s === '1-0') return { winner: 'white' };
  else if (s === '0-1') return { winner: 'black' };
  else if (s === '1/2-1/2') return { winner: undefined };
  else return;
}

function escapeHeader(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function safeComment(comment: string): string {
  return comment.replace(/\}/g, '');
}

interface AppendPgnFrame {
  state: 'pre' | 'sidelines' | 'end';
  ply: number;
  node: ChildNode<PgnNodeData>;
  sidelines: Iterator<ChildNode<PgnNodeData>>;
  startsVariation: boolean;
  inVariation: boolean;
}

export function makePgn(game: Game<PgnNodeData>): string {
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

  const stack: AppendPgnFrame[] = [];

  if (game.moves.children.length) {
    const variations = game.moves.children[Symbol.iterator]();
    stack.push({
      state: 'pre',
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
      case 'pre':
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
        frame.state = 'sidelines'; // fall through
      case 'sidelines': {
        const child = frame.sidelines.next();
        if (child.done) {
          if (frame.node.children.length) {
            const variations = frame.node.children[Symbol.iterator]();
            stack.push({
              state: 'pre',
              ply: frame.ply + 1,
              node: variations.next().value,
              sidelines: variations,
              startsVariation: false,
              inVariation: false,
            });
          }
          frame.state = 'end';
        } else {
          tokens.push('(');
          forceMoveNumber = true;
          stack.push({
            state: 'pre',
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
      case 'end':
        stack.pop();
    }
  }

  tokens.push(makeOutcome(parseOutcome(game.headers.get('Result'))));

  builder.push(tokens.join(' '));
  return builder.join('');
}

export function defaultHeaders(): Map<string, string> {
  return new Map([
    ['Event', '?'],
    ['Site', '?'],
    ['Date', '????.??.??'],
    ['Round', '?'],
    ['White', '?'],
    ['Black', '?'],
    ['Result', '*'],
  ]);
}

const bom = '\ufeff';

function isWhitespace(line: string): boolean {
  return /^\s*$/.test(line);
}

function isCommentLine(line: string): boolean {
  return line.startsWith('%');
}

export interface ParseOptions {
  stream: boolean;
}

interface ParserFrame {
  parent: Node<PgnNodeData>;
  root: boolean;
  node?: ChildNode<PgnNodeData>;
  startingComments?: string[];
}

class LineParser {
  private lineBuf: string[] = [];

  constructor(private emitLine: (line: string) => void) {}

  parse(data: string, options?: ParseOptions) {
    let idx = 0;
    for (;;) {
      const nlIdx = data.indexOf('\n', idx);
      if (nlIdx === -1) {
        break;
      }
      const crIdx = nlIdx > idx && data[nlIdx - 1] === '\r' ? nlIdx - 1 : nlIdx;
      this.lineBuf.push(data.slice(idx, crIdx));
      idx = nlIdx + 1;
      this.emit();
    }
    this.lineBuf.push(data.slice(idx));
    if (!options?.stream) this.emit();
  }

  emit() {
    this.emitLine(this.lineBuf.join(''));
    this.lineBuf = [];
  }
}

export class PgnError extends Error {}

export class PgnParser {
  private lineParser = new LineParser(line => this.handleLine(line));

  private budget: number;
  private found: boolean;
  private state: 'bom' | 'pre' | 'headers' | 'moves' | 'comment';
  private game: Game<PgnNodeData>;
  private consecutiveEmptyLines: number;
  private stack: ParserFrame[];
  private commentBuf: string[];

  constructor(
    private emitGame: (game: Game<PgnNodeData>) => void,
    private initHeaders: () => Map<string, string> = defaultHeaders,
    private maxBudget = 1_000_000
  ) {
    this.resetGame();
    this.state = 'bom';
  }

  private resetGame() {
    this.budget = this.maxBudget;
    this.found = false;
    this.state = 'pre';
    this.game = {
      headers: this.initHeaders(),
      moves: new Node(),
    };
    this.consecutiveEmptyLines = 0;
    this.stack = [{ parent: this.game.moves, root: true }];
    this.commentBuf = [];
  }

  private consumeBudget(cost: number) {
    this.budget -= cost;
    if (this.budget < 0) throw new PgnError('ERR_PGN_BUDGET');
  }

  parse(data: string, options?: ParseOptions): void {
    this.consumeBudget(data.length);
    this.lineParser.parse(data, options);
    if (!options?.stream) this.emit();
  }

  private handleLine(line: string) {
    let freshLine = true;
    for (;;) {
      switch (this.state) {
        case 'bom':
          if (line.startsWith(bom)) line = line.slice(bom.length);
          this.state = 'pre'; // fall through
        case 'pre':
          if (isWhitespace(line) || isCommentLine(line)) return;
          this.state = 'headers'; // fall through
        case 'headers':
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
            console.log(line, matches);
            if (matches) this.game.headers.set(matches[1], matches[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
            return;
          }
          this.state = 'moves'; // fall through
        case 'moves': {
          if (freshLine) {
            if (isCommentLine(line)) return;
            if (isWhitespace(line)) return this.emit();
          }
          const tokenRegex =
            /(?:[NBKRQ]?[a-h]?[1-8]?[-x]?[a-h][1-8](?:=?[nbrqkNBRQK])?|[pnbrqkPNBRQK]?@[a-h][1-8]|O-O|0-0|O-O-O|0-0-0)[+#]?|--|Z0|0000|@@@@|{|;|\$\d{1,4}|[?!]{1,2}|\(|\)|\*|1-0|0-1|1\/2-1\/2/g;
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
              if (this.stack.length === 1) this.game.headers.set('Result', token);
            } else if (token === '(') {
              this.consumeBudget(200);
              this.stack.push({ parent: frame.parent, root: false });
            } else if (token === ')') {
              if (this.stack.length > 1) this.stack.pop();
            } else if (token === '{') {
              const openIndex = tokenRegex.lastIndex;
              const beginIndex = line[openIndex] === ' ' ? openIndex + 1 : openIndex;
              line = line.slice(beginIndex);
              this.state = 'comment';
              break;
            } else {
              this.consumeBudget(200);
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
          if (this.state !== 'comment') return; // fall through
        }
        case 'comment': {
          const closeIndex = line.indexOf('}');
          if (closeIndex === -1) {
            this.commentBuf.push(line);
            return;
          } else {
            const endIndex = closeIndex > 0 && line[closeIndex - 1] === ' ' ? closeIndex - 1 : closeIndex;
            this.commentBuf.push(line.slice(0, endIndex));
            this.handleComment();
            line = line.slice(closeIndex);
            this.state = 'moves';
            freshLine = false;
          }
        }
      }
    }
  }

  private handleNag(nag: number) {
    this.consumeBudget(100);
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

  private emit() {
    if (this.found) {
      if (this.state === 'comment') this.handleComment();
      this.emitGame(this.game);
    }
    this.resetGame();
  }
}

export function parsePgn(pgn: string, initHeaders: () => Map<string, string> = defaultHeaders): Game<PgnNodeData>[] {
  const games: Game<PgnNodeData>[] = [];
  new PgnParser(game => games.push(game), initHeaders, NaN).parse(pgn);
  return games;
}
