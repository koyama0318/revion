import { describe, expect, it } from 'bun:test'
import { CommandDispatcherMock } from '../../src/utils/command-dispatcher-mock'

describe('command dispatcher mock', () => {
  describe('dispatch', () => {
    it('should store command', async () => {
      const dispatcher = new CommandDispatcherMock()
      const command = {
        operation: 'create',
        id: { type: 'counter', id: '1' }
      }
      await dispatcher.dispatch(command)
      expect(dispatcher.getCommands()).toEqual([command])
    })

    it('should dispatch command', async () => {
      const dispatcher = new CommandDispatcherMock()
      const command = {
        type: 'counter',
        operation: 'increment',
        id: { type: 'counter', id: '1' }
      }

      await dispatcher.dispatch(command)
      const commands = dispatcher.getCommands()
      expect(commands).toHaveLength(1)
      expect(commands[0]).toEqual(command)
    })
  })

  describe('getCommands', () => {
    it('should return empty array when no commands', () => {
      const dispatcher = new CommandDispatcherMock()
      expect(dispatcher.getCommands()).toEqual([])
    })

    it('should return all commands', async () => {
      const dispatcher = new CommandDispatcherMock()
      const command1 = {
        operation: 'create',
        id: { type: 'counter', id: '1' }
      }
      const command2 = {
        operation: 'increment',
        id: { type: 'counter', id: '1' }
      }
      await dispatcher.dispatch(command1)
      await dispatcher.dispatch(command2)
      expect(dispatcher.getCommands()).toEqual([command1, command2])
    })
  })

  describe('reset', () => {
    it('should clear commands', async () => {
      const dispatcher = new CommandDispatcherMock()
      const command = {
        operation: 'create',
        id: { type: 'counter', id: '1' }
      }
      await dispatcher.dispatch(command)
      dispatcher.reset()
      expect(dispatcher.getCommands()).toEqual([])
    })

    it('should reset commands', async () => {
      const dispatcher = new CommandDispatcherMock()
      const command = {
        type: 'counter',
        operation: 'increment',
        id: { type: 'counter', id: '1' }
      }

      await dispatcher.dispatch(command)
      dispatcher.reset()
      const commands = dispatcher.getCommands()
      expect(commands).toHaveLength(0)
    })
  })
})
