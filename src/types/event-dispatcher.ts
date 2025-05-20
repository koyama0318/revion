import type { Command } from './command'

export type CommandDispatcher = {
  dispatch(command: Command): Promise<void>
}
