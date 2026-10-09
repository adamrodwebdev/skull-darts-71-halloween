# Skull Darts 71 · Halloween Party

Site vitrine statique (HTML/CSS/JS natifs, aucune dépendance, aucun build).

## Lancer en local
```bash
npx serve .        # ou : python3 -m http.server
```

## Structure
- `index.html` — page unique (SEO, données structurées Event, Open Graph)
- `assets/css/styles.css` — thèmes sombre/clair, animations
- `assets/js/i18n.js` — FR (par défaut) / EN — `?lang=en`
- `assets/js/audio.js` — sound design synthétisé (Web Audio, 0 fichier audio)
- `assets/js/board.js` — dessin de la cible et de la fléchette
- `assets/js/intro.js` — intro : lancer → impact → fissures → éclats + particules
- `assets/js/game.js` — mini-jeu de fléchettes (record en localStorage)
- `assets/js/app.js` — compte à rebours, thème, langue, agenda .ics, partage, lightbox
- `sw.js`, `manifest.webmanifest` — hors-ligne / installable (HTTPS)
- `_headers` (Netlify) et `.htaccess` (Apache) — cache longue durée

## Paramètres d'URL
`?lang=en` · `?theme=dark|light`

## Lighthouse (mobile & desktop)
Performance 100 · Accessibilité 100 · Bonnes pratiques 100 · SEO 100

## À vérifier
- Heure de fin (non indiquée sur l'affiche) : fixée à 2h du matin dans `app.js` (compte à rebours + fichier .ics).
