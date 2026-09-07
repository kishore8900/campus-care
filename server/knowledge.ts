import { followUpTopic, type RecentMessage } from './conversation-context.js'
import { studentConversations } from './student-conversations.js'
import { matchSupportExample, normalizeSupportText, supportConversations } from './support-conversations.js'

export type KnowledgeSource = { id: string; title: string }
export type Resource = { id: string; title: string; description: string; contact: string; hours: string; kind: string; verified?: boolean }
export type Tip = { id: string; category: string; title: string; body: string }
export type KnowledgeDocument = KnowledgeSource & { keywords: string[]; content: string }

// App-authored guidance, not live web results or college policies.
export const studentKnowledge: KnowledgeDocument[] = [
  { id: 'active-recall', title: 'Student guide · revision and recall', keywords: ['revision', 'revise', 'memorize', 'remember', 'exam', 'study', 'learning'], content: 'For revision, ask the learner to explain a concept without looking at notes, check gaps, then practise a few questions. Revisit difficult concepts later. Match the plan to the actual time and topics the student supplies; never promise an exam result.' },
  { id: 'deadlines', title: 'Student guide · assignment planning', keywords: ['assignment', 'deadline', 'schedule', 'overwhelmed', 'procrastination', 'planning', 'plan', 'prioritize'], content: 'List tasks, due times, and approximate effort. Choose the most urgent important task, define a small first deliverable, and reserve time to check the work. When a deadline is impossible, help draft a polite extension request; only the instructor can confirm whether an extension is allowed.' },
  { id: 'coding', title: 'Student guide · debugging', keywords: ['code', 'coding', 'debug', 'error', 'python', 'javascript', 'typescript', 'react', 'program', 'programming'], content: 'When debugging, ask for the smallest relevant code sample and exact error if missing. Explain the cause, show a corrected example, and suggest how to test it. Never say code was run unless it was actually executed. For a clear coding request, provide the requested code instead of generic study advice.' },
  { id: 'writing', title: 'Student guide · writing and email', keywords: ['write', 'writing', 'essay', 'email', 'letter', 'draft', 'report', 'summarize'], content: 'Draft the requested text directly when enough context exists. Use placeholders for missing names or dates rather than invented personal facts. For essays, separate a claim, reasoning, evidence and conclusion. Never invent quotations, citations or references.' },
  { id: 'math', title: 'Student guide · problem solving', keywords: ['math', 'equation', 'algebra', 'calculate', 'solve', 'derivative', 'probability'], content: 'Identify known values and the requested result, show short checkable solution steps, track units, and substitute the answer back where possible. Explain the principle with a concrete example. Be clear about assumptions and do not pretend to use a calculator or run code.' },
  { id: 'career', title: 'Student guide · career preparation', keywords: ['career', 'resume', 'cv', 'interview', 'internship', 'portfolio', 'job'], content: 'Help the student identify a role, describe actual projects and skills, and practise interview answers with concrete examples. Do not invent work experience or qualifications. Current vacancies and eligibility must be checked with the employer or college placement office.' },
  { id: 'connection', title: 'Student guide · communication', keywords: ['roommate', 'friend', 'lonely', 'loneliness', 'relationship', 'conflict', 'bullying'], content: 'Acknowledge the situation, help identify what the student wants, and offer a respectful boundary or message they could use. Encourage real-world support from a trusted person when needed. Do not pressure someone to confront a person who makes them feel unsafe.' },
  { id: 'campus', title: 'Student guide · finding campus help', keywords: ['campus', 'counselling', 'counselor', 'counsellor', 'health', 'contact', 'scholarship', 'fees', 'policy', 'office'], content: 'College-specific contacts, fees, eligibility and policies require verified college information. If no verified entry is supplied, say it is not configured and suggest checking the official student portal or student-services office. Demo contacts must never be presented as real contacts.' }
]

const words = (text: string) => new Set(text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [])
const relevance = (text: string, keywords: string[]) => {
  const query = ' ' + normalizeSupportText(text) + ' '
  return keywords.reduce((score, keyword) => {
    const term = normalizeSupportText(keyword)
    return score + (term && query.includes(' ' + term + ' ') ? term.includes(' ') ? 3 : 1 : 0)
  }, 0)
}

export function retrieveKnowledge(message: string, resources: Resource[], tips: Tip[], recent: RecentMessage[] = []) {
  const topic = followUpTopic(message, recent)
  const support = matchSupportExample(message)
  const documents: KnowledgeDocument[] = [
    ...studentConversations,
    // Only the confidently matched disclosure belongs in the prompt. Broad
    // keyword retrieval must not reintroduce a rejected/negated support example.
    ...supportConversations.filter(example => example.id === support?.id).map(example => ({
      id: 'support-' + example.id,
      title: 'Student support examples · ' + example.intent.replaceAll('_', ' '),
      keywords: example.keywords,
      content: JSON.stringify({ englishExample: example.englishMessage, tanglishExample: example.tanglishMessage, englishReply: example.englishResponse, tanglishReply: example.tanglishResponse, suggestHumanSupport: example.escalation })
    })),
    ...studentKnowledge,
    ...resources.filter(resource => resource.verified === true).map(resource => ({
      id: `campus-${resource.id}`, title: resource.title,
      keywords: [resource.kind, 'campus', 'contact', ...words(resource.title)],
      content: JSON.stringify({ description: resource.description, contact: resource.contact, hours: resource.hours }).slice(0, 1300)
    })),
    ...tips.map(tip => ({ id: `tip-${tip.id}`, title: tip.title, keywords: [...words(`${tip.category} ${tip.title}`)], content: tip.body.slice(0, 1000) }))
  ]
  const ranked = documents.map(document => ({ document, score: 2 * relevance(message, document.keywords) + 3 * relevance(topic, document.keywords) + (support && document.id === 'support-' + support.id ? 20 : 0) }))
    .filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 3)
  const selected: typeof ranked = []
  let remaining = 3600
  for (const item of ranked) {
    if (item.document.content.length > remaining) continue
    selected.push(item)
    remaining -= item.document.content.length
  }
  return {
    sources: selected.map(({ document: { id, title } }) => ({ id, title })),
    context: selected.map(({ document }) => JSON.stringify({ title: document.title, information: document.content })).join('\n')
  }
}
