# Deploying medscribe-ai to Vercel

> ⚠️ **Portfolio / demo deploy only. Synthetic data.**
> Do not connect a Supabase project that contains real PHI. See
> [HIPAA_GOLIVE.md](./HIPAA_GOLIVE.md) for the production gap list.

## Prerequisites

1. **Supabase project** (free tier is fine for the demo)
   - Create a project at [supabase.com](https://supabase.com)
   - Open the SQL editor, paste [supabase-schema.sql](./supabase-schema.sql), run it
   - Settings → API → copy: Project URL, `anon` public key, `service_role` secret key
   - Authentication → URL Configuration → add your Vercel preview + production URLs
     to **Redirect URLs** (e.g. `https://medscribe-ai.vercel.app/auth/callback` and
     `https://medscribe-ai-*.vercel.app/auth/callback` for previews)

2. **Anthropic API key** with access to `claude-sonnet-4-6`
   - [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys)

3. **Groq API key** (free tier, no credit card required) with access to `whisper-large-v3-turbo`
   - [console.groq.com/keys](https://console.groq.com/keys)

4. **Vercel account** linked to your GitHub

## Deploy

```bash
# From the repo root
vercel link        # first time only
vercel --prod
```

Or push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).

## Environment Variables (set in Vercel → Project → Settings → Environment Variables)

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Production, Preview (⚠️ secret) |
| `ANTHROPIC_API_KEY` | `sk-ant-…` | Production, Preview (⚠️ secret) |
| `GROQ_API_KEY` | `gsk_…` | Production, Preview (⚠️ secret) |
| `NEXT_PUBLIC_DEMO_MODE` | `true` | Production, Preview, Development |

**Never set `NEXT_PUBLIC_DEMO_MODE=false` on this deploy.** That flag gates the demo
banner, and removing it implies the app is ready for real PHI — which it is not until
every item in HIPAA_GOLIVE.md is complete.

## Function limits

`vercel.json` sets:
- `/api/transcribe` → 60s (Groq Whisper is fast — typically <10s for 5min audio — but reserve headroom)
- `/api/generate-note` → 60s (Claude Sonnet 4.6 with adaptive thinking, typical <15s)

**Free (Hobby) plan** caps function duration at 60s, which fits. If you hit timeouts on
longer audio, the fix is to chunk the audio client-side, not to upgrade the plan — the
Whisper API itself has a 25MB limit per request enforced in the route handler.

## Post-deploy verification

1. Visit the production URL → demo banner should render at top
2. Click **Start Recording** → `/login` redirect (auth gate working)
3. Enter email → check inbox → click magic link → lands on `/dashboard`
4. Record a 10–20s sample ("synthetic patient says they have a headache") → transcript
   appears → SOAP note appears → row inserted in Supabase `consultations` table (verify
   in Supabase dashboard → Table Editor)
5. Sign out → dashboard should redirect to `/login`

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Magic link email never arrives | Supabase free-tier email rate limit | Wait 60s and retry, or configure custom SMTP in Supabase |
| Magic link opens but redirects to `/login?error=auth_callback_failed` | Redirect URL not whitelisted | Add the exact callback URL to Supabase Auth → URL Configuration |
| `/api/transcribe` returns 500 | Missing `GROQ_API_KEY` in Vercel env | Set it and redeploy (env var changes require a new deploy) |
| `/api/generate-note` returns 500 | Missing `ANTHROPIC_API_KEY` in Vercel env | Same fix — set it and redeploy |
| `/api/consultations` returns 401 | Cookies not propagating | Check middleware.ts is present; confirm Vercel isn't caching the dashboard route |
| RLS error on insert | Missing or wrong RLS policy | Re-run supabase-schema.sql |
| Build succeeds but dashboard blank | `NEXT_PUBLIC_*` env vars only set at build time | Add them to **all** environments and redeploy |
