# quatro



├── src/

│   ├── routes/                  # File-based routing TanStack Router

│   │   ├── \_\_root.tsx           # Layout racine : providers (Auth, Theme,

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

│   │   ├── supabase.ts          # Client Supabase + types + ADMIN\_EMAILS

│   │   ├── auth.tsx             # AuthProvider + useAuth()

│   │   ├── cart.tsx             # CartProvider lié au compte user

│   │   ├── player.tsx           # Lecteur audio global

│   │   ├── theme.tsx            # Mode clair / sombre persistant

│   │   ├── app-settings.tsx     # Lecture/écriture table `app\_settings`

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



Mais il faut adapter le tout et remplacer react par flutter et supabase par Django, un backend sécurisé en python. 

