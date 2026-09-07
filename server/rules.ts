import { resolveReplyLanguage, isNonDisclosure, matchSupportExample, normalizeSupportText, supportConversations, type ReplyLanguage } from './support-conversations.js'
import type { RecentMessage } from './conversation-context.js'

export type SupportCategory = 'crisis' | 'exam' | 'stress' | 'anxiety' | 'sadness' | 'loneliness' | 'burnout' | 'sleep' | 'motivation' | 'anger' | 'positive' | 'general'

const rules: Array<{ category: SupportCategory; pattern: RegExp; response: string }> = [
  { category: 'exam', pattern: /\b(exams?|tests?|assignments?|deadlines?|grades?|study)\b/i, response: 'That sounds like a lot to carry. Make the next hour smaller: choose one topic, set a 25-minute focus timer, then take a five-minute reset. You do not have to solve everything at once.' },
  { category: 'burnout', pattern: /(burnout|burned out|burnt out|exhausted|drained|overwhelmed)/i, response: 'Burnout can be a sign you have been carrying too much. Pick one task to postpone and one small thing that could replenish you today.' },
  { category: 'anxiety', pattern: /(anxious|anxiety|panic|worried|nervous)/i, response: 'Try naming five things you can see, four you can feel, and three you can hear. Bringing your attention to the present can create a little room.' },
  { category: 'sadness', pattern: /\b(sad|crying|down|depressed|hopeless)\b/i, response: 'I’m sorry things feel heavy. You deserve support. Consider a small message to someone you trust or a confidential appointment with campus counselling.' },
  { category: 'loneliness', pattern: /(alone|lonely|isolated|no friends)/i, response: 'Feeling alone can be difficult on campus. Connection does not need to be big: a club meeting, a classmate, or a short call can be a first step.' },
  { category: 'sleep', pattern: /\b(sleep|insomnia|tired|rest)\b/i, response: 'A gentle wind-down may help: set aside a quiet activity before bed and aim for a regular sleep time. If sleep problems persist, consider speaking with a healthcare professional.' },
  { category: 'motivation', pattern: /(motivation|procrastinat|can.t focus|unmotivated)/i, response: 'Start with a task so small it feels almost easy: open the document, list three steps, or work for five minutes. Momentum can come after starting.' },
  { category: 'positive', pattern: /\b(?:i (?:am|feel)|i.m|feeling) (?:really |so |very )?(happy|great|good|better|excited|proud)\b/i, response: 'I’m glad to hear that. Noticing good moments makes them easier to return to later. Consider saving this in today’s mood check-in.' },
  { category: 'anger', pattern: /\b(angry|anger|furious|kovam|kovama)\b/i, response: 'If it is safe, step away from the situation and give yourself a little space before responding. What happened?' },
  { category: 'stress', pattern: /\b(stress|stressed|pressure|busy|tense)\b/i, response: 'It makes sense to feel stretched when a lot is happening. If it feels comfortable, pause and take a gentle breath without forcing it. Then choose one small next step.' }
]

export function analyseMessage(message: string, preference: ReplyLanguage = 'auto', recent: RecentMessage[] = []) {
  const normalized = normalizeSupportText(message)
  const language = resolveReplyLanguage(message, preference, recent)
  // Always run emergency patterns before topic matching or any model request.
  const selfHarm = /\b(kill(?:ing)? myself|hurt(?:ing)? myself|harm(?:ing)? myself|self harm|suicid(?:e|al)|end my life|(?:don t|dont|do not) want to live|want to die|naane hurt|enna hurt pannikanum|v[ae]?a?zhanum nu thonala)\b/.test(normalized)
  const violence = /\b((?:hit|hitting|hurt|harm|kill|attack) (?:someone|somebody|him|her|them|my roommate)|adikk?anum)\b/.test(normalized)
  const medical = /\b(severe chest pain|crushing chest pain|(?:can t|cannot|can not) breathe|severe difficulty breathing|breathing romba kashtam|moochu vida mudila)\b/.test(normalized)
  if (selfHarm || violence || medical) {
    const emergency = supportConversations.find(example => example.id === (violence && !selfHarm ? 'violence-risk' : 'self-harm-risk'))!
    const response = medical && !selfHarm && !violence
      ? language === 'tanglish'
        ? 'Indha symptoms-ku immediate medical help thevai. Local emergency services-a ippo call pannunga, nearby trusted person-kitta help kelunga. Idhu anxiety-nu assume panna mudiyadhu. CampusCare emergency care kudukka mudiyadhu.'
        : 'These symptoms need immediate medical attention. Call local emergency services now and ask someone nearby for help. I cannot determine the cause or assume it is anxiety. CampusCare cannot provide emergency care.'
      : language === 'tanglish' ? emergency.tanglishResponse : emergency.englishResponse
    return { category: 'crisis' as SupportCategory, response, language, needsHumanSupport: true, intent: medical ? 'medical_emergency' : selfHarm ? 'self_harm_risk' : 'violence_risk' }
  }
  const example = matchSupportExample(message)
  if (example) return { category: example.category, response: language === 'tanglish' ? example.tanglishResponse : example.englishResponse, language, needsHumanSupport: example.escalation, intent: example.intent }
  const matched = isNonDisclosure(message) ? undefined : rules.find(rule => rule.pattern.test(message))
  return { ...(matched ?? { category: 'general' as SupportCategory, response: 'Thanks for sharing that. I’m here to listen and offer practical support. What feels most important about today?' }), language, needsHumanSupport: false, intent: matched?.category ?? 'general' }
}
