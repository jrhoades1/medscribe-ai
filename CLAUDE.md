# medscribe-ai

AI-powered medical documentation capture. Records or uploads patient-consultation audio,
transcribes via Groq-hosted Whisper, and generates structured SOAP notes via Claude Sonnet 4.6.

> ⚠️ **MVP — SYNTHETIC DATA ONLY. NOT HIPAA-COMPLIANT. DO NOT USE WITH REAL PHI.**
> See [HIPAA_GOLIVE.md](./HIPAA_GOLIVE.md) for the gap list before handling real patient data.

## Architecture

```
Browser (mic / upload)
  │
  ▼
Next.js App Router (src/app)
  │
  ├── /api/transcribe  ──► Groq (whisper-large-v3-turbo)  ──► transcript text
  │
  ├── /api/generate-note  ──► Anthropic (claude-sonnet-4-6)  ──► SOAP JSON
  │                          (messages.parse + Zod schema, adaptive thinking)
  │
  └── Supabase client  ──► Supabase (Auth + Postgres + Storage)
```

### Key components
- **UI** (`src/app`, `src/components`) — Landing, dashboard, `AudioRecorder`, `TranscriptView`, `ClinicalNote`
- **API routes** (`src/app/api`) — `transcribe/route.ts` (Groq), `generate-note/route.ts` (Claude), `consultations/route.ts` (DB insert)
- **Integrations** (`src/lib`) — `supabase*.ts`, `anthropic.ts`, `groq.ts`
- **Persistence** — Supabase `consultations` table (`id`, `user_id`, `audio_path`, `transcript`, `clinical_note JSONB`, `created_at`) with RLS by `user_id`

### Data flow
1. User records audio in the browser (Web Audio API) or uploads a file
2. `/api/transcribe` streams audio to Groq-hosted Whisper, returns transcript
3. `/api/generate-note` sends transcript to Claude Sonnet 4.6 via `messages.parse()` with a Zod schema for the SOAP shape; adaptive thinking enabled
4. `/api/consultations` inserts a row into `consultations` (RLS scopes to `auth.uid()`)
5. UI renders the note with copy/download actions and prepends it to the history list

## Conventions

### Naming
- Files: kebab-case (`audio-recorder.tsx`); React components: PascalCase
- API routes: `src/app/api/<resource>/route.ts`
- Database tables: snake_case, plural
- Environment variables: SCREAMING_SNAKE_CASE

### File organization
- One module per file
- Max nesting: 2 levels inside `src/components`
- `src/lib` holds external-service clients only; business logic lives in `src/services`
- Tests mirror `src/` under `tests/`

## Commands

### Initial setup (first time)
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias '@/*' --no-git
npm install @supabase/supabase-js openai
cp .env.example .env.local
```

### Development
```bash
npm run dev
```

### Testing
```bash
npx vitest run
```

### Linting
```bash
npx eslint . --ext .ts,.tsx
```

## Constraints

### Security (MVP posture)
- No secrets in code — `.env.local` only, gitignored
- `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are server-side only; never imported into client components
- Row Level Security enabled on `consultations` — users see only their own rows
- Demo banner required on every page: "DEMO — synthetic data only, not HIPAA-compliant"
- Audio files auto-deleted from Supabase Storage after 24h (cron or Edge Function)

### PHI boundary (future)
- If/when this goes live with real PHI, all PHI handling must move into `src/phi/` and every data flow re-audited. See HIPAA_GOLIVE.md.

### Performance
- Groq Whisper budget: <10s for 5min audio (10x real-time typical)
- Claude SOAP generation: <15s with adaptive thinking
- No N+1 queries against Supabase

## Current State

### Built and working
- DSF scaffolding (directories, READMEs, .gitignore, pre-commit hooks)
- CLAUDE.md, .env.example, HIPAA go-live checklist

### In progress
- Next.js app init (`create-next-app` not yet run)

### Planned (per SPEC.md)
- Week 1: Next.js + Tailwind + Supabase wiring, landing page
- Week 2: Audio recorder, upload, `/api/transcribe`
- Week 3: `/api/generate-note`, SOAP prompt
- Week 4: Polish, copy/download, Vercel deploy

## Environment Variables

| Variable | Purpose | Required | Where used |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes | client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-protected) | Yes | client + server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin key | Server only | proxy + `/api` routes |
| `ANTHROPIC_API_KEY` | Claude Sonnet 4.6 for SOAP note generation | Yes | `/api/generate-note` only — never client |
| `GROQ_API_KEY` | Groq-hosted Whisper for transcription | Yes | `/api/transcribe` only — never client |
| `NEXT_PUBLIC_DEMO_MODE` | Shows demo banner | Yes (`true` for MVP) | UI |
