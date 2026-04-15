# AI Scribe MVP - Technical Specification

## Project Overview

**Name:** MedScribe AI  
**Type:** Web Application (MVP)  
**Purpose:** Demonstrate AI-powered medical documentation capture and transcription  
**Target Users:** Healthcare developers, potential employers, open source community

---

## What It Does (MVP)

1. **Audio Input** — User records or uploads audio of a patient consultation
2. **Transcription** — Speech-to-text via OpenAI Whisper API
3. **AI Processing** — LLM converts transcript into structured medical note
4. **Output** — Display formatted clinical note (SOAP format)

---

## Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| **Frontend** | Next.js 14 + React | Modern, fast, easy deployment |
| **Styling** | Tailwind CSS | Quick styling, clean UI |
| **Backend** | Next.js API Routes | No separate server needed |
| **Speech-to-Text** | OpenAI Whisper API | Best-in-class accuracy |
| **LLM** | OpenAI GPT-4o | Clinical note generation |
| **Database** | Supabase | Free tier, easy auth |
| **Audio Storage** | Supabase Storage | Store recordings |
| **Deployment** | Vercel | Free tier, one-click |

---

## Project Structure

```
medscribe-ai/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Main app interface
│   │   ├── api/
│   │   │   ├── transcribe/
│   │   │   │   └── route.ts   # Whisper transcription
│   │   │   └── generate-note/
│   │   │       └── route.ts   # GPT clinical note generation
│   │   └── globals.css
│   ├── components/
│   │   ├── AudioRecorder.tsx  # Record audio from mic
│   │   ├── AudioPlayer.tsx     # Playback recordings
│   │   ├── TranscriptView.tsx  # Show transcript
│   │   ├── ClinicalNote.tsx    # Generated SOAP note
│   │   └── ui/                 # Reusable UI components
│   └── lib/
│       ├── supabase.ts         # Supabase client
│       └── openai.ts           # OpenAI client
├── public/
├── supabase-schema.sql         # Database setup
├── .env.example                # Environment variables
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## Core Features (MVP)

### 1. Landing Page
- Hero section explaining product
- "Start Recording" CTA
- Features overview
- GitHub link

### 2. Recording Interface
- Large "Record" button
- Audio waveform visualization
- Timer showing recording duration
- Stop/Pause controls

### 3. Processing View
- Show processing status
- Progress indicator
- "Analyzing your consultation..."

### 4. Clinical Note Output
Display structured SOAP note:
- **Subjective:** Patient complaints, history
- **Objective:** Vital signs, exam findings
- **Assessment:** Diagnosis
- **Plan:** Treatment plan

### 5. Copy/Download
- Copy note to clipboard
- Download as text file

---

## API Endpoints

### POST /api/transcribe
**Input:** Audio file (m4a, mp3, webm)  
**Output:** Transcript text

```typescript
// Request
{ audioFile: File }

// Response
{ transcript: "Patient presents with..." }
```

### POST /api/generate-note
**Input:** Transcript text  
**Output:** Structured clinical note

```typescript
// Request
{ transcript: "Patient presents with chest pain..." }

// Response
{
  subjective: "64-year-old male presenting with...",
  objective: "BP 140/90, HR 88...",
  assessment: "Suspected angina vs GERD...",
  plan: "1. EKG 2. Troponin..."
}
```

---

## Database Schema (Supabase)

```sql
-- Consultations table
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  audio_url TEXT,
  transcript TEXT,
  clinical_note JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simple auth is built into Supabase
-- Enable Row Level Security for user data
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# OpenAI
OPENAI_API_KEY=sk-your-key

# Optional: Analytics
NEXT_PUBLIC_GA_ID=
```

---

## Step-by-Step Build Guide

### Week 1: Foundation
- [ ] Initialize Next.js project
- [ ] Set up Tailwind CSS
- [ ] Configure Supabase
- [ ] Build landing page

### Week 2: Recording
- [ ] Implement audio recording (Web Audio API)
- [ ] Add upload functionality
- [ ] Create /api/transcribe endpoint

### Week 3: AI Processing
- [ ] Connect OpenAI Whisper
- [ ] Build /api/generate-note endpoint
- [ ] Create prompt for clinical note generation

### Week 4: Polish
- [ ] Style the dashboard
- [ ] Add copy/download features
- [ ] Deploy to Vercel
- [ ] Clean up code, add comments
- [ ] Push to GitHub

---

## Key Technical Challenges

| Challenge | Solution |
|-----------|----------|
| Audio format compatibility | Use ffmpeg to convert on backend |
| HIPAA compliance | Don't store PHI in logs; clear quickly |
| LLM context limits | Chunk long transcripts if needed |
| Cost management | Cache common patterns; limit usage |

---

## Cost Estimate (MVP)

| Service | Free Tier | Cost after free |
|---------|-----------|-----------------|
| Supabase | 500MB DB, Auth | $0/mo |
| Vercel | 100GB bandwidth | $0/mo |
| OpenAI | $5 credit | ~$10-50/mo |
| **Total** | | **$10-50/mo** |

---

## Demo Workflow

1. User opens app
2. Clicks "Start Recording"
3. Speaks their consultation (or uses provided sample)
4. System transcribes via Whisper
5. GPT generates SOAP note
6. User reviews, copies, or downloads

---

## GitHub README Should Include

- Clear setup instructions
- Screenshot/GIF of the app
- Tech stack explanation
- API key setup guide
- How to run locally
- Roadmap for future features

---

## Future Enhancements (Post-MVP)

- [ ] Multi-speaker identification (doctor vs patient)
- [ ] Real-time transcription
- [ ] EHR integration
- [ ] Voice commands
- [ ] Medical coding (ICD-10, CPT)
- [ ] Multi-language support

---

## Why This is a Strong Portfolio Piece

✅ Shows you can build full-stack  
✅ Demonstrates AI/ML integration  
✅ Proves you understand APIs  
✅ Clean UI/UX implementation  
✅ Real healthcare domain knowledge  
✅ Deployment experience  

---

*Last updated: April 2026*
