# Quori - Quoridor Mobile App

Quori is a mobile strategy game based on Quoridor, built with Expo and React Native.
Players race pawns to the opposite side while using walls to block opponents.
The app includes AI difficulty levels, match history, player profile stats, achievements, and theme support.

## What this repository contains

This repository currently contains the frontend mobile application.

- Platform: Android/iOS/Web (Expo)
- Language: TypeScript
- Framework: React Native + Expo Router
- State: Zustand + Context where needed

## Main features

- Play Quoridor game modes from the mobile app UI
- AI gameplay with multiple difficulties
- Match result and history tracking
- User profile and performance stats
- Achievements and progression UI
- Theme settings and polished game screens

## Prerequisites

Install the following first:

- Node.js 18+ (recommended: Node.js 20 LTS)
- npm 9+
- Git
- Expo Go app on your phone (optional but recommended for quick testing)

Optional for cloud builds:

- Expo account
- EAS CLI access (can be run via npx, no global install required)

## Clone and run on another device

### 1. Clone the repo

```bash
git clone https://github.com/trilumos/quori.git
cd quori
```

### 2. Install app dependencies

```bash
cd frontend
npm install
```

### 3. Start the Expo development server

```bash
npm run start
```

This opens the Expo dev server. From there you can:

- Press a for Android emulator
- Press i for iOS simulator (macOS only)
- Press w for web
- Scan the QR code with Expo Go on a physical device

## Useful commands

Run all commands from the frontend folder.

### Start

```bash
npm run start
```

### Start on Android target

```bash
npm run android
```

### Start on iOS target (macOS only)

```bash
npm run ios
```

### Start web

```bash
npm run web
```

### Lint

```bash
npm run lint
```

## Production APK build (EAS)

Run from the frontend folder:

```bash
npx -y eas-cli@latest build --platform android --profile production-apk --non-interactive --clear-cache
```

If this is your first time building with EAS, log in first:

```bash
npx -y eas-cli@latest login
```

## Project structure

```text
quori/
  frontend/
    app/                 # Expo Router screens
    src/components/      # UI components
    src/game/            # Game engine and AI logic
    src/services/        # App services (stats, profile, auth helpers)
    src/store/           # Zustand stores
    package.json
```

## Notes

- This project is configured as an Expo app in the frontend directory.
- If Metro cache causes startup issues, clear it with:

```bash
npx expo start -c
```

- If dependency issues appear after pulling new changes, reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

(For Windows PowerShell, delete folders/files manually or use Remove-Item.)

## License

Private project / all rights reserved unless otherwise specified.
