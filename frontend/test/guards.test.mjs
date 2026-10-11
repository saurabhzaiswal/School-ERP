import test from 'node:test'
import assert from 'node:assert/strict'
import { routeDecision } from '../src/router/guards.js'

test('signed-in user cannot return to the login screen', () => {
  assert.equal(routeDecision({ path: '/login', fullPath: '/login', meta: {} }, { role: 'TEACHER' }), '/students')
})
test('guest is sent to login with intended page retained', () => {
  assert.deepEqual(routeDecision({ path: '/attendance', fullPath: '/attendance?grade=8', meta: { requiresAuth: true } }, null), { path: '/login', query: { redirect: '/attendance?grade=8' } })
})
test('teacher cannot enter admin routes', () => {
  assert.equal(routeDecision({ path: '/users', fullPath: '/users', meta: { requiresAuth: true, adminOnly: true } }, { role: 'TEACHER' }), '/students')
  assert.equal(routeDecision({ path: '/users', fullPath: '/users', meta: { requiresAuth: true, adminOnly: true } }, { role: 'ADMIN' }), undefined)
})
