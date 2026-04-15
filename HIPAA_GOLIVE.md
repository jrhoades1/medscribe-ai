# HIPAA Go-Live Checklist — medscribe-ai

**Current posture:** MVP / portfolio demo. **Synthetic data only.**
This document is the gap list between today's build and a production deployment
that could legally handle real Protected Health Information (PHI).

**Do not flip `NEXT_PUBLIC_DEMO_MODE=false` or remove the demo banner until every
item below is complete and signed off.**

---

## 1. Business Associate Agreements (BAAs)

Every vendor that receives, stores, or transmits PHI must have a signed BAA
covering this specific use case. No BAA = no PHI.

| Vendor | MVP status | Required for go-live |
|---|---|---|
| **Supabase** | Free tier — **no BAA** | Upgrade to Team plan ($599/mo) or higher, then request and countersign a BAA. Free and Pro tiers are **not** HIPAA-eligible regardless of configuration. |
| **Anthropic (Claude Sonnet 4.6)** | Standard API — **no BAA** | Two paths: (1) Anthropic's Enterprise tier with a direct BAA, or (2) deploy through **AWS Bedrock** with an existing AWS BAA covering Bedrock. Bedrock is the most common compliant path. Confirm the BAA explicitly covers the Messages API and adaptive thinking. |
| **Groq (whisper-large-v3-turbo)** | Free tier — **no BAA** | Groq does not currently offer BAAs on the self-serve tier. For real PHI, replace with a HIPAA-eligible STT: **Deepgram** (enterprise tier, offers BAA, has medical-tuned models like `nova-2-medical`), **AWS Transcribe Medical** (covered under AWS BAA), or **Azure AI Speech** (Azure BAA). Keep the client-side `openai` SDK pattern and just swap `baseURL` + model. |
| **Vercel** | Hobby / Pro — **no BAA** | Upgrade to Vercel Enterprise and sign a BAA. Alternatively, self-host Next.js on a BAA-covered platform (AWS w/ BAA, Azure Health Data Services). |
| **Any analytics / logging SaaS** (Sentry, PostHog, GA, Vercel Analytics) | May be wired in for MVP | Each one needs its own BAA, or must be disabled for PHI paths, or scrubbed of PHI before events leave the server. Default: disable in PHI paths. |

Rule: if a new third-party SDK is added, the PR cannot merge until the BAA
status is documented.

---

## 2. PHI Boundary

- [ ] Move all PHI handling into `src/phi/` (models, services, middleware)
- [ ] `src/shared/` must contain no PHI — ever. Add a lint rule / code review check.
- [ ] Audio files, transcripts, and clinical notes are PHI. Every code path that
      touches them must be enumerated in `docs/phi-data-flow.md`.
- [ ] Minimum-necessary principle: UI, logs, and exports must not surface more
      PHI than the user needs for the task at hand.

---

## 3. Encryption

- [ ] **At rest:** Confirm Supabase storage + Postgres encryption is enabled
      (AES-256). Add field-level encryption for the `transcript` and
      `clinical_note` columns using a key stored in a managed KMS (AWS KMS,
      GCP KMS, or Supabase Vault).
- [ ] **In transit:** TLS 1.2+ enforced on all endpoints. HSTS enabled.
      No plain HTTP.
- [ ] **Audio uploads:** signed URLs only, short TTL (<5 min), never public.
- [ ] **Key rotation:** document rotation cadence (at least annually) and
      who owns it.

---

## 4. Authentication & Access Control

- [ ] MFA required for all accounts that can access PHI (Supabase Auth supports TOTP).
- [ ] Role-based access: `patient`, `clinician`, `admin`. RLS policies per role,
      not just per user.
- [ ] Session timeout ≤ 15 minutes idle (HIPAA guidance; not a hard rule but expected).
- [ ] Account lockout after N failed attempts.
- [ ] Password policy meets NIST 800-63B.

---

## 5. Audit Logging (6-year retention)

HIPAA §164.312(b) — immutable audit trail of every PHI access.

- [ ] Log every read, write, export, and delete of PHI with: actor user_id,
      timestamp (UTC), action, resource id, source IP, user agent, outcome.
- [ ] Logs written to a **separate, append-only store** — never to the same DB
      as the PHI, never to stdout only.
- [ ] Retention: 6 years minimum. Set up lifecycle policy.
- [ ] Logs themselves must not contain PHI values — only references (ids).
- [ ] Tamper-evidence: hash chain, or write to an append-only service (AWS
      CloudTrail Lake, immudb, etc.).
- [ ] Log review process: someone actually reads them on a schedule. Document who.

---

## 6. Data Retention & Disposal

- [ ] Written retention policy: how long audio, transcripts, and notes are kept.
- [ ] Automated deletion after retention window.
- [ ] Secure deletion verified (not just soft-delete flags).
- [ ] Patient right-to-delete workflow (HIPAA + state laws like CCPA/CMIA).
- [ ] Backups also subject to retention policy — no forgotten 7-year-old backups.

---

## 7. Breach Response

- [ ] Written incident response plan.
- [ ] 60-day breach notification process (HHS + affected individuals; media if ≥500).
- [ ] On-call rotation and escalation paths documented.
- [ ] Tabletop exercise completed at least once before go-live.

---

## 8. Administrative Safeguards

- [ ] Designated HIPAA Security Officer (a named human).
- [ ] Workforce HIPAA training completed and documented annually.
- [ ] Risk analysis completed (NIST SP 800-66 or equivalent). Redo annually.
- [ ] Sanctions policy for workforce violations.
- [ ] Contingency plan: backup, disaster recovery, emergency mode operation.

---

## 9. Technical Controls Specific to medscribe-ai

- [ ] **Claude payloads:** Anthropic's standard commercial terms already prohibit
      training on API inputs and outputs. For real PHI, still require the BAA
      in writing (Enterprise or AWS Bedrock). Confirm Zero Data Retention if using
      Anthropic directly.
- [ ] **Transcription payloads:** Groq is not HIPAA-eligible and will need to be
      replaced for real PHI. The replacement vendor (Deepgram / AWS Transcribe
      Medical / Azure) must have a BAA covering the specific audio endpoint used.
- [ ] **Client-side recording:** browser-side audio must be encrypted before
      leaving the device, or uploaded directly to a BAA-covered endpoint —
      never through a third-party CDN or analytics pixel.
- [ ] **Error tracking:** Sentry-style error reports will capture stack traces;
      ensure no PHI is in exception messages or local variables. Use a PHI
      scrubber or disable in PHI paths.
- [ ] **Demo banner removal:** `NEXT_PUBLIC_DEMO_MODE` gate is only flipped
      after sign-off on this entire document.

---

## 10. Pre-Go-Live Sign-Off

Before PHI ever touches production:

- [ ] Third-party HIPAA security assessment (SOC 2 Type II or HITRUST preferred).
- [ ] Penetration test of production environment.
- [ ] All checklist items above signed off in writing by the Security Officer.
- [ ] Legal review of privacy policy and terms of service.
- [ ] Notice of Privacy Practices published and acknowledged at signup.

---

**Last reviewed:** 2026-04-15 (MVP scaffold — no items completed yet; demo-only).
