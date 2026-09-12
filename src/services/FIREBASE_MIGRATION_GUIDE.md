# Guide de migration Firebase — KKD Music

Ce document explique où et comment connecter Firebase pour remplacer le backend Base44.
L'architecture a été pensée pour que **seules les implémentations des services changent**,
jamais l'UI qui les consomme.

## Principe d'architecture

```
┌─────────────────────────────────────────────────┐
│  UI (pages, composants, hooks)                  │
│  import { musicService, authService } from '@/services'
├─────────────────────────────────────────────────┤
│  Couche de services (src/services/)             │  ← SEUL POINT D'ABSTRACTION
│  - authService       → Auth                      │
│  - storageService    → Storage                  │
│  - paymentService     → Payments                 │
│  - musicService       → Releases/Videos           │
│  - artistService      → Artists/Follows           │
│  - purchaseService    → Purchases/Access         │
│  - analyticsService   → Stats                    │
│  - platformConfigService → Config globale        │
├─────────────────────────────────────────────────┤
│  Provider actuel : Base44 SDK                    │
│  Provider futur  : Firebase                       │
└─────────────────────────────────────────────────┘
```

**Règle :** Aucun composant/page ne doit importer `@/api/base44Client` directement.
Tout passe par `@/services`.

---

## 1. Firebase Authentication

**Fichier à modifier :** `src/services/authService.js`

| Méthode | Base44 (actuel) | Firebase (cible) |
|---|---|---|
| `me()` | `base44.auth.me()` | `onAuthStateChanged` + snapshot user |
| `isAuthenticated()` | `base44.auth.isAuthenticated()` | `auth.currentUser != null` |
| `updateMe(data)` | `base44.auth.updateMe(data)` | `updateProfile(auth.currentUser, data)` |
| `logout(url)` | `base44.auth.logout(url)` | `signOut(auth)` |
| `redirectToLogin(url)` | `base44.auth.redirectToLogin(url)` | Navigation vers `/login` |
| `inviteUser(email, role)` | `base44.users.inviteUser()` | Cloud Function `inviteUser` |

**Setup :**
```js
// src/firebase/config.js (à créer)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

**Roles :** Stocker `role` dans `customClaims` (admin) ou Firestore doc `users/{uid}`.
La logique de redirection ProtectedRoute/AdminRoute reste identique.

---

## 2. Cloud Firestore (base de données)

**Fichiers à modifier :** `musicService.js`, `artistService.js`, `purchaseService.js`

### Mapping des entités → collections Firestore

| Entité Base44 | Collection Firestore |
|---|---|
| `Release` | `releases` |
| `Video` | `videos` |
| `Artist` | `artists` |
| `Event` | `events` |
| `News` | `news` |
| `Purchase` | `purchases` |
| `Like` | `likes` |
| `ArtistFollow` | `follows` |
| `Playlist` | `playlists` |
| `Ticket` | `tickets` |
| `MusicLicense` | `licenses` |
| `PartnerPublication` | `publications` |
| `Notification` | `notifications` |
| `User` | `users` (géré par Auth + Firestore) |

### Exemple de migration — musicService

```js
// Avant (Base44)
async getRelease(id) {
  return base44.entities.Release.get(id);
}

// Après (Firebase)
async getRelease(id) {
  const doc = await getDoc(doc(db, 'releases', id));
  return { id: doc.id, ...doc.data() };
}
```

### RLS → Firestore Security Rules

Les règles RLS Base44 doivent être traduites en Firestore Security Rules.

Exemple (Purchase) :
```
match /purchases/{purchaseId} {
  allow read: if request.auth.uid == resource.data.user_id
             || isAdmin();
  allow create: if request.auth != null;
  allow update, delete: if isAdmin();
}
```

---

## 3. Firebase Storage (fichiers)

**Fichier à modifier :** `src/services/storageService.js`

| Méthode | Base44 (actuel) | Firebase (cible) |
|---|---|---|
| `uploadPublic(file)` | `UploadPublicFile` | `ref().put()` + `getDownloadURL()` |
| `uploadPrivate(file)` | `UploadPrivateFile` | `ref('private/').put()` |
| `getSignedUrl(uri)` | `CreateFileSignedUrl` | `getDownloadURL()` ou URL signée serveur |

**Structure des buckets :**
```
gs://kkd-music.appspot.com/
  covers/          → pochettes publiques
  artist-photos/   → photos artistes publiques
  audio/free/      → audio gratuit public
  audio/private/   → audio vendu (accès restreint)
  video/private/   → clips vendus (accès restreint)
```

**Security Rules Storage :**
```
match /audio/private/{file} {
  allow read: if request.auth != null
              && hasPurchased(file);
  allow write: if isAdmin();
}
```

---

## 4. Cloud Functions (logique serveur)

**Fichiers à modifier :** `paymentService.js`, `purchaseService.js`, `analyticsService.js`

### Fonctions backend Base44 → Cloud Functions

| Fonction Base44 | Cloud Function Firebase |
|---|---|
| `createCheckoutSession` | `onCall createCheckoutSession` |
| `stripeWebhook` | `onRequest stripeWebhook` (HTTPS) |
| `redeemPurchase` | `onCall redeemPurchase` |
| `incrementPlay` | `onCall incrementPlay` (FieldValue.increment) |
| `getMyPurchases` | `onCall getMyPurchases` |
| `getProtectedPreview` | `onCall getProtectedPreview` |
| `validateTicketPayment` | `onCall validateTicketPayment` |
| `generateMusicLicense` | `onCall generateMusicLicense` |
| `sendLicenseEmail` | `onCall sendLicenseEmail` |

### Stripe Webhook

L'endpoint webhook Stripe doit être reconfiguré vers la Cloud Function :
```
https://us-central1-kkd-music.cloudfunctions.net/stripeWebhook
```

Inclure `metadata.base44_app_id` → `metadata.app_id` dans les sessions Stripe.

---

## 5. Système de paiement

**Fichier :** `src/services/paymentService.js`

Le `computeSplit()` utilise `platformConfigService.getCommissionRate()`.
Pour Firebase, stocker le taux dans un doc Firestore `config/commission` :

```js
// platformConfigService — version Firebase
async getCommissionRate() {
  const doc = await getDoc(doc(db, 'config', 'commission'));
  return doc.exists() ? doc.data().rate : 0.10;
}
```

---

## 6. Variables d'environnement

Créer `src/firebase/config.js` et un fichier `.env` :

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_STRIPE_PUBLISHABLE_KEY=...
```

**Ne jamais placer de clés privées (Stripe secret, Firebase service account) dans le frontend.**
Toutes les opérations sensibles passent par des Cloud Functions.

---

## 7. Checklist de migration

- [ ] Créer le projet Firebase + activer Auth, Firestore, Storage
- [ ] Créer `src/firebase/config.js` avec `initializeApp`
- [ ] Migrer `authService` → Firebase Auth
- [ ] Migrer `storageService` → Firebase Storage
- [ ] Migrer `musicService` + `artistService` → Firestore
- [ ] Migrer `purchaseService` → Firestore + Cloud Functions
- [ ] Migrer `paymentService` → Cloud Functions (Stripe)
- [ ] Migrer `analyticsService` → Firebase Analytics
- [ ] Traduire les RLS Base44 en Firestore Security Rules
- [ ] Configurer le webhook Stripe vers la Cloud Function
- [ ] Migrer les données existantes (script d'export Base44 → import Firestore)
- [ ] Tester chaque rôle (auditeur, artiste, admin)