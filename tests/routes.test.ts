import { adminRoute, adminViewFor, studentRoute, studentViewFor, type AdminView, type StudentView } from '../src/routes'

describe('application routes', () => {
  test.each<StudentView>(['chat', 'resources', 'breathing', 'help', 'history'])('%s preserves preview', view => {
    const target = new URL(studentRoute(view, true), 'http://localhost')
    expect(studentViewFor(target.pathname)).toBe(view)
    expect(target.searchParams.get('preview')).toBe('1')
  })
  test.each<AdminView>(['overview', 'conversations', 'alerts', 'resources', 'tips', 'exercises', 'moods', 'users', 'settings'])('maps admin %s', view => expect(adminViewFor(adminRoute(view))).toBe(view))
  test('unknown and root student paths open chat', () => { expect(studentViewFor('/')).toBe('chat'); expect(studentViewFor('/unknown')).toBe('chat') })
})
