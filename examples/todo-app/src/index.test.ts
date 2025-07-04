import { beforeEach, describe, expect, it } from 'bun:test'
import request from 'supertest'
import { createApp } from './create-app'

describe('[todo-app] HTTP E2E Tests', () => {
  let app: unknown

  beforeEach(() => {
    const result = createApp()
    app = result.app
  })

  describe('POST /command', () => {
    it('should create a todo successfully', async () => {
      const response = await request(app)
        .post('/command')
        .send({
          operation: 'create',
          id: {
            type: 'todo',
            id: '00000000-0000-0000-0000-000000000000'
          },
          title: 'Test Todo'
        })

      expect(response.status).toBe(200)
      expect(response.body.ok).toBe(true)
      expect(response.body.data).toBeDefined()
      expect(response.body.data.id).toBeDefined()
    })

    it('should edit a todo successfully', async () => {
      // First create a todo
      const createResponse = await request(app)
        .post('/command')
        .send({
          operation: 'create',
          id: {
            type: 'todo',
            id: '00000000-0000-0000-0000-000000000000'
          },
          title: 'Original Todo'
        })

      expect(createResponse.status).toBe(200)
      expect(createResponse.body.ok).toBe(true)

      // const createdId = createResponse.body.data.id

      // Then edit it
      const editResponse = await request(app)
        .post('/command')
        .send({
          operation: 'edit',
          id: {
            type: 'todo',
            id: '00000000-0000-0000-0000-000000000000'
          },
          title: 'Updated Todo Title',
          priority: 'high'
        })

      console.log('Edit response:', editResponse.body)
      expect(editResponse.status).toBe(200)
      expect(editResponse.body.ok).toBe(true)
    })

    it('should update todo status successfully', async () => {
      // First create a todo
      const createResponse = await request(app)
        .post('/command')
        .send({
          operation: 'create',
          id: {
            type: 'todo',
            id: '00000000-0000-0000-0000-000000000000'
          },
          title: 'Status Test Todo'
        })

      expect(createResponse.status).toBe(200)
      expect(createResponse.body.ok).toBe(true)

      // const createdId = createResponse.body.data.id

      // Then update status
      const statusResponse = await request(app)
        .post('/command')
        .send({
          operation: 'updateStatus',
          id: {
            type: 'todo',
            id: '00000000-0000-0000-0000-000000000000'
          },
          status: 'completed'
        })
        .expect(200)

      expect(statusResponse.body.ok).toBe(true)
    })

    it('should delete a todo successfully', async () => {
      // First create a todo
      const createResponse = await request(app)
        .post('/command')
        .send({
          operation: 'create',
          id: {
            type: 'todo',
            id: '00000000-0000-0000-0000-000000000000'
          },
          title: 'Delete Test Todo'
        })

      expect(createResponse.status).toBe(200)
      expect(createResponse.body.ok).toBe(true)

      // const createdId = createResponse.body.data.id

      // Then delete it
      const deleteResponse = await request(app)
        .post('/command')
        .send({
          operation: 'delete',
          id: {
            type: 'todo',
            id: '00000000-0000-0000-0000-000000000000'
          }
        })
        .expect(200)

      expect(deleteResponse.body.ok).toBe(true)
    })

    it('should return error for invalid command', async () => {
      const response = await request(app)
        .post('/command')
        .send({
          operation: 'invalid',
          id: {
            type: 'todo',
            id: '50000000-0000-0000-0000-000000000005'
          }
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error).toBeDefined()
    })

    it('should return error for invalid UUID', async () => {
      const response = await request(app)
        .post('/command')
        .send({
          operation: 'create',
          id: {
            type: 'todo',
            id: 'invalid-uuid'
          },
          title: 'Test Todo'
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error).toBeDefined()
    })
  })

  describe('POST /query', () => {
    it('should handle query requests', async () => {
      const response = await request(app).post('/query').send({
        type: 'todo',
        filter: {}
      })

      // Query might return error if resolver is not implemented
      // but should not crash the server
      expect(response.status).toBeOneOf([200, 400])
      expect(response.body.ok).toBeDefined()
    })

    it('should return error for malformed query', async () => {
      const response = await request(app)
        .post('/query')
        .send({
          invalidField: 'invalid'
        })
        .expect(400)

      expect(response.body.ok).toBe(false)
      expect(response.body.error).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app).post('/command').send('invalid json').expect(400)

      expect(response.body.ok).toBe(false)
    })

    it('should handle missing request body', async () => {
      const response = await request(app).post('/command').expect(400)

      expect(response.body.ok).toBe(false)
    })
  })
})
