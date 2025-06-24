import type { Command, CommandDispatcher } from '../types'

export class CommandDispatcherMock implements CommandDispatcher {
  private commands: Command[] = []

  dispatch(command: Command): Promise<void> {
    this.commands.push(command)
    return Promise.resolve()
  }

  getCommands(): Command[] {
    return this.commands
  }

  reset() {
    this.commands = []
  }
}
