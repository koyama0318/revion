import type { Command } from './aggregate'

export interface CommandDispatcher {
  dispatch(command: Command): Promise<void>
}
