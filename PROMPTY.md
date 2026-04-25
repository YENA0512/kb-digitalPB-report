# PROMPTY: KB MoneyFlow AI Agent Guide

## 1. Context & Persona
**Project:** KB MoneyFlow (Digital PB/Wealth Management App)
**Design Philosophy:** "Elegant Dark Banking". Use #FFBC00 (KB Yellow) for points, dark grey/black (#1a1a1a, #262626) for background. Glassmorphism and smooth motion are mandatory.

## 2. Core Technical Constraints
- **Framework:** React 18 (Vite)
- **Styling:** Tailwind CSS + Framer Motion (for all animations)
- **AI:** Google Gemini API (use `GoogleGenAI` SDK)
- **Icons:** `lucide-react`
- **Navigation:** Custom bottom tab bar with `AnimatePresence`.

## 3. Data Structure (Current Mock)
```typescript
interface Asset {
  id: string;
  name: string;
  amount: number;
  change: number;
  category: 'Stock' | 'Fund' | 'Cash';
}
```

## 4. Specific Integration Instructions for Antigravity

### [Error Handling Strategy]
- **Gemini Missing:** If `VITE_GEMINI_API_KEY` is missing, display: "환경변수 VITE_GEMINI_API_KEY가 설정되지 않았습니다".
- **Supabase Error:** Display specific technical error messages in the UI for debugging.
- **Parsing Error:** If JSON parsing for AI response fails, display the first 200 chars of raw output + the specific error reason.

### [Build & Syntax Rules]
- **Type Imports:** ALWAYS use `import type { ... }` for TypeScript models.
- **No Unused Imports:** Ensure clean code to avoid build warnings.
- **Dependencies:** Ensure `tslib` is installed for `@supabase/supabase-js` compatibility.

### [Environment Management]
- Read from `import.meta.env.VITE_XXX`.
- NEVER create UI inputs for API keys.
- Ensure `.env.example` is present for Vercel/Local deployment reference.

## 5. Prompts for Immediate Execution

### [Task: Supabase Client & Setup]
"Create `src/lib/supabase.ts` and initialize the client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Implement a basic `getAssets` function that fetches from the `assets` table and handles connection errors with clear UI messages."

### [Task: Gemini Integration (Client-Side)]
"Create `src/lib/gemini.ts`. Implement a function to call the Gemini 1.5 Flash model directly from the browser. Ensure the prompt requests a JSON response and add a `try-cache` block that handles JSON.parse errors by showing the raw 200 character preview."

### [Task: Deployment Readiness]
"Generate a `README.md` at the root explaining: 1) Asset installation, 2) SQL Schema execution in Supabase, 3) Vercel environment variable setup (3 keys). Update `package.json` to ensure the build script is standard `vite build`."
