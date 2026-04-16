
# Quoridor Frontend

This project is the frontend for the Quoridor game, built with React Native and Expo. Below is an up-to-date overview of the project and its folder structure.

## Project Structure

```
frontend/
├── app.json
├── eas.json
├── eslint.config.js
├── expo-env.d.ts
├── metro.config.js
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── app/
│   ├── _layout.tsx
│   ├── +html.tsx
│   ├── achievements.tsx
│   ├── ad-interstitial.tsx
│   ├── daily-puzzle.tsx
│   ├── defeat.tsx
│   ├── edit-profile.tsx
│   ├── game-over.tsx
│   ├── game.tsx
│   ├── index.tsx
│   ├── match-history.tsx
│   ├── match-result.tsx
│   ├── mode-select.tsx
│   ├── paywall.tsx
│   ├── pregame-ai.tsx
│   ├── pregame-local.tsx
│   ├── settings.tsx
│   ├── subscription.tsx
│   ├── trainer.tsx
│   ├── victory.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── collection.tsx
│       ├── index.tsx
│       ├── me.tsx
│       ├── rank.tsx
│       └── settings.tsx
├── assets/
│   ├── fonts/
│   │   └── SpaceMono-Regular.ttf
│   └── images/
│       ├── adaptive-icon.png
│       ├── favicon.png
│       ├── icon.png
│       ├── partial-react-logo.png
│       ├── react-logo.png
│       ├── react-logo@2x.png
│       ├── react-logo@3x.png
│       └── splash-icon.png
├── scripts/
│   ├── fix-expo-module-scripts-tsconfig.js
│   └── reset-project.js
├── src/
│   ├── components/
│   │   ├── AchievementToast.tsx
│   │   ├── GameBoard.tsx
│   │   ├── GhostButton.tsx
│   │   ├── LessonBoard.tsx
│   │   ├── PrimaryButton.tsx
│   │   ├── SectionLabel.tsx
│   │   ├── ThemedBackground.tsx
│   │   ├── TopBar.tsx
│   │   ├── TurnToast.tsx
│   │   └── WallIcon.tsx
│   ├── game/
│   │   ├── AIPlayer.ts
│   │   ├── GameEngine.ts
│   │   └── types.ts
│   ├── lib/
│   │   ├── ADManager.ts
│   │   └── ads.ts
│   ├── services/
│   │   ├── AchievementService.ts
│   │   ├── AuthService.ts
│   │   ├── BillingService.ts
│   │   ├── DailyPuzzleService.ts
│   │   ├── FeedbackService.ts
│   │   ├── GameSaveService.ts
│   │   ├── ProfileService.ts
│   │   └── StatsService.ts
│   ├── storage/
│   │   ├── AuthContext.tsx
│   │   ├── GameContext.tsx
│   │   └── StorageService.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   ├── gameStore.ts
│   │   └── statsStore.ts
│   └── theme/
│       └── colors.ts
```


## Folder Descriptions

- **app/**: Main application screens and navigation layouts.
  - **(tabs)/**: Tabbed navigation screens.
- **assets/**: Static assets such as fonts and images.
  - **fonts/**: Custom fonts used in the app.
  - **images/**: App icons, splash screens, and other images.
- **scripts/**: Utility scripts for project maintenance.
- **src/**: Source code for components, game logic, services, storage, and theming.
  - **components/**: Reusable UI components.
  - **game/**: Game engine and AI logic.
  - **lib/**: Utility libraries (e.g., ad management).
  - **services/**: Business logic and API services (including billing, authentication, stats, etc.).
  - **storage/**: Context and storage management.
  - **store/**: State management stores.
  - **theme/**: Theming and color definitions.


## Getting Started

1. Install dependencies:
  ```sh
  npm install
  ```
2. Start the development server:
  ```sh
  npx expo start
  ```


## Additional Notes
- This project uses Expo for development and building.
- See `package.json` for dependencies and scripts.
- See `eas.json` for EAS build profiles.

---

### Useful Links

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
- [Expo on GitHub](https://github.com/expo/expo): View the open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
