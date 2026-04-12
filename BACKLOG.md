# TagTale — backlog & hardening checklist

Use this as the master list. Check items off as you ship them.

## Security

- [x] Require a strong `JWT_SECRET` in production (no known fallback)
- [x] Do not expose raw exception strings in auth API JSON in production
- [x] Basic rate limits on auth exchange, magic-link, verify, and upload
- [x] Security headers via `middleware.ts` (nosniff, referrer, permissions)
- [x] Tighten Server Actions `allowedOrigins` (uses `NEXT_PUBLIC_BASE_URL` + `ALLOWED_ORIGINS`)
- [x] **Cloudflare R2** optional — if `R2_*` env vars are set, uploads go to R2 first (cheaper storage); else Supabase; else local dev
- [x] **Private** object storage + **signed URLs** for preview, feed, moderation, and admin (7-day URLs for feed; 1h for preview/moderation)
- [ ] If feed images break after 7 days without refresh, add a client refresh or longer-lived strategy
- [ ] Validate uploads with magic-byte sniffing, strip EXIF, per-user quotas
- [ ] Central rate limiting for multi-instance (Redis / Upstash)
- [ ] CSRF review for cookie-authenticated POSTs beyond SameSite defaults
- [ ] Content-Security-Policy tuned for your asset domains
- [ ] Document / enforce dev-only auto-login in `(main)/layout` (never wrong `NODE_ENV` in prod)

## Auth & accounts

- [ ] Decide single primary path: Supabase OTP vs Resend magic-link (remove or wire the unused path)
- [x] Document Supabase public env vars in `.env.example`
- [ ] Optional: email verification / account recovery flows

## Database

- [ ] Add versioned Prisma migrations to the repo (`prisma migrate`) for team/prod deploys
- [ ] Data retention policy for logs, analytics JSON, and scan coordinates (privacy)

## API / admin

- [x] Correct HTTP 401 vs 403 for admin routes (`Unauthorized` vs `Forbidden`)
- [ ] Audit remaining routes for consistent error shapes and logging (no PII in client errors)

## UI / UX / a11y

- [x] Bottom nav: `aria-current="page"` for active route
- [ ] Broader pass: focus order, labels, live regions for async errors
- [ ] Consistent loading skeletons and empty states across main pages

## Observability & ops

- [ ] **Production builds** need `JWT_SECRET` (≥32 chars) in the environment — `next build` runs with `NODE_ENV=production` and will fail if it is missing or too short
- [ ] Structured logging (level, request id) for production; avoid logging secrets
- [ ] Automated tests (auth, admin guards, critical API smoke)
- [ ] CI (lint + build + tests on PR)
- [ ] Confirm Netlify / host config (`netlify.toml`, Node version, Next plugin)

## Product / abuse

- [ ] Revisit public object listing: pagination, fields exposed, abuse limits
- [ ] Monitor AI moderation false positives / appeals

---

### Legend

Items marked **[x]** are implemented in-repo as of the last update to this file. **[ ]** is still open or only partially addressed.
