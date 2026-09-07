import type { SupportCategory } from './rules.js'

export type SupportExample = {
  id: string; intent: string; category: SupportCategory
  // Routing labels from the supplied dataset, not clinical risk assessments.
  riskLevel: 'low' | 'medium' | 'high'; escalation: boolean
  englishMessage: string; tanglishMessage: string; keywords: string[]
  englishResponse: string; tanglishResponse: string
}

export const supportConversations: SupportExample[] = [
  {
    id: 'academic-stress', intent: 'academic_stress', category: 'exam', riskLevel: 'low', escalation: false,
    englishMessage: 'I have too many assignments.', tanglishMessage: 'Enaku romba assignments iruku, enga start panrathune therila.',
    keywords: ['too many assignments', 'workload', 'romba assignments', 'start panna therila'],
    englishResponse: 'That sounds like a lot to manage. List the assignments and their deadlines, then choose one small step on the most urgent task. Which deadline is closest?',
    tanglishResponse: 'Assignments romba irundha overwhelm aagalam. Ella assignment-um deadline-oda list pannunga; nearest deadline task-la oru small step start pannalam. Endha deadline first varudhu?'
  },
  {
    id: 'exam-anxiety', intent: 'exam_anxiety', category: 'exam', riskLevel: 'low', escalation: false,
    englishMessage: "I am scared about tomorrow's exam.", tanglishMessage: 'Naalaiku exam nu romba bayama iruku.',
    keywords: ['scared about tomorrow s exam', 'exam anxiety', 'naalaiku exam', 'exam bayam'],
    englishResponse: 'An exam tomorrow can feel daunting. Pick a few priority topics, practise what you know, and leave time to rest. Which subject is it?',
    tanglishResponse: 'Naalaiku exam-na bayama irukalam. Ellathayum ore time-la padikka pressure edukama, important topics first revise pannunga; rest-kum time vechukkonga. Endha subject exam?'
  },
  {
    id: 'low-mood', intent: 'low_mood', category: 'sadness', riskLevel: 'low', escalation: false,
    englishMessage: 'I feel sad today.', tanglishMessage: 'Inniku romba sad ah feel panren.',
    keywords: ['feel sad', 'sad today', 'sad ah', 'manasu sari illa'],
    englishResponse: 'I’m sorry today feels difficult. If you feel comfortable, you could share what is on your mind with someone you trust. Would you like to tell me what happened?',
    tanglishResponse: 'Inniku kashtama iruku pola. Comfortable-ah irundha, trust panra friend illa family member-kitta pesalam. Enna nadandhuchu-nu share panna viruppama?'
  },
  {
    id: 'persistent-low-mood', intent: 'low_mood', category: 'sadness', riskLevel: 'medium', escalation: true,
    englishMessage: 'I have been feeling down for many days.', tanglishMessage: 'Neraya naala romba down ah feel panren.',
    keywords: ['down for many days', 'sad for weeks', 'neraya naala down', 'neraya naala romba down'],
    englishResponse: 'Feeling low for several days deserves support. Consider speaking with a counsellor or healthcare professional, and let someone you trust know how you have been feeling.',
    tanglishResponse: 'Neraya naala ipdi feel aagudhu-na support theduradhu nalladhu. Trust panra person-kitta sollunga; counsellor illa doctor-kitta pesavum consider pannunga.'
  },
  {
    id: 'loneliness', intent: 'loneliness', category: 'loneliness', riskLevel: 'low', escalation: false,
    englishMessage: 'I feel lonely in college.', tanglishMessage: 'College la romba lonely ah feel panren.',
    keywords: ['feel lonely', 'lonely in college', 'lonely ah', 'thaniya'],
    englishResponse: 'Feeling lonely in college can be hard. One small conversation with a classmate or a call to someone you know could be a first step, if that feels comfortable.',
    tanglishResponse: 'College-la lonely-ah feel aaguradhu kashtama irukalam. Comfortable-na oru classmate-kitta small conversation start pannalam, illa therinja orutharukku call pannalam.'
  },
  {
    id: 'nobody-cares', intent: 'loneliness', category: 'loneliness', riskLevel: 'medium', escalation: true,
    englishMessage: 'I feel like nobody cares about me.', tanglishMessage: 'Enna pathi yaarukum care illa madhiri feel aaguthu.',
    keywords: ['nobody cares', 'no one cares', 'yaarukum care illa', 'yaarum care panna maatanga'],
    englishResponse: 'Feeling uncared for can be painful. You deserve support even when it does not feel available. Could you tell a trusted person or counsellor how things have been for you?',
    tanglishResponse: 'Yaarukum care illa madhiri feel aaguradhu painful-ah irukalam. Ungalukku support kidaikka vendum. Trust panra person illa counsellor-kitta epdi feel panreenga-nu solla mudiyuma?'
  },
  {
    id: 'sleep-problem', intent: 'sleep_problem', category: 'sleep', riskLevel: 'low', escalation: false,
    englishMessage: "I can't sleep at night.", tanglishMessage: 'Night thoongave mudila.',
    keywords: ['can t sleep', 'sleep problem', 'thoongave mudila', 'thoonga mudila', 'thoongala'],
    englishResponse: 'Trouble sleeping can be frustrating. A regular bedtime and a quiet, screen-free wind-down may help. If it persists or affects daily life, speak with a healthcare professional.',
    tanglishResponse: 'Thoonga mudiyama irukradhu kashtam. Regular sleep time vechu, bed-ku munnadi phone use kammi panni quiet-ah relax panna try pannalam. Continue aana doctor-kitta pesunga.'
  },
  {
    id: 'persistent-sleep-problem', intent: 'sleep_problem', category: 'sleep', riskLevel: 'medium', escalation: true,
    englishMessage: "I haven't slept properly for weeks.", tanglishMessage: 'Weeks ah proper ah thoongave mudila.',
    keywords: ['sleep for weeks', 'slept properly for weeks', 'weeks ah proper ah thoongave', 'proper sleep illa'],
    englishResponse: 'Sleep difficulties lasting weeks are worth discussing with a healthcare professional. You do not have to manage them alone; a counsellor can also help with worries affecting sleep.',
    tanglishResponse: 'Weeks-ah proper sleep illa-na doctor-kitta pesradhu nalladhu. Idha thaniya handle panna vendam; sleep-a affect panra worries pathi counsellor-kittayum pesalam.'
  },
  {
    id: 'self-esteem', intent: 'self_esteem', category: 'sadness', riskLevel: 'low', escalation: false,
    englishMessage: 'Everyone is better than me.', tanglishMessage: 'Ellarum enna vida better ah irukanga nu feel panren.',
    keywords: ['better than me', 'comparison', 'ellarum enna vida', 'ellarum better'],
    englishResponse: 'Comparison can make your own progress hard to notice. Try looking at one thing you have learned or improved recently. Your worth is not a ranking.',
    tanglishResponse: 'Compare pannite irundha unga own progress theriyama pogalam. Recent-ah neenga kathukitta illa improve panna oru vishayatha paarkalam. Unga value marks illa ranking mattum illa.'
  },
  {
    id: 'feeling-failure', intent: 'self_esteem', category: 'sadness', riskLevel: 'medium', escalation: true,
    englishMessage: 'I feel like a failure.', tanglishMessage: 'Na oru failure madhiri feel panren.',
    keywords: ['feel like a failure', 'useless', 'failure madhiri', 'life waste madhiri'],
    englishResponse: 'A setback does not define your worth. It may help to talk through what happened with someone supportive, such as a trusted friend, mentor or counsellor.',
    tanglishResponse: 'Oru setback unga value-a decide pannaadhu. Enna nadandhuchu-nu trust panra friend, mentor illa counsellor-kitta pesalam.'
  },
  {
    id: 'family-pressure', intent: 'family_pressure', category: 'stress', riskLevel: 'low', escalation: false,
    englishMessage: 'My parents expect me to always get high marks.', tanglishMessage: 'En parents always high marks edukanum nu pressure panranga.',
    keywords: ['parents expect', 'high marks', 'parents pressure', 'pressure panranga'],
    englishResponse: 'Constant expectations can feel stressful. If it feels safe, explain how the pressure affects you and what support would help. A trusted mentor can help you prepare that conversation.',
    tanglishResponse: 'High marks expectation stress-a irukalam. Safe-ah feel aana, indha pressure epdi affect aagudhu-nu calm-ah parents-kitta explain pannalam. Pesuradhukku trusted mentor help kekkalam.'
  },
  {
    id: 'friendship-problem', intent: 'friendship_problem', category: 'loneliness', riskLevel: 'low', escalation: false,
    englishMessage: 'My friend is ignoring me.', tanglishMessage: 'En friend enna ignore panra madhiri iruku.',
    keywords: ['friend is ignoring', 'friend ignoring', 'ignore panra'],
    englishResponse: 'That can feel confusing and hurtful. If you are comfortable, you could ask calmly whether something has changed, without assuming their reason.',
    tanglishResponse: 'Adhu confusing-ahum hurt-ahum irukalam. Comfortable-na, edhavadhu problem iruka-nu calm-ah kekkalam; avanga reason enna-nu assume panna vendam.'
  },
  {
    id: 'motivation', intent: 'motivation', category: 'motivation', riskLevel: 'low', escalation: false,
    englishMessage: "I don't feel like studying.", tanglishMessage: 'Padikave mood illa.',
    keywords: ['don t feel like studying', 'mood illa', 'padikka mudila', 'padikka mood illa'],
    englishResponse: 'Starting can be the hardest part. Try one small task for just ten minutes, then pause and see what feels manageable.',
    tanglishResponse: 'Start panradhu kashtama irukalam. First 10 minutes-ku oru small task try pannalam; appuram pause panni epdi iruku-nu paarkalam.'
  },
  {
    id: 'no-energy', intent: 'motivation', category: 'burnout', riskLevel: 'medium', escalation: true,
    englishMessage: "I don't have energy to do anything.", tanglishMessage: 'Edhuvum panna energy illa.',
    keywords: ['no energy', 'don t have energy', 'energy illa'],
    englishResponse: 'Low energy can have many causes. Be gentle with yourself; if it continues or affects daily life, consider speaking with a healthcare professional.',
    tanglishResponse: 'Energy kammi irukradhukku pala reasons irukalam. Ungala romba pressure panna vendam; continue aana illa daily life affect aana doctor-kitta pesunga.'
  },
  {
    id: 'social-stress', intent: 'social_stress', category: 'anxiety', riskLevel: 'low', escalation: false,
    englishMessage: "I'm scared to talk in front of people.", tanglishMessage: 'People munnadi pesa romba bayama iruku.',
    keywords: ['talk in front of people', 'scared to talk', 'pesa bayam', 'people munnadi'],
    englishResponse: 'Speaking in front of others can feel intimidating. If you would like, practise a short part with one trusted friend before trying a small group.',
    tanglishResponse: 'People munnadi pesaradhu bayama irukalam. Viruppam irundha first oru trusted friend munnadi small-ah practice pannalam; appuram small group try pannalam.'
  },
  {
    id: 'breakup', intent: 'relationship_problem', category: 'sadness', riskLevel: 'low', escalation: false,
    englishMessage: 'My girlfriend broke up with me.', tanglishMessage: 'En girlfriend enna breakup pannita.',
    keywords: ['broke up', 'breakup', 'relationship ended'],
    englishResponse: 'A breakup can hurt deeply. Give yourself time and keep in touch with supportive people. You do not have to work through every feeling today.',
    tanglishResponse: 'Breakup romba hurt pannalam. Konjam time eduthukkonga, supportive friends illa family-kitta connected-ah irunga. Ellathayum innike solve panna vendam.'
  },
  {
    id: 'anger', intent: 'anger', category: 'anger', riskLevel: 'low', escalation: false,
    englishMessage: 'I am very angry.', tanglishMessage: 'Enaku romba kovama iruku.',
    keywords: ['very angry', 'furious', 'kovama iruku', 'kovam'],
    englishResponse: 'It sounds intense right now. If it is safe, step away from the situation and give yourself a little space before responding.',
    tanglishResponse: 'Ippo kovam romba intense-ah iruku pola. Safe-na situation-la irundhu konjam distance eduthu, respond panradhukku munnadi konjam space kuduthukkonga.'
  },
  {
    id: 'violence-risk', intent: 'violence_risk', category: 'crisis', riskLevel: 'high', escalation: true,
    englishMessage: 'I feel like hitting someone.', tanglishMessage: 'Yaarayavadhu adikanum pola kovama iruku.',
    keywords: ['hit someone', 'hitting someone', 'hurt someone', 'adikanum', 'adikkanum'],
    englishResponse: 'Move away from the person and anything that could hurt someone. Contact a trusted person now. If you may act on the urge or anyone is in immediate danger, call local emergency services. CampusCare cannot provide emergency care.',
    tanglishResponse: 'Andha person-kitta irundhum, hurt panna use aagura things-kitta irundhum move aagunga. Trusted person-a ippo contact pannunga. Act panniduven pola irundha illa immediate danger-na local emergency services-a call pannunga. CampusCare emergency care kudukka mudiyadhu.'
  },
  {
    id: 'bullying', intent: 'bullying', category: 'stress', riskLevel: 'medium', escalation: true,
    englishMessage: 'Students keep making fun of me every day.', tanglishMessage: 'Daily en classmates enna kalaaichite irukanga.',
    keywords: ['bullying', 'making fun of me', 'kalaaikranga', 'kalaaichite'],
    englishResponse: 'Repeated bullying is not something you should have to handle alone. Tell a trusted faculty member, mentor, counsellor or college authority. Avoid confronting anyone who makes you feel unsafe.',
    tanglishResponse: 'Daily bullying-a neenga thaniya handle panna vendam. Trusted faculty, mentor, counsellor illa college authority-kitta sollunga. Unsafe-ah feel panna avangala thaniya confront panna vendam.'
  },
  {
    id: 'homesickness', intent: 'homesickness', category: 'loneliness', riskLevel: 'low', escalation: false,
    englishMessage: 'I miss my family a lot.', tanglishMessage: 'En family ah romba miss panren.',
    keywords: ['miss my family', 'miss home', 'family miss', 'family ah romba miss'],
    englishResponse: 'Missing home while adjusting to college is understandable. A regular call with family and one familiar daily routine may help you feel more connected.',
    tanglishResponse: 'College-ku adjust aagumbodhu family miss panradhu puriyudhu. Regular-ah call pannalam; inga oru familiar daily routine create pannavum try pannalam.'
  },
  {
    id: 'overwhelmed', intent: 'overwhelmed', category: 'burnout', riskLevel: 'medium', escalation: false,
    englishMessage: 'Everything feels too much.', tanglishMessage: 'Ellame romba overload ah iruku.',
    keywords: ['everything feels too much', 'overload ah', 'ennaala mudila'],
    englishResponse: 'You do not need to solve everything at once. Let’s pause and choose just one manageable next step. What feels most pressing?',
    tanglishResponse: 'Ellathayum ore time-la solve panna vendam. Konjam pause panni, ippo panna mudinja oru small step choose pannalam. Edhu romba urgent-ah feel aagudhu?'
  },
  {
    id: 'anxiety', intent: 'anxiety', category: 'anxiety', riskLevel: 'medium', escalation: true,
    englishMessage: 'I am worried about everything.', tanglishMessage: 'Ellathayum nenachu romba tension aaguthu.',
    keywords: ['worried about everything', 'constant worry', 'tension aaguthu'],
    englishResponse: 'Constant worry can be exhausting. Focus on one thing you can control right now. If worry keeps affecting your day, consider talking with a counsellor or healthcare professional.',
    tanglishResponse: 'Constant-ah tension aaguradhu tiring-ah irukalam. Ippo unga control-la irukura one thing-la focus pannalam. Daily life affect aagite irundha counsellor illa doctor-kitta pesunga.'
  },
  {
    id: 'severe-distress', intent: 'severe_distress', category: 'anxiety', riskLevel: 'medium', escalation: true,
    englishMessage: "My heart is beating fast and I can't calm down.", tanglishMessage: 'Heart romba fast ah beat aaguthu, calm aaga mudila.',
    keywords: ['heart is beating fast', 'heart fast', 'calm aaga mudila', 'calm mudila'],
    englishResponse: 'That sounds frightening. Sit somewhere safe and, if comfortable, breathe gently without forcing or holding your breath. I cannot tell what is causing this. Severe chest pain, serious trouble breathing or fainting need immediate medical help; new or persistent symptoms also need medical advice.',
    tanglishResponse: 'Bayama irukalam. Safe place-la ukkandhu, comfortable-na breath-a force pannama gentle-ah breathe pannunga. Enna cause-nu ennaala solla mudiyadhu. Severe chest pain, breathing romba kashtam illa faint aana immediate medical help thevai; new illa continue aagura symptoms-na doctor advice kelunga.'
  },
  {
    id: 'self-harm-risk', intent: 'self_harm_risk', category: 'crisis', riskLevel: 'high', escalation: true,
    englishMessage: 'I feel like hurting myself.', tanglishMessage: 'Enna naane hurt pannikanum pola feel aaguthu.',
    keywords: ['hurt myself', 'hurting myself', 'self harm', 'naane hurt', 'enna hurt pannikanum'],
    englishResponse: 'Your safety matters most right now. Move away from anything you could use to hurt yourself and contact someone you trust who can stay with you. If you may act on these thoughts, seek immediate local emergency or crisis support. CampusCare cannot provide emergency care.',
    tanglishResponse: 'Unga safety ippo mukkiyam. Ungala hurt panna use aagura things-kitta irundhu move aagunga; trust panra person-a ippo contact panni unga kooda irukka sollunga. Indha thoughts-la act panniduven pola irundha immediate local emergency illa crisis help seek pannunga. CampusCare emergency care kudukka mudiyadhu.'
  },
  {
    id: 'suicide-risk', intent: 'suicide_risk', category: 'crisis', riskLevel: 'high', escalation: true,
    englishMessage: "I don't want to live anymore.", tanglishMessage: 'Inime vazhanum nu thonala.',
    keywords: ['don t want to live', 'do not want to live', 'suicide', 'vazhanum nu thonala', 'vaazhanum nu thonala'],
    englishResponse: 'Your safety matters most right now. Please reach out to someone you trust and tell them you do not feel safe; ask them to stay with you. Move away from anything you could use to hurt yourself. If you may act on these thoughts, contact local emergency or crisis support immediately. CampusCare cannot provide emergency care.',
    tanglishResponse: 'Unga safety ippo mukkiyam. Thaniya irukka vendam; trust panra person-kitta safe-ah feel pannala-nu solli, unga kooda irukka kelunga. Hurt panna use aagura things-kitta irundhu move aagunga. Act panniduven pola irundha immediate local emergency illa crisis help contact pannunga. CampusCare emergency care kudukka mudiyadhu.'
  }
]

export type ReplyLanguage = 'auto' | 'english' | 'tanglish'
export const normalizeSupportText = (text: string) => text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  .replace(/\benakku\b/g, 'enaku').replace(/\birukku\b/g, 'iruku').replace(/\bmudiyala\b/g, 'mudila')
export const isTanglish = (text: string) => /\b(enaku|enakku|enna|ennapandra|ennapanra|naane|nee|neenga|unga|ungaloda|yaaru|yaru|naalaiku|inniku|iruku|irukku|iruka|irukka|irukanga|iruken|irukken|panren|panranga|panra|pandra|panreenga|pannita|pannikanum|mudila|mudiyala|illa|thaniya|thoongave|thoonga|pesa|pesu|pesalam|bayama|bayam|kovama|vazhanum|vaazhanum|aaguthu|aagudhu|padikave|padikka|vanakkam|epdi|eppadi|sollu|sollunga|puriyala|saptiya|saaptiya|saapitiya|saptingala|saaptingala|nandri|thanglish|tanglish|tanglishla)\b/i.test(text)

type LanguageHistory = Array<{ role: 'USER' | 'ASSISTANT'; message: string; language?: 'english' | 'tanglish' }>
export function resolveReplyLanguage(message: string, preference: ReplyLanguage = 'auto', recent: LanguageHistory = []): 'english' | 'tanglish' {
  if (preference !== 'auto') return preference
  const text = normalizeSupportText(message)
  // A language instruction may accompany a real question; it is not itself the intent.
  if (/\b(in english|english la|english only|reply english)\b/.test(text)) return 'english'
  if (isTanglish(text)) return 'tanglish'
  const continuation = /^(hi|hey|hello|ok|okay|thanks|thank you|yes|no|continue|go on|give (me )?(an? |one |another )?(simple )?example|explain (it )?(again|simply)|make it (simpler|shorter))$/.test(text)
  if (continuation) {
    for (const item of [...recent].reverse()) {
      if (item.role === 'ASSISTANT' && item.language) return item.language
      if (item.role === 'ASSISTANT' && item.message.trim()) return hasTanglishReplyText(item.message) ? 'tanglish' : 'english'
      if (item.role === 'USER' && isTanglish(item.message)) return 'tanglish'
      if (item.role === 'USER' && !/^(hi|hey|hello|ok|okay|yes|no|thanks|thank you)$/.test(normalizeSupportText(item.message))) return 'english'
    }
  }
  return 'english'
}
// Merely mentioning "Tanglish" in an English sentence is not a Tanglish reply.
export const hasTanglishReplyText = (text: string) => (text.match(/\b(?:unga\w*|pann\w*|iruk\w*|venum|soll\w*|mudiy\w*|mudila|padik\w*|enna|endha|naalaiku|inniku|pes\w*|bayam\w*|kitta|konjam|vanakkam)\b/gi)?.length ?? 0) >= 2

// Do not turn definitions, code, negated feelings or third-person examples into
// personal disclosures. Emergency detection in rules.ts runs separately first.
export function isNonDisclosure(message: string) {
  const text = normalizeSupportText(message)
  return /^(?:(?:can|could) you |please )?(?:explain|define|translate|write|draft|summari[sz]e|what (?:is|are|does)|how (?:does|do|to)|tell me about|give (?:me )?(?:a |an )?(?:definition|example))\b/.test(text)
    || /\b(?:meaning of|meaning enna|difference between|python|javascript|typescript|function|code|algorithm)\b/.test(text)
    || /\b(?:not|never|don t|dont|do not|no longer|no)\s+(?:(?:really|very|feel|feeling|have|any|so|that|at all|exam|much)\s+){0,3}(?:sad|sadness|down|lonely|loneliness|anxious|anxiety|angry|stressed|stress|worried|scared|happy|good|better|sleep problems?)\b/.test(text)
    || /\b(?:sad|lonely|stress|bayam|kovam|tension)\s+(?:ah |a )?(?:illa|illai|illay)\b/.test(text)
    || /^(?:my (?:friend|sister|brother|roommate)|he|she|they)\s+(?:feels?|is|has|can t|cannot)\b/.test(text)
}

export function matchSupportExample(message: string) {
  const normalized = normalizeSupportText(message), query = ' ' + normalized + ' '
  const exact = supportConversations.find(example => [example.englishMessage, example.tanglishMessage].some(text => normalizeSupportText(text) === normalized))
  if (exact) return exact
  if (isNonDisclosure(message)) return undefined
  const matches = supportConversations.map(example => {
    const score = example.keywords.reduce((sum, keyword) => {
      const term = normalizeSupportText(keyword)
      return sum + (query.includes(' ' + term + ' ') ? term.split(' ').length : 0)
    }, 0)
    return { example, score }
  }).filter(item => item.score >= 2).sort((a, b) => b.score - a.score)
  // Let the model address multiple concerns rather than arbitrarily picking one.
  if (new Set(matches.map(item => item.example.category)).size > 1) return undefined
  return matches[0]?.example
}

export function tanglishReference(message: string) {
  const support = matchSupportExample(message)
  if (support && canUseSupportReference(message, support)) return { message: support.tanglishResponse, source: { id: 'support-' + support.id, title: 'Student support examples · ' + support.intent.replaceAll('_', ' ') } }
  const text = normalizeSupportText(message)
  if (/^(hi|hello|hey|vanakkam)( bro| there)?$/.test(text)) return {
    message: 'Vanakkam! Inniku ungalukku enna help venum? Padippu pathiyo, manasula irukura vishayam pathiyo pesalam.',
    source: { id: 'tanglish-greeting', title: 'Tanglish conversation · greeting' }
  }
  if (/^(thanks|thank you|nandri|okay|ok)$/.test(text)) return {
    message: 'Sari, unga pace-la pogalam. Innum edhavadhu help venumna sollunga.',
    source: { id: 'tanglish-acknowledgement', title: 'Tanglish conversation · acknowledgement' }
  }
  if (/^(?:(?:please|can you) )?(?:(?:speak|reply|talk)(?: to me)?(?: in)? )?(?:tanglish|thanglish|tanglishla)(?: la)?(?: (?:please|pesu|pesunga|pesalam|sollu|sollunga))?$/.test(text)) return {
    message: 'Sari, Tanglish-la pesalam! Ungalukku enna help venum?',
    source: { id: 'tanglish-language', title: 'Tanglish conversation · language preference' }
  }
  return null
}

export function canUseSupportReference(message: string, example: SupportExample) {
  const text = normalizeSupportText(message)
  if ([example.englishMessage, example.tanglishMessage].some(value => normalizeSupportText(value) === text)) return true
  // A support example is guidance, not an answer to an additional concrete task.
  return text.split(' ').length <= 20 && !/\b(?:write|draft|explain|translate|meaning|plan|schedule|solve|calculate|instead|but|however|also|because|why|how|enna seiya|enna panna)\b/.test(text)
}
