import { todoResolver } from '@feature/todo/todo-resolver'
import express from 'express'
import { todo } from 'feature/todo'
import { todoReactor } from 'feature/todo/todo-reactor'
import { FakeHandler } from 'revion'

export const createApp = () => {
  const app = express()
  app.use(express.json())

  const handler = new FakeHandler({
    aggregates: [todo],
    services: [],
    reactors: [todoReactor],
    resolvers: [todoResolver]
  })

  app.post('/command', async (req, res) => {
    try {
      const command = req.body

      if (!command || typeof command !== 'object') {
        res.status(400).json({ ok: false, error: 'Invalid request body' })
        return
      }

      if (!command.operation) {
        res.status(400).json({ ok: false, error: 'Missing operation field' })
        return
      }

      const result = await handler.command(command)

      if (result.ok) {
        res.json({ ok: true, data: result.value })
      } else {
        res.status(400).json({ ok: false, error: result.error.message })
      }
    } catch (error) {
      console.error('Command error:', error)
      res.status(500).json({ ok: false, error: 'Internal server error' })
    }
  })

  app.post('/query', async (req, res) => {
    try {
      const query = req.body
      const result = await handler.query(query)

      if (result.ok) {
        res.json({ ok: true, data: result.value })
      } else {
        res.status(400).json({ ok: false, error: result.error.message })
      }
    } catch (error) {
      console.error('Query error:', error)
      res.status(500).json({ ok: false, error: 'Internal server error' })
    }
  })

  return { app, handler }
}
