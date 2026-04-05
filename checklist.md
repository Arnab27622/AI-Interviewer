# 🔍 Prepify (AI Interview) — Full Codebase Review

> Complete analysis of frontend (React + Vite + TypeScript), backend (Express + MongoDB), and AI service (FastAPI + Gemini + Whisper).

---

## ✅ Overall Verdict

The project **compiles cleanly** — zero TypeScript errors. The architecture is sound (3-tier with socket.io real-time updates), the code structure is well-organized, and the UI is polished. However, there are **several bugs, security risks, and improvement opportunities** listed below, ordered from most critical to least.

---

## 🐛 Bugs & Errors

### 2. **BUG — Auth Middleware Double-Throws on Missing Token**
**File:** [auth.js:22-26](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/backend/middleware/auth.js#L22-L26)

```js
// Line 8-21: if auth header exists, try verify → on catch, throw "token failed"
// Line 22-26: if (!token) → throw "no token"
```

If a valid `Authorization` header is present but verification fails (expired token, tampered, etc.), the `catch` block throws "Not authorized, token failed" — **but it doesn't return**. Execution continues to line 23 where `token` is now set (it was split from the header), so the `!token` check is skipped. This is a latent bug — it works by accident but should be explicitly using `return` or `else if`.

```diff
-    if (!token) {
+    } else {
         res.status(401);
         throw new Error("Not authorized, no token");
     }
```

---

### 3. **BUG — `sessionSlice` Regex Extract Logic Is Broken**
**File:** [sessionSlice.ts:145-151](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/frontend/src/features/session/sessionSlice.ts#L145-L151)

```ts
const qMatch = message.match(/Q\d+/);
if (qMatch) {
    const qIndex = parseInt(qMatch[1]) - 1;  // BUG: qMatch[1] is undefined
```

`qMatch[0]` is the full match (e.g., `"Q3"`), but `qMatch[1]` would be a capture group — the regex has no capture groups. This always produces `NaN`, causing `state.activeSession.questions[NaN]` which is `undefined`.

**Fix:**
```ts
const qMatch = message.match(/Q(\d+)/);  // Add capture group
```

---

### 4. **BUG — `InterviewRunner` Destructures `message` Twice**
**File:** [InterviewRunner.tsx:83](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/frontend/src/pages/InterviewRunner.tsx#L83)

```ts
const { activeSession, isLoading, message, isError: sessionError, message: sessionMessage } = useSelector(...)
```

`message` is destructured twice — once as `message` and once as `sessionMessage`. They both refer to the same value but `message` shadows `sessionMessage`. This is harmless but confusing and indicates an incomplete refactor.

**Fix:** Remove the redundant `message` destructure:
```ts
const { activeSession, isLoading, isError: sessionError, message: sessionMessage } = useSelector(...)
```

---

### 5. **BUG — `SessionReview` "No answer recorded" Display Logic Is Incorrect**
**File:** [SessionReview.tsx:184](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/frontend/src/pages/SessionReview.tsx#L184)

```tsx
{(!q.userAnswerText || q.userSubmittedCode === 'undefined') && !q.userAnswerText && (
```

This checks `q.userSubmittedCode === 'undefined'` (as a **string literal**). If the field is the JS `undefined` type, this check fails. And if it actually holds the string `"undefined"`, it's a data bug elsewhere. The condition also redundantly checks `!q.userAnswerText` twice.

**Fix:**
```tsx
{!q.userAnswerText && (!q.userSubmittedCode || q.userSubmittedCode === 'undefined') && (
```

---

### 6. **BUG — `endTime` Defaults to `Date.now` at Creation Time**
**File:** [SessionModel.js:93-94](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/backend/models/SessionModel.js#L93-L94)

```js
endTime: {
    type: Date,
    default: Date.now
}
```

When a session is created, `endTime` is immediately set to the current time (same as `startTime`). This means `formatDuration()` on the review page shows `0s` until the session actually completes and `endTime` gets overwritten. It should default to `null` instead.

---

### 7. **Typo — "Assesment" → "Assessment"**
**File:** [SessionReview.tsx:107](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/frontend/src/pages/SessionReview.tsx#L107)

```tsx
<span>Assesment Complete</span>  // ← Typo
```

---

### 8. **BUG — `calculateScoreSummary` Averages Include Unevaluated Questions as 0**
**File:** [sessionController.js:178](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/backend/controllers/sessionController.js#L178)

```js
avgTechnical: { $avg: { $cond: [{ $eq: ['$questions.isEvaluated', true] }, '$questions.technicalScore', 0] } },
```

Questions that aren't evaluated contribute `0` to the average, dragging the score down. If a user only answers 3 of 5 questions, the average divides by 5 including two 0s.

**Fix:** Use `$match` to filter only evaluated questions before `$avg`, or use `null` instead of `0` in `$cond` (MongoDB's `$avg` ignores `null`).

---

## ⚠️ Security Issues

### 9. **No Rate Limiting on Auth Endpoints**
Login and register endpoints have no rate limiting. This allows brute-force attacks.

**Fix:** Add `express-rate-limit` middleware on `/api/user/login` and `/api/user/register`.

### 10. **No Input Sanitization / Validation on Backend**
User-provided fields (`role`, `level`, `name`, `email`) are passed directly to MongoDB without validation. While Mongoose schemas provide type enforcement, explicit validation (e.g., `express-validator`) would prevent injection and ensure data integrity.

### 11. **CORS Origin Check Uses `includes()` on a String**
**File:** [server.js:28](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/backend/server.js#L28)

```js
if (allowOrigin.includes(origin)) {
```

`allowOrigin` is a single string (e.g., `"http://localhost:3000"`). Using `.includes()` on a string means `"http://localhost:300"` would also pass because it's a substring. Use strict equality `===` or split into an array.

### 12. **`devTools: true` Hardcoded in Redux Store**
**File:** [store.ts:13](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/frontend/src/app/store.ts#L13)

Should be `process.env.NODE_ENV !== 'production'` to prevent access to Redux state in production.

---

## 🏗 Architecture & Code Quality Improvements

### 13. **No README.md in Root / Backend / AI-Service**
The root has no README. Only the frontend has a (Vite template) README. Add a comprehensive project README with:
- Architecture diagram
- Setup instructions for all 3 services
- Environment variable documentation
- API endpoint reference

### 14. **Large Commented-Out Code Block in `ai-service/main.py`**
**File:** [main.py:1-122](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/ai-service/main.py#L1-L122)

122 lines of commented-out Ollama code. Remove it and keep history in git.

### 15. **Duplicated Axios Interceptors**
Auth token injection is done in two places:
- `sessionSlice.ts` (line 12-19) — Local `api` instance  
- `main.tsx` (line 13-22) — Global axios interceptor for 401s only

And 401 handling is duplicated in both the local interceptor (line 21-30) and the global one. Consolidate into a single setup.

### 16. **No `.gitignore` for `.env` Files**
The `.env` files (with real secrets!) may be committed to git. Ensure `**/.env` is in the root `.gitignore`.

### 17. **`index.html` Title Says "AI Interview" — Brand Is "Prepify"**
**File:** [index.html:7](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/frontend/index.html#L7)

Also missing meta description for SEO.

### 18. **Missing `requests` in `requirements.txt`**
**File:** [requirements.txt](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/ai-service/requirements.txt)

`main.py` imports `requests` (line 126) but it's not listed in `requirements.txt`.

### 19. **Audio Recording Cleanup Missing in `InterviewRunner`**
If the user navigates away without stopping recording, the `MediaRecorder` and `MediaStream` tracks may remain active. Add a cleanup effect:
```tsx
useEffect(() => {
    return () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
}, []);
```

### 20. **`node-fetch` Is Unnecessary with Express 5**
**File:** [backend/package.json:24](file:///c:/Users/ARNAB%20DEY/MyPC/Web_Dev/NextJs/AI-Interview2/backend/package.json#L24)

Express 5 runs on Node.js 18+, which has native `fetch`. You can replace `node-fetch` with the built-in `fetch` API.

---

## 🚀 Feature Improvement Recommendations

### High Priority

| # | Feature | Why |
|---|---------|-----|
| 1 | **Interview Timer** | Show a live countdown/elapsed timer during the interview. Users have no sense of how long they've been |
| 2 | **Retry / Resume Failed Sessions** | Failed sessions (from API quota limits) are abandoned. Allow users to retry question generation |
| 3 | **Password Reset Flow** | There's no "Forgot Password?" link or flow |
| 4 | **Session Pagination** | Dashboard loads ALL sessions at once. As data grows this will become slow |
| 5 | **Loading Skeleton States** | Replace raw spinner with skeleton placeholders for better perceived performance |

### Medium Priority

| # | Feature | Why |
|---|---------|-----|
| 6 | **Dark Mode Toggle** | Header is dark but pages are light — a full dark mode would improve UX consistency |
| 7 | **Export Interview Report** | Allow PDF/CSV export of the session review for personal records |
| 8 | **Question Bookmarking** | Let users bookmark difficult questions for later review |
| 9 | **Performance Trends Chart** | Dashboard could show score trends over time (line chart) |
| 10 | **Keyboard Shortcuts** | Enable arrow keys for question navigation, spacebar for recording toggle |

### Low Priority / Polish

| # | Feature | Why |
|---|---------|-----|
| 11 | **Landing Page** | Unauthenticated users see Login/Register — a marketing landing page would boost signups |
| 12 | **Email Verification** | Validate email addresses during registration |
| 13 | **Custom Interview Templates** | Allow users to save favorite role/level/type combinations |
| 14 | **Sound Effects** | Subtle audio cues for recording start/stop and submission |
| 15 | **Accessibility (a11y) Audit** | Add `aria-labels`, keyboard focus management, color contrast checks |

---

## 📊 Summary

| Category | Count |
|----------|-------|
| **Critical Bugs** | 3 (OAuth secret leak, auth middleware, regex) |
| **Logic Bugs** | 5 (score calculation, display, model defaults) |
| **Security Issues** | 4 (rate limiting, validation, CORS, devtools) |
| **Code Quality** | 8 (dead code, duplication, missing deps, cleanup) |
| **Feature Ideas** | 15 |

The codebase is in a **functional but pre-production state**. The most urgent fixes are the **exposed OAuth secret** (#1), the **auth middleware control flow** (#2), and the **score calculation bug** (#8). Everything else is improvement work toward a production-ready product.
