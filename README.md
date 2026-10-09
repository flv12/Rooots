# Rooots 🌱

Appli Android perso pour suivre l'arrosage et l'entretien de ses plantes d'intérieur : rappels quotidiens, historique des soins, catalogue de 100 plantes (photos, entretien, toxicité pour les animaux). Tout reste sur le téléphone.

Expo SDK 57 · React Native · TypeScript · SQLite.

## Développer

```bash
nvm use && npm install
npx expo start            # scanner le QR code avec Expo Go
npm run lint && npm run typecheck && npm test
```

## APK

- **Automatique** : chaque merge dans `main` construit l'APK et le publie dans les [Releases](../../releases) (`v1.1.<n>`).
- **En local** : `npm run build:apk` → `dist/rooots.apk` (JDK 17 dans `~/.local/jdk-17`, SDK Android dans `~/Android/Sdk`).

Installer la nouvelle version par-dessus l'ancienne, sans désinstaller, pour garder ses données. La version (`1.1.<nombre de commits>`) est calculée au build ; pour passer en 1.2, modifier `expo.version` dans `app.json`.

## Branches

1 feature = 1 branche depuis `main` → mergée dans une branche de lot (depuis `main`) → le lot est mergé dans `main`, ce qui publie une nouvelle version. Lint, typecheck et tests tournent sur chaque PR. Ne jamais réécrire `main`.

## Catalogue

Fiches sources dans `scripts/catalog/drafts/`, assemblées par `node scripts/catalog/build-catalog.mjs` dans `assets/catalog/catalog.json`. Photos Wikimedia : `node scripts/catalog/fetch-photos.mjs`.
