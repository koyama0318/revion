import type { Command } from './aggregate'

export interface CommandDispatcher {
  dispatch(command: Command): void
}
