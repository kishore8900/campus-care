import { referenceReply } from '../server/reply-routing.js'
import { analyseMessage } from '../server/rules.js'
import { retrieveKnowledge } from '../server/knowledge.js'
import { matchSupportExample, resolveReplyLanguage } from '../server/support-conversations.js'

describe('Relevant bilingual replies', () => {
  it.each(['enna pandra', 'enna panra?', 'Enna pannra bro?', 'ennapandra', 'hi enna panreenga'])('answers the reported small-talk case: %s', text => {
    const reply = referenceReply(text)
    expect(reply?.source.id).toBe('conversation-doing')
    expect(reply?.message).toContain('Ungaloda pesittu irukken')
    expect(reply?.message).not.toMatch(/kashtama iruku|English select|local AI/i)
  })
  it.each([
    ['what are you doing?', 'conversation-doing', /here chatting/],
    ['how are you?', 'conversation-how-are-you', /How are you doing/],
    ['epdi iruka', 'conversation-how-are-you', /Neenga epdi/],
    ['saptiya', 'conversation-eating', /saapida maatten/],
    ['saaptingala', 'conversation-eating', /saapida maatten/],
    ['neenga yaaru', 'conversation-identity', /Naan CampusCare/],
    ['who are you?', 'conversation-identity', /not a person or college staff/],
    ['unga peru enna', 'conversation-identity', /CampusCare/],
    ['Hi', 'conversation-greeting', /Hi!/]
  ])('answers %s with its own intent', (text, id, content) => {
    expect(referenceReply(text as string)?.source.id).toBe(id)
    expect(referenceReply(text as string)?.message).toMatch(content as RegExp)
  })
  it('honours explicit language even for a Tanglish question', () => {
    expect(referenceReply('enna pandra', 'english')?.message).toContain('here chatting')
    expect(referenceReply('what are you doing?', 'tanglish')?.message).toContain('Ungaloda')
  })
  it('keeps Tanglish for neutral follow-ups but lets new English questions switch', () => {
    const history = [{ role: 'USER' as const, message: 'enna pandra' }, { role: 'ASSISTANT' as const, message: 'Ungaloda pesittu irukken!' }]
    expect(referenceReply('Hi', 'auto', history)?.message).toContain('Vanakkam')
    expect(resolveReplyLanguage('Give me an example', 'auto', history)).toBe('tanglish')
    expect(resolveReplyLanguage('Explain photosynthesis', 'auto', history)).toBe('english')
    expect(resolveReplyLanguage('enna pandra reply in English')).toBe('english')
  })
  it.each(['Explain stack in Tanglish', 'Hi, explain photosynthesis', 'enna pandra, Python code explain pannu', 'How are you going to solve this equation?'])('never replaces a substantive question with small talk: %s', text => {
    expect(referenceReply(text)).toBeNull()
  })
  it.each(['I do not feel sad', 'I am not lonely', 'I do not have exam anxiety', 'I have no exam anxiety', 'enaku bayam illa', 'What is exam anxiety?', 'Explain why people feel sad', 'How to get high marks?', 'My friend feels sad today', 'I feel sad and feel lonely'])('does not choose an unrelated canned reply: %s', text => {
    expect(matchSupportExample(text)).toBeUndefined()
    expect(referenceReply(text)).toBeNull()
    expect(retrieveKnowledge(text, [], []).sources.some(source => source.id.startsWith('support-'))).toBe(false)
  })
  it('does not mistake word fragments or negated feelings for moods', () => {
    expect(analyseMessage('download this file').category).toBe('general')
    expect(analyseMessage('I am not happy').category).not.toBe('positive')
    expect(analyseMessage('I do not feel sad').category).not.toBe('sadness')
  })
  it('does not swallow a more specific task inside a support message', () => {
    expect(referenceReply('I have too many assignments. Help me write an extension email.')).toBeNull()
    expect(referenceReply('I feel sad today.')?.source.id).toBe('support-low-mood')
    expect(referenceReply('Night thoonga mudiyala.')?.source.id).toBe('support-sleep-problem')
  })
  it('keeps urgent routing ahead of greetings and negation checks', () => {
    expect(analyseMessage('Hi, I want to hurt myself').category).toBe('crisis')
    expect(analyseMessage('I am not sad but I want to hurt myself').category).toBe('crisis')
  })
  it('preserves the actual last reply language in preview after an explicit choice', () => {
    expect(resolveReplyLanguage('Hi', 'auto', [
      { role: 'USER', message: 'what are you doing?' }, { role: 'ASSISTANT', message: 'Ungaloda pesittu irukken! Naan unga AI assistant.' }
    ])).toBe('tanglish')
    expect(resolveReplyLanguage('Hi', 'auto', [
      { role: 'USER', message: 'enna pandra' }, { role: 'ASSISTANT', message: 'I am here chatting with you.' }
    ])).toBe('english')
  })
})
