import { analyseMessage } from '../server/rules.js'

describe('CampusCare rule engine', () => {
  it('prioritises emergency guidance over ordinary support', () => {
    const result = analyseMessage('I have an exam tomorrow and want to hurt myself')
    expect(result.category).toBe('crisis')
    expect(result.response).toMatch(/safety matters/i)
  })

  it.each([
    ['I am anxious about my presentation', 'anxiety'],
    ['I cannot sleep before exams', 'exam'],
    ['I feel lonely at university', 'loneliness'],
    ['I am so burned out this week', 'burnout']
  ])('classifies %s as %s', (message, category) => {
    expect(analyseMessage(message).category).toBe(category)
  })

  it('returns a safe general response for unrelated text', () => {
    const result = analyseMessage('I would like to talk about my afternoon')
    expect(result.category).toBe('general')
    expect(result.response).toMatch(/Thanks for sharing/i)
  })
})
