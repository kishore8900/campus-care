# CampusCare API

The machine-readable OpenAPI entry point is `GET /api/openapi.json`.

## Authentication

Register using `POST /api/auth/register`, then include the returned bearer token in subsequent student requests:

```http
Authorization: Bearer <token>
```

## Safety response contract

`POST /api/chat` returns `reply` (including `category`), an `urgent` boolean, and an `assistantMode` value (`ai`, `reference` or `rules`). A true `urgent` value must be treated by the client as an immediate safety banner and must never be represented as medical diagnosis.

With `AI_PROVIDER=ollama`, ordinary signed-in conversations are answered locally by the configured model (Gemma 3 1B by default). Before generation, the server retrieves relevant app-authored knowledge notes, wellness tips and campus resources explicitly marked `verified: true`. Default demonstration contacts are excluded. The model receives only the authenticated student's recent complete chat exchanges. No native tool-calling support is required.

Messages may contain up to 4,000 characters. Assistant replies include `assistantMode`, `model` when generated, `sources` (the reference notes supplied, not guaranteed citations), and `truncated`. Generated Markdown is preserved. Matching crisis messages bypass generation. Provider failures and 45-second generation timeouts return basic support clearly labelled `rules` for signed-in chat. Ordinary overlapping requests for the same student return HTTP 409; urgent support does not wait for an earlier request.

## Progressive replies

Send `Accept: application/x-ndjson` to either chat endpoint to receive newline-delimited JSON events:

```json
{"type":"delta","text":"Part of an English model answer"}
{"type":"done","data":{"reply":{"id":"…","role":"ASSISTANT","message":"Complete answer","createdAt":"…"},"urgent":false,"assistantMode":"ai"}}
```

The `done.data` value has the same full contract as the JSON response, including metadata. Reference and crisis replies emit only `done`. Tanglish model output is buffered for a language check. Failures before streaming use an HTTP error; failures after headers emit `{"type":"error","error":"Retryable explanation"}`. EOF without `done` is incomplete, never a successful response. Cancelling the browser request aborts inference; partial output is not persisted. Existing clients without this Accept header still receive ordinary JSON. Chat responses use `Cache-Control: no-store`.

## Status codes

| Code | Meaning |
| --- | --- |
| 200 / 201 | Request completed |
| 400 | Validation failed |
| 401 | Missing, invalid, or expired token |
| 403 | Student tried an admin-only route |
| 409 | Duplicate account or a chat request is already active |
| 429 | Rate limit reached |
| 503 | Local preview model unavailable or timed out |

## No-login preview

`POST /api/preview/chat` accepts `{ message, history?: [{ role: "USER" | "ASSISTANT", message }] }`. Messages are limited to 4,000 characters, history to eight items of 6,000 characters each, and model history to complete exchanges within a 5,000-character budget. System roles are rejected. Client-provided history is untrusted conversation, never system instructions.

The reply contract matches signed-in chat. Preview uses local Ollama when generation is needed; a gateway-only configuration returns 503 for model requests. Local conversation guides still work. It processes supplied text without storing preview conversations in accounts. It permits one active model request and 20 model requests per IP per 15 minutes. Conversation guides and explicit crisis matches bypass model generation and preview quotas, but the general abuse limit still applies. Ordinary preview failures return a visible retryable error.

Both chat endpoints accept optional `language: "auto" | "english" | "tanglish"`, defaulting to `auto`. An explicit choice overrides detection for replies, never for safety matching. Auto mode retains the recent language for neutral follow-ups and detects language changes on substantive new messages. Everyday conversation and confidently matching support disclosures use the corresponding English/Tanglish guide. A language instruction attached to a question does not replace the question's intent. If a general model answer fails a basic Tanglish-language check, a labelled Tanglish clarification is returned instead of silently showing English. This check is heuristic, not a guarantee of translation quality.

## Reference datasets and safety

Ten academic scenarios and 25 English/Tanglish support examples supply bounded reference context. English/Tanglish fallback responses are selected by phrases, with emergency checks first. Medium-level support routing is not an emergency or a clinical assessment. The chatbot does not alert college staff, book appointments, read files, or automatically disclose chats.

Matching Tanglish topics use a curated reply with `assistantMode: "reference"`, reference metadata and no `model` field, because Gemma 1B was unreliable at Tanglish generation. Replies include `language` and `needsHumanSupport` routing hints. A human-support suggestion is not automatically urgent. Reference responses must not be labelled as model-generated.

Safety wording was checked against [NIMH support guidance](https://www.nimh.nih.gov/health/publications/5-action-steps-to-help-someone-having-thoughts-of-suicide) and [NHS emergency symptom guidance](https://www.nhs.uk/symptoms/shortness-of-breath/). This is not clinical validation. Real deployment requires specialist safety review, native-language review, verified local resources, durable access-controlled storage, and privacy/retention policies.
