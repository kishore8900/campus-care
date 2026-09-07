# CampusCare

CampusCare is a responsive early-support platform for college students. It combines a deterministic safety layer with an optional LLM support agent, mood check-ins, wellbeing tools, and guidance toward verified campus support.

## Run locally

1. Install packages with `npm install`.
2. Copy `.env.example` to `.env` and set a secure `JWT_SECRET`.
3. Start the complete local app with `npm run dev`. Vite starts the chat API automatically.
4. Keep that process running while using the app. Ollama must also be running for model-generated answers.

Use `npm run test` for automated rule-engine tests, `npm run typecheck` for TypeScript validation, and `npm run build` for a production frontend build.

The web app opens on `http://localhost:5173` and the API listens on `http://localhost:4000`.

CampusCare uses a full-width, neutral app canvas. Student navigation includes Chat, Resources, Breathing, Help, and History. The chatbot lives on `/chat`; drafts and messages stay in the current session when switching pages. The direct no-login preview is `http://localhost:5173/chat?preview=1`; preview navigation preserves that mode on refresh, but its messages remain temporary. Supported browsers also show a voice-input control. Speech is transcribed into the draft and is never sent until the student reviews it and presses Send.

## College administrator access

There is no public admin registration. Public registration always creates a `STUDENT`; the email configured as `ADMIN_EMAIL` is reserved and cannot be registered by a student. Set `ADMIN_EMAIL`, a unique `ADMIN_PASSWORD` of at least 12 characters, and a random `JWT_SECRET` in the ignored `.env` file, then restart the API. Signing in with that configured account opens the college-only admin area. Admin authorization is checked against the server-side account on every request, and sign-in attempts are throttled.

The admin area uses live API data for overview metrics, conversations, risk alerts, mood data, users, and runtime settings. The administrator can create, edit, and remove campus resources, wellness tips, and breathing exercises. Run `npm run test:admin-access` while the app is running to verify anonymous access is rejected, students receive `403`, the configured admin succeeds, and protected CRUD works.

On this Windows development machine, `npm run start:local` starts the website in the background and prints its local log directory. The website owns the local API, reuses a healthy existing API, and attempts bounded recovery if it disappears (up to three launches per minute). Lifecycle logs contain no chat content. Dev requests use a same-origin API proxy. Restart `npm run dev` after backend edits; `npm run api` remains available for a deliberately separate API process.

This supervisor is development-only; a production deployment needs proper process management and durable storage. The development account store is in memory and resets when the API restarts.

## Enable the local Ollama support agent

CampusCare uses Google's Gemma through local Ollama; no cloud key or billing is required. Install Ollama, run `ollama pull gemma3:1b`, and keep Ollama running. This compact model is installed on the development computer, which has 8 GB RAM and runs inference on its CPU. To change models, run `ollama list`, set `OLLAMA_MODEL` in `.env`, and restart the API. The previously installed `qwen2.5:1.5b` is another option.

Everyday English/Tanglish messages (including “enna pandra”, “epdi iruka”, greetings and matching support disclosures) use immediate, labelled conversation guides. Whole-message intent matching prevents a greeting from swallowing a real question. Negated feelings and informational questions do not select personal-support examples. English model answers arrive progressively; Tanglish generation is checked before display. Model requests have a 45-second deadline and a Stop reply button. Unfinished output is not saved as completed chat history. Signed-in failures retain basic support; preview failures show a retryable error.

An empty [Ollama warm-up request](https://docs.ollama.com/faq#how-can-i-preload-a-model-into-ollama-to-get-faster-response-times) loads the configured model in the background at API startup and retains it for 30 minutes after completed generations. This is best-effort and changes no global Ollama settings. CPU-generated replies can still take seconds or tens of seconds; streaming is not a guarantee of instantaneous answers.

The assistant can answer general knowledge and study questions, explain code, draft writing, plan tasks and discuss student wellbeing. It preserves recent complete exchanges for follow-up questions and retrieves up to three relevant entries from the app-authored knowledge library before generation. This works even with models that do not support native tool calls. Answers preserve Markdown formatting. Internal model and retrieval metadata is retained for diagnostics but is not shown as distracting interface chrome to students.

The knowledge library is in `server/knowledge.ts`. It includes ten academic conversation scenarios in `server/student-conversations.ts` and 25 English/Tanglish support scenarios in `server/support-conversations.ts`, adapted from the supplied examples. These are retrieved reference notes and fallback replies, not fine-tuning of the model. Follow-ups such as “give me a 3-mark answer” reuse the recent subject. The tone is friendly college support staff, with explicit AI identity and no implied access to student records.

Gemma 1B did not consistently generate Tanglish in live testing. Matching support disclosures and everyday conversation in either language therefore use the curated bilingual responses directly, labelled `reference` and “not generated,” without claiming a model wrote them. More specific requests are sent to the model instead of repeating a loosely related support script. Other questions use AI generation; unfamiliar Tanglish may still be misunderstood. Emergency matches always use deterministic safety replies.

Choose **Reply language → Tanglish** beneath the conversation to get Tanglish even for English input such as “Hi.” Auto detect recognizes the provided phrases and common spellings such as “Enakku… irukku” and “thoonga mudiyala.” A basic output guard replaces English-only or wrong-script model answers with a transparent Tanglish clarification. `npm run test:tanglish` checks real preview replies, language selection, common spellings and safety bypass.

Add factual, reviewed material as documents with a title, keywords and content. Campus contacts are excluded from the model unless an admin explicitly sets `verified: true` when adding the resource. Seed contacts are demonstration data, not real college information. Do not treat supplied notes as proof that every generated claim is correct.

Messages matched as immediate-risk language bypass the model and receive deterministic emergency-support guidance. These rules are not a comprehensive risk assessment. The assistant is user-rate-limited and receives only the authenticated student's recent chat history. A cloud gateway remains optional: set `AI_PROVIDER=gateway` and provide a server-only `AI_GATEWAY_API_KEY`.

Gemma is an open model family related to Gemini; a small local model is not equivalent to the Gemini cloud product. This app has no live web search, code execution, file reading or long-term AI memory. Local models can make factual and reasoning mistakes. See [Google's Ollama guide](https://ai.google.dev/gemma/docs/integrations/ollama) and [the Gemma 3 1B model](https://ollama.com/library/gemma3:1b).

With the API running, `npm run test:ollama` creates a disposable development student and verifies a real local AI reply plus the crisis rule bypass. This test requires the configured model to be installed and ready.

`npm run test:knowledge` also checks a factual explanation, a follow-up using conversation history, a Python function and crisis bypass against the actual model. These smoke checks establish that the integration works; they are not an evaluation of general model accuracy or clinical safety.

To explore without an account, choose preview on the login page or open `http://localhost:5173/?preview=1`. Preview chat messages and up to four previous exchanges are sent to the Campus Care API for processing. Local development uses this computer and local Ollama; a hosted deployment can use its configured AI Gateway. The app does not save preview chats to the account store or browser storage; they disappear when you leave or refresh. Preview mood check-ins remain browser-only. The endpoint permits 20 model requests per IP per 15 minutes and one active model request per IP; conversation guides and safety replies do not consume the model quota. All requests still have an abuse limit. It never exposes signed-in history. If no model is available, curated guides and deterministic safety replies remain available.

`npm run test:reply-accuracy` checks the reported bilingual small-talk cases, language selection, urgent bypass, actual response times and real English streaming. `npm test` covers negation, task-versus-small-talk routing and fragmented stream parsing. These are regression checks, not a guarantee of accuracy for every question.

`npm run test:preview` checks no-login greetings, stack explanations, a follow-up exam answer, Tanglish and immediate safety replies. Unit tests cover all 50 language examples. Dataset risk labels are routing hints, not diagnoses or validated assessments. Medium-level support suggestions do not automatically trigger the emergency UI. Listed self-harm, violence and urgent physical-symptom phrases bypass the model, but unknown wording and spelling can still be missed. The bilingual content and risk rules require qualified clinical and native-language review before real student deployment.

## Included API endpoints

| Area | Endpoint |
| --- | --- |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/me` |
| Support chat | `POST /api/chat`, `GET /api/chats` |
| Temporary local preview | `POST /api/preview/chat` (no login) |
| Mood tracking | `POST /api/moods`, `GET /api/moods` |
| Student content | `GET /api/resources`, `GET /api/tips`, `GET /api/exercises` |
| Admin insights | `GET /api/admin/analytics`, `/conversations`, `/alerts`, `/moods`, `/users`, `/settings` |
| Admin content | CRUD under `/api/admin/resources`, `/api/admin/tips`, `/api/admin/exercises` |
| API contract | `GET /api/openapi.json` |

Every student data endpoint requires `Authorization: Bearer <JWT>`. Admin routes also require an `ADMIN` role.

## Safety boundary

CampusCare is an early-support and resource-guidance product. It does not diagnose conditions or replace crisis services, clinicians, or emergency care. Crisis-language rules direct students toward immediate human and emergency support.

## Supabase + Prisma

The relational model is defined in [prisma/schema.prisma](prisma/schema.prisma). After creating a Supabase project, add its pooled PostgreSQL URL as `DATABASE_URL`, then run:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

The local API currently uses an in-memory development store so the app can be evaluated without cloud credentials. Do not deploy that development store: switch the repository implementation to the generated Prisma client after the database migration is available.
