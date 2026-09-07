import { analyseMessage } from '../server/rules.js'
import { supportConversations, tanglishReference, resolveReplyLanguage, hasTanglishReplyText } from '../server/support-conversations.js'

describe('English and Tanglish support routing', () => {
  it('does not accept an English answer just because it mentions Tanglish', () => {
    expect(hasTanglishReplyText('I understand you want a Tanglish reply. How can I help?')).toBe(false)
    expect(hasTanglishReplyText('Vanakkam! Ungalukku enna help venum?')).toBe(true)
    expect(supportConversations.every(example => hasTanglishReplyText(example.tanglishResponse))).toBe(true)
  })
  it('respects explicit reply language and handles Tanglish greetings', () => {
    expect(resolveReplyLanguage('Hi', 'tanglish')).toBe('tanglish')
    expect(resolveReplyLanguage('Naalaiku exam nu romba bayama iruku.', 'english')).toBe('english')
    expect(tanglishReference('Hi')?.message).toMatch(/Vanakkam/)
    expect(tanglishReference('Vanakkam')?.message).toMatch(/ungalukku/)
    expect(analyseMessage('I want to hurt myself', 'tanglish').response).toMatch(/Unga safety/)
  })
  it('recognizes common Tanglish spelling variants', () => {
    expect(tanglishReference('Night thoonga mudiyala.')?.source.id).toBe('support-sleep-problem')
    expect(tanglishReference('Enakku romba assignments irukku, enga start panrathune therila.')?.source.id).toBe('support-academic-stress')
  })
  it.each(supportConversations)('routes both languages for $id', example => {
    for (const message of [example.englishMessage, example.tanglishMessage]) {
      const result = analyseMessage(message)
      expect(result.category).toBe(example.category)
      expect(result.needsHumanSupport).toBe(example.escalation)
      expect(result.response.length).toBeGreaterThan(30)
    }
    expect(analyseMessage(example.tanglishMessage).language).toBe('tanglish')
  })
  it.each([
    'Inime vazhanum nu thonala. Naalaiku exam.',
    'Enna hurt pannikanum pola iruku',
    'I don’t want to live anymore',
    'I am going to hurt someone after my exam',
    'Yaarayavadhu adikkanum',
    'I have severe chest pain and an exam tomorrow',
    'Moochu vida mudila'
  ])('prioritises urgent support for %s', message => {
    expect(analyseMessage(message).category).toBe('crisis')
    expect(analyseMessage(message).needsHumanSupport).toBe(true)
    expect(analyseMessage(message).response).toMatch(/emergency/i)
  })
  it('does not turn a human-support suggestion into an emergency alarm', () => {
    const result = analyseMessage('Neraya naala romba down ah feel panren.')
    expect(result.needsHumanSupport).toBe(true)
    expect(result.category).not.toBe('crisis')
  })
  it('does not interpret keyword fragments as wellbeing disclosures', () => {
    expect(analyseMessage('Tell me the latest news about forests').category).toBe('general')
    expect(analyseMessage('Everyone is better than me.').category).not.toBe('positive')
  })
})
