# 416 Records — Plateforme films, musique & boutique

Application web full-stack du label **416 Records** : streaming de films,
catalogue d'artistes, lecteur audio, boutique de merch avec panier et
commande WhatsApp, dashboard admin complet, personnalisation de la page
d'accueil et thème clair/sombre.

L'app est **hébergeable gratuitement sur Netlify** et peut être empaquetée
en **applications Android et iOS** via Capacitor.

---

## Sommaire

1. [Stack technique](#1-stack-technique)
2. [Architecture du projet](#2-architecture-du-projet)
3. [Modèle de données Supabase](#3-modèle-de-données-supabase)
4. [Installation locale](#4-installation-locale)
5. [Configuration des secrets](#5-configuration-des-secrets)
6. [Déploiement Netlify (gratuit)](#6-déploiement-netlify-gratuit)
7. [Build mobile Android & iOS (Capacitor)](#7-build-mobile-android--ios-capacitor)
8. [Administration](#8-administration)
9. [Flux d'une commande boutique](#9-flux-dune-commande-boutique)
10. [Personnalisation de l'apparence](#10-personnalisation-de-lapparence)
11. [FAQ & dépannage](#11-faq--dépannage)

---

## 1. Stack technique

| Couche                | Technologie                                         |
| --------------------- | --------------------------------------------------- |
| Framework             | **TanStack Start v1** (React 19 + Vite 7)           |
| Routing               | TanStack Router (file-based, `src/routes/`)         |
| State serveur         | TanStack Query                                      |
| UI                    | Tailwind CSS v4 + shadcn/ui (Radix)                 |
| Icônes                | lucide-react                                        |
| Backend / BDD / Auth  | **Supabase** (PostgreSQL + Row-Level Security)     |
| Stockage panier       | `localStorage` indexé par `user.id`                 |
| Notifications         | Sonner (toasts)                                     |
| Mobile (optionnel)    | **Capacitor** (Android + iOS)                       |
| Hébergement web       | **Netlify** (free tier suffisant)                   |

---

## 2. Architecture du projet

```
.
├── src/
│   ├── routes/                  # File-based routing TanStack Router
│   │   ├── __root.tsx           # Layout racine : providers (Auth, Theme,
│   │   │                        # Cart, Player, Settings, Toaster)
│   │   ├── index.tsx            # Page d'accueil (Landing si non connecté,
│   │   │                        # Hero + lignes catégories sinon)
│   │   ├── login.tsx            # Connexion / inscription Supabase
│   │   ├── account.tsx          # Profil utilisateur
│   │   ├── browse.tsx           # Catalogue films
│   │   ├── watch.$id.tsx        # Lecteur vidéo
│   │   ├── watchlist.tsx        # Liste personnelle
│   │   ├── search.tsx           # Recherche globale
│   │   ├── artists.index.tsx    # Liste des artistes
│   │   ├── artists.$id.tsx      # Page artiste + tracks
│   │   ├── merch.tsx            # Boutique + bouton "Ajouter au panier"
│   │   └── admin.tsx            # Dashboard admin (films, artistes,
│   │                            # tracks, merch, commandes, apparence)
│   │
│   ├── components/
│   │   ├── Navbar.tsx           # Header sticky + menu mobile (Sheet)
│   │   ├── HeroBanner.tsx       # Hero du film mis en avant
│   │   ├── MovieRow.tsx         # Carrousel horizontal de films
│   │   ├── MovieCard.tsx        # Vignette film
│   │   ├── MiniPlayer.tsx       # Lecteur audio flottant
│   │   ├── CartDrawer.tsx       # Tiroir panier + checkout WhatsApp
│   │   └── ui/                  # Composants shadcn/ui
│   │
│   ├── lib/
│   │   ├── supabase.ts          # Client Supabase + types + ADMIN_EMAILS
│   │   ├── auth.tsx             # AuthProvider + useAuth()
│   │   ├── cart.tsx             # CartProvider lié au compte user
│   │   ├── player.tsx           # Lecteur audio global
│   │   ├── theme.tsx            # Mode clair / sombre persistant
│   │   ├── app-settings.tsx     # Lecture/écriture table `app_settings`
│   │   └── utils.ts             # cn() (tailwind-merge)
│   │
│   ├── styles.css               # Tailwind v4 + tokens design système
│   ├── router.tsx               # Création du router
│   └── routeTree.gen.ts         # Auto-généré — NE PAS éditer
│
├── supabase/migrations/         # SQL à exécuter sur l'instance Supabase
├── netlify.toml                 # Config déploiement Netlify
├── capacitor.config.ts          # Config wrapper mobile
├── wrangler.jsonc               # (optionnel) Cloudflare Workers
├── vite.config.ts
└── package.json
```

### Providers globaux (`src/routes/__root.tsx`)

L'ordre est important :

```
QueryClientProvider
└─ ThemeProvider
   └─ AuthProvider              ← source de l'utilisateur Supabase
      └─ AppSettingsProvider    ← config dynamique (nom, logo, textes)
         └─ CartProvider        ← panier lié à user.id
            └─ PlayerProvider   ← lecteur audio global
               └─ <Outlet />
```

### Conventions

- **Tous les chemins absolus** utilisent l'alias `@/` (= `src/`).
- **Composants shadcn** sont dans `src/components/ui/` — ne pas les modifier
  manuellement, utilisez les variants existants ou créez un wrapper.
- **Couleurs et thèmes** : tokens sémantiques dans `src/styles.css`. Ne
  jamais hardcoder `text-white`, `bg-black`, `bg-[#xxx]` dans les
  composants — utilisez `text-foreground`, `bg-background`, etc.
- **Routes file-based** : ajouter un fichier dans `src/routes/`, le router
  régénère `routeTree.gen.ts` automatiquement (ne pas l'éditer).

---

## 3. Modèle de données Supabase

Tables publiques (toutes avec RLS activée) :

| Table          | Rôle                                                        |
| -------------- | ----------------------------------------------------------- |
| `movies`       | Films (titre, vidéo, poster, catégorie, mise en avant)      |
| `artists`      | Artistes du label                                           |
| `tracks`       | Morceaux liés à un artiste                                  |
| `merch`        | Produits dérivés (prix, image, stock, lien artiste)         |
| `orders`       | Commandes boutique (items JSONB, WhatsApp, statut)          |
| `watchlist`    | Liste de visionnage par utilisateur                         |
| `app_settings` | Clé/valeur — apparence, textes landing, logo                |

**Admin** : déterminé côté client par l'email présent dans
`ADMIN_EMAILS` (cf. `src/lib/supabase.ts`) **et** côté SQL par la
correspondance `auth.jwt() ->> 'email'`. Pour changer l'admin :

1. Modifier la constante dans `src/lib/supabase.ts`.
2. Réexécuter les policies SQL avec le nouvel email.

Les migrations sont dans `supabase/migrations/`. Ouvrez le **SQL Editor**
Supabase et collez le contenu dans l'ordre chronologique.

---

## 4. Installation locale

Prérequis : **Bun** (https://bun.sh) ou Node 20+.

```bash
# 1. Cloner et installer
git clone <repo>
cd 416-records
bun install

# 2. Lancer en dev (port 8080 par défaut)
bun run dev
```

L'URL du Supabase et la clé `anon` sont actuellement codées en clair dans
`src/lib/supabase.ts` (clé publique, c'est OK). Pour changer d'instance,
remplacez `SUPABASE_URL` et `SUPABASE_ANON_KEY`.

---

## 5. Configuration des secrets

Aucune variable d'environnement n'est nécessaire pour faire tourner l'app :
la clé anonyme Supabase est publique. Les **vraies** opérations sensibles
sont protégées par les policies RLS de Supabase.

Si vous voulez ajouter des secrets (ex. service role, webhook) :

- En dev : créez un fichier `.env.local` (ignoré par git).
- Sur Netlify : `Site settings → Environment variables`.

---

## 6. Déploiement Netlify (gratuit)

### Préparation

Le projet est par défaut configuré pour Cloudflare Workers. Pour le
publier sur **Netlify en mode SPA statique** (gratuit, sans SSR), suivez
ces étapes :

1. Désactivez le plugin Cloudflare dans `vite.config.ts` (ou supprimez
   l'import `@cloudflare/vite-plugin`).
2. Assurez-vous que `vite build` produit bien un dossier `dist/` avec
   `index.html` à la racine.
3. Le fichier `netlify.toml` à la racine s'occupe du reste :
   - `command = "bun run build"`
   - `publish = "dist"`
   - Fallback `/* → /index.html 200` pour le routing côté client.

### Déploiement

**Option A — via l'interface Netlify**

1. Allez sur https://app.netlify.com → *Add new site* → *Import from Git*.
2. Sélectionnez votre repo.
3. Build command : `bun run build`. Publish directory : `dist`.
4. Cliquez sur *Deploy*. Votre site est en ligne sous
   `https://<nom>.netlify.app`.

**Option B — via la CLI**

```bash
npm i -g netlify-cli
netlify deploy --build --prod
```

### Domaine personnalisé

Netlify → *Domain settings* → *Add a custom domain*. Suivez les
instructions DNS (record `CNAME` vers `<nom>.netlify.app`).

---

## 7. Build mobile Android & iOS (Capacitor)

L'app peut être empaquetée en application native via **Capacitor**.

### Installation initiale (à faire une seule fois)

```bash
bun add @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
bunx cap init   # déjà fait : voir capacitor.config.ts
```

### Stratégie 1 — Wrapper de l'URL Netlify (le plus simple)

Dans `capacitor.config.ts`, décommentez et remplissez :

```ts
server: {
  url: "https://votre-site.netlify.app",
  cleartext: false,
}
```

L'app mobile chargera directement votre site publié. Les mises à jour
web sont instantanément reflétées dans l'app — **pas besoin de
republier sur les stores** tant que vous ne touchez pas aux plugins
natifs.

### Stratégie 2 — Bundle statique embarqué

```bash
bun run build                 # génère dist/
bunx cap add android          # ajoute le projet Android
bunx cap add ios              # ajoute le projet iOS (macOS requis)
bunx cap sync                 # copie dist/ dans les projets natifs
```

### Lancer / builder

**Android** (nécessite Android Studio) :

```bash
bunx cap open android
# Puis dans Android Studio : Build → Generate Signed Bundle / APK
```

**iOS** (nécessite macOS + Xcode) :

```bash
bunx cap open ios
# Puis dans Xcode : Product → Archive → Distribute App
```

### Workflow de mise à jour

À chaque modif de code web :

```bash
bun run build && bunx cap sync
```

Puis relancer dans Android Studio / Xcode.

---

## 8. Administration

L'admin (`/admin`) est accessible uniquement aux emails listés dans
`ADMIN_EMAILS` (`src/lib/supabase.ts`). Il propose 6 onglets :

| Onglet      | Actions                                                  |
| ----------- | -------------------------------------------------------- |
| Films       | Ajouter / éditer / supprimer / mettre en avant un film   |
| Artistes    | Idem pour les artistes                                   |
| Tracks      | Morceaux liés à un artiste, lien Spotify, etc.           |
| Boutique    | Produits merch (image, prix, stock)                      |
| Commandes   | Voir les commandes entrantes + numéro WhatsApp client    |
| Apparence   | Nom de l'app, logo, textes de la landing page, CTAs      |

---

## 9. Flux d'une commande boutique

1. L'utilisateur **connecté** clique *Ajouter au panier* sur un produit
   merch (un visiteur non connecté est invité à se connecter).
2. Le panier (`CartDrawer`) s'ouvre. Quantités modifiables.
3. *Passer commande* → formulaire : nom + numéro WhatsApp.
4. Insertion dans la table `orders` (statut `pending`, items en JSONB).
5. L'admin reçoit la commande dans `/admin → Commandes`, voit le
   contenu et le numéro WhatsApp, et clique sur *Contacter via WhatsApp*
   pour finaliser la vente hors-app.

Le panier est **scopé à `user.id`** (clé localStorage
`416-cart:<uid>`), donc changer de compte = changer de panier.

---

## 10. Personnalisation de l'apparence

L'admin → *Apparence* écrit dans la table `app_settings` (clé/valeur).
Les champs éditables :

- `app_name` — nom affiché dans la navbar
- `logo_url` — logo (URL d'image)
- `landing_eyebrow` — sur-titre de la landing
- `landing_title_1` / `landing_title_2` — gros titre (la 2e ligne est
  en dégradé doré)
- `landing_subtitle` — sous-titre (multiligne supporté)
- `landing_cta_primary` / `landing_cta_secondary` — boutons CTA

Le hook `useAppSettings()` lit ces valeurs partout dans l'app et
recharge automatiquement après modification.

---

## 11. FAQ & dépannage

**Q. Page blanche en prod sur Netlify.**
Vérifiez que `base: './'` n'est PAS forcé dans `vite.config.ts`
(Netlify sert depuis la racine `/`) et que `dist/index.html` existe
après `bun run build`.

**Q. Les routes refresh en 404.**
Le fallback `/* → /index.html` dans `netlify.toml` corrige ça. Si vous
voyez encore l'erreur, redéployez après avoir vérifié que `netlify.toml`
est bien à la racine du repo.

**Q. L'app mobile reste vide.**
Si vous utilisez la stratégie 1 (server.url), vérifiez la connectivité
et que l'URL est en `https`. Si stratégie 2, refaites
`bun run build && bunx cap sync`.

**Q. Comment ajouter un admin ?**
Ajoutez son email dans `ADMIN_EMAILS` (`src/lib/supabase.ts`) **et**
mettez à jour les policies SQL admin sur les tables protégées
(`orders`, `app_settings`, etc.).

**Q. Le panier disparaît après déconnexion.**
C'est voulu : il est lié à l'utilisateur. Reconnectez-vous pour le
retrouver.

---

Made with ❤ for **416 Records**.
