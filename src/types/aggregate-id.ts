declare const __brand: unique symbol
type Brand = { readonly [__brand]: 'AggregateId' }

const zeroUUID = '00000000-0000-0000-0000-000000000000'

export type AggregateId<T extends string = string> = {
  readonly type: T
  readonly id: string
} & Brand

export function id<T extends string>(type: T, id: string): AggregateId<T> {
  return {
    type,
    id
  } as AggregateId<T>
}

export function zeroId<T extends string>(type: T): AggregateId<T> {
  return {
    type,
    id: zeroUUID
  } as AggregateId<T>
}

export function isAggregateId(value: unknown): value is AggregateId {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const obj = value as Brand

  return '__brand' in obj && obj[__brand] === 'AggregateId'
}

export function isZero(value: AggregateId) {
  return value.id === zeroUUID
}
