import 'dotenv/config'
import assert from 'node:assert/strict'
import pg from 'pg'

const base = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000/api'
const password = process.env.DEMO_PASSWORD ?? 'SchoolDemo!2026'
let createdId = null
let createdAttendanceId = null
let createdUserId = null

async function login(email, loginPassword = password) {
  const response = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: loginPassword }) })
  assert.equal(response.status, 201, `Login failed for ${email}`)
  return { cookie: response.headers.get('set-cookie')?.split(';')[0], csrf: response.headers.get('x-csrf-token') }
}
async function call(session, method, path, body, token = session.csrf) {
  const response = await fetch(`${base}${path}`, { method, headers: { cookie: session.cookie, ...(token ? { 'x-csrf-token': token } : {}), ...(body ? { 'content-type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
  const data = await response.json().catch(() => ({}))
  return { status: response.status, data }
}
async function assertAdmissionUnique(admissionNumber) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  try {
    await assert.rejects(
      pool.query('INSERT INTO "Student" ("admissionNumber", name, grade, section, "guardianName", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW())', [admissionNumber, 'Duplicate Test', '8', 'A', 'Demo Guardian']),
      error => error.code === '23505',
    )
  } finally { await pool.end() }
}
async function assertCorrectionAudit(attendanceId) {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  try {
    const result = await pool.query('SELECT "oldStatus", "newStatus" FROM "AttendanceAudit" WHERE "attendanceId" = $1 ORDER BY "changedAt" DESC LIMIT 1', [attendanceId])
    assert.deepEqual(result.rows[0], { oldStatus: 'PRESENT', newStatus: 'LATE' })
  } finally { await pool.end() }
}

async function cleanUp() {
  if (!createdId) return
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    if (createdAttendanceId) await client.query('DELETE FROM "ActivityLog" WHERE "entityType" = $1 AND "entityId" = $2', ['ATTENDANCE', createdAttendanceId])
    if (createdId) await client.query('DELETE FROM "ActivityLog" WHERE "entityType" = $1 AND "entityId" = $2', ['STUDENT', createdId])
    if (createdUserId) {
      await client.query('DELETE FROM "ActivityLog" WHERE "actorId" = $1 OR ("entityType" = $2 AND "entityId" = $3)', [createdUserId, 'USER', createdUserId])
      await client.query('DELETE FROM "User" WHERE id = $1', [createdUserId])
    }
    await client.query('DELETE FROM "AttendanceAudit" WHERE "attendanceId" IN (SELECT id FROM "Attendance" WHERE "studentId" = $1)', [createdId])
    await client.query('DELETE FROM "Attendance" WHERE "studentId" = $1', [createdId])
    await client.query('DELETE FROM "Student" WHERE id = $1', [createdId])
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

try {
  const admin = await login('admin@school.local')
  const teacher = await login('teacher@school.local')
  assert.equal((await call(admin, 'GET', '/auth/profile')).status, 200)
  const listed = await call(admin, 'GET', '/students?page=1&per_page=2')
  assert.equal(listed.status, 200)
  assert.ok(listed.data.items.length <= 2)
  assert.equal(listed.data.per_page, 2)

  const student = await call(admin, 'POST', '/students', { name: 'Verification Learner', gender: 'OTHER', email: 'learner@school.test', phoneNumber: '+919876543210', grade: '8', section: 'A', guardianName: 'Demo Guardian', active: true, feeStatus: 'PENDING', amountDue: 1250 })
  assert.equal(student.status, 201, JSON.stringify(student.data))
  createdId = student.data.id
  assert.equal(student.data.phoneNumber, '+919876543210')
  assert.match(student.data.admissionNumber, /^SCH-\d{4}-\d{6,}$/)
  await assertAdmissionUnique(student.data.admissionNumber)
  assert.equal((await call(admin, 'POST', '/students', { ...student.data, admissionNumber: student.data.admissionNumber })).status, 400)
  const namePatch = await call(admin, 'PATCH', `/students/${createdId}`, { name: 'Verification Learner Updated' })
  assert.equal(namePatch.status, 200)
  assert.equal(namePatch.data.feeStatus, 'PENDING')
  assert.equal(Number(namePatch.data.amountDue), 1250)
  assert.equal((await call(admin, 'PATCH', `/students/${createdId}`, { feeStatus: 'PAID' })).status, 400)
  const feePatch = await call(admin, 'PATCH', `/students/${createdId}`, { feeStatus: 'PAID', amountDue: 0 })
  assert.equal(feePatch.status, 200)
  assert.equal(Number(feePatch.data.amountDue), 0)
  assert.equal((await call(admin, 'PATCH', `/students/${createdId}`, { feeStatus: 'PENDING', amountDue: 1250 })).status, 200)
  assert.equal((await call(admin, 'GET', `/students/dues?q=${student.data.admissionNumber}`)).data.total, 1)

  const teacherStudent = await call(teacher, 'GET', `/students/${createdId}`)
  assert.equal(teacherStudent.status, 200)
  assert.equal('amountDue' in teacherStudent.data, false)
  assert.equal((await call(teacher, 'GET', '/attendance?grade=9&section=B&date=2026-10-10')).status, 403)
  const crossClassStudent = (await call(admin, 'GET', '/students?grade=9&section=B&per_page=1')).data.items[0]
  assert.equal((await call(teacher, 'GET', `/students/${crossClassStudent.id}`)).status, 403)
  assert.equal((await call(teacher, 'GET', `/attendance/student/${crossClassStudent.id}`)).status, 403)
  assert.equal((await call(teacher, 'POST', '/attendance', { studentId: crossClassStudent.id, date: '2026-10-09', status: 'PRESENT' })).status, 403)
  assert.equal((await call(teacher, 'POST', '/attendance', { studentId: createdId, date: 'not-a-date', status: 'PRESENT' })).status, 400)
  assert.equal((await call(teacher, 'POST', '/attendance', { studentId: createdId, date: '2026-10-09', status: 'PRESENT' }, '')).status, 403)

  const attempts = await Promise.all([
    call(teacher, 'POST', '/attendance', { studentId: createdId, date: '2026-10-09', status: 'PRESENT' }),
    call(teacher, 'POST', '/attendance', { studentId: createdId, date: '2026-10-09', status: 'PRESENT' }),
  ])
  assert.deepEqual(attempts.map(result => result.status).sort(), [201, 409])
  const record = attempts.find(result => result.status === 201)
  assert.equal(record.status, 201, JSON.stringify(record.data))
  createdAttendanceId = record.data.id
  assert.equal((await call(teacher, 'POST', '/attendance', { studentId: createdId, date: '2026-10-09', status: 'ABSENT' })).status, 409)
  assert.equal((await call(teacher, 'PUT', `/attendance/${record.data.id}`, { status: 'LATE' })).status, 200)
  await assertCorrectionAudit(record.data.id)
  const history = await call(teacher, 'GET', `/attendance/student/${createdId}?page=1&per_page=10`)
  assert.equal(history.data.items[0].status, 'LATE')
  const register = await call(teacher, 'GET', '/attendance?grade=8&section=A&date=2026-10-09&page=1&per_page=2')
  assert.equal(register.status, 200)
  assert.ok(register.data.items.length <= 2)
  assert.ok(register.data.totals.LATE >= 1)
  const email = `smoke-${Date.now()}@school.local`
  const newUser = await call(admin, 'POST', '/users', { name: 'Verification Teacher', email, gender: 'PREFER_NOT_TO_SAY', phoneNumber: '+919876543211', role: 'TEACHER', active: true, password: 'TemporaryPass!2026', assignments: [{ grade: '8', section: 'A' }] })
  assert.equal(newUser.status, 201, JSON.stringify(newUser.data))
  createdUserId = newUser.data.id
  assert.equal('passwordHash' in newUser.data, false)
  assert.equal((await call(admin, 'GET', '/users?per_page=2')).data.per_page, 2)
  assert.ok((await call(admin, 'GET', '/users/stats')).data.teachers >= 2)
  const newTeacher = await login(email, 'TemporaryPass!2026')
  const ownProfile = await call(newTeacher, 'GET', '/auth/profile')
  assert.equal(ownProfile.data.assignments[0].grade, '8')
  assert.equal(ownProfile.data.gender, 'PREFER_NOT_TO_SAY')
  assert.equal(ownProfile.data.phoneNumber, '+919876543211')
  assert.equal((await call(newTeacher, 'GET', '/users')).status, 403)
  const ownActivity = await call(newTeacher, 'GET', '/activity')
  assert.equal(ownActivity.status, 200)
  assert.ok(ownActivity.data.items.every(item => item.actorId === createdUserId))
  const promoted = await call(admin, 'PATCH', `/users/${createdUserId}`, { role: 'ADMIN', assignments: [] })
  assert.equal(promoted.status, 200)
  assert.equal(promoted.data.role, 'ADMIN')
  assert.equal(promoted.data.assignments.length, 0)
  const demoted = await call(admin, 'PATCH', `/users/${createdUserId}`, { role: 'TEACHER', assignments: [{ grade: '8', section: 'A' }] })
  assert.equal(demoted.status, 200)
  assert.equal(demoted.data.assignments[0].grade, '8')
  const deactivated = await call(admin, 'PATCH', `/users/${createdUserId}`, { active: false })
  assert.equal(deactivated.status, 200, JSON.stringify(deactivated.data))
  const inactiveUsers = await call(admin, 'GET', `/users?active=false&q=${email}`)
  assert.equal(inactiveUsers.data.total, 1)
  assert.equal((await call(newTeacher, 'GET', '/auth/profile')).status, 401)
  const activity = await call(admin, 'GET', '/activity?q=Verification')
  assert.equal(activity.status, 200)
  assert.ok(activity.data.items.some(item => item.action === 'USER_CREATED'))
  assert.ok(activity.data.items.every(item => !item.action.startsWith('SESSION_')))
  const today = new Date().toISOString().slice(0, 10)
  const filteredActivity = await call(admin, 'GET', `/activity?role=TEACHER&dateFrom=${today}&dateTo=${today}`)
  assert.equal(filteredActivity.status, 200)
  assert.ok(filteredActivity.data.items.some(item => item.action === 'ATTENDANCE_RECORDED'))
  assert.ok(filteredActivity.data.items.every(item => item.actor.role === 'TEACHER'))
  assert.equal((await call(admin, 'GET', '/activity?q=SESSION_LOGIN')).data.total, 0)
  console.log('Live smoke passed: auth, pagination, admission, dues, class permissions, CSRF, attendance, user management, and activity log.')
} finally {
  await cleanUp()
}
