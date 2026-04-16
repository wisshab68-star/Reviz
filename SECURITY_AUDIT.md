# AUDIT DE SÉCURITÉ COMPLET — Reviz SaaS
Date : 2026-04-16

---

## Résumé Exécutif

- **État général : MOYEN**
- **Findings : 2 critiques, 4 élevés, 5 moyens**
- **Recommandation de lancement : NON — Corriger les 2 critiques avant mise en production**

L'application est globalement bien structurée. L'authentification NextAuth v5, le hachage de mots de passe avec scrypt et la vérification des signatures Stripe sont correctement implémentés. Cependant, deux vulnérabilités critiques compromettent directement la sécurité financière et la confidentialité des données : l'absence totale de protection des routes d'API de génération et une fuite de secrets réels dans le fichier `.env` local.

---

## 🔴 Findings CRITIQUES

### CRIT-1 — Routes `/api/generate/inventory` et `/api/generate/sheet` non authentifiées

- **Fichiers** :
  - `src/app/api/generate/inventory/route.ts`
  - `src/app/api/generate/sheet/route.ts`
- **Problème** : Ces deux routes POST déclenchent des appels à l'API Anthropic (coûteux) et modifient des enregistrements en base de données sans aucune vérification d'authentification. N'importe quel attaquant anonyme peut appeler ces routes en boucle, forger un `sheetId` valide (CUID), lancer des générations IA arbitraires, et écraser le statut de n'importe quelle fiche existante en base.
- **Impact** :
  - Épuisement du quota et de la facture Anthropic par un tiers malveillant (attaque de type "API billing drain").
  - Écriture arbitraire dans la table `StudySheet` pour toute ligne dont l'ID est connu ou deviné.
  - Aucune ownership check : un utilisateur A peut déclencher la génération d'une fiche appartenant à l'utilisateur B.
- **Correction** :

```typescript
// src/app/api/generate/inventory/route.ts — ajouter en tête de la fonction POST :
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = inventoryRequestSchema.parse(await request.json());

  // Vérifier que la fiche appartient à l'utilisateur connecté
  const sheet = await db.studySheet.findFirst({
    where: { id: parsed.sheetId, userId: session.user.id },
    select: { id: true },
  });
  if (!sheet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // ... suite du handler
}
```

```typescript
// src/app/api/generate/sheet/route.ts — même pattern :
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
const sheet = await db.studySheet.findFirst({
  where: { id: sheetId, userId: session.user.id },
  select: { id: true, userId: true, ... },
});
if (!sheet) return NextResponse.json({ error: "Not found" }, { status: 404 });
```

- **Sévérité** : 🔴 CRITIQUE

---

### CRIT-2 — Secrets réels présents dans le fichier `.env` local (risque de fuite)

- **Fichier** : `.env` (racine du projet)
- **Problème** : Le fichier `.env` contient des secrets réels de production actifs :
  - Clé API Anthropic (`sk-ant-api03-...`)
  - Secret NextAuth (`AUTH_SECRET`)
  - Client ID Google OAuth réel

  Bien que `.env` soit listé dans `.gitignore`, ce fichier est situé dans un dossier OneDrive (`C:\Users\madri\OneDrive\Documents\Playground`). OneDrive synchronise automatiquement ce fichier vers le cloud Microsoft, exposant les secrets à toute personne ayant accès au compte OneDrive (synchronisation multi-appareils, partage de dossier accidentel, compromission du compte Microsoft).

- **Impact** :
  - Accès à l'API Anthropic par un tiers → facturation illimitée au nom du propriétaire.
  - Compromission du secret NextAuth → forge de sessions JWT pour n'importe quel utilisateur.
  - Compromission du Client ID Google → abus de l'OAuth.
- **Correction** :
  1. Déplacer le projet hors de OneDrive, ou ajouter le dossier projet à la liste d'exclusion OneDrive.
  2. Révoquer et régénérer immédiatement la clé API Anthropic et le secret NextAuth.
  3. Si OneDrive a déjà synchronisé le fichier, supprimer la version cloud manuellement depuis onedrive.live.com.
  4. Utiliser un gestionnaire de secrets (Vercel env vars, Doppler, 1Password Secrets Automation) pour les déploiements.

- **Sévérité** : 🔴 CRITIQUE

---

## 🟠 Findings ÉLEVÉS

### HIGH-1 — Route `/api/uploads` accessible sans authentification, pas de vérification de type MIME côté serveur

- **Fichier** : `src/app/api/uploads/route.ts`
- **Problème** : La route d'upload est accessible sans authentification. N'importe qui peut uploader des fichiers. De plus, la détection du type de fichier repose sur `file.type` (fourni par le client) et l'extension du nom de fichier — les deux sont trivialement falsifiables. Un attaquant peut envoyer un exécutable en le nommant `cours.pdf` avec `Content-Type: application/pdf`.
- **Impact** :
  - Upload illimité de fichiers arbitraires sur le serveur (stockage `/tmp/uploads` ou `uploads/`).
  - Si le serveur sert ces fichiers statiquement, risque de LFI ou d'exécution selon la configuration.
  - Coût API Anthropic (OCR d'images) déclenché par des anonymes.
- **Correction** :

```typescript
// Ajouter en tête de POST dans uploads/route.ts :
const session = await auth();
if (!session?.user?.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Validation du type MIME réel avec les magic bytes :
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf", "text/plain", "image/jpeg",
  "image/png", "image/webp", "image/gif",
]);

const bytes = Buffer.from(await file.arrayBuffer());
// Vérifier les magic bytes (PDF: %PDF, PNG: \x89PNG, JPEG: \xFF\xD8\xFF)
// Utiliser la lib `file-type` (npm) pour détection fiable.
```

- **Sévérité** : 🟠 ÉLEVÉ

---

### HIGH-2 — Double webhook Stripe : duplication de logique et risque d'incohérence

- **Fichiers** :
  - `src/app/api/billing/webhook/route.ts`
  - `src/app/api/stripe/webhook/route.ts`
- **Problème** : Il existe deux endpoints webhook Stripe distincts avec des logiques différentes. Les deux vérifient correctement la signature Stripe, mais :
  - `billing/webhook` utilise le nouveau `subscription-service.ts` (modèle `Subscription` dédié).
  - `stripe/webhook` écrit directement sur `User.plan` et `User.subscriptionStatus` via un chemin de code séparé.
  - Si les deux endpoints sont enregistrés sur Stripe, chaque événement sera traité deux fois, avec des mises à jour conflictuelles.
  - Absence de déduplication idempotente (pas de vérification de `event.id` avant traitement).
- **Impact** :
  - Données d'abonnement incohérentes entre les tables `User` et `Subscription`.
  - Double downgrade ou double upgrade possible.
  - Comportement imprévisible selon lequel endpoint Stripe appelle en premier.
- **Correction** :
  - Choisir un seul endpoint et supprimer l'autre (recommandé : garder `billing/webhook`).
  - Ajouter une table `ProcessedWebhookEvent { stripeEventId String @unique }` et vérifier avant traitement.
- **Sévérité** : 🟠 ÉLEVÉ

---

### HIGH-3 — `/api/sheets` et `/api/sheets/[id]/status` : IDOR par userId arbitraire

- **Fichiers** :
  - `src/app/api/sheets/route.ts`
  - `src/app/api/sheets/[id]/status/route.ts`
- **Problème** :
  - `GET /api/sheets?userId=<n'importe_quel_id>` : Si la session est absente (ou si la DB est indisponible), `effectiveUserId` prend la valeur du paramètre `userId` fourni par le client. Un attaquant peut énumérer les fiches de n'importe quel utilisateur en passant son ID en query string.
  - `GET /api/sheets/[id]/status` : Aucune authentification, aucune vérification d'ownership. Expose le titre et le statut de toute fiche par son ID.
- **Impact** : Accès en lecture aux données d'autres utilisateurs (IDOR — Insecure Direct Object Reference).
- **Correction** :

```typescript
// sheets/route.ts — supprimer le fallback sur userId query param :
if (!session?.user?.id) {
  return NextResponse.json({ success: true, data: [] });
}
const sheets = await db.studySheet.findMany({
  where: { userId: session.user.id }, // jamais depuis la query string
  ...
});

// sheets/[id]/status/route.ts — ajouter auth :
const session = await auth();
const sheet = await db.studySheet.findFirst({
  where: {
    id,
    ...(session?.user?.id ? { userId: session.user.id } : { id: "impossible" }),
  },
  select: { id: true, status: true, title: true },
});
```

- **Sévérité** : 🟠 ÉLEVÉ

---

### HIGH-4 — Rate limiting en mémoire sur `/api/generate/demo` : contournable et non persistant

- **Fichier** : `src/app/api/generate/demo/route.ts`
- **Problème** : La limite de débit repose sur un `Map` JavaScript en mémoire du processus Node.js. Ce mécanisme est :
  - Réinitialisé à chaque redémarrage du serveur (Vercel redémarre les fonctions fréquemment).
  - Non partagé entre instances (Vercel peut exécuter plusieurs instances en parallèle).
  - Contournable en faisant pivoter l'IP (proxies, Tor) ou en modifiant l'en-tête `X-Forwarded-For`.
  - La confiance en `X-Forwarded-For` sans vérification de la source est exploitable.
- **Impact** : Un attaquant peut appeler `/api/generate/demo` des centaines de fois par heure → facturation Anthropic non bornée.
- **Correction** : Utiliser Upstash Redis + `@upstash/ratelimit` (compatible Edge/Serverless) ou un middleware de rate-limiting Vercel.
- **Sévérité** : 🟠 ÉLEVÉ

---

## 🟡 Findings MOYENS

### MED-1 — Middleware de protection trop étroit (routes API non protégées)

- **Fichier** : `src/middleware.ts`
- **Problème** : Le middleware ne couvre que `/app/:path*`, `/library/:path*`, `/settings/:path*`. Toutes les routes `/api/**` sont hors scope. La protection des API repose entièrement sur des vérifications per-route, dont certaines sont manquantes (CRIT-1, HIGH-3).
- **Recommandation** : Documenter explicitement ce choix architectural. Envisager d'ajouter `/api/generate/:path*` au matcher pour forcer l'auth au niveau middleware, en fallback de sécurité.
- **Sévérité** : 🟡 MOYEN

---

### MED-2 — En-têtes de sécurité HTTP absents

- **Fichier** : `next.config.ts`
- **Problème** : Le fichier ne définit aucun en-tête de sécurité. Les en-têtes manquants :
  - `Content-Security-Policy` : absence de CSP expose aux attaques XSS.
  - `X-Frame-Options` ou `frame-ancestors` : risque de clickjacking.
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy`
  - `Permissions-Policy`
- **Correction** :

```typescript
// next.config.ts
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
  },
];

const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
```

- **Sévérité** : 🟡 MOYEN

---

### MED-3 — `dangerouslySetInnerHTML` avec sortie KaTeX non strictement contrôlée

- **Fichier** : `src/components/math-renderer.tsx` (ligne 114)
- **Problème** : Le composant `MathRenderer` injecte du HTML généré par KaTeX via `dangerouslySetInnerHTML`. KaTeX produit du HTML sûr en théorie, mais :
  - Le texte en entrée peut provenir de contenu généré par l'IA (Anthropic), qui accepte du texte utilisateur comme input.
  - Si une réponse IA inclut du JavaScript encodé en LaTeX, KaTeX peut dans certaines configurations de version produire des balises HTML inattendues.
  - La fonction `renderPlainSegment` appelle `escapeHtml` pour le texte brut, mais les segments mathématiques passent directement dans `renderKatex` → `katex.renderToString` sans escape supplémentaire avant injection HTML.
- **Impact** : Risque XSS faible à modéré si une réponse IA malformée ou un input utilisateur parvient à injecter du HTML via le moteur LaTeX.
- **Correction** : Utiliser `katex` avec `strict: false` (déjà fait) et `throwOnError: false` (déjà fait). Ajouter une DOMPurify pass après le rendu KaTeX pour sanitiser la sortie HTML avant injection.
- **Sévérité** : 🟡 MOYEN

---

### MED-4 — Logging verbeux en production (données sensibles)

- **Fichier** : `src/auth.ts` (lignes 79, 110)
- **Problème** : Des `console.log` de debug logguent des informations sensibles en production :
  - Ligne 79 : révèle si les secrets Google et NextAuth sont configurés.
  - Ligne 98 : `JSON.stringify(cause)` peut logger des stack traces complètes incluant des données utilisateur.
  - Ligne 110 : `[AUTH_DEBUG] signIn called` avec `userId` et `provider` à chaque connexion.
- **Impact** : Les logs de Vercel sont accessibles à tous les membres de l'équipe et peuvent être exfiltrés. Exposition de métadonnées utilisateur.
- **Correction** : Supprimer ou conditionner ces logs à `process.env.NODE_ENV !== "production"`.
- **Sévérité** : 🟡 MOYEN

---

### MED-5 — Absence de validation de taille et de quota sur `/api/generate` pour les utilisateurs anonymes

- **Fichier** : `src/app/api/generate/route.ts`
- **Problème** : La route `/api/generate` (point d'entrée principal) vérifie le quota uniquement si `session?.user?.id` est présent. Si la session est absente (utilisateur anonyme ou erreur de DB), le contenu est quand même enregistré en base et la génération est quand même déclenchée (via `generate/inventory` et `generate/sheet`). Un attaquant non authentifié peut soumettre du contenu en boucle sans quota.
- **Correction** : Exiger l'authentification pour toute génération, ou appliquer un rate-limit strict (Redis) aux utilisateurs anonymes.
- **Sévérité** : 🟡 MOYEN

---

## ✅ Points Forts

- **Hachage de mots de passe correct** : `src/lib/password.ts` utilise `scrypt` (Node.js crypto natif) avec un sel aléatoire de 16 octets et une clé de 64 octets. La comparaison utilise `timingSafeEqual` pour prévenir les attaques timing. Excellente implémentation.

- **Vérification des signatures Stripe** : Les deux webhooks (`billing/webhook` et `stripe/webhook`) appellent `stripe.webhooks.constructEvent()` avant tout traitement. Aucun webhook n'est traité sans signature valide.

- **Validation des entrées avec Zod** : Toutes les routes qui acceptent du JSON (generate, inventory, sheets) utilisent des schémas Zod stricts avec des contraintes de longueur et de type.

- **Pas de requêtes SQL brutes** : Aucune utilisation de `$queryRaw` ou `$executeRaw` dans le codebase. 100% Prisma ORM avec paramètres typés.

- **Protection contre les open redirects** : `src/auth.ts` (callback `redirect`) et `src/app/sign-in/actions.ts` valident que les redirects commencent par `/` ou pointent vers le même origin.

- **Pas de `process.env` côté client** : Aucun fichier `"use client"` n'accède à `process.env`. Les variables d'environnement sensibles ne sont pas exposées au navigateur.

- **Pas d'`eval()`** : Aucune occurrence dans le codebase source.

- **`.env` dans `.gitignore`** : Le fichier n'a jamais été commité dans git (vérification de l'historique git confirmée).

- **Isolation des sessions JWT** : `src/auth.config.ts` utilise `strategy: "jwt"`. La session contient uniquement `id`, `email`, `name`, `image` et `plan` — pas de données sensibles dans le token.

- **Sanitisation des noms de fichiers** : `src/lib/uploads.ts` remplace tous les caractères non alphanumériques par `_` avant écriture sur disque.

- **Rate limiting sur la démo** : Bien qu'imparfait (MED-4), un mécanisme de rate-limit existe sur l'endpoint demo, montrant une conscience du risque.

---

## 📋 Checklist de remédiation

### Critique (avant lancement)
- [ ] **CRIT-1** : Ajouter `auth()` + vérification d'ownership dans `generate/inventory/route.ts`
- [ ] **CRIT-1** : Ajouter `auth()` + vérification d'ownership dans `generate/sheet/route.ts`
- [ ] **CRIT-2** : Révoquer la clé API Anthropic actuelle et en générer une nouvelle
- [ ] **CRIT-2** : Régénérer le secret `AUTH_SECRET`
- [ ] **CRIT-2** : Déplacer le projet hors du dossier OneDrive synchronisé

### Élevé (dans les 7 jours)
- [ ] **HIGH-1** : Requérir l'authentification sur `POST /api/uploads`
- [ ] **HIGH-1** : Valider le type MIME réel côté serveur (magic bytes, lib `file-type`)
- [ ] **HIGH-2** : Choisir un seul endpoint webhook Stripe et supprimer l'autre
- [ ] **HIGH-2** : Implémenter la déduplication idempotente des événements Stripe
- [ ] **HIGH-3** : Supprimer le fallback `userId` query param dans `GET /api/sheets`
- [ ] **HIGH-3** : Ajouter l'authentification à `GET /api/sheets/[id]/status`
- [ ] **HIGH-4** : Remplacer le rate-limit en mémoire par Upstash Redis

### Moyen (avant ou peu après lancement)
- [ ] **MED-2** : Ajouter les en-têtes de sécurité HTTP dans `next.config.ts` (CSP, X-Frame-Options, etc.)
- [ ] **MED-3** : Ajouter un pass DOMPurify sur la sortie KaTeX avant `dangerouslySetInnerHTML`
- [ ] **MED-4** : Supprimer ou conditionner les `console.log` de debug dans `src/auth.ts`
- [ ] **MED-5** : Bloquer ou quota-limiter les générations pour utilisateurs anonymes

---

## 🚀 Plan d'action post-lancement

### Semaine 1 — Monitoring
- Configurer des alertes sur la facturation Anthropic (seuil mensuel).
- Activer les alertes Stripe sur les webhooks échoués.
- Mettre en place un logging structuré (sans données PII) avec Axiom ou Datadog.

### Semaine 2 — Hardening
- Passer le rate-limiting démo sur Upstash Redis.
- Ajouter une Content Security Policy complète et tester avec `report-only` d'abord.
- Implémenter la déduplication des webhooks Stripe.

### Mois 1 — Sécurité avancée
- Ajouter la vérification d'email (lien de confirmation) avant activation des comptes créés par mot de passe.
- Évaluer l'ajout de CAPTCHA (hCaptcha / Cloudflare Turnstile) sur la route de démo.
- Audit des dépendances : `pdf-parse` (1.1.1, dernière version 2019) est une dépendance ancienne — vérifier les CVE.
- Considérer l'ajout de CSP nonces pour les scripts Next.js inline.

### Continu
- Surveiller les CVE sur `next-auth@5.0.0-beta.25` (version bêta, pas encore stable).
- Renouveler les secrets (AUTH_SECRET, Stripe webhook) tous les 6 mois.
- Review de sécurité à chaque ajout de route API.
