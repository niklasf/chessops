import { defined } from './util.js';
import { Outcome } from './types.js';

export interface Game<T> {
  headers: Map<string, string>;
  moves: Node<T>;
}

export class Node<T> {
  children: ChildNode<T>[] = [];
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
  ply: number;
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

export function parseOutcome(s: string): Outcome | undefined {
  if (s === '1-0') return { winner: 'white' };
  else if (s === '0-1') return { winner: 'black' };
  else if (s === '1/2-1/2') return { winner: undefined };
  else return;
}

function escapeHeader(value: string): string {
  return value; // TODO!
}

export function appendPgn(builder: string[], game: Game<PgnNodeData>): void {
  if (game.headers.size) {
    for (const [key, value] of game.headers.entries()) {
      builder.push('[', key, ' "', escapeHeader(value), '"]\n');
    }
    builder.push('\n');
  }
}

export function makePgn(game: Game<PgnNodeData>): string {
  const builder: string[] = [];
  appendPgn(builder, game);
  return builder.join();
}
