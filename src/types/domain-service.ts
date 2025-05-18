import type { CombinedFns } from '../command/combined'
import type { Command } from './command'

export type DomainServiceFn<C extends Command> = (
  command: C,
  combined: CombinedFns
) => Promise<void>
