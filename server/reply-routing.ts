import { canUseSupportReference, matchSupportExample, normalizeSupportText, resolveReplyLanguage, tanglishReference, type ReplyLanguage } from './support-conversations.js'
import type { RecentMessage } from './conversation-context.js'

type ConversationReply = { id: string; pattern: RegExp; english: string; tanglish: string }
// Whole-message matching only: a greeting at the start must never hide a question.
const conversationReplies: ConversationReply[] = [
  { id: 'doing', pattern: /^(?:(?:hi|hey|hello) )?(?:enna ?(?:panra|pandra|panre|panreenga|panringa|pannra|seira|seiringa)|what (?:are you doing|do you do)|what s up|whats up|wassup)(?: (?:bro|da|pa|neenga|nee|now|right now))?$/,
    english: 'I’m here chatting with you! I’m CampusCare, an AI assistant. What would you like to talk about?',
    tanglish: 'Ungaloda pesittu irukken! Naan CampusCare, unga AI assistant. Neenga enna panreenga?' },
  { id: 'greeting', pattern: /^(?:hi|hii+|hey|hello|vanakkam|good morning|good afternoon|good evening)(?: (?:bro|there|campuscare))?$/,
    english: 'Hi! What’s on your mind today?',
    tanglish: 'Vanakkam! Inniku epdi irukeenga? Ungalukku enna help venum?' },
  { id: 'how-are-you', pattern: /^(?:(?:hi|hey|hello) )?(?:(?:nee|neenga) )?(?:epdi|eppadi) (?:iruka|irukka|iruke|irukeenga|irukinga|irukkinga)$|^(?:(?:hi|hey|hello) )?(?:how are you|how r u|how are you doing|are you okay)$/,
    english: 'I’m here and ready to chat. I’m an AI, so I don’t have feelings like a person. How are you doing?',
    tanglish: 'Naan inga unga kooda pesa ready-ah irukken! AI-naala enakku manushanga maadhiri feelings illa. Neenga epdi irukeenga?' },
  { id: 'identity', pattern: /^(?:who are you|what (?:is|s) your name|whats your name|your name|are you (?:a real person|human|a bot|ai|college staff)|(?:nee|neenga) (?:yaaru|yaru)|(?:un|unga|ungaloda) (?:peru|peyar) (?:enna|ennaa))$/,
    english: 'I’m CampusCare, an AI assistant for college students—not a person or college staff member. I can help with learning, planning and talking things through.',
    tanglish: 'Naan CampusCare, college students-kkaana AI assistant. Naan real college staff illa. Padippu, planning, illa manasula irukura vishayangal pathi pesalam.' },
  { id: 'eating', pattern: /^(?:(?:nee|neenga) )?(?:saptiya|saaptiya|saapitiya|saptingala|saaptingala)(?: (?:bro|da))?$|^(?:did you eat|have you eaten|had (?:lunch|dinner|breakfast))$/,
    english: 'I’m an AI, so I don’t eat—but thanks for asking! Have you had something to eat?',
    tanglish: 'Naan AI, adhanala saapida maatten. Kettadhukku nandri! Neenga saaptingala?' },
  { id: 'help', pattern: /^(?:help|help me|can you help me|enaku help venum|enakku help venum|konjam help pannunga)$/,
    english: 'Of course. What would you like help with?',
    tanglish: 'Kandippa help pannalam. Ungalukku enna help venum-nu sollunga.' },
  { id: 'acknowledgement', pattern: /^(?:thanks|thank you|nandri)(?: (?:bro|so much))?$/,
    english: 'You’re welcome. If there’s more you’d like to discuss, I’m here.',
    tanglish: 'Sari! Innum edhavadhu pesanum illa help venumna sollunga.' },
  { id: 'okay', pattern: /^(?:okay|ok)(?: bro)?$/,
    english: 'Okay. We can go at your pace.',
    tanglish: 'Sari. Unga pace-la pesalam.' },
  { id: 'goodbye', pattern: /^(?:bye|goodbye|see you|see you later|good night|poitu varen)$/,
    english: 'Take care! You can come back whenever you’d like to chat.',
    tanglish: 'Paathukonga! Marubadi pesanum-na inga vandhu sollunga.' }
]

export function referenceReply(message: string, language: ReplyLanguage = 'auto', recent: RecentMessage[] = []) {
  const resolved = resolveReplyLanguage(message, language, recent)
  const entry = conversationReplies.find(item => item.pattern.test(normalizeSupportText(message)))
  if (entry) return {
    message: resolved === 'tanglish' ? entry.tanglish : entry.english,
    source: { id: 'conversation-' + entry.id, title: 'Conversation guide · ' + entry.id.replaceAll('-', ' ') }
  }
  if (resolved === 'tanglish') return tanglishReference(message)
  const support = matchSupportExample(message)
  if (support && canUseSupportReference(message, support)) return {
    message: support.englishResponse,
    source: { id: 'support-' + support.id, title: 'Student support examples · ' + support.intent.replaceAll('_', ' ') }
  }
  return null
}
