/**
 * A Result type that represents either success (Ok) or failure (Err)
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>

/**
 * Represents a successful operation
 */
export class Ok<T, E> {
  readonly value: T

  constructor(value: T) {
    this.value = value
  }

  isOk(): this is Ok<T, E> {
    return true
  }

  isErr(): this is Err<T, E> {
    return false
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value))
  }

  mapErr<U>(fn: (err: E) => U): Result<T, U> {
    return new Ok<T, U>(this.value)
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value)
  }

  _unsafeUnwrap(): T {
    return this.value
  }

  _unsafeUnwrapErr(): E {
    throw new Error('Called _unsafeUnwrapErr on an Ok value')
  }
}

/**
 * Represents a failed operation
 */
export class Err<T, E> {
  readonly error: E

  constructor(error: E) {
    this.error = error
  }

  isOk(): this is Ok<T, E> {
    return false
  }

  isErr(): this is Err<T, E> {
    return true
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Err<U, E>(this.error)
  }

  mapErr<U>(fn: (err: E) => U): Result<T, U> {
    return new Err<T, U>(fn(this.error))
  }

  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Err<U, E>(this.error)
  }

  _unsafeUnwrap(): T {
    throw new Error(`Called _unsafeUnwrap on an Err value: ${this.error}`)
  }

  _unsafeUnwrapErr(): E {
    return this.error
  }
}

/**
 * Creates an Ok result
 */
export const ok = <T, E>(value: T): Result<T, E> => {
  return new Ok<T, E>(value)
}

/**
 * Creates an Err result
 */
export const err = <T, E>(error: E): Result<T, E> => {
  return new Err<T, E>(error)
}
