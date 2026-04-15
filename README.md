# medscribe-ai

AI-powered medical documentation. Record or upload a patient consultation; get a
structured SOAP note back, generated from Groq-hosted Whisper (transcription) and
Claude Sonnet 4.6 (clinical note generation).

> ⚠️ **Portfolio MVP — synthetic data only. Not HIPAA-compliant.**
> See [HIPAA_GOLIVE.md](./HIPAA_GOLIVE.md) before using with real PHI.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS · Supabase (Auth + Postgres +
Storage, free tier) · Claude Sonnet 4.6 (SOAP generation) · Groq Whisper (transcription) · Vercel

## Quick Start

```bash
# First-time Next.js init (not yet run by bootstrap)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias '@/*' --no-git
npm install @supabase/supabase-js @supabase/ssr @anthropic-ai/sdk openai zod

# Configure env
cp .env.example .env.local
# fill in Supabase, Anthropic, and Groq keys

# Run (port 3006)
npm run dev
```

## Docs

- [CLAUDE.md](./CLAUDE.md) — architecture, conventions, commands (LLM-facing)
- [SPEC.md](./SPEC.md) — original product spec
- [HIPAA_GOLIVE.md](./HIPAA_GOLIVE.md) — gap list for real-PHI go-live
- [NEXT_SETUP.md](./NEXT_SETUP.md) — DSF bootstrap notes
