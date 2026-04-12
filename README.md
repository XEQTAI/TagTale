# TagTale

Social feed tied to QR-tagged objects.

## Database (Supabase or any Postgres)

1. Copy `.env.example` → `.env` and set **`DATABASE_URL`**, **`JWT_SECRET`** (≥32 chars), **`RESEND_API_KEY`**, **`NEXT_PUBLIC_BASE_URL`** (your site URL in production).

2. **Prove the DB is reachable** (saves hours of guessing):

   ```bash
   npm run db:check
   ```

3. Apply schema and seed:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

   Or for a quick local DB without migration history: `npx prisma db push` then `npm run db:seed`.

4. **Email sign-in**: set `RESEND_API_KEY` in production. For local testing without sending mail, you can use `re_dev_placeholder` — codes are logged in the terminal where `npm run dev` runs.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3333` — sign in with email OTP on `/login`.

## Production build

```bash
npm run build
npm start
```

Set the same env vars on your host (e.g. Netlify). Run `npx prisma migrate deploy` against production `DATABASE_URL` whenever migrations change.
