<p align="center">
  <img src="public/teddy.png" alt="TeddyCare" width="200"/>
</p>

# TeddyCare

One app that a patient and their doctor both log into, showing each of them a different thing. Patients connect a wearable and see their own vitals and trends; doctors get a patient list, full records, and appointments. Both talk to a medical chat model that has the patient's actual numbers already in context, which is the only reason a question like "why is my resting heart rate up" gets a useful answer instead of a disclaimer.

Built at HackMIT 2023, where it won the $1,000 Tune AI sponsor award. [Demo](https://teddycare.vercel.app/).

Roles come from Clerk organizations rather than a column on the user. Membership in the `doctor` org routes you to the doctor dashboard, membership in `patient` routes you to yours, and middleware enforces it before a page renders.

## Setup

Node 18+ and pnpm. The lockfile is pnpm's, so npm and yarn will not reproduce the install.

```bash
pnpm install
cp .env.example .env    # fill in the keys below
pnpm run setup          # prisma generate + db push
pnpm dev                # http://localhost:3000
```

You need a Clerk application with two organizations, one with slug `doctor` and one with slug `patient`, a Tune Studio account for the chat model, and Terra credentials for wearable data. `.env` wants:

```
TUNE_STUDIO_API_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET
TERRA_DEV_ID
TERRA_API_KEY
TERRA_WEBHOOK_SECRET
DATABASE_URL          # defaults to file:./dev.db
```

Other scripts: `pnpm build`, `pnpm start`, `pnpm type-check`, `pnpm db:studio`, `pnpm db:reset` (destructive), `pnpm format:write`.

## How it fits together

Patients connect a device through the Terra widget, Terra runs the OAuth flow with the vendor, and health data arrives at `/api/terra/webhook`, which normalizes it into Prisma. The chat endpoint reads recent vitals for the signed-in user and injects them into the system prompt before calling a fine-tuned GPT-4o (`rohan/tune-gpt-4o`) through Tune Studio's proxy. The prompt adapts to role: technical terminology and differential diagnosis for a doctor, plain language and a push toward seeing a real physician for a patient.

Next.js 14 App Router with server components, Prisma over SQLite for local development, shadcn/ui and Radix on Tailwind, deployed on Vercel. For a real deployment, point `DATABASE_URL` at Postgres and switch the datasource provider in `prisma/schema.prisma`.

This is hackathon code and it is not a medical device. Do not use it to make a clinical decision.

## License

MIT
