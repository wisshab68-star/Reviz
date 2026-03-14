# Prompt SaaS

Starter backend minimal pour une SaaS de generation de fiches de revision.

## Stack

- Next.js
- Prisma
- PostgreSQL
- OpenAI
- Zod

## Variables d'environnement

Copier `.env.example` vers `.env` puis renseigner :

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `AUTH_SECRET`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PREMIUM_MONTHLY`

## Installation

```bash
npm install
npm run prisma:generate
npx prisma migrate dev --name init
npm run dev
```

## Stripe

- `POST /api/billing/checkout` cree une session Stripe Checkout
- `POST /api/billing/portal` ouvre le portail client Stripe
- `POST /api/billing/webhook` synchronise l'abonnement et le plan utilisateur

Pense a configurer le webhook Stripe local vers `/api/billing/webhook`.

## Endpoints

### `POST /api/generate`

```json
{
  "userId": "ck1234567890123456789012",
  "sourceType": "TEXT",
  "titleHint": "La photosynthese",
  "content": "Contenu de cours suffisamment long..."
}
```

### `GET /api/sheets?userId=...`

Retourne la liste des fiches d'un utilisateur.

### `GET /api/sheets/:id`

Retourne une fiche detaillee.
