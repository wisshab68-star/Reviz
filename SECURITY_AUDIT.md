# AUDIT DE SÉCURITÉ COMPLET — Reviz SaaS
**Date** : 2026-04-16  
**Auditeur** : Claude Security Audit  
**Version** : 1.0

---

## 📊 Résumé Exécutif

| Indicateur | Valeur |
|---|---|
| État général | MOYEN — Ne pas lancer en l'état |
| Findings critiques | 3 |
| Findings élevés | 5 |
| Findings moyens | 6 |
| Recommandation | Corriger CRIT + HIGH avant lancement |

**Résumé** : L'application est globalement bien structurée — authentification NextAuth v5 correcte, hachage scrypt des mots de passe, vérification des signatures Stripe, aucune injection SQL. Cependant, trois vulnérabilités critiques compromettent directement la sécurité financière et la confidentialité des données : absence totale d'authentification sur les routes de génération IA (coût Anthropic non borné), fuite potentielle de secrets réels via OneDrive, et un double webhook Stripe avec double écriture conflictuelle sur les données d'abonnement. Ces trois points doivent être corrigés avant tout lancement en production.

---

## 🔴 Findings CRITIQUES

### CRIT-01 — Routes `/api/generate/inventory` et `/api/generate/sheet` non authentifiées

- **Fichiers** :
  - `src/app/api/generate/inventory/route.ts`
  - `src/app/api/generate/sheet/route.ts`
- **Problème** : Ces deux routes POST déclenchent des appels à l'API Anthropic (coûteux) et modifient des enregistrements en base de données sans aucune vérification d'authentification ni d'ownership. N'importe quel attaquant anonyme peut les appeler en boucle, passer un `sheetId` quelconque (format CUID, 25 caractères alphanumériques — énumérable par force brute ou observable dans les réponses), lancer des générations IA arbitraires et écraser le statut de n'importe quelle fiche existante.
- **Impact** :
  - Épuisement du quota et de la facture Anthropic par un tiers malveillant (attaque "API billing drain").
  - Écriture arbitraire dans la table `StudySheet` pour toute ligne dont l'ID est connu ou deviné.
  - Absence d'ownership check : l'utilisateur A peut déclencher la génération d'une fiche appartenant à l'utilisateur B.
- **Probabilité** : Élevée
- **Correction** :
```ts
// src/app/api/generate/inventory/route.ts — ajouter en tête de POST :
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = inventoryRequestSchema.parse(await request.json());

  // Vérifier l'ownership
  const sheet = await db.studySheet.findFirst({
    where: { id: parsed.sheetId, userId: session.user.id },
    select: { id: true },
  });
  if (!sheet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // ... suite du handler
}

// src/app/api/generate/sheet/route.ts — même pattern :
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const sheet = await db.studySheet.findFirst({
  where: { id: sheetId, userId: session.user.id },
  select: { id: true },
});
if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
```
- **Sévérité** : 🔴 CRITIQUE

---

### CRIT-02 — Secrets réels exposés via OneDrive (synchronisation cloud automatique)

- **Fichier** : `.env` (racine du projet)
- **Problème** : Le fichier `.env` contient des secrets réels de production actifs (clé API Anthropic `sk-ant-api03-…`, `AUTH_SECRET`, Client ID Google OAuth). Bien que `.env` soit dans `.gitignore`, le projet réside dans `C:\Users\madri\OneDrive\Documents\Playground` — OneDrive synchronise automatiquement ce fichier vers le cloud Microsoft, l'exposant à toute personne ayant accès au compte (multi-appareils, partage de dossier accidentel, compromission du compte Microsoft).
- **Impact** :
  - Accès à l'API Anthropic par un tiers → facturation illimitée au nom du propriétaire.
  - Compromission de `AUTH_SECRET` → forge de sessions JWT pour n'importe quel utilisateur.
  - Compromission du Client ID Google → abus OAuth.
- **Probabilité** : Élevée (synchronisation en cours à chaque modification)
- **Correction** :
  1. Déplacer le projet hors de OneDrive (ex. `C:\dev\reviz`) ou ajouter le dossier à la liste d'exclusion OneDrive.
  2. Révoquer et régénérer immédiatement la clé API Anthropic et le secret NextAuth.
  3. Si OneDrive a déjà synchronisé le fichier, supprimer la version cloud manuellement depuis onedrive.live.com.
  4. Utiliser un gestionnaire de secrets (Vercel env vars, Doppler, 1Password Secrets Automation) pour les déploiements.
- **Sévérité** : 🔴 CRITIQUE

---

### CRIT-03 — Double webhook Stripe avec logique conflictuelle et absence d'idempotence

- **Fichiers** :
  - `src/app/api/billing/webhook/route.ts`
  - `src/app/api/stripe/webhook/route.ts`
- **Problème** : Deux endpoints webhook Stripe distincts coexistent avec des logiques divergentes. Les deux vérifient la signature Stripe mais produisent des effets de bord contradictoires :
  - `billing/webhook` utilise `subscription-service.ts` avec le modèle `Subscription` dédié et mappe le `priceId` au bon tier (STANDARD/PRO).
  - `stripe/webhook` écrit directement sur `User.plan` et force `tier: "STANDARD"` pour tout abonnement actif, quel que soit le prix réel, et sans incrémenter `sheetsUsedMonth`.
  - Aucun des deux n'implémente de déduplication par `event.id` : si Stripe rejoue un événement (comportement normal en cas d'échec), les deux handlers s'exécutent deux fois chacun.
  - Si les deux sont enregistrés sur le Dashboard Stripe, chaque événement est traité 4 fois avec des mises à jour conflictuelles.
- **Impact** :
  - Données d'abonnement incohérentes : un utilisateur PRO peut se voir attribuer les limites STANDARD (20 fiches au lieu de 50).
  - Double incrémentation ou double downgrade possible.
  - `PromoExamAccess` créé deux fois → `upsert` masque le bug mais crée un état imprévisible.
- **Probabilité** : Élevée dès que les deux endpoints sont enregistrés sur Stripe.
- **Correction** :
```ts
// 1. Choisir UN SEUL endpoint (recommandé : billing/webhook) et supprimer l'autre.
// 2. Ajouter une table d'idempotence dans schema.prisma :
model ProcessedStripeEvent {
  stripeEventId String   @id
  processedAt   DateTime @default(now())
}

// 3. En début de handler :
const already = await db.processedStripeEvent.findUnique({
  where: { stripeEventId: event.id },
});
if (already) return new Response("ok", { status: 200 });

await db.processedStripeEvent.create({ data: { stripeEventId: event.id } });
// ... traitement
```
- **Sévérité** : 🔴 CRITIQUE

---

## 🟠 Findings ÉLEVÉS

### HIGH-01 — `GET /api/sheets/[id]` : IDOR sans authentification en l'absence de session

- **Fichier** : `src/app/api/sheets/[id]/route.ts` (lignes 26-32)
- **Problème** : Quand la session est absente (utilisateur non connecté ou erreur DB), la route exécute `db.studySheet.findUnique({ where: { id } })` sans contrainte `userId`. N'importe qui connaissant un ID de fiche (CUID visible dans les URLs de l'app) peut lire l'intégralité du contenu généré (résumé, points-clés, définitions, flashcards, quiz) appartenant à n'importe quel utilisateur.
- **Impact** : Accès en lecture aux données privées d'autres utilisateurs (IDOR — Insecure Direct Object Reference).
- **Probabilité** : Élevée
- **Correction** :
```ts
// src/app/api/sheets/[id]/route.ts — remplacer le bloc conditionnel :
if (!session?.user?.id) {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
const sheet = await db.studySheet.findFirst({
  where: { id, userId: session.user.id },
});
```
- **Sévérité** : 🟠 ÉLEVÉ

---

### HIGH-02 — `GET /api/sheets` : IDOR par `userId` passé en query string

- **Fichier** : `src/app/api/sheets/route.ts` (ligne 23)
- **Problème** : `effectiveUserId = session?.user?.id ?? userId` — si la session est absente (erreur DB lors de l'auth, `isDatabaseConnectionError`), le `userId` fourni par le client dans la query string devient l'identifiant utilisé pour la requête. Un attaquant peut énumérer les fiches de n'importe quel utilisateur dont il connaît l'ID.
- **Impact** : Accès en lecture à la bibliothèque de fiches d'autres utilisateurs.
- **Probabilité** : Moyenne (nécessite une erreur DB ou une condition de timing)
- **Correction** :
```ts
// Supprimer le fallback sur userId query param :
if (!session?.user?.id) {
  return NextResponse.json({ success: true, data: [] });
}
const sheets = await db.studySheet.findMany({
  where: { userId: session.user.id },
  // ...
});
```
- **Sévérité** : 🟠 ÉLEVÉ

---

### HIGH-03 — `GET /api/sheets/[id]/status` : exposition du titre et statut sans authentification

- **Fichier** : `src/app/api/sheets/[id]/status/route.ts`
- **Problème** : Aucune authentification, aucune vérification d'ownership. La route expose le titre et le statut de traitement de n'importe quelle fiche par son ID, sans contrôle d'accès.
- **Impact** : Fuite de métadonnées (titre des documents privés). Facilite l'énumération et la reconnaissance sur d'autres utilisateurs.
- **Probabilité** : Élevée
- **Correction** :
```ts
import { auth } from "@/auth";

export async function GET(_: NextRequest, context: RouteContext) {
  const session = await auth();
  const { id } = await context.params;

  const sheet = await db.studySheet.findFirst({
    where: {
      id,
      ...(session?.user?.id ? { userId: session.user.id } : { id: "impossible" }),
    },
    select: { id: true, status: true, title: true },
  });

  if (!sheet) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: sheet });
}
```
- **Sévérité** : 🟠 ÉLEVÉ

---

### HIGH-04 — Route `/api/uploads` : upload anonyme sans vérification du type MIME réel

- **Fichier** : `src/app/api/uploads/route.ts` (lignes 13-22)
- **Problème** : La route accepte les uploads sans exiger d'authentification. La session est tentée mais silencieusement ignorée si la DB est indisponible (`isDatabaseConnectionError`). Le `userId` est alors pris du `formData` fourni par le client (ligne 27), contournant toute authentification. De plus, la validation du type de fichier repose sur `file.type` (fourni par le client et trivialement falsifiable) — un attaquant peut uploader un exécutable renommé `cours.pdf`.
- **Impact** :
  - Upload illimité de fichiers arbitraires par des anonymes.
  - Déclenchement de l'extraction de texte (OCR, parsing PDF) → coût CPU et API Anthropic.
  - Si les fichiers uploadés sont servis statiquement, risque d'exécution de code côté serveur selon la configuration.
- **Probabilité** : Élevée
- **Correction** :
```ts
// En tête de POST :
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Validation du type MIME réel (magic bytes) :
import { fileTypeFromBuffer } from "file-type"; // npm install file-type

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf", "text/plain", "image/jpeg",
  "image/png", "image/webp", "image/gif",
]);

const bytes = Buffer.from(await file.arrayBuffer());
const detected = await fileTypeFromBuffer(bytes);
if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
  return NextResponse.json({ error: "Type de fichier non autorisé." }, { status: 415 });
}
```
- **Sévérité** : 🟠 ÉLEVÉ

---

### HIGH-05 — Rate limiting en mémoire sur `/api/generate/demo` : contournable et non persistant

- **Fichier** : `src/app/api/generate/demo/route.ts`
- **Problème** : La limite de débit repose sur un `Map` JavaScript en mémoire du processus Node.js. Ce mécanisme est réinitialisé à chaque redémarrage (Vercel redémarre les fonctions serverless fréquemment), non partagé entre instances parallèles, et contournable en faisant pivoter l'IP ou en modifiant l'en-tête `X-Forwarded-For`. La confiance accordée à `X-Forwarded-For` sans validation de la source est exploitable.
- **Impact** : Appels illimités à l'API Anthropic via la route de démo → facturation non bornée.
- **Probabilité** : Élevée (trivial à exploiter)
- **Correction** : Remplacer par Upstash Redis + `@upstash/ratelimit` (compatible Edge/Serverless).
```ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "24 h"),
  prefix: "reviz:demo",
});

const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
const { success } = await ratelimit.limit(ip);
if (!success) return NextResponse.json({ error: "Limite atteinte." }, { status: 429 });
```
- **Sévérité** : 🟠 ÉLEVÉ

---

## 🟡 Findings MOYENS

### MED-01 — Middleware de protection trop étroit (routes API non couvertes)

- **Fichier** : `src/middleware.ts`
- **Problème** : Le matcher couvre uniquement `/app/:path*`, `/library/:path*`, `/settings/:path*`. Toutes les routes `/api/**` sont hors scope. La sécurité des API repose entièrement sur des vérifications per-route, dont plusieurs sont absentes (CRIT-01, HIGH-01, HIGH-02, HIGH-03).
- **Recommandation** : Ajouter `/api/generate/:path*` et `/api/sheets/:path*` au matcher comme filet de sécurité supplémentaire. Documenter explicitement les routes intentionnellement publiques.
- **Sévérité** : 🟡 MOYEN

---

### MED-02 — En-têtes de sécurité HTTP absents

- **Fichier** : `next.config.ts`
- **Problème** : Aucun en-tête de sécurité n'est configuré. Manquants : `Content-Security-Policy`, `X-Frame-Options` / `frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
- **Impact** : Exposition aux attaques XSS, clickjacking, MIME sniffing.
- **Correction** :
```ts
// next.config.ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.anthropic.com https://js.stripe.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```
- **Sévérité** : 🟡 MOYEN

---

### MED-03 — `dangerouslySetInnerHTML` avec sortie KaTeX non sanitisée

- **Fichier** : `src/components/math-renderer.tsx` (ligne 114)
- **Problème** : Le composant `MathRenderer` injecte du HTML généré par KaTeX via `dangerouslySetInnerHTML`. Le texte source peut provenir de contenu généré par l'IA à partir d'un input utilisateur. Si une réponse IA malformée inclut du balisage HTML via un LaTeX mal formé, la sortie KaTeX peut contenir des balises inattendues. Aucune passe DOMPurify n'est appliquée avant l'injection.
- **Impact** : Risque XSS modéré si une réponse IA ou un input utilisateur parvient à injecter du HTML via le moteur LaTeX.
- **Correction** :
```ts
import DOMPurify from "dompurify";

// Avant dangerouslySetInnerHTML :
const safeHtml = DOMPurify.sanitize(renderMath(text), {
  ALLOWED_TAGS: ["span", "svg", "path", "g", "rect", "line", "text", "tspan"],
  ALLOWED_ATTR: ["class", "style", "viewBox", "xmlns", "d", "transform"],
});
// <div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```
- **Sévérité** : 🟡 MOYEN

---

### MED-04 — Logging verbeux en production (données sensibles)

- **Fichiers** :
  - `src/auth.ts` (lignes 79, 98, 110)
  - `src/app/api/generate/route.ts` (lignes 43, 71)
- **Problème** :
  - `src/auth.ts` ligne 79 : log de la présence des secrets Google et NextAuth à chaque démarrage → visible dans les logs Vercel accessibles à tous les membres de l'équipe.
  - `src/auth.ts` ligne 98 : `JSON.stringify(cause)` peut logger des stack traces complètes incluant des données utilisateur.
  - `src/auth.ts` ligne 110 : `[AUTH_DEBUG] signIn called` avec `userId` et `provider` à chaque connexion.
  - `src/app/api/generate/route.ts` ligne 71 : log du `titleHint` et du `subject` en clair (contenu utilisateur potentiellement sensible).
- **Impact** : Exposition de métadonnées utilisateur dans les logs Vercel.
- **Correction** : Conditionner tous ces logs à `process.env.NODE_ENV !== "production"` ou les supprimer.
- **Sévérité** : 🟡 MOYEN

---

### MED-05 — Quota non appliqué aux utilisateurs anonymes sur `/api/generate`

- **Fichier** : `src/app/api/generate/route.ts` (ligne 77)
- **Problème** : La vérification du quota `canGenerateSheet` n'est exécutée que si `session?.user?.id` est présent. Si la session est absente (utilisateur anonyme ou erreur DB ignorée), un document et une fiche `StudySheet` sont quand même créés en base et la génération IA est déclenchée sans aucune limite.
- **Impact** : Génération IA illimitée pour des utilisateurs non authentifiés.
- **Correction** : Exiger l'authentification pour toute génération, ou appliquer un rate-limit Redis strict aux utilisateurs anonymes.
- **Sévérité** : 🟡 MOYEN

---

### MED-06 — `pricing-config.ts` : dates de promo expirées codées en dur

- **Fichier** : `src/lib/stripe/pricing-config.ts` (lignes 56-58)
- **Problème** : Les dates de la promo examen sont `startDate: new Date("2025-05-01")` et `endDate: new Date("2025-06-30")`. La date actuelle est le 2026-04-16 — la promo est expirée depuis 9 mois mais `enabled: true` reste dans le code. La fonction `isExamPromoActive()` retourne donc `false` (correct), mais si un développeur réactive la promo en changeant uniquement `enabled`, les dates passées ne seront pas recalculées, rendant la promo disponible à tort.
- **Impact** : Risque de vente de la promo hors période, potentiellement sans obligation légale ou sans période de validité correcte. Les champs `validFrom`/`validUntil` dans `PromoExamAccess` seraient créés avec des dates en 2025 pour des achats en 2026.
- **Correction** : Migrer les dates de promo vers des variables d'environnement ou une table de configuration en base, plutôt que des constantes codées en dur.
- **Sévérité** : 🟡 MOYEN

---

## ✅ Points Forts

- **Hachage de mots de passe correct** : `src/lib/password.ts` utilise `scrypt` (Node.js crypto natif) avec sel aléatoire 16 octets, clé 64 octets, et `timingSafeEqual` pour la comparaison. Excellente implémentation, résistante aux attaques timing.

- **Vérification des signatures Stripe** : Les deux webhooks (`billing/webhook` et `stripe/webhook`) appellent `stripe.webhooks.constructEvent()` avant tout traitement. Aucun webhook n'est traité sans signature valide.

- **Validation des entrées avec Zod** : Toutes les routes acceptant du JSON utilisent des schémas Zod stricts avec contraintes de type et de longueur. Les `sheetId` sont validés comme CUID.

- **Aucune injection SQL** : Zéro utilisation de `$queryRaw` ou `$executeRaw`. 100 % Prisma ORM avec paramètres typés.

- **Protection contre les open redirects** : `src/auth.ts` callback `redirect` valide que les redirects commencent par `/` ou pointent vers le même origin — implémentation correcte.

- **Aucune variable d'environnement côté client** : Aucun fichier `"use client"` n'accède à `process.env`. Les secrets ne sont pas exposés au navigateur.

- **Aucun `eval()`** : Aucune occurrence dans le codebase source.

- **`.env` dans `.gitignore`** : Jamais commité dans git (historique vérifié).

- **Isolation des sessions JWT** : `strategy: "jwt"` avec `id`, `email`, `name`, `image` et `plan` uniquement dans le token — pas de données sensibles.

- **Sanitisation des noms de fichiers** : `src/lib/uploads.ts` normalise les noms avant écriture disque, prévenant les path traversal via le nom de fichier.

- **Checkout sécurisé** : `src/app/api/billing/checkout/route.ts` exige l'authentification, valide le tier côté serveur, et utilise le `stripePriceId` configuré côté serveur — le montant n'est pas manipulable côté client.

---

## 🇪🇺 Conformité RGPD

| Exigence | Statut | Note |
|---|---|---|
| Droit à l'oubli (suppression compte) | ❌ | Aucun endpoint `DELETE /api/user` ou mécanisme de suppression de compte identifié. `onDelete: SetNull` sur `Document` et `StudySheet` orphelinise les données sans les effacer. |
| Consentement cookies | ❌ | Aucune bannière cookie ou mécanisme de consentement visible dans le code source. |
| Données collectées minimales | ✅ | Seuls `email`, `name`, `image`, `plan` sont stockés dans le JWT. Le contenu des documents est stocké pour le service (légitime). |
| Politique de confidentialité | ❌ | Non trouvée dans le codebase. Obligatoire avant lancement. |
| Transferts hors UE documentés | ❌ | Anthropic (US), Stripe (US), Vercel (US) — transferts non documentés. Nécessite une DPA avec chaque fournisseur ou des clauses contractuelles types. |

---

## 💳 Conformité PCI DSS

| Exigence | Statut | Note |
|---|---|---|
| Aucune donnée carte stockée | ✅ | Aucun numéro de carte, CVV ou données de paiement stockés en base. Délégation totale à Stripe. |
| Signature webhook Stripe vérifiée | ✅ | `stripe.webhooks.constructEvent()` utilisé dans les deux handlers avant tout traitement. |
| HTTPS en transit | ✅ | Vercel force HTTPS. Aucune communication HTTP non chiffrée identifiée. |
| Montants non manipulables côté client | ✅ | Le `tier` est validé côté serveur dans `/api/billing/checkout`. Le `stripePriceId` est lu depuis les variables d'environnement serveur, pas depuis le body client. |

---

## 🔗 Sécurité Fournisseurs Tiers

| Fournisseur | Risque | Recommandation |
|---|---|---|
| Anthropic (Claude API) | ÉLEVÉ — Clé API unique sans restriction IP ni budget cap configuré. Routes non authentifiées (CRIT-01) permettent l'utilisation arbitraire. | Configurer un budget cap mensuel sur console.anthropic.com. Corriger CRIT-01. Révoquer et régénérer la clé si OneDrive a synchronisé le `.env` (CRIT-02). |
| Stripe | MOYEN — Double webhook (CRIT-03) crée des états incohérents. Pas d'idempotence. | Consolider vers un seul webhook. Implémenter la déduplication par `event.id`. Vérifier sur le Dashboard Stripe qu'un seul endpoint est enregistré. |
| NextAuth v5 / Google OAuth | FAIBLE — Implémentation correcte. `checks: ["state"]` activé. Redirect callback sécurisé. | Surveiller les CVE sur `next-auth@5.0.0-beta.25` (version bêta — pas encore stable en production). Passer en version stable dès disponibilité. |
| Vercel (hébergement) | FAIBLE — Fonctions serverless avec cold start fréquents (invalide le rate-limit en mémoire, HIGH-05). | Activer Vercel Edge Config ou Upstash pour le rate-limiting persistant. Configurer les alertes de budget Vercel. |
| Supabase / PostgreSQL | FAIBLE — Prisma ORM sans injection SQL. `DATABASE_URL` et `DIRECT_URL` côté serveur uniquement. | Activer les logs de requêtes lentes. S'assurer que la connexion passe par un pooler (PgBouncer) en production. |

---

## ⚡ Quick Wins (< 1 heure chacun)

1. [ ] **Ajouter `auth()` dans `generate/inventory/route.ts`** — 5 lignes, bloque CRIT-01 partiellement
2. [ ] **Ajouter `auth()` dans `generate/sheet/route.ts`** — 5 lignes, bloque CRIT-01 entièrement
3. [ ] **Ajouter `auth()` dans `sheets/[id]/status/route.ts`** — 3 lignes, bloque HIGH-03
4. [ ] **Supprimer le fallback `userId` dans `GET /api/sheets`** — 1 ligne, bloque HIGH-02
5. [ ] **Conditionner les `console.log` de debug à `NODE_ENV !== "production"`** — 10 min, bloque MED-04
6. [ ] **Ajouter les en-têtes de sécurité HTTP dans `next.config.ts`** — copier-coller le snippet MED-02, < 30 min
7. [ ] **Corriger le IDOR dans `sheets/[id]/route.ts`** — remplacer `findUnique` par `findFirst` avec `userId`, 3 lignes
8. [ ] **Révoquer et régénérer la clé Anthropic et `AUTH_SECRET`** — 15 min via les dashboards

---

## 📋 Checklist de Remédiation Complète

### Avant le lancement (obligatoire)

- [ ] **CRIT-01** : Ajouter `auth()` + vérification d'ownership dans `src/app/api/generate/inventory/route.ts`
- [ ] **CRIT-01** : Ajouter `auth()` + vérification d'ownership dans `src/app/api/generate/sheet/route.ts`
- [ ] **CRIT-02** : Révoquer la clé API Anthropic actuelle et en générer une nouvelle
- [ ] **CRIT-02** : Régénérer le secret `AUTH_SECRET`
- [ ] **CRIT-02** : Déplacer le projet hors du dossier OneDrive synchronisé
- [ ] **CRIT-03** : Choisir un seul endpoint webhook Stripe (garder `billing/webhook`) et supprimer `src/app/api/stripe/webhook/route.ts`
- [ ] **CRIT-03** : Implémenter la déduplication idempotente des événements Stripe par `event.id`
- [ ] **HIGH-01** : Corriger l'IDOR dans `src/app/api/sheets/[id]/route.ts` (fallback sans session = accès public)
- [ ] **HIGH-02** : Supprimer le fallback `userId` query param dans `GET /api/sheets`
- [ ] **HIGH-03** : Ajouter l'authentification et l'ownership check dans `GET /api/sheets/[id]/status`
- [ ] **HIGH-04** : Requérir l'authentification dans `POST /api/uploads` et valider le type MIME réel (magic bytes)
- [ ] **HIGH-05** : Remplacer le rate-limit en mémoire par Upstash Redis sur `/api/generate/demo`

### Dans les 2 semaines

- [ ] **MED-01** : Ajouter `/api/generate/:path*` et `/api/sheets/:path*` au matcher du middleware
- [ ] **MED-02** : Ajouter les en-têtes de sécurité HTTP dans `next.config.ts` (CSP, X-Frame-Options, etc.)
- [ ] **MED-04** : Supprimer ou conditionner les `console.log` de debug dans `src/auth.ts` et `src/app/api/generate/route.ts`
- [ ] **MED-05** : Bloquer les générations pour utilisateurs anonymes ou appliquer un rate-limit Redis

### Dans le mois

- [ ] **MED-03** : Ajouter une passe DOMPurify sur la sortie KaTeX avant `dangerouslySetInnerHTML`
- [ ] **MED-06** : Migrer les dates de promo vers des variables d'environnement ou une table de configuration en base
- [ ] **RGPD** : Implémenter un endpoint de suppression de compte (`DELETE /api/user`) avec effacement en cascade
- [ ] **RGPD** : Ajouter une bannière de consentement cookies conforme
- [ ] **RGPD** : Rédiger et publier une politique de confidentialité
- [ ] **RGPD** : Signer des DPA (Data Processing Agreement) avec Anthropic, Stripe, Vercel
- [ ] **Dépendances** : Auditer `pdf-parse@1.1.1` (dernière version 2019) — vérifier les CVE
- [ ] **Auth** : Ajouter la vérification d'email avant activation des comptes créés par mot de passe
- [ ] **Auth** : Migrer de `next-auth@5.0.0-beta.25` vers une version stable dès disponibilité

---

## 🚀 Plan d'Action Post-Lancement

1. **Monitoring** :
   - Configurer des alertes sur la facturation Anthropic (seuil mensuel, ex. 80 % du budget).
   - Activer les alertes Stripe sur les webhooks échoués (Dashboard → Developers → Webhooks).
   - Mettre en place un logging structuré sans PII (Axiom, Datadog, ou Vercel Log Drains).
   - Surveiller les erreurs 401/403 pour détecter les tentatives d'accès non autorisées.

2. **Tests récurrents** :
   - Audit de sécurité des dépendances : `npm audit` à chaque PR, alerte Dependabot ou Snyk.
   - Test de pénétration manuel tous les 6 mois (focus sur les routes API et les flux Stripe).
   - Tester le comportement des webhooks Stripe avec les événements de test du Dashboard.

3. **RGPD** :
   - Implémenter le droit à l'oubli avant lancement public (suppression compte + données associées).
   - Prévoir un registre des traitements de données (ROPA) documentant Anthropic/Stripe/Vercel.
   - Renouveler les secrets (`AUTH_SECRET`, clé Stripe webhook) tous les 6 mois.
   - Mettre en place un processus de notification de violation de données (72h CNIL).
