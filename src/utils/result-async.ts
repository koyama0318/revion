import { type Result, err, ok } from './result'

/**
 * A Result type that represents an asynchronous operation that can succeed or fail
 */
export class ResultAsync<T, E> {
  private readonly promise: Promise<Result<T, E>>

  constructor(promise: Promise<Result<T, E>>) {
    this.promise = promise
  }

  async isOk(): Promise<boolean> {
    const result = await this.promise
    return result.isOk()
  }

  async isErr(): Promise<boolean> {
    const result = await this.promise
    return result.isErr()
  }

  async map<U>(fn: (value: T) => U): Promise<Result<U, E>> {
    const result = await this.promise
    return result.map(fn)
  }

  async mapErr<U>(fn: (err: E) => U): Promise<Result<T, U>> {
    const result = await this.promise
    return result.mapErr(fn)
  }

  async andThen<U>(fn: (value: T) => Result<U, E>): Promise<Result<U, E>> {
    const result = await this.promise
    return result.andThen(fn)
  }

  async _unsafeUnwrap(): Promise<T> {
    const result = await this.promise
    return result._unsafeUnwrap()
  }

  async _unsafeUnwrapErr(): Promise<E> {
    const result = await this.promise
    return result._unsafeUnwrapErr()
  }
}

/**
 * Creates an async Ok result
 */
export const okAsync = <T, E>(value: T): ResultAsync<T, E> => {
  return new ResultAsync<T, E>(Promise.resolve(ok<T, E>(value)))
}

/**
 * Creates an async Err result
 */
export const errAsync = <T, E>(error: E): ResultAsync<T, E> => {
  return new ResultAsync<T, E>(Promise.resolve(err<T, E>(error)))
}

/**
 * Converts a Promise<T> to a ResultAsync<T, E>
 */
export const fromPromise = <T, E extends Error>(
  promise: Promise<T>
): ResultAsync<T, E> => {
  return new ResultAsync<T, E>(
    promise.then(value => ok<T, E>(value)).catch(error => err<T, E>(error as E))
  )
}
