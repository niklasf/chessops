import { defined } from './util.js';
import { Outcome } from './types.js';
import { parseFen } from './fen.js';

export interface Game<T> {
  headers: Map<string, string>;
  moves: Node<T>;
}

export class Node<T> {
  children: ChildNode<T>[] = [];

  *mainline(): Iterable<T> {
    let node = this.children[0];
    while (node) {
      yield node.data;
      node = node.children[0];
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
  startingComment?: string;
  comment?: string;
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
  return value.replace('\\', '\\\\').replace('"', '\\"');
}

export function appendPgn(builder: string[], game: Game<PgnNodeData>): void {
  if (game.headers.size) {
    for (const [key, value] of game.headers.entries()) {
      builder.push('[', key, ' "', escapeHeader(value), '"]\n');
    }
    builder.push('\n');
  }

  const fen = game.headers.get('FEN');
  const initialPly = fen
    ? parseFen(fen).unwrap(
        setup => (setup.fullmoves - 1) * 2 + (setup.turn === 'white' ? 0 : 1),
        _ => 0
      )
    : 0;

  const stack = [
    {
      ply: initialPly,
      node: game.moves,
      i: 0,
    },
  ];

  let first = true,
    needsMoveNumber = true;
  while (stack.length) {
    const frame = stack[stack.length - 1];
    if (frame.i < frame.node.children.length) {
      const child = frame.node.children[frame.i];
      if (child.data.startingComment) {
        builder.push(' { ', child.data.startingComment.replace('}', ''), ' }');
      }
      if (needsMoveNumber || frame.ply % 2 == 0) {
        if (!first) builder.push(' ');
        builder.push(Math.floor(frame.ply / 2) + 1 + (frame.ply % 2 ? '...' : '.'));
      }
      builder.push(' ', child.data.san);

      stack.push({
        ply: frame.ply + 1,
        node: child,
        i: 0,
      });

      if (child.data.nags) {
        for (const nag of child.data.nags) {
          builder.push(' $' + nag);
        }
        needsMoveNumber = true;
      }
      if (child.data.comment) {
        builder.push(' { ', child.data.comment.replace('}', ''), ' }');
        needsMoveNumber = true;
      }
      frame.i++;
      first = false;
    } else stack.pop();
  }

  if (game.moves.children.length) builder.push(' ');
  builder.push(makeOutcome(parseOutcome(game.headers.get('Result'))));
}

export function makePgn(game: Game<PgnNodeData>): string {
  const builder: string[] = [];
  appendPgn(builder, game);
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
