# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pratiro is an AI-powered parenting simulator that helps parents practice difficult conversations with children. Users roleplay as parents while the AI plays the child, followed by feedback analysis.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build
npm run start    # Run production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Next.js 16** with App Router
- **React 19** with TypeScript
- **Tailwind CSS v4** via PostCSS
- **Google Gemini AI** (gemini-2.5-flash) for chat and analysis

## Architecture

### Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Landing page with access code login modal. Access code is in `ACCESS_CODE` env variable. Stores `pratiro_access` in sessionStorage. |
| `app/simulator/page.tsx` | Main app - single-file component with 3-step flow: configuration → chat → analysis. Contains all state, UI components, and business logic. |
| `app/actions.ts` | Server action (`chatWithGemini`) that proxies requests to Gemini API. Keeps API key server-side only. |

### Application Flow

1. **Authentication**: Simple sessionStorage-based access control. `/simulator` redirects to `/` if no access token.

2. **Configuration (Step 1)**: User selects child's age (3-18), gender, and scenario. Scenarios are dynamically generated based on age group via `useMemo`.

3. **Chat (Step 2)**: Conversational roleplay where AI plays the child. Each message builds conversation history and sends to Gemini with context.

4. **Analysis (Step 3)**: AI analyzes the conversation and returns JSON with score, strengths, improvements, and child's perspective.

### API Integration

All Gemini API calls go through `app/actions.ts` server action. The action:
- Uses `GEMINI_API_KEY` from environment
- Returns `{ text }` on success or `{ error }` on failure
- Handles rate limiting with multiple layers:
  - **Kill switch**: `API_ENABLED=false` deaktiverer alle API-kall umiddelbart
  - **Global daglig grense**: `DAILY_GLOBAL_LIMIT` (standard 5000) for hele siden per dag
  - **Brukergrense per dag**: 100 kall per bruker per dag
  - **Burst-grense**: 10 kall per bruker per minutt
  - Logger `[ADVARSEL]` ved 80% av grensene og `[RATE LIMIT]` når grenser nås
- Error codes: `RATE_LIMIT`, `DAILY_LIMIT`, `SERVICE_DISABLED`, `INPUT_TOO_LONG`, `API_ERROR`, `NO_RESPONSE`, `NETWORK_ERROR`

### Environment Variables

Required in `.env.local`:
```
GEMINI_API_KEY=your_key_here
ACCESS_CODE=your_access_code_here
API_ENABLED=true
DAILY_GLOBAL_LIMIT=5000
```

## Code Style Notes

- UI text and comments are in Norwegian
- All components use Tailwind utility classes (no separate CSS modules)
- SVG icons are defined inline in the simulator page (`Icons` object)
- Color scheme: Nordic Calm v4.1 — forest (#2A4036), sage (#E7ECEA), sand (#F7F5F0), mist (#FDFCFB)
