import { gateway, streamText } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { config } from './config.js'
import type { SupportCategory } from './rules.js'
import { buildConversation, responseGuidance, studentInstructions, type RecentMessage } from './conversation-context.js'
import { retrieveKnowledge, type Resource, type Tip } from './knowledge.js'
import { hasTanglishReplyText, matchSupportExample, resolveReplyLanguage, type ReplyLanguage } from './support-conversations.js'
import { referenceReply } from './reply-routing.js'
import { warmLocalModel } from './ollama-warmup.js'

const localProvider = createOpenAICompatible({ name: 'ollama', baseURL: config.OLLAMA_BASE_URL })
export const aiSupportEnabled = () => config.AI_PROVIDER === 'ollama' || Boolean(config.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN)
export const assistantInfo = () => ({ provider: config.AI_PROVIDER, model: config.AI_PROVIDER === 'ollama' ? config.OLLAMA_MODEL : config.AI_MODEL })

export function createReferenceReply(message: string, language: ReplyLanguage = 'auto', recent: RecentMessage[] = []) {
  const reference = referenceReply(message, language, recent)
  return reference ? {
    message: reference.message, assistantMode: 'reference' as const,
    provider: 'local-reference', model: undefined,
    sources: [reference.source],
    truncated: false
  } : null
}

export async function createStudentReply({ message, category, recent, resources, tips, language = 'auto', onText, signal }: { message: string; category: SupportCategory; recent: RecentMessage[]; resources: Resource[]; tips: Tip[]; language?: ReplyLanguage; onText?: (text: string) => void; signal?: AbortSignal }) {
  if (category === 'crisis') return null
  const support = matchSupportExample(message)
  const replyLanguage = resolveReplyLanguage(message, language, recent)
  const reference = createReferenceReply(message, replyLanguage, recent)
  if (reference) return reference
  if (!aiSupportEnabled()) return null
  const knowledge = retrieveKnowledge(message, resources, tips, recent)
  const style = responseGuidance(message, recent)
  if (replyLanguage === 'tanglish') style.guidance += ' Reply in respectful, simple Tanglish using Latin letters, following the supplied Tanglish example. Keep it to two or three sentences.'
  else style.guidance += ' Reply in English.'
  if (support?.escalation) style.guidance += ' Gently suggest support from a trusted person or an appropriate professional. Do not diagnose or promise a cure.'
  const abortSignal = AbortSignal.any([AbortSignal.timeout(45_000), ...(signal ? [signal] : [])])
  // This is one generation with no tools. streamText exposes explicit error
  // handling so provider errors cannot log private prompts by default.
  const result = streamText({
    model: config.AI_PROVIDER === 'ollama' ? localProvider(config.OLLAMA_MODEL) : gateway(config.AI_MODEL),
    instructions: `${studentInstructions}\n\nReference entries supplied for this request:\n${knowledge.context || 'No matching local reference. Answer from general knowledge when appropriate.'}\n\nResponse format: ${style.guidance}`,
    // Retrieve before generation so models such as Gemma do not need native tool calling.
    maxOutputTokens: style.maxOutputTokens,
    temperature: 0.35,
    maxRetries: 0,
    // Provider errors can contain request bodies. The route logs only a generic
    // status; never let the SDK's default logger print student conversation text.
    onError: () => {},
    abortSignal,
    messages: buildConversation(recent, message)
  })
  let text = ''
  for await (const delta of result.textStream) {
    abortSignal.throwIfAborted()
    text += delta
    // Tanglish must pass the language check before it is shown. English can
    // arrive progressively; neither language is saved until completion.
    if (replyLanguage === 'english') onText?.(delta)
  }
  abortSignal.throwIfAborted()
  const finishReason = await result.finishReason
  if (finishReason === 'error') throw new Error('Model generation failed')
  void warmLocalModel()
  const reply = text.trim()
  if (!reply) return null
  if (replyLanguage === 'tanglish' && (!hasTanglishReplyText(reply) || /[\u0900-\u0dff]/u.test(reply))) return {
    message: 'Indha kelvikku sariyana Tanglish badhil kudukka local AI-kku kashtama iruku. Konjam simple-ah illa detail-ah solla mudiyuma? Viruppam irundha Reply language-la English select pannalam.',
    assistantMode: 'reference' as const, provider: 'local-reference', model: undefined,
    sources: [{ id: 'tanglish-clarification', title: 'Tanglish conversation · language limitation' }], truncated: false
  }
  return { message: reply, assistantMode: 'ai' as const, ...assistantInfo(), sources: knowledge.sources, truncated: finishReason === 'length' }
}
