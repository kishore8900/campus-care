import 'dotenv/config'

const base = process.env.VITE_API_URL || 'http://localhost:4000'
const adminEmail = process.env.ADMIN_EMAIL
const adminPassword = process.env.ADMIN_PASSWORD
if (!adminEmail || !adminPassword) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured before running this check.')

const request = (path, init = {}) => fetch(base + path, init)
const jsonHeaders = { 'content-type': 'application/json' }
const expectStatus = async (response, expected, label) => {
  if (response.status !== expected) throw new Error(`${label}: expected ${expected}, received ${response.status}`)
}

await expectStatus(await request('/api/admin/analytics'), 401, 'Anonymous admin access')
await expectStatus(await request('/api/auth/register', {
  method: 'POST', headers: jsonHeaders,
  body: JSON.stringify({ name: 'Reserved account check', email: adminEmail, password: 'student-password-123' })
}), 403, 'Reserved admin email registration')

const studentEmail = `student-smoke-${Date.now()}@college.edu`
const studentRegistration = await request('/api/auth/register', {
  method: 'POST', headers: jsonHeaders,
  body: JSON.stringify({ name: 'Access check student', email: studentEmail, password: 'student-password-123' })
})
await expectStatus(studentRegistration, 201, 'Student registration')
const student = await studentRegistration.json()
await expectStatus(await request('/api/admin/settings', { headers: { authorization: `Bearer ${student.token}` } }), 403, 'Student admin access')

const adminLogin = await request('/api/auth/login', {
  method: 'POST', headers: jsonHeaders,
  body: JSON.stringify({ email: adminEmail, password: adminPassword })
})
await expectStatus(adminLogin, 200, 'Admin login')
const admin = await adminLogin.json()
const adminHeaders = { ...jsonHeaders, authorization: `Bearer ${admin.token}` }
await expectStatus(await request('/api/admin/analytics', { headers: adminHeaders }), 200, 'Admin analytics access')

const created = await request('/api/admin/resources', {
  method: 'POST', headers: adminHeaders,
  body: JSON.stringify({ title: 'Temporary access check', description: 'Created by the local admin authorization smoke test.', contact: 'Not published', hours: 'Not published', kind: 'test', verified: false })
})
await expectStatus(created, 201, 'Admin resource create')
const resource = await created.json()
await expectStatus(await request(`/api/admin/resources/${resource.id}`, { method: 'DELETE', headers: adminHeaders }), 204, 'Admin resource cleanup')

console.log('Admin boundary passed: anonymous 401, student 403, configured college admin 200, CRUD verified.')
