import 'dotenv/config'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { Client } from 'pg'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required')
const source = new URL(process.env.DATABASE_URL)
const adminUrl = new URL(source)
adminUrl.pathname = '/postgres'
adminUrl.searchParams.delete('schema')
const databaseName = `school_erp_seed_verify_${Date.now()}`
const tempUrl = new URL(source)
tempUrl.pathname = `/${databaseName}`
const admin = new Client({ connectionString: adminUrl.toString() })
let created = false

function run(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: tempUrl.toString() },
    stdio: 'inherit',
  })
  if (result.status !== 0) throw new Error(`${script} failed with exit code ${result.status}`)
}

try {
  await admin.connect()
  await admin.query(`CREATE DATABASE "${databaseName}"`)
  created = true
  run('node_modules/prisma/build/index.js', ['migrate', 'deploy'])
  for (let runNumber = 0; runNumber < 2; runNumber++) {
    run('node_modules/tsx/dist/cli.mjs', ['prisma/seed.ts'])
    const db = new Client({ connectionString: tempUrl.toString() })
    try {
      await db.connect()
      const counts = await db.query('SELECT (SELECT count(*) FROM "User")::int AS users, (SELECT count(*) FROM "Student")::int AS students, (SELECT count(*) FROM "Attendance")::int AS attendance, (SELECT count(*) FROM "AttendanceAudit")::int AS audits')
      assert.deepEqual(counts.rows[0], { users: 3, students: 12, attendance: 30, audits: 30 })
      const contacts = await db.query('SELECT count(*)::int AS total FROM "Student" WHERE gender IS NOT NULL AND email IS NOT NULL AND "phoneNumber" IS NOT NULL')
      assert.equal(contacts.rows[0].total, 12)
    } finally { await db.end() }
  }
  console.log('Fresh seed passed twice with stable user, student, attendance, audit and contact counts.')
} finally {
  if (created) await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`)
  await admin.end()
}
