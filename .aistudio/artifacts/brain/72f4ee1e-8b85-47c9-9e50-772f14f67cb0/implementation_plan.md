# Studio de Génération Vidéo Musicale & Système de Crédits

Création d'un studio complet de production vidéo pour les artistes de KKD Music, permettant de générer des clips courts et teasers multi-formats (TikTok 9:16, Instagram Reels 9:16, YouTube 16:9) animés en temps réel avec visualiseur audio réactif, pochette d'album et paroles synchronisées, monétisé via abonnements mensuels et packs de crédits rechargeables.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Décisions validées lors de la phase de cadrage et intégrées au présent plan :

- **Style visuel confirmé** : Visualiseur audio synchronisé en temps réel avec pochette du morceau, formes d'ondes réactives et typographie cinétique pour les paroles/titres.
- **Modèle économique confirmé** : Formule hybride combinant un abonnement récurrent (avec quota de crédits mensuels renouvelés) et une boutique de recharge instantanée de packs de crédits pour les besoins ponctuels.
- **Formats d'export confirmés** : Multi-formats prêts pour les réseaux sociaux — TikTok (9:16 vertical), Instagram Reels (9:16 vertical) et YouTube / Paysage (16:9), avec rendu MP4 fluide et lien direct vers le partage TikTok existant sur la plateforme.

---

### 1. Overview & Core Concept

- **Fonctionnalité principale** : Un studio de création vidéo interactif intégré (« Video Studio ») accessible aux artistes et créateurs. L'artiste sélectionne l'un de ses morceaux (ou importe un extrait audio), choisit un preset visuel (onde néon, cercle spectral, pulsation basse, typographie dynamique, effet vinyle rétro), définit le ratio (9:16 TikTok/Reels ou 16:9 YouTube), édite les paroles/accroches textuelles, prévisualise le rendu à 60 FPS synchronisé avec l'audio, et exporte la vidéo finale en MP4.
- **Public cible** : Artistes indépendants, musiciens, producteurs et créateurs de contenu souhaitant promouvoir leurs sorties musicales sur TikTok et les réseaux sans compétences complexes de montage vidéo.
- **Valeur ajoutée** : Autonomie promotionnelle immédiate en moins de 2 minutes par morceau, augmentation de la viralité des sorties musicales, et flux de monétisation récurrent pour le label/plateforme via abonnements et crédits.

---

### 2. User Experience & Visual Design

#### Parcours Utilisateur
1. **Accès & Solde de Crédits** : L'utilisateur accède à l'onglet "Studio Vidéo" (depuis son tableau de bord artiste ou la page Vidéos). Son solde de crédits et son statut d'abonnement s'affichent clairement en haut de page.
2. **Configuration du Projet** :
   - Sélection du titre ou upload d'un extrait audio (15s, 30s, 60s, ou extrait personnalisé avec sélecteur de début/fin).
   - Choix du format : TikTok 9:16 (vertical 1080x1920), Instagram Reels 9:16 ou YouTube 16:9 (1920x1080).
   - Sélection du thème graphique : *Pulse Bass*, *Spectrum Circular*, *Retro Vinyl*, *Lyric Glitch*, *Minimal Gold*.
   - Personnalisation : Import de visuel d'ambiance ou pochette du single, affichage des paroles / punchlines animées, couleur d'accentuation, typographie du titre et nom d'artiste.
3. **Prévisualisation Temps Réel** : Lecteur interactif avec analyseur Web Audio API affichant en direct les réactions de l'image, des barres de spectre et des ondes sonores au tempo.
4. **Génération & Débit de Crédits** :
   - Clic sur « Générer la vidéo MP4 ». Le système vérifie le solde (ex. 1 crédit pour 15s, 2 crédits pour 30s, 3 crédits pour 60s).
   - Si solde insuffisant : modal clair invitant à recharger un pack de crédits ou à souscrire à l'abonnement Créateur / Pro.
   - Si solde suffisant : capture Canvas frame-by-frame avec WebCodecs / MediaRecorder pour garantir un rendu à débit binaire constant sans saccade, mixage de l'audio haute qualité.
5. **Téléchargement & Publication** :
   - Téléchargement direct du fichier MP4.
   - Option « Publier sur TikTok » via l'intégration TikTok OAuth 2.0 déjà présente dans KKD Music.
   - Enregistrement dans la bibliothèque de projets vidéo de l'artiste.

#### Direction Visuelle & Identité
- **Palette & Ambiance** : Interface sombre de studio de mastering (`#0A0D14` et `#121824`), accents dorés/ambre KKD Music (`#F59E0B` / `#D97706`) et cyan subtil pour les indicateurs de fréquence audio.
- **Règles Anti-Slop** : Pas de pills superposés, pas de faux compteurs arbitraires. Métadonnées sobres séparées par des points typographiques (`·`), chiffres tabulaires (`tabular-nums`) pour les durées, compteurs de frames et soldes de crédits.
- **Mise en page** : Disposition studio ergonomique 1440px avec panneau de prévisualisation central réactif et tiroir de réglages d'ondes, de filtres et de typographie.

---

### 3. Key Product Decisions & Trade-Offs

- **Moteur de rendu vidéo : Rendu Canvas + MediaRecorder / AudioContext**
  - *Choix* : Rendu client-side ultra-réactif combinant HTML5 Canvas 2D/WebGL, Web Audio API (AnalyserNode) et `MediaRecorder` avec encodeur WebCodecs/H.264 MP4.
  - *Pourquoi* : Instantanéité sans temps d'attente de file de rendu serveur externe coûteux, coûts d'infrastructure nuls par génération pour la plateforme, et prévisualisation WYSIWYG absolue.
  - *Alternative écartée* : Rendu lourd côté serveur FFMPEG hébergé (trop coûteux en serveurs GPU et temps de latence élevé pour l'utilisateur).

- **Modèle de Monétisation : Abonnements + Crédits**
  - *Offres Abonnements* :
    - *Free / Découverte* : 2 crédits d'essai offerts à l'inscription pour tester l'outil.
    - *Abonnement Artiste* (ex: 9,99 € / mois) : 25 crédits mensuels + exports sans filigrane + formats multi-ratios.
    - *Abonnement Label Pro* (ex: 24,99 € / mois) : 80 crédits mensuels + exports prioritaires 4K + templates exclusifs.
  - *Packs de Crédits (à la demande)* :
    - Pack Starter (10 crédits)
    - Pack Pro (30 crédits)
    - Pack Boost (75 crédits)
  - *Persistance* : Gestion du solde et historique des transactions dans Firestore (`userProfiles` / `creditTransactions`).

---

### 4. Technical Architecture & Data Strategy

#### Schéma d'Architecture & Flux de Données

```
┌────────────────────────────────────────────────────────────────────────┐
│                        STUDIO CRÉATION VIDÉO                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
       ┌───────────────────────────┴───────────────────────────┐
       ▼                                                       ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│     Audio & Visual Engine    │        │    Billing & Credit Engine   │
├──────────────────────────────┤        ├──────────────────────────────┤
│ • Web Audio AnalyserNode     │        │ • Firestore User Balance     │
│ • Canvas Waveform Renderers  │        │ • Plan Subscription Quota    │
│ • Kinetic Lyrics Animation   │        │ • Transaction Ledger         │
│ • Format Ratio (9:16 / 16:9) │        │ • Credit Top-up Modal        │
└──────────────┬───────────────┘        └──────────────┬───────────────┘
               │                                       │
               ▼                                       ▼
┌──────────────────────────────┐        ┌──────────────────────────────┐
│     Export Pipeline (MP4)    │        │   Distribution & Social      │
├──────────────────────────────┤        ├──────────────────────────────┤
│ • Canvas stream capture      │        │ • Direct MP4 Local Download  │
│ • MediaRecorder / H.264 mux  │◄───────┤ • TikTok OAuth Integration   │
│ • High-bitrate audio sync    │        │ • Video History / Archives   │
└──────────────────────────────┘        └──────────────────────────────┘
```

#### Modèle de Données Firestore

1. **`users/{userId}` / `profiles/{userId}`** :
   - `videoCredits`: `number` (solde actuel)
   - `subscriptionTier`: `'free' | 'creator' | 'pro_label'`
   - `subscriptionRenewalDate`: `timestamp`
   - `totalVideosGenerated`: `number`

2. **`videoProjects/{projectId}`** :
   - `userId`: `string`
   - `title`: `string`
   - `trackId`: `string`
   - `format`: `'tiktok_9_16' | 'reels_9_16' | 'youtube_16_9'`
   - `duration`: `number` (15, 30, 60)
   - `theme`: `string`
   - `createdAt`: `timestamp`
   - `thumbnailUrl`: `string`

3. **`creditTransactions/{txId}`** :
   - `userId`: `string`
   - `type`: `'subscription_grant' | 'top_up_purchase' | 'video_generation_spend'`
   - `amount`: `number` (+/- crédits)
   - `description`: `string`
   - `createdAt`: `timestamp`

---

### 5. Plan d'Exécution & Étapes d'Implémentation

1. **Composants du Moteur Audio-Visuel** :
   - Création de la suite d'effets visuels Canvas : spectre radial, vagues fréquentielles (waveform), réactivité dynamique de la pochette (zoom battement au kick), et affichage des paroles / punchlines synchronisées.
   - Sélecteur de ratio dynamique 9:16 (vertical TikTok/Reels) et 16:9 (paysage YouTube) avec recadrage intelligent.
2. **Pipeline d'Exportation MP4** :
   - Module d'enregistrement direct via `MediaRecorder` capturant le flux Canvas + le flux audio mixé, générant un conteneur MP4/WebM téléchargeable.
   - Barre de progression de rendu en direct avec estimation du temps restant.
3. **Module Économique & Gestion des Crédits** :
   - Système de gestion de crédits dans le profil utilisateur Firestore avec décompte automatique lors du clic d'export.
   - Modale d'achat de packs de crédits et d'adhésion aux abonnements avec interface de commande claire et historique des transactions.
4. **Page Dédiée & Intégration Navigation** :
   - Intégration de la page `StudioVideo.jsx` accessible depuis la barre de navigation et le tableau de bord artiste.
   - Bouton de raccourci "Créer un clip TikTok" depuis la page d'un morceau musical existant.
   - Pont avec l'authentification TikTok existante pour faciliter la diffusion.
