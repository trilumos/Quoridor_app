import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { showRewarded } from "../src/lib/ads";
import { AdManager } from "../src/lib/ADManager";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { getThemeColors } from "../src/theme/colors";
import {
  GameState,
  Position,
  Wall,
  ActionMode,
  AIDifficulty,
  GameMode,
} from "../src/game/types";
import {
  createInitialGameState,
  getValidMoves,
  isValidWallPlacement,
  applyMove,
  applyWall,
} from "../src/game/GameEngine";
import { getAIMove } from "../src/game/AIPlayer";
import GameBoard from "../src/components/GameBoard";
import WallIcon from "../src/components/WallIcon";
import { useGameContext } from "../src/storage/GameContext";
import { StorageService } from "../src/storage/StorageService";
import { useAuthStore } from "../src/store/authStore";
import { useStatsStore } from "../src/store/statsStore";
import { useGameStore } from "../src/store/gameStore";
import { FeedbackService } from "../src/services/FeedbackService";


type LogEntry = { num: number; type: string; detail: string };
type MatchHistoryEntry = {
  id: string;
  mode: GameMode;
  difficulty?: string;
  result: "WIN" | "LOSS";
  played_at_ms: number;
  duration_seconds: number;
  moves_made: number;
  walls_placed: number;
  walls_used_p1?: number;
  walls_used_p2?: number;
  created_at: string;
  opponent: string;
  player_name: string;
  winner_index: 0 | 1;
  move_log: LogEntry[];
};
type LocalLayoutMode = "flip-turn" | "face-to-face";

function posToNotation(row: number, col: number): string {
  return String.fromCharCode(65 + col) + (9 - row);
}

function formatClock(totalSec: number): string {
  const clamped = Math.max(0, totalSec);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getCardTextPalette(
  theme: ReturnType<typeof getThemeColors>,
  isActive: boolean,
) {
  if (isActive) {
    return {
      textPrimary: theme.textPrimary,
      textSecondary: theme.textSecondary,
      controlBorder: theme.borderFocus,
    };
  }

  return {
    textPrimary: theme.textSecondary,
    textSecondary: theme.textSecondary,
    controlBorder: theme.border,
  };
}
export default function GameScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const {
    settings,
    recordWin,
    recordLoss,
    recordWallsPlaced,
    incrementAdCounter,
    shouldShowAd,
    queueAchievementUnlocks,
    canUseUndo,
    useUndo: consumeUndo,
    resetUndoCount,
    recordGameTimestamp,
  } = useGameContext();
  const { user, isPremium, profile } = useAuthStore();
  const { stats, recordGame } = useStatsStore();
  const {
    saveGame: storeSaveGame,
    savedGame: storeSavedGame,
    deleteSavedGame,
    incrementMatchCount,
    shouldShowAd: storeShowAd,
  } = useGameStore();
  const { width: sw, height: sh } = useWindowDimensions();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(
    () => createStyles(theme, settings.darkMode),
    [theme, settings.darkMode],
  );

  const mode = (params.mode as GameMode) || "ai";
  const shouldResume = params.resume === "true";
  const difficulty =
    (shouldResume && storeSavedGame?.difficulty
      ? (storeSavedGame.difficulty as AIDifficulty)
      : (params.difficulty as AIDifficulty)) || "easy";
  const localTimeSec = Math.max(0, Number(params.localTimeSec || 0));
  const p1Name =
    (params.p1Name as string) || profile?.username || "PLAYER";
  const p2Name =
    mode === "ai"
      ? (params.p2Name as string) || "KAI_ZEN_01"
      : (params.p2Name as string) || "Player 2";

  const [gameState, setGameState] = useState<GameState>(() =>
    createInitialGameState(p1Name, theme.player1, p2Name, theme.player2),
  );
  const [actionMode, setActionMode] = useState<ActionMode>("move");
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [selectedIntersection, setSelectedIntersection] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [wallOrientation, setWallOrientation] = useState<
    "horizontal" | "vertical"
  >("horizontal");
  const [wallPreview, setWallPreview] = useState<Wall | null>(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [message, setMessage] = useState("");
  const [moveLog, setMoveLog] = useState<LogEntry[]>([]);
  const [stateHistory, setStateHistory] = useState<GameState[]>([]);
  
  const [localLayoutMode, setLocalLayoutMode] =
    useState<LocalLayoutMode>("flip-turn");
  const [remainingSeconds, setRemainingSeconds] = useState<[number, number]>(
    () => [localTimeSec, localTimeSec],
  );
  const gameOverHandled = useRef(false);
  const gameEndMethodRef = useRef<"normal" | "time">("normal");
  const moveCountRef = useRef(0);
  const resumeHydratedRef = useRef(false);
  const rewardedContinueHydratedRef = useRef(false);
  const rewardedUndoConsumedRef = useRef(false);
  const interactionLockRef = useRef(false);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMessage(""), 2500);
  }, []);

  const addLog = useCallback((type: string, detail: string) => {
    moveCountRef.current += 1;
    setMoveLog((prev) => [
      { num: moveCountRef.current, type, detail },
      ...prev,
    ]);
  }, []);

  const isTimedLocal = mode === "local" && localTimeSec > 0;

  useFocusEffect(
  useCallback(() => {
    // Game screen handles NO ads on entry anymore.
    // Ads on game start are handled by pregame screens
    // to avoid double-firing.
    // This effect is intentionally left empty.
    // Only end-of-game ads are handled here.
  }, [])
);
  useEffect(() => {
  if (params.adType !== "rewarded_undo") return;

  const restoreAndApplyRewardedUndo = async () => {
    if (rewardedUndoConsumedRef.current) return;
    const rewardToken =
      typeof params.rewardToken === "string" ? params.rewardToken : null;
    if (!rewardToken) return;

    const saved = await StorageService.get<{
      rewardToken: string;
      gameState: GameState;
      stateHistory: GameState[];
      gameId: string;
    }>(StorageService.KEYS.REWARDED_UNDO_STATE);

    if (!saved || saved.rewardToken !== rewardToken) return;
    if (!saved?.stateHistory?.length) return;

    rewardedUndoConsumedRef.current = true;

    // Restore gate so next undo correctly requires another ad
    if (saved.gameId) {
      AdManager.restoreUndoGate(saved.gameId);
    }

    let popCount = 1;
    let previousState = saved.stateHistory[saved.stateHistory.length - 1];
    if (
      mode === "ai" &&
      previousState.currentPlayer === 1 &&
      saved.stateHistory.length >= 2
    ) {
      popCount = 2;
      previousState = saved.stateHistory[saved.stateHistory.length - 2];
    }

    setGameState(previousState);
    setStateHistory(saved.stateHistory.slice(0, -popCount));
    setSelectedIntersection(null);
    setWallPreview(null);
    setActionMode("move");
    setAiThinking(false);
    interactionLockRef.current = false;

    await StorageService.clear(StorageService.KEYS.REWARDED_UNDO_STATE);
  };

  void restoreAndApplyRewardedUndo();
}, [mode, params.adType, params.rewardToken]);

  useEffect(() => {
    if (rewardedContinueHydratedRef.current) return;
    if (params.adType !== "rewarded_continue" || mode !== "ai") return;

    const restoreRewardedContinue = async () => {
      const saved = await StorageService.get<{ state: GameState }>(
        StorageService.KEYS.REWARDED_CONTINUE_STATE,
      );
      if (!saved?.state) return;

      rewardedContinueHydratedRef.current = true;
      gameOverHandled.current = false;
      moveCountRef.current =
        saved.state.moveCount[0] + saved.state.moveCount[1];
      setGameState(saved.state);
      setActionMode("move");
      setSelectedIntersection(null);
      setWallPreview(null);
      setAiThinking(false);
      setMessage("");
      setMoveLog([]);
      setStateHistory([]);
      await StorageService.clear(StorageService.KEYS.REWARDED_CONTINUE_STATE);
    };

    void restoreRewardedContinue();
  }, [mode, params.adType]);

  useEffect(() => {
    if (!shouldResume || resumeHydratedRef.current) return;
    if (
      !storeSavedGame ||
      storeSavedGame.mode !== "ai" ||
      !storeSavedGame.game_state
    ) {
      return;
    }

    const resumedState = storeSavedGame.game_state as GameState;
    resumeHydratedRef.current = true;
    moveCountRef.current =
      resumedState.moveCount[0] + resumedState.moveCount[1];
    gameOverHandled.current = false;
    setGameState(resumedState);
    setActionMode("move");
    setSelectedIntersection(null);
    setWallPreview(null);
    setAiThinking(false);
    setMessage("");
    setMoveLog([]);
    setStateHistory([]);
  }, [shouldResume, storeSavedGame]);

  const pushHistory = useCallback((snapshot: GameState) => {
    setStateHistory((prev) => [...prev.slice(-9), snapshot]);
  }, []);

  useEffect(() => {
    interactionLockRef.current = false;
  }, [gameState.currentPlayer, gameState.moveCount]);

  useEffect(() => {
    const adType = typeof params.adType === "string" ? params.adType : "";
    const isFreshAiStart =
      mode === "ai" &&
      !shouldResume &&
      adType !== "rewarded_undo" &&
      adType !== "rewarded_continue";

    if (isFreshAiStart) {
  resetUndoCount();
  AdManager.resetUndoGate(""); // clear gate for new game
}
  }, [mode, params.adType, resetUndoCount, shouldResume]);

  // Auto-save game state on every change
  useEffect(() => {
    if (user && !gameState.gameOver) {
      storeSaveGame(user.id, gameState as any, mode, difficulty || null);
    }
  }, [gameState, user, storeSaveGame, mode, difficulty]);

  useEffect(() => {
    if (actionMode === "move" && !gameState.gameOver) {
      const cp = gameState.currentPlayer;
      if (mode === "ai" && cp === 1) {
        setValidMoves([]);
        return;
      }
      const opp = 1 - cp;
      const moves = getValidMoves(
        gameState.players[cp].position,
        gameState.players[opp].position,
        gameState.walls,
      );
      setValidMoves(moves);
    } else {
      setValidMoves([]);
    }
  }, [
    actionMode,
    gameState.currentPlayer,
    gameState.walls,
    gameState.players,
    gameState.gameOver,
    mode,
  ]);

  useEffect(() => {
    if (mode !== "ai" || gameState.currentPlayer !== 1 || gameState.gameOver)
      return;
    setAiThinking(true);
    const t = setTimeout(() => {
      setGameState((prev) => {
        if (prev.currentPlayer !== 1 || prev.gameOver) return prev;
        pushHistory(prev);
        const aiAction = getAIMove(prev, difficulty);
        if (aiAction.type === "move") {
          const from = prev.players[1].position;
          addLog(
            "Opponent Move",
            `${posToNotation(from.row, from.col)} \u2192 ${posToNotation(aiAction.to.row, aiAction.to.col)}`,
          );
          return applyMove(prev, aiAction.to);
        } else {
          addLog(
            "Opponent Wall",
            `${posToNotation(aiAction.wall.row, aiAction.wall.col)}-${aiAction.wall.orientation[0].toUpperCase()}`,
          );
          return applyWall(prev, aiAction.wall);
        }
      });
      void FeedbackService.impact();
      setAiThinking(false);
      setActionMode("move");
    }, 600);
    return () => clearTimeout(t);
  }, [gameState.currentPlayer, gameState.gameOver, mode, difficulty, addLog, pushHistory]);

  useEffect(() => {
    if (!isTimedLocal || gameState.gameOver) return;

    const activePlayer = gameState.currentPlayer;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev[activePlayer] <= 0) return prev;

        const next: [number, number] = [...prev] as [number, number];
        next[activePlayer] = Math.max(0, next[activePlayer] - 1);

        if (next[activePlayer] === 0) {
          gameEndMethodRef.current = "time";
          setGameState((state) => {
            if (state.gameOver) return state;
            return {
              ...state,
              gameOver: true,
              winner: (1 - activePlayer) as 0 | 1,
            };
          });
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.currentPlayer, gameState.gameOver, isTimedLocal]);

  useEffect(() => {
    if (gameState.gameOver && !gameOverHandled.current) {
      gameOverHandled.current = true;
      const isPlayerWin = mode === "ai" ? gameState.winner === 0 : true;
      if (mode === "ai") {
        if (gameState.winner === 0)
          recordWin(
            10 - gameState.players[0].wallsRemaining,
            gameState.moveCount[0],
            difficulty,
          );
        else recordLoss(10 - gameState.players[0].wallsRemaining);

        if (gameState.winner !== 0) {
          const undoSteps = Number(params.undoMoves || 5);
          const rewindIndex = Math.max(0, stateHistory.length - undoSteps);
          const rewindState = stateHistory[rewindIndex] ?? stateHistory[0] ?? gameState;
          void StorageService.set(StorageService.KEYS.REWARDED_CONTINUE_STATE, {
            state: rewindState,
          });
        }
      }
      recordGameTimestamp();
      resetUndoCount();
      recordWallsPlaced(gameState.wallsPlaced[0] + gameState.wallsPlaced[1]);

      // Record to local prototype storage
      const handleGameEnd = async () => {
        if (user) {
          try {
            const durationSec = Math.floor(
              (Date.now() - gameState.startTime) / 1000,
            );
            const wallsUsed = gameState.wallsPlaced[0];
            const historyKey = `${StorageService.KEYS.GAME_HISTORY}:${user.id}`;
            const history =
              (await StorageService.get<MatchHistoryEntry[]>(historyKey)) || [];
            const moveLogAsc = [...moveLog].sort((a, b) => a.num - b.num);

            const historyEntry: MatchHistoryEntry = {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              mode,
              difficulty: mode === "ai" ? difficulty.toUpperCase() : "",
              result: (gameState.winner === 0 ? "WIN" : "LOSS") as
                | "WIN"
                | "LOSS",
              played_at_ms: Date.now(),
              duration_seconds: durationSec,
              moves_made: gameState.moveCount[0],
              walls_placed: wallsUsed,
              walls_used_p1: gameState.wallsPlaced[0],
              walls_used_p2: gameState.wallsPlaced[1],
              created_at: new Date().toISOString(),
              opponent: gameState.players[1].name,
              player_name: gameState.players[0].name,
              winner_index: (gameState.winner ?? 0) as 0 | 1,
              move_log: moveLogAsc,
            };

            history.unshift(historyEntry);
            await StorageService.set(historyKey, history.slice(0, 100));

            if (mode === "ai" && stats) {
              const ratingBefore = stats.rating || 1200;
              const ratingChange =
                mode === "ai"
                  ? isPlayerWin
                    ? Math.floor(Math.random() * 15) + 5
                    : -(Math.floor(Math.random() * 10) + 3)
                  : 0;
              const ratingAfter = ratingBefore + ratingChange;

              const gameData = {
                difficulty: mode === "ai" ? difficulty.toUpperCase() : "LOCAL",
                result: (gameState.winner === 0 ? "WIN" : "LOSS") as
                  | "WIN"
                  | "LOSS",
                duration_seconds: durationSec,
                moves_made: gameState.moveCount[0],
                walls_placed: wallsUsed,
                wall_efficiency: Math.round((wallsUsed / 10) * 100),
                rating_before: ratingBefore,
                rating_after: ratingAfter,
                rating_change: ratingChange,
              };

              const newAchievements = await recordGame(user.id, gameData);
              if (newAchievements.length > 0) {
                queueAchievementUnlocks(newAchievements);
              }
            }

            await deleteSavedGame(user.id);
          } catch {}
        }
      };
      handleGameEnd();

      const endParams = {
        winner: String(gameState.winner),
        p1Name: gameState.players[0].name,
        p2Name: gameState.players[1].name,
        moves1: String(gameState.moveCount[0]),
        moves2: String(gameState.moveCount[1]),
        walls1: String(gameState.wallsPlaced[0]),
        walls2: String(gameState.wallsPlaced[1]),
        time: String(Math.floor((Date.now() - gameState.startTime) / 1000)),
        mode,
        difficulty: mode === "ai" ? difficulty : "",
        winMethod: gameEndMethodRef.current,
      };

      const saveLocalGameExport = async () => {
        const durationSec = Math.floor(
          (Date.now() - gameState.startTime) / 1000,
        );
        await StorageService.set(StorageService.KEYS.LAST_GAME_EXPORT, {
          mode,
          difficulty,
          startTime: gameState.startTime,
          durationSec,
          winner: gameState.winner,
          winMethod: gameEndMethodRef.current,
          players: [
            {
              index: 0,
              name: gameState.players[0].name,
              moves: gameState.moveCount[0],
              wallsPlaced: gameState.wallsPlaced[0],
              wallsRemaining: gameState.players[0].wallsRemaining,
              timeRemainingSec: remainingSeconds[0],
            },
            {
              index: 1,
              name: gameState.players[1].name,
              moves: gameState.moveCount[1],
              wallsPlaced: gameState.wallsPlaced[1],
              wallsRemaining: gameState.players[1].wallsRemaining,
              timeRemainingSec: remainingSeconds[1],
            },
          ],
          timeLimitSec: localTimeSec,
          moveLog: [...moveLog].sort((a, b) => a.num - b.num),
        });
      };

      setTimeout(() => {
        const destination =
          mode === "ai" && gameState.winner !== 0
            ? "/defeat"
            : "/victory";

        // --- CENTRALIZED AD LOGIC ---
        let shouldShow = false;

        if (!isPremium) {
          shouldShow = AdManager.shouldShowAd({
            event: mode === "local" ? "LOCAL_GAME_END" : "AI_GAME_END",
          });
        }

        if ((mode as GameMode) === "local") {
          void saveLocalGameExport();

          if (!isPremium) {
            AdManager.showInterstitial(() => {
              router.replace({
                pathname: "/game-over",
                params: endParams,
              } as never);
            });
          } else {
            router.replace({
              pathname: "/game-over",
              params: endParams,
            } as never);
          }

          AdManager.recordEvent("LOCAL_GAME_END");
          return;
        }

        if (shouldShow) {
          AdManager.showInterstitial(() => {
            router.replace({
              pathname: destination,
              params: endParams,
            } as never);
          });

          AdManager.recordEvent("AI_GAME_END");
        } else {
          router.replace({
            pathname: destination,
            params: endParams,
          } as never);

          AdManager.recordEvent("AI_GAME_END");
        }
      }, 1500);
    }
  }, [
    gameState.gameOver,
    deleteSavedGame,
    difficulty,
    gameState.moveCount,
    gameState.players,
    gameState.startTime,
    gameState.wallsPlaced,
    gameState.winner,
    isPremium,
    localTimeSec,
    mode,
    moveLog,
    params.undoMoves,
    recordGame,
    recordLoss,
    recordWallsPlaced,
    recordGameTimestamp,
    resetUndoCount,
    recordWin,
    remainingSeconds,
    router,
    queueAchievementUnlocks,
    stateHistory,
    stats,
    user,
    gameState,
  ]);

  const notifyTurnChange = useCallback(() => {
    void FeedbackService.impact();
  }, []);

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (interactionLockRef.current) return;
      if (gameState.gameOver || aiThinking || actionMode !== "move") return;
      if (mode === "ai" && gameState.currentPlayer === 1) return;
      if (!validMoves.some((m) => m.row === row && m.col === col)) return;
      interactionLockRef.current = true;
      const from = gameState.players[gameState.currentPlayer].position;
      const activeName = gameState.players[gameState.currentPlayer].name;
      addLog(
        `${activeName} Move`,
        `${posToNotation(from.row, from.col)} \u2192 ${posToNotation(row, col)}`,
      );
      pushHistory(gameState);
      const ns = applyMove(gameState, { row, col });
      setGameState(ns);
      setSelectedIntersection(null);
      setWallPreview(null);
      void FeedbackService.impact();
      if (mode === "local" && !ns.gameOver) notifyTurnChange();
    },
    [
      gameState,
      actionMode,
      validMoves,
      aiThinking,
      mode,
      notifyTurnChange,
      addLog,
      pushHistory,
    ],
  );

  const handleIntersectionPress = useCallback(
    (row: number, col: number) => {
      if (gameState.gameOver || aiThinking) return;
      if (mode === "ai" && gameState.currentPlayer === 1) return;
      if (gameState.players[gameState.currentPlayer].wallsRemaining <= 0) {
        showToast("No walls remaining!");
        return;
      }
      if (actionMode !== "wall") setActionMode("wall");
      if (
        selectedIntersection?.row === row &&
        selectedIntersection?.col === col
      ) {
        const newO =
          wallOrientation === "horizontal" ? "vertical" : "horizontal";
        setWallOrientation(newO);
        setWallPreview({ row, col, orientation: newO });
      } else {
        setSelectedIntersection({ row, col });
        setWallPreview({ row, col, orientation: wallOrientation });
      }
    },
    [
      gameState,
      aiThinking,
      mode,
      selectedIntersection,
      wallOrientation,
      actionMode,
      showToast,
    ],
  );

  const handlePlaceWall = useCallback(() => {
    if (interactionLockRef.current) return;
    if (!wallPreview) return;
    if (
      !isValidWallPlacement(
        wallPreview,
        gameState.walls,
        gameState.players[0].position,
        gameState.players[1].position,
      )
    ) {
      showToast("Invalid wall placement!");
      void FeedbackService.error();
      return;
    }
    interactionLockRef.current = true;
    const activeName = gameState.players[gameState.currentPlayer].name;
    addLog(
      `${activeName} Wall`,
      `${posToNotation(wallPreview.row, wallPreview.col)}-${wallPreview.orientation[0].toUpperCase()}`,
    );
    pushHistory(gameState);
    const ns = applyWall(gameState, wallPreview);
    setGameState(ns);
    setSelectedIntersection(null);
    setWallPreview(null);
    setActionMode("move");
    void FeedbackService.impact();
    if (mode === "local" && !ns.gameOver) notifyTurnChange();
  }, [wallPreview, gameState, mode, notifyTurnChange, addLog, showToast, pushHistory]);

  const handleUndo = useCallback(() => {
  if (stateHistory.length === 0) {
    showToast("No moves to undo");
    return;
  }

  if (mode === "ai" && !isPremium) {
    const gameId = String(gameState.startTime);

    if (!AdManager.canUndoFree(gameId)) {
      // Free undo already used — require rewarded ad
      const openRewardedUndo = async () => {
        rewardedUndoConsumedRef.current = false;
        const rewardToken = `${Date.now()}_${Math.random()}`;
        await StorageService.set(StorageService.KEYS.REWARDED_UNDO_STATE, {
          rewardToken,
          gameState,
          stateHistory,
          gameId, // saved so restore effect can recover the gate
        });

        if (!AdManager.isOnline()) {
          showToast("Internet required for undo");
          return;
        }

        AdManager.showRewardedUndo(() => {
          router.replace({
            pathname: "/game",
            params: {
              adType: "rewarded_undo",
              mode,
              difficulty,
              p1Name,
              p2Name,
              rewardToken,
            },
          } as never);
        });
      };

      void openRewardedUndo();
      return;
    }

    // Free undo — consume it
    AdManager.consumeFreeUndo(gameId);
    consumeUndo();
  }

  // Perform the actual undo
  let popCount = 1;
  let previousState = stateHistory[stateHistory.length - 1];

  if (
    mode === "ai" &&
    previousState.currentPlayer === 1 &&
    stateHistory.length >= 2
  ) {
    popCount = 2;
    previousState = stateHistory[stateHistory.length - 2];
  }

  setStateHistory((prev) => prev.slice(0, -popCount));
  setGameState(previousState);
  setSelectedIntersection(null);
  setWallPreview(null);
  setActionMode("move");
  setAiThinking(false);
  interactionLockRef.current = false;

  void FeedbackService.impact();
}, [
  consumeUndo,
  difficulty,
  gameState,
  isPremium,
  mode,
  p1Name,
  p2Name,
  router,
  showToast,
  stateHistory,
]);

  const cp = gameState.currentPlayer;
  const isHuman = mode === "local" || cp === 0;
  const isPassAndPlay = mode === "local";
  const useFaceToFace = isPassAndPlay && localLayoutMode === "face-to-face";
  const flipForPlayer2 =
    isPassAndPlay && localLayoutMode === "flip-turn" && cp === 1;
  const topPlayerIndex = useFaceToFace ? 1 : flipForPlayer2 ? 0 : 1;
  const bottomPlayerIndex = useFaceToFace ? 0 : flipForPlayer2 ? 1 : 0;
  const topPlayer = gameState.players[topPlayerIndex];
  const bottomPlayer = gameState.players[bottomPlayerIndex];
  const topLabel = isPassAndPlay ? `PLAYER ${topPlayerIndex + 1}` : "OPPONENT";
  const bottomLabel = isPassAndPlay ? `PLAYER ${bottomPlayerIndex + 1}` : "YOU";
  const topSideCanAct =
    !useFaceToFace ||
    (!gameState.gameOver && !aiThinking && cp === topPlayerIndex);
  const bottomSideCanAct =
    !useFaceToFace ||
    (!gameState.gameOver && !aiThinking && cp === bottomPlayerIndex);
  const topIsActive = cp === topPlayerIndex;
  const topCardColors = getCardTextPalette(theme, topIsActive);
  const bottomCardColors = getCardTextPalette(theme, bottomSideCanAct);
  const reservedUiHeight = useFaceToFace ? 430 : 350;
  const boardSize = Math.max(208, Math.min(sw - 48, sh - reservedUiHeight));

  const handleMoveMode = useCallback(() => {
    setActionMode("move");
    setSelectedIntersection(null);
    setWallPreview(null);
  }, []);

  const handleWallMode = useCallback(() => {
    if (!isHuman || gameState.players[cp].wallsRemaining <= 0) return;
    setActionMode("wall");
  }, [cp, gameState.players, isHuman]);

  const renderBasicPlayerCard = ({
    label,
    name,
    status,
    wallsRemaining,
    palette,
    avatarUrl,
    iconName,
    active,
    mirrored,
  }: {
    label: string;
    name: string;
    status: string;
    wallsRemaining: number;
    palette: { textPrimary: string; textSecondary: string };
    avatarUrl?: string | null;
    iconName: keyof typeof Ionicons.glyphMap;
    active: boolean;
    mirrored?: boolean;
  }) => {
    const cardShellStyle = [active && st.cardGlowWrap, mirrored && st.cardMirrored];

    return (
      <View style={cardShellStyle}>
        <View
          style={[
            st.playerCard,
            st.basicCard,
            active && st.basicCardActive,
            {
              backgroundColor: settings.darkMode ? theme.elevated : theme.surface,
              borderColor: active
                ? settings.darkMode
                  ? theme.borderFocus
                  : theme.borderFocus
                : settings.darkMode
                  ? theme.secondaryBg
                  : theme.border,
            },
          ]}
        >
          <View style={st.cardBody}>
            <View style={st.cardHeaderRow}>
              <View style={st.cardIdentity}>
                <View
                  style={[
                    st.avatarShell,
                    {
                      borderColor: settings.darkMode
                        ? theme.secondaryBg
                        : theme.border,
                      backgroundColor: settings.darkMode
                        ? theme.secondaryBg
                        : theme.secondaryBg,
                    },
                  ]}
                >
                  {avatarUrl ? (
                    <ExpoImage source={{ uri: avatarUrl }} style={st.avatarImage} contentFit="cover" />
                  ) : (
                    <Ionicons name={iconName} size={21} color={palette.textPrimary} />
                  )}
                </View>
                <View style={st.cardNameBlock}>
                  <Text style={[st.cardLabel, { color: palette.textSecondary }]}>{label}</Text>
                  <Text style={[st.cardName, { color: palette.textPrimary }]}>{name}</Text>
                </View>
              </View>
              <View
                style={[
                  st.cardStatusPill,
                  {
                    backgroundColor: settings.darkMode
                      ? theme.secondaryBg
                      : theme.secondaryBg,
                    borderColor: settings.darkMode
                      ? theme.border
                      : theme.border,
                  },
                ]}
              >
                <Text style={[st.cardStatusText, { color: palette.textPrimary }]}>{status}</Text>
              </View>
            </View>

            <View style={st.cardFooterRow}>
              <View>
                <Text style={[st.cardMetaLabel, { color: palette.textSecondary }]}>WALLS LEFT</Text>
                <Text style={[st.cardMetaValue, { color: palette.textPrimary }]}>{wallsRemaining}</Text>
              </View>
              <View>
                <Text style={[st.cardMetaLabel, { color: palette.textSecondary }]}>STATUS</Text>
                <Text style={[st.cardMetaValue, { color: palette.textPrimary }]}>{active ? "LIVE" : "WAITING"}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderActivePlayerCard = ({
    label,
    name,
    status,
    wallsRemaining,
    palette,
    avatarUrl,
    iconName,
    canAct,
    timeValue,
    showTime,
    onMoveMode,
    onWallMode,
    onConfirm,
    mirrored,
  }: {
    label: string;
    name: string;
    status: string;
    wallsRemaining: number;
    palette: { textPrimary: string; textSecondary: string };
    avatarUrl?: string | null;
    iconName: keyof typeof Ionicons.glyphMap;
    canAct: boolean;
    timeValue?: string;
    showTime: boolean;
    onMoveMode: () => void;
    onWallMode: () => void;
    onConfirm: () => void;
    mirrored?: boolean;
  }) => {
    const cardShellStyle = [canAct && st.cardGlowWrap, mirrored && st.cardMirrored];
    const moveActive = canAct && actionMode === "move";
    const wallActive = canAct && actionMode === "wall";
    const confirmEnabled = canAct && wallActive;
    const controlAccentColor = canAct ? theme.accent : null;
    const controlBorderColor = controlAccentColor
      ? withAlpha(theme.accent, 0.5)
      : settings.darkMode
        ? theme.border
        : theme.border;
    const controlIdleBg = settings.darkMode
      ? theme.accentAlpha15
      : theme.accentAlpha15;
    const controlActiveBg = theme.accent;
    const controlIdleTextColor = settings.darkMode
      ? theme.textSecondary
      : theme.textSecondary;
    const controlActiveTextColor = settings.darkMode ? theme.textPrimary : theme.textPrimary;
    const wallColorForToggle = wallActive
      ? settings.darkMode
        ? theme.textPrimary
        : theme.textPrimary
      : controlIdleTextColor;
    const confirmBg = canAct && wallActive ? controlActiveBg : controlIdleBg;
    const confirmBorder = controlBorderColor;
    const confirmText = canAct && wallActive ? controlActiveTextColor : controlIdleTextColor;

    return (
      <View style={cardShellStyle}>
        <View
          style={[
            st.playerCard,
            st.activeCard,
            canAct && st.activeCardCurrent,
            {
              backgroundColor: settings.darkMode ? theme.elevated : theme.surface,
              borderColor: canAct
                ? settings.darkMode
                  ? theme.borderFocus
                  : theme.borderFocus
                : settings.darkMode
                  ? theme.secondaryBg
                  : theme.border,
            },
          ]}
        >
          <View style={st.cardBody}>
            <View style={st.cardHeaderRow}>
              <View style={st.cardIdentity}>
                <View
                  style={[
                    st.avatarShell,
                    {
                      backgroundColor: settings.darkMode
                        ? theme.secondaryBg
                        : theme.secondaryBg,
                      borderColor: settings.darkMode
                        ? theme.secondaryBg
                        : theme.border,
                    },
                  ]}
                >
                  {avatarUrl ? (
                    <ExpoImage source={{ uri: avatarUrl }} style={st.avatarImage} contentFit="cover" />
                  ) : (
                    <Ionicons name={iconName} size={21} color={palette.textPrimary} />
                  )}
                </View>
                <View style={st.cardNameBlock}>
                  <Text style={[st.cardLabel, { color: palette.textSecondary }]}>{label}</Text>
                  <Text style={[st.cardName, { color: palette.textPrimary }]}>{name}</Text>
                </View>
              </View>
              <View style={[st.turnBadge, canAct ? st.turnBadgeActive : st.turnBadgeIdle]}>
                <Text
                  style={[
                    st.turnBadgeText,
                    {
                      color: canAct
                        ? settings.darkMode
                          ? theme.textPrimary
                          : theme.textPrimary
                        : palette.textPrimary,
                    },
                  ]}
                >
                  {status}
                </Text>
              </View>
            </View>

            <View style={st.cardFooterRow}>
              <View>
                <Text style={[st.cardMetaLabel, { color: palette.textSecondary }]}>WALLS LEFT</Text>
                <Text style={[st.cardMetaValue, { color: palette.textPrimary }]}>{wallsRemaining}</Text>
              </View>
              <View>
                <Text style={[st.cardMetaLabel, { color: palette.textSecondary }]}>TURN</Text>
                <Text style={[st.cardMetaValue, { color: palette.textPrimary }]}>{canAct ? "ACTIVE" : "WAITING"}</Text>
              </View>
              {showTime && timeValue ? (
                <View>
                  <Text style={[st.cardMetaLabel, { color: palette.textSecondary }]}>TIME</Text>
                  <Text style={[st.cardMetaValue, { color: palette.textPrimary }]}>{timeValue}</Text>
                </View>
              ) : null}
            </View>

            <View style={st.actionBarWrap}>
              <View style={st.actionToggleBar}>
                <TouchableOpacity
                  style={[
                    st.actionToggle,
                    { backgroundColor: moveActive ? controlActiveBg : controlIdleBg, borderColor: controlBorderColor },
                    moveActive && {
                      backgroundColor: controlActiveBg,
                      borderColor: controlBorderColor,
                      borderWidth: 1.5,
                    },
                    !canAct && st.actionToggleDisabled,
                  ]}
                  onPress={onMoveMode}
                  activeOpacity={0.8}
                  disabled={!canAct}
                >
                  <Ionicons
                    name="person-outline"
                    size={15}
                    color={moveActive ? controlActiveTextColor : controlIdleTextColor}
                  />
                  <Text
                    style={[
                      st.actionToggleText,
                      { color: moveActive ? controlActiveTextColor : controlIdleTextColor },
                    ]}
                  >
                    MOVE
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    st.actionToggle,
                    { backgroundColor: wallActive ? controlActiveBg : controlIdleBg, borderColor: controlBorderColor },
                    wallActive && {
                      backgroundColor: controlActiveBg,
                      borderColor: controlBorderColor,
                      borderWidth: 1.5,
                    },
                    !canAct && st.actionToggleDisabled,
                  ]}
                  onPress={onWallMode}
                  activeOpacity={0.8}
                  disabled={!canAct || wallsRemaining <= 0}
                >
                  <WallIcon
                    remaining={Math.max(0, Math.min(10, wallsRemaining))}
                    availableColor={wallColorForToggle}
                  />
                  <Text
                    style={[
                      st.actionToggleText,
                      { color: wallActive ? controlActiveTextColor : controlIdleTextColor },
                    ]}
                  >
                    WALL
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[
                  st.confirmButton,
                  { backgroundColor: confirmBg, borderColor: confirmBorder },
                  canAct && wallActive && {
                    backgroundColor: controlActiveBg,
                    borderColor: controlBorderColor,
                    borderWidth: 1.5,
                  },
                  !canAct && st.actionToggleDisabled,
                ]}
                onPress={confirmEnabled ? onConfirm : undefined}
                activeOpacity={0.85}
                disabled={!confirmEnabled}
              >
                <Text style={[st.confirmButtonText, { color: confirmText }]}>CONFIRM ACTION</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView testID="game-screen" style={st.container}>
      <View style={st.screen}>
        <ScrollView
          style={st.main}
          contentContainerStyle={st.mainScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <View style={st.content}>
            <View style={st.cardStackTop}>
              {mode === "ai"
                ? renderBasicPlayerCard({
                    label: topLabel,
                    name: topPlayer.name,
                    status: topIsActive ? "ACTIVE" : "WAITING",
                    wallsRemaining: topPlayer.wallsRemaining,
                    palette: topCardColors,
                    avatarUrl: null,
                    iconName: "hardware-chip-outline",
                    active: topIsActive,
                  })
                : useFaceToFace
                  ? renderActivePlayerCard({
                      label: topLabel,
                      name: topPlayer.name,
                      status: topSideCanAct ? "YOUR TURN" : "WAITING",
                      wallsRemaining: topPlayer.wallsRemaining,
                      palette: topCardColors,
                      avatarUrl: null,
                      iconName: "person-outline",
                      canAct: topSideCanAct,
                      showTime: isTimedLocal,
                      timeValue: isTimedLocal
                        ? formatClock(remainingSeconds[topPlayerIndex])
                        : undefined,
                      onMoveMode: handleMoveMode,
                      onWallMode: handleWallMode,
                      onConfirm: handlePlaceWall,
                      mirrored: true,
                    })
                  : renderBasicPlayerCard({
                      label: topLabel,
                      name: topPlayer.name,
                      status: "WAITING",
                      wallsRemaining: topPlayer.wallsRemaining,
                      palette: topCardColors,
                      avatarUrl: null,
                      iconName: "person-outline",
                      active: false,
                    })}
            </View>

            <View style={st.boardWrap}>
              <GameBoard
                gameState={gameState}
                actionMode={isHuman ? actionMode : "move"}
                validMoves={isHuman ? validMoves : []}
                wallPreview={wallPreview}
                onCellPress={handleCellPress}
                onIntersectionPress={handleIntersectionPress}
                boardSize={boardSize}
                flipped={flipForPlayer2}
              />
            </View>

            <View style={st.cardStackBottom}>
              {mode === "ai"
                ? renderActivePlayerCard({
                    label: bottomLabel,
                    name: bottomPlayer.name,
                    status: bottomSideCanAct ? "YOUR TURN" : "WAITING",
                    wallsRemaining: bottomPlayer.wallsRemaining,
                    palette: bottomCardColors,
                    avatarUrl: profile?.avatar_url,
                    iconName: "person-outline",
                    canAct: bottomSideCanAct,
                    showTime: isTimedLocal,
                    timeValue: isTimedLocal
                      ? formatClock(remainingSeconds[bottomPlayerIndex])
                      : undefined,
                    onMoveMode: handleMoveMode,
                    onWallMode: handleWallMode,
                    onConfirm: handlePlaceWall,
                  })
                : useFaceToFace
                  ? renderActivePlayerCard({
                      label: bottomLabel,
                      name: bottomPlayer.name,
                      status: bottomSideCanAct ? "YOUR TURN" : "WAITING",
                      wallsRemaining: bottomPlayer.wallsRemaining,
                      palette: bottomCardColors,
                      avatarUrl: null,
                      iconName: "person-outline",
                      canAct: bottomSideCanAct,
                      showTime: isTimedLocal,
                      timeValue: isTimedLocal
                        ? formatClock(remainingSeconds[bottomPlayerIndex])
                        : undefined,
                      onMoveMode: handleMoveMode,
                      onWallMode: handleWallMode,
                      onConfirm: handlePlaceWall,
                    })
                  : renderActivePlayerCard({
                      label: bottomLabel,
                      name: bottomPlayer.name,
                      status: bottomSideCanAct ? "YOUR TURN" : "WAITING",
                      wallsRemaining: bottomPlayer.wallsRemaining,
                      palette: bottomCardColors,
                      avatarUrl: null,
                      iconName: "person-outline",
                      canAct: bottomSideCanAct,
                      showTime: isTimedLocal,
                      timeValue: isTimedLocal
                        ? formatClock(remainingSeconds[bottomPlayerIndex])
                        : undefined,
                      onMoveMode: handleMoveMode,
                      onWallMode: handleWallMode,
                      onConfirm: handlePlaceWall,
                    })}
            </View>

            {isPassAndPlay && (
              <View style={st.layoutSwitchBar}>
                <TouchableOpacity
                  style={[
                    st.layoutSwitchBtn,
                    localLayoutMode === "flip-turn" && st.layoutSwitchBtnActive,
                  ]}
                  onPress={() => setLocalLayoutMode("flip-turn")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      st.layoutSwitchText,
                      localLayoutMode === "flip-turn" && st.layoutSwitchTextActive,
                    ]}
                  >
                    PASS N PLAY
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    st.layoutSwitchBtn,
                    localLayoutMode === "face-to-face" && st.layoutSwitchBtnActive,
                  ]}
                  onPress={() => setLocalLayoutMode("face-to-face")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      st.layoutSwitchText,
                      localLayoutMode === "face-to-face" && st.layoutSwitchTextActive,
                    ]}
                  >
                    FACE TO FACE
                  </Text>
                </TouchableOpacity>
              </View>
            )}

           {mode === "ai" && !gameState.gameOver && stateHistory.length > 0 && (
  <View style={st.undoBar}>
    <TouchableOpacity
      style={[
        st.undoBtn,
        !AdManager.canUndoFree(String(gameState.startTime)) && !isPremium && st.undoBtnAd,
      ]}
      onPress={handleUndo}
      activeOpacity={0.85}
    >
      <Text style={[
        st.undoBtnText,
        !AdManager.canUndoFree(String(gameState.startTime)) && !isPremium && st.undoBtnTextAd,
      ]}>
        {isPremium
          ? "UNDO LAST MOVE"
          : AdManager.canUndoFree(String(gameState.startTime))
            ? "UNDO LAST MOVE  (1 FREE)"
            : "UNDO  —  WATCH AD"}
      </Text>
    </TouchableOpacity>
  </View>
)}
          </View>
        </ScrollView>

        {message !== "" && (
          <View testID="toast-message" style={st.toast}>
            <Text style={st.toastText}>{message}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (
  theme: ReturnType<typeof getThemeColors>,
  darkMode: boolean,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    screen: { flex: 1 },
    main: {
      flex: 1,
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 10,
    },
    mainScroll: {
      flexGrow: 1,
      paddingBottom: 16,
    },
    content: {
      flex: 1,
      justifyContent: "flex-start",
      gap: 16,
    },
    cardStackTop: { flexShrink: 0 },
    cardStackBottom: { flexShrink: 0 },
    boardWrap: {
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      marginVertical: 12,
    },
    boardSection: {
      flex: 1,
      justifyContent: "center",
    },
    cardMirrored: { transform: [{ rotate: "180deg" }] },
    playerCard: {
      borderRadius: 18,
      overflow: "hidden",
      backgroundColor: theme.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: darkMode ? theme.overlay : theme.textPrimary,
      shadowOpacity: 0.2,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 5,
    },
    basicCard: { minHeight: 84 },
    basicCardActive: {
      borderColor: darkMode
        ? theme.secondaryBg
        : theme.secondaryBg,
    },
    activeCard: { minHeight: 156 },
    activeCardCurrent: {
      borderColor: withAlpha(theme.accent, 0.46),
    },
    cardGlowWrap: {
      padding: 1,
      borderRadius: 19,
      backgroundColor: theme.accentAlpha15,
      shadowColor: theme.accent,
      shadowOpacity: 0.24,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    cardStripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      zIndex: 2,
    },
    cardBody: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      gap: 8,
    },
    cardHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    cardIdentity: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flex: 1,
    },
    avatarShell: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.secondaryBg,
    },
    avatarImage: { width: "100%", height: "100%", borderRadius: 18 },
    cardNameBlock: { flex: 1 },
    cardLabel: {
      fontSize: 8,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },
    cardName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 1,
    },
    cardStatusPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.secondaryBg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardStatusText: {
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.1,
      textTransform: "uppercase",
    },
    cardFooterRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    cardMetaLabel: {
      color: theme.textSecondary,
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    cardMetaValue: {
      color: theme.textPrimary,
      fontSize: 12,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 1,
    },
    turnBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
    },
    turnBadgeActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    turnBadgeIdle: {
      backgroundColor: theme.secondaryBg,
      borderColor: theme.border,
    },
    turnBadgeText: {
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.1,
      textTransform: "uppercase",
    },
    actionBarWrap: {
      gap: 6,
    },
    actionToggleBar: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
    },
    actionToggle: {
      flexBasis: "48%",
      flexGrow: 1,
      minHeight: 34,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: 12,
      backgroundColor: theme.secondaryBg,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 10,
    },
    actionToggleActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    actionToggleDisabled: { opacity: 0.5 },
    actionToggleText: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    actionToggleTextActive: { color: theme.textPrimary },
    confirmButton: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.accent,
      width: "100%",
    },
    confirmDisabled: { opacity: 1 },
    confirmButtonText: {
      color: theme.background,
      fontSize: 12,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 0.9,
    },
    layoutSwitchBar: {
      flexDirection: "row",
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 4,
      gap: 4,
      flexWrap: "wrap",
    },
    layoutSwitchBtn: {
      flex: 1,
      minWidth: 0,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      backgroundColor: theme.secondaryBg,
    },
    layoutSwitchBtnActive: {
      backgroundColor: theme.accentAlpha15,
      borderWidth: 1,
      borderColor: theme.borderFocus,
    },
    layoutSwitchText: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
      textAlign: "center",
    },
    layoutSwitchTextActive: { color: theme.accent },
    undoBar: {
      marginTop: 8,
      gap: 8,
    },
    undoBtn: {
      borderRadius: 10,
      paddingVertical: 11,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderFocus,
      backgroundColor: theme.accentAlpha15,
    },
    undoBtnText: {
      color: theme.accent,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    undoBtnAd: {
  borderColor: theme.textSecondary,
  backgroundColor: theme.elevated,
},
undoBtnTextAd: {
  color: theme.textSecondary,
},
    toast: {
      position: "absolute",
      left: 20,
      right: 20,
      bottom: 18,
      alignItems: "center",
      zIndex: 30,
    },
    toastText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      backgroundColor: theme.elevated,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
  });
