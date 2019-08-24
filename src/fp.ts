export interface Ok<V, E = never> {
  value: V;
  map<U>(f: (value: V) => U): Ok<U, never>;
}

export interface Err<V, E> {
  error: E;
  map<U>(f: (value: V) => U): Err<never, E>;
}

export type Result<V, E = undefined> = {
  value?: V,
  error?: E,
  map<U>(f: (value: V) => U): Result<U, E>;
}

export function ok<V, E>(value: V): Ok<V, E> {
  return {
    value,
    map<T>(f: (value: V) => T) {
      return ok(f(value));
    }
  };
}

export function isOk<V, E>(result: Result<V, E>): result is Ok<V, E> {
  return 'value' in result;
}

export function err<V, undefined>(): Err<V, undefined>;
export function err<V, E>(error: E): Err<V, E>;
export function err<V, E>(error?: E): Err<V, E | undefined> {
  return {
    error,
    map<T>(f: (value: V) => T) {
      return err(error);
    }
  }
}

export function unwrap<V>(result: Result<V, string>): V {
  if (isOk(result)) return result.value;
  else throw new Error(result.error);
}
