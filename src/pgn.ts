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

interface AppendPgnFrame {
  ply: number;
  state: 'pre' | 'variations' | 'end';
  parent: Node<PgnNodeData>;
  variation: number;
  isVariation: boolean;
  inVariation: boolean;
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

  const stack: AppendPgnFrame[] = [
    {
      ply: initialPly,
      parent: game.moves,
      state: 'pre',
      variation: 1,
      isVariation: false,
      inVariation: false,
    },
  ];

  let first = true,
    needsMoveNumber = true;
  while (stack.length) {
    const frame = stack[stack.length - 1];

    if (frame.inVariation) {
      frame.inVariation = false;
      builder.push(' )');
    }

    if (frame.state == 'pre') {
      const child = frame.parent.children[0];
      if (child.data.startingComment) {
        builder.push(' { ', child.data.startingComment.replace('}', ''), ' }');
      }
      if (needsMoveNumber || frame.ply % 2 == 0) {
        if (!first) builder.push(' ');
        builder.push(Math.floor(frame.ply / 2) + 1 + (frame.ply % 2 == 0 ? '.' : '...'));
        needsMoveNumber = false;
      }
      builder.push(' ', child.data.san);
      for (const nag of child.data.nags || []) {
        builder.push(' $' + nag);
      }
      if (child.data.comment) {
        builder.push(' { ', child.data.comment.replace('{', ''), ' }');
      }
      frame.state = 'variations';
    } else if (frame.state == 'variations') {
      if (frame.variation < frame.parent.children.length) {
        frame.variation++;
      } else {
        frame.state = 'end';
      }
    } else if (frame.state == 'end') {
      stack.pop();
    }

    first = false;
  }

  if (!first) builder.push(' ');
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
