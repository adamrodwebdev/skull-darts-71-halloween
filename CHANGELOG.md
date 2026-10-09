# Changelog

Toutes les évolutions notables du site sont consignées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · Versionnage : [SemVer](https://semver.org/lang/fr/).

## [1.2.0] – 2026-10-09
### Ajouté
- Rappel « enfants » dans le programme : enfants accompagnés et sous la responsabilité de leurs parents, autorisés aussi pour la partie adultes (+ question dans la FAQ).
- Bloc DJ « Prépa’soirée 39 » avec boule disco animée (SVG) et lien discret vers sa page Facebook ; DJ ajouté aux données structurées (`performer`).

### Corrigé
- Mobile : le bouton de langue (et les autres boutons ronds) restait incliné après un tap. Les effets de survol ne s’appliquent plus qu’aux appareils avec souris / trackpad.

### Modifié
- Service worker : cache `v3`.

## [1.1.0] – 2026-10-09
### Ajouté
- Logo officiel Skull Darts 71 (`assets/img/logo.svg`, recadré et optimisé) dans l'en-tête, le pied de page et l'écran d'intro.
- `CHANGELOG.md`, `package.json` (version + script `start`), `.gitignore`, `.gitattributes`.

### Modifié
- Favicon et icônes d'application (180 / 192 / 512 px) régénérées à partir du logo officiel.
- Intro : boutons ancrés en bas d'écran, la cible s'adapte à l'espace restant (petits écrans).
- Service worker : cache `v2` pour forcer la mise à jour des visiteurs.

### Supprimé
- Ancienne icône provisoire `assets/img/icon.svg`.

## [1.0.0] – 2026-10-09
### Ajouté
- Première version : intro fléchette + écran brisé, sound design Web Audio, FR/EN, thème sombre/clair,
  compte à rebours, programme, infos pratiques, mini-jeu, affiche, FAQ, PWA, SEO.

[1.2.0]: https://github.com/adamrodwebdev/skull-darts-71-halloween/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/adamrodwebdev/skull-darts-71-halloween/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/adamrodwebdev/skull-darts-71-halloween/releases/tag/v1.0.0
