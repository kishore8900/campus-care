import { retrieveKnowledge } from '../server/knowledge.js'
import { buildConversation, responseGuidance } from '../server/conversation-context.js'
import { studentConversations } from '../server/student-conversations.js'
import { supportConversations, isTanglish } from '../server/support-conversations.js'

describe('Student knowledge and conversation boundaries', () => {
  it('includes all ten academic examples and 25 bilingual support examples with unique IDs', () => {
    expect(studentConversations).toHaveLength(10)
    expect(supportConversations).toHaveLength(25)
    const ids = [...studentConversations, ...supportConversations].map(item => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('finds the stack topic for an exam-answer follow-up', () => {
    const found = retrieveKnowledge('Give me a 3-mark exam answer.', [], [], [
      { role: 'USER', message: 'Explain stack in simple words.' },
      { role: 'ASSISTANT', message: 'A stack follows LIFO.' }
    ])
    expect(found.sources.map(source => source.id)).toContain('sample-stacks')
    expect(found.context).toContain('push')
  })
  it('preserves the programming context of a short example request', () => {
    const history = [{ role: 'USER' as const, message: 'I am learning C programming. What is a loop?' }, { role: 'ASSISTANT' as const, message: 'C has for, while and do-while loops.' }]
    expect(responseGuidance('Give me a simple example.', history).guidance).toMatch(/programming/)
    expect(retrieveKnowledge('Give me a simple example.', [], [], history).sources[0].id).toBe('sample-c-loops')
    expect(retrieveKnowledge('What is photosynthesis?', [], [], history).sources).toEqual([])
  })
  it('does not copy old programming requirements into a new science question', () => {
    expect(responseGuidance('What is photosynthesis? Explain it in two sentences.', [{ role: 'USER', message: 'Explain Python code' }]).guidance).toMatch(/Do not include programming code/)
  })
  it('retrieves the relevant Tanglish example instead of unrelated English notes', () => {
    const found = retrieveKnowledge('Naalaiku exam nu romba bayama iruku.', [], [])
    expect(found.sources[0].id).toBe('support-exam-anxiety')
    expect(found.context).toContain('Endha subject exam?')
    expect(isTanglish('Naalaiku exam nu romba bayama iruku.')).toBe(true)
    expect(isTanglish('Explain the difference between a stack and a queue')).toBe(false)
  })
  it('documents the missing file-upload capability honestly', () => {
    expect(retrieveKnowledge('I uploaded my notes. Explain Chapter 2.', [], []).context).toContain('cannot open uploaded files')
  })
  it('matches full phrases rather than confusing full-stack with a stack explanation', () => {
    expect(retrieveKnowledge('I want to become a full-stack developer', [], []).sources[0].id).toBe('sample-full-stack')
    expect(retrieveKnowledge('What are the latest scientific discoveries?', [], []).sources).toEqual([])
  })
  it('retrieves coding guidance without unrelated wellbeing material', () => {
    const found = retrieveKnowledge('Help debug my Python code', [], [])
    expect(found.sources.map(source => source.id)).toContain('coding')
    expect(found.sources.map(source => source.id)).not.toContain('connection')
  })
  it('excludes demonstration college contacts unless verified', () => {
    const resource = { id: 'test', title: 'Counselling office', description: 'Appointments', contact: 'real@example.edu', hours: 'Weekdays', kind: 'counselling' }
    expect(retrieveKnowledge('counselling campus contact', [resource], []).context).not.toContain(resource.contact)
    expect(retrieveKnowledge('counselling campus contact', [{ ...resource, verified: true }], []).context).toContain(resource.contact)
  })
  it('does not attach references to an unrelated general knowledge question', () => {
    expect(retrieveKnowledge('What is photosynthesis?', [], []).sources).toEqual([])
  })
  it('keeps roles and formatting for a follow-up', () => {
    expect(buildConversation([{ role: 'USER', message: 'Explain Python lists' }, { role: 'ASSISTANT', message: 'Example:\n```python\na = []\n```' }], 'Show another example')).toEqual([
      { role: 'user', content: 'Explain Python lists' },
      { role: 'assistant', content: 'Example:\n```python\na = []\n```' },
      { role: 'user', content: 'Show another example' }
    ])
  })
  it('drops an oversized old exchange rather than cutting code in half', () => {
    const result = buildConversation([{ role: 'USER', message: 'Old request' }, { role: 'ASSISTANT', message: 'x'.repeat(6000) }, { role: 'USER', message: 'Latest request' }, { role: 'ASSISTANT', message: 'Latest answer' }], 'Continue')
    expect(result.map(item => item.content)).toEqual(['Latest request', 'Latest answer', 'Continue'])
  })
  it('ignores a leading orphaned assistant reply', () => {
    expect(buildConversation([{ role: 'ASSISTANT', message: 'orphaned history' }], 'New question')).toEqual([{ role: 'user', content: 'New question' }])
  })
})
