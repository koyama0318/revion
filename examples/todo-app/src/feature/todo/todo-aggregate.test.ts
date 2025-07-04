import { describe, expect, test } from 'bun:test'
import { aggregateFixture, zeroId } from 'revion'
import { todo } from './todo-aggregate'

describe('[todo-app] todo aggregate tests', () => {
  test('create', () => {
    aggregateFixture(todo)
      .when({ operation: 'create', id: zeroId('todo'), title: 'Test Todo' })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.state.after.id.type).toBe('todo')
          expect(ctx.state.after.parentId).toBe(null)
          expect(ctx.state.after.title).toBe('Test Todo')
          expect(ctx.state.after.priority).toBe('none')
          expect(ctx.state.after.status).toBe('incomplete')
          expect(ctx.state.after.dueDate).toBe(null)
          expect(ctx.state.after.createdAt).toEqual(expect.any(Date))
          expect(ctx.state.after.updatedAt).toEqual(expect.any(Date))
          expect(ctx.state.after.deletedAt).toBe(null)
          expect(ctx.version.diff).toBe(1)
          expect(ctx.version.latest).toBe(1)
        })
      })
  })

  test('edit', () => {
    const todoId = zeroId('todo')
    aggregateFixture(todo)
      .givenId(todoId)
      .given({
        type: 'created',
        id: todoId,
        parentId: null,
        title: 'Original Title',
        priority: 'none',
        status: 'incomplete',
        dueDate: null
      })
      .when({ operation: 'edit', id: todoId, title: 'Updated Title', priority: 'high' })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.state.after.title).toBe('Updated Title')
          expect(ctx.state.after.priority).toBe('high')
          expect(ctx.version.diff).toBe(1)
          expect(ctx.version.latest).toBe(2)
        })
      })
  })

  test('update status', () => {
    const todoId = zeroId('todo')
    aggregateFixture(todo)
      .givenId(todoId)
      .given({
        type: 'created',
        id: todoId,
        parentId: null,
        title: 'Test Todo',
        priority: 'none',
        status: 'incomplete',
        dueDate: null
      })
      .when({ operation: 'updateStatus', id: todoId, status: 'completed' })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.state.after.status).toBe('completed')
          expect(ctx.version.diff).toBe(1)
          expect(ctx.version.latest).toBe(2)
        })
      })
  })

  test('delete', () => {
    const todoId = zeroId('todo')
    aggregateFixture(todo)
      .givenId(todoId)
      .given({
        type: 'created',
        id: todoId,
        parentId: null,
        title: 'Test Todo',
        priority: 'none',
        status: 'incomplete',
        dueDate: null
      })
      .when({ operation: 'delete', id: todoId })
      .then(fixture => {
        fixture.assert(ctx => {
          expect(ctx.error).toBeNull()
          expect(ctx.state.after.deletedAt).toEqual(expect.any(Date))
          expect(ctx.version.diff).toBe(1)
          expect(ctx.version.latest).toBe(2)
        })
      })
  })
})
