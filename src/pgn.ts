export interface Game<T> {
  headers: Map<string, string>;
  moves: Node<T>;
}

export class Node<T> {
  children: ChildNode<T>[];
}

export class ChildNode<T> extends Node<T> {
  constructor(public data: T) {
    super();
  }
}

export interface PgnNodeData {
  ply: number;
  san: string;
  startingComment?: string;
  comment?: string;
  nags?: number[];
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
