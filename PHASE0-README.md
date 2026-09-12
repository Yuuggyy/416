# Phase 0 — Casting digital 416 Records

Module ajouté à l'appli 416 : casting digital (votes par likes), quicks,
écoutes fan / super fan, points de fidélité, et gestion complète dans l'admin.

## Fichiers ajoutés

| Fichier | Rôle |
| --- | --- |
| `supabase/phase0_schema.sql` | Tables + RLS + storage (à exécuter une fois) |
| `src/lib/phase0.ts` | Constantes, types, logique de score (jury 60% / likes 40%) |
| `src/routes/casting.tsx` | Page publique : participer + galerie + likes |
| `src/routes/quicks.tsx` | Feed vertical Quicks (publication ouverte aux abonnés) |
| `src/components/FanListen.tsx` | Écoute Fan (pub) / Super Fan (paiement ou 2 pubs) + points |
| `src/components/admin/casting-admin.tsx` | Onglet admin Casting (validation, grille jury, sélection 36+4) |
| `src/components/admin/quicks-admin.tsx` | Onglet admin Quicks (validation, à la une, suppression) |

## Fichiers modifiés

- `src/routes/admin.tsx` — onglets **Casting** et **Quicks** ajoutés
- `src/components/Navbar.tsx` — liens **Quicks** et **Casting**
- `src/routes/watch.$id.tsx` — bloc `FanListen` sous le player
- `src/routeTree.gen.ts` — régénéré (automatique au build)

## Mise en route

1. **SQL** : exécuter `supabase/phase0_schema.sql` dans le SQL Editor du projet
   Supabase (ugwsvksozygdzgqeiddc). Idempotent, relançable.
2. **Build** : rien à faire de plus — `routeTree.gen.ts` se régénère seul.
   Vérifié : `vite build` passe sans erreur (les 3 erreurs tsc dans
   `__root.tsx` / `search.tsx` existaient avant ce module).
3. **Paiement Super Fan** : renseigner `VITE_FLW_PUBLIC_KEY` (Netlify ou `.env`)
   pour activer M-Pesa / Airtel / Orange Money / carte via Flutterwave.
   Sans la clé, le bouton renvoie un message d'erreur propre.
4. **Test rapide** : créer 2 comptes → candidature avec le compte A,
   validation dans l'admin, like avec le compte B, note jury dans l'admin,
   puis « Appliquer la sélection (36 + 4) ».

## Réglages (tout est dans `src/lib/phase0.ts`)

| Constante | Valeur | Signification |
| --- | --- | --- |
| `targetCandidates` | 140 | Candidats sérieux visés en Phase 0 |
| `selectedByComposite` | 36 | Retenus au score composite (jury 60% + likes 40%) |
| `repecheByLikes` | 4 | Repêchés par les likes purs → 40 au parking (E1) |
| `JURY_WEIGHT` / `PUBLIC_WEIGHT` | 0.6 / 0.4 | Pondération du composite |
| `SUPER_FAN_PRICE_FC` | 2200 | ≈ 0,90 USD, payé en mobile money ou carte |
| `SUPER_FAN_AD_COUNT` | 2 | Nb de pubs pour débloquer Super Fan gratuitement |
| `POINTS` | 1/2/5/3 | Visite quotidienne / écoute fan / super fan / partage quick |

Grille jury sur 10 : Écriture /3 · Choix de prod /2 · Prestance /3 · Potentiel vidéo /2.

## Règles anti-triche (v1, client + SQL)

- 1 like par abonné et par candidature (contrainte SQL unique + RLS).
- 1 écoute comptabilisée par titre et par jour (index unique SQL).
- Points de fidélité v1 : écrits côté client — suffisant tant que les
  points ne donnent que des réductions. Pour des récompenses en argent :
  passer les insertions de points par une Edge Function signée.
- Quicks et candidatures : validation admin avant affichage public.

## Notes techniques

- Les votes/likes sont publics (compteurs visibles) — c'est voulu : la
  transparence fait la pression sociale qui anime le casting.
- `casting_votes` est relié à `casting_applications` via `select("*, casting_votes(count)")`
  (relation par clé étrangère, pas de RPC nécessaire).
- Le storage utilise le bucket `media` existant avec deux nouveaux préfixes
  `casting/` et `quicks/` ouverts aux abonnés connectés.
