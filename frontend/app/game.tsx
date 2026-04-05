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
import AchievementToast from "../src/components/AchievementToast";
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

function getCardTextPalette(playerColor: string) {
  const rgb = hexToRgb(playerColor);
  if (!rgb) {
    return { textPrimary: "#111111", textSecondary: "rgba(17, 17, 17, 0.72)" };
  }
  const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  if (luminance > 0.48) {
    return { textPrimary: "#111111", textSecondary: "rgba(17, 17, 17, 0.72)" };
  }
  return { textPrimary: "#F8F6F2", textSecondary: "rgba(248, 246, 242, 0.78)" };
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
  const theme = getThemeColors(settings.darkMode);
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
    (params.p1Name as string) || profile?.username || "ARCHITECT_X";
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
  const [showLogPopup, setShowLogPopup] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<string[]>([]);
  const [localLayoutMode, setLocalLayoutMode] =
    useState<LocalLayoutMode>("flip-turn");
  const [remainingSeconds, setRemainingSeconds] = useState<[number, number]>(
    () => [localTimeSec, localTimeSec],
  );
  const gameOverHandled = useRef(false);
  const moveCountRef = useRef(0);
  const resumeHydratedRef = useRef(false);
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
  }, [shouldResume, storeSavedGame]);

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
  }, [gameState.currentPlayer, gameState.gameOver, mode, difficulty, addLog]);

  useEffect(() => {
    if (!isTimedLocal || gameState.gameOver) return;

    const activePlayer = gameState.currentPlayer;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev[activePlayer] <= 0) return prev;

        const next: [number, number] = [...prev] as [number, number];
        next[activePlayer] = Math.max(0, next[activePlayer] - 1);

        if (next[activePlayer] === 0) {
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
      }
      recordWallsPlaced(gameState.wallsPlaced[0] + gameState.wallsPlaced[1]);
      incrementAdCounter();
      incrementMatchCount();

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
              winner_index: gameState.winner,
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
                setAchievementQueue(newAchievements);
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
      };

      const saveAndRouteLocalGameOver = async () => {
        const durationSec = Math.floor(
          (Date.now() - gameState.startTime) / 1000,
        );
        await StorageService.set(StorageService.KEYS.LAST_GAME_EXPORT, {
          mode,
          difficulty,
          startTime: gameState.startTime,
          durationSec,
          winner: gameState.winner,
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

        router.replace({ pathname: "/game-over", params: endParams } as never);
      };

      if (mode === "local") {
        saveAndRouteLocalGameOver();
        return;
      }

      setTimeout(() => {
        if (shouldShowAd() || storeShowAd(isPremium)) {
          router.replace({
            pathname: "/ad-interstitial",
            params: {
              returnTo:
                mode === "ai" && gameState.winner !== 0
                  ? "/defeat"
                  : "/victory",
              ...endParams,
            },
          } as never);
        } else {
          const destination =
            mode === "ai" && gameState.winner !== 0 ? "/defeat" : "/victory";
          router.replace({ pathname: destination, params: endParams } as never);
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
    incrementAdCounter,
    incrementMatchCount,
    isPremium,
    localTimeSec,
    mode,
    moveLog,
    recordGame,
    recordLoss,
    recordWallsPlaced,
    recordWin,
    remainingSeconds,
    router,
    shouldShowAd,
    stats,
    storeShowAd,
    user,
  ]);

  const notifyTurnChange = useCallback(() => {
    void FeedbackService.impact();
  }, []);

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (gameState.gameOver || aiThinking || actionMode !== "move") return;
      if (mode === "ai" && gameState.currentPlayer === 1) return;
      if (!validMoves.some((m) => m.row === row && m.col === col)) return;
      const from = gameState.players[gameState.currentPlayer].position;
      const activeName = gameState.players[gameState.currentPlayer].name;
      addLog(
        `${activeName} Move`,
        `${posToNotation(from.row, from.col)} \u2192 ${posToNotation(row, col)}`,
      );
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
    const activeName = gameState.players[gameState.currentPlayer].name;
    addLog(
      `${activeName} Wall`,
      `${posToNotation(wallPreview.row, wallPreview.col)}-${wallPreview.orientation[0].toUpperCase()}`,
    );
    const ns = applyWall(gameState, wallPreview);
    setGameState(ns);
    setSelectedIntersection(null);
    setWallPreview(null);
    setActionMode("move");
    void FeedbackService.impact();
    if (mode === "local" && !ns.gameOver) notifyTurnChange();
  }, [wallPreview, gameState, mode, notifyTurnChange, addLog, showToast]);

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
  const topPlayerColor = topPlayerIndex === 0 ? theme.player1 : theme.player2;
  const bottomPlayerColor =
    bottomPlayerIndex === 0 ? theme.player1 : theme.player2;
  const topIsActive = cp === topPlayerIndex;
  const bottomIsActive = cp === bottomPlayerIndex;
  const topCardColors = getCardTextPalette(topPlayerColor);
  const bottomCardColors = getCardTextPalette(bottomPlayerColor);
  const topCardBg = topPlayerColor;
  const bottomCardBg = bottomPlayerColor;
  const inactiveCardStyle = {
    backgroundColor: theme.elevated,
    borderColor: theme.border,
    borderWidth: 1,
  };
  const cardWallAvailableColor = "#E96A00";
  const cardWallUsedColor = "rgba(233, 106, 0, 0.26)";
  const topLabel = isPassAndPlay ? `PLAYER ${topPlayerIndex + 1}` : "OPPONENT";
  const bottomLabel = isPassAndPlay ? `PLAYER ${bottomPlayerIndex + 1}` : "YOU";
  const showPlayerAvatar =
    mode === "ai" && bottomLabel === "YOU" && !!profile?.avatar_url;
  const topSideCanAct =
    !useFaceToFace ||
    (!gameState.gameOver && !aiThinking && cp === topPlayerIndex);
  const bottomSideCanAct =
    !useFaceToFace ||
    (!gameState.gameOver && !aiThinking && cp === bottomPlayerIndex);
  const reservedUiHeight = useFaceToFace ? 340 : 280;
  const boardSize = Math.max(250, Math.min(sw - 20, sh - reservedUiHeight));

  return (
    <SafeAreaView testID="game-screen" style={st.container}>
      <View style={st.main}>
        <View style={st.topNavRow}>
          <TouchableOpacity
            testID="game-back-btn"
            style={st.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Top Player Info */}
        <View
          style={[
            st.infoCard,
            st.topCard,
            st.playerCard,
            topIsActive
              ? {
                  backgroundColor: topCardBg,
                  borderColor: withAlpha(topPlayerColor, 0.42),
                  borderWidth: 1.2,
                }
              : inactiveCardStyle,
            useFaceToFace && st.topSideInverted,
          ]}
        >
          <View
            style={[st.playerPinstripe, { backgroundColor: topPlayerColor }]}
          />
          <View style={st.infoRow}>
            <View
              style={[
                st.avatarShell,
                {
                  backgroundColor: topIsActive
                    ? withAlpha(topPlayerColor, 0.34)
                    : theme.secondaryBg,
                  borderColor: topIsActive ? topPlayerColor : theme.borderFocus,
                },
              ]}
            >
              <Ionicons
                name="person"
                size={24}
                color={topIsActive ? topCardColors.textPrimary : topPlayerColor}
              />
            </View>
            <View style={st.infoMid}>
              <Text
                style={[
                  st.infoLabel,
                  {
                    color: topIsActive
                      ? topCardColors.textSecondary
                      : theme.textSecondary,
                  },
                ]}
              >
                {topLabel}
                {cp === topPlayerIndex ? " (ACTIVE)" : ""}
              </Text>
              <Text
                style={[
                  st.infoName,
                  topIsActive && { color: topCardColors.textPrimary },
                ]}
              >
                {topPlayer.name}
              </Text>
              {isTimedLocal ? (
                <View style={st.infoMeta}>
                  <Text
                    style={[
                      st.infoMetaLabel,
                      topIsActive && { color: topCardColors.textSecondary },
                    ]}
                  >
                    TIME LEFT
                  </Text>
                  <Text
                    style={[
                      st.infoMetaValue,
                      topIsActive && { color: topCardColors.textPrimary },
                    ]}
                  >
                    {formatClock(remainingSeconds[topPlayerIndex])}
                  </Text>
                </View>
              ) : (
                <View style={st.infoMeta}>
                  <Text
                    style={[
                      st.infoMetaLabel,
                      topIsActive && { color: topCardColors.textSecondary },
                    ]}
                  >
                    LOCAL MATCH
                  </Text>
                </View>
              )}
            </View>
            <View style={st.wallsCol}>
              <Text
                style={[
                  st.wallsLabel,
                  topIsActive && { color: topCardColors.textSecondary },
                ]}
              >
                WALLS
              </Text>
              <WallIcon
                remaining={topPlayer.wallsRemaining}
                availableColor={cardWallAvailableColor}
                usedColor={cardWallUsedColor}
              />
              <Text
                style={[
                  st.wallsCount,
                  topIsActive && { color: topCardColors.textPrimary },
                ]}
              >
                {topPlayer.wallsRemaining}
              </Text>
            </View>
          </View>
        </View>

        {useFaceToFace && (
          <View
            style={[
              st.faceControlsTop,
              st.topSideInverted,
              !topSideCanAct && st.sideControlsDisabled,
            ]}
          >
            <View style={[st.modeToggle, st.modeToggleCompact]}>
              <TouchableOpacity
                testID="mode-move-btn-top"
                style={[
                  st.modeHalf,
                  st.modeHalfCompact,
                  actionMode === "move" && st.modeHalfActive,
                  !topSideCanAct && st.controlDisabled,
                ]}
                onPress={() => {
                  setActionMode("move");
                  setSelectedIntersection(null);
                  setWallPreview(null);
                }}
                activeOpacity={0.7}
                disabled={!topSideCanAct}
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={16}
                  color={
                    actionMode === "move" ? theme.accent : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    st.modeText,
                    actionMode === "move" && st.modeTextActive,
                  ]}
                >
                  MOVE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="mode-wall-btn-top"
                style={[
                  st.modeHalf,
                  st.modeHalfCompact,
                  actionMode === "wall" && st.modeHalfActive,
                  !topSideCanAct && st.controlDisabled,
                ]}
                onPress={() => setActionMode("wall")}
                disabled={
                  !topSideCanAct || gameState.players[cp].wallsRemaining <= 0
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="reorder-three-outline"
                  size={16}
                  color={
                    actionMode === "wall" ? theme.accent : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    st.modeText,
                    actionMode === "wall" && st.modeTextActive,
                  ]}
                >
                  WALL
                </Text>
              </TouchableOpacity>
            </View>

            {actionMode === "wall" && (
              <TouchableOpacity
                testID="confirm-btn-top"
                style={[
                  st.confirmBtn,
                  st.confirmBtnCompact,
                  (!topSideCanAct || !wallPreview) && st.confirmDisabled,
                ]}
                onPress={
                  topSideCanAct && wallPreview ? handlePlaceWall : undefined
                }
                activeOpacity={0.85}
                disabled={!topSideCanAct}
              >
                <Text style={st.confirmText}>CONFIRM ACTION</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Board */}
        <View
          style={[
            st.boardSection,
            st.boardWrap,
            flipForPlayer2 && st.boardWrapFlipped,
          ]}
        >
          <GameBoard
            gameState={gameState}
            actionMode={isHuman ? actionMode : "move"}
            validMoves={isHuman ? validMoves : []}
            wallPreview={wallPreview}
            onCellPress={handleCellPress}
            onIntersectionPress={handleIntersectionPress}
            boardSize={boardSize}
          />
        </View>

        {/* Bottom Player Info */}
        <View
          style={[
            st.infoCard,
            st.bottomCard,
            st.playerCard,
            bottomIsActive
              ? {
                  backgroundColor: bottomCardBg,
                  borderColor: withAlpha(bottomPlayerColor, 0.42),
                  borderWidth: 1.2,
                }
              : inactiveCardStyle,
          ]}
        >
          <View
            style={[st.playerPinstripe, { backgroundColor: bottomPlayerColor }]}
          />
          <View style={st.infoRow}>
            <View
              style={[
                st.avatarShell,
                {
                  backgroundColor: bottomIsActive
                    ? withAlpha(bottomPlayerColor, 0.34)
                    : theme.secondaryBg,
                  borderColor: bottomIsActive
                    ? bottomPlayerColor
                    : theme.borderFocus,
                },
              ]}
            >
              {showPlayerAvatar ? (
                <ExpoImage
                  source={{ uri: profile.avatar_url }}
                  style={st.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Ionicons
                  name="person"
                  size={24}
                  color={
                    bottomIsActive
                      ? bottomCardColors.textPrimary
                      : bottomPlayerColor
                  }
                />
              )}
            </View>
            <View style={st.infoMid}>
              <Text
                style={[
                  st.infoLabel,
                  {
                    color: bottomIsActive
                      ? bottomCardColors.textSecondary
                      : theme.textSecondary,
                  },
                ]}
              >
                {bottomLabel}
                {cp === bottomPlayerIndex ? " (ACTIVE)" : ""}
              </Text>
              <Text
                style={[
                  st.infoName,
                  bottomIsActive && { color: bottomCardColors.textPrimary },
                ]}
              >
                {bottomPlayer.name}
              </Text>
              {isTimedLocal ? (
                <View style={st.infoMeta}>
                  <Text
                    style={[
                      st.infoMetaLabel,
                      bottomIsActive && {
                        color: bottomCardColors.textSecondary,
                      },
                    ]}
                  >
                    TIME LEFT
                  </Text>
                  <Text
                    style={[
                      st.infoMetaValue,
                      bottomIsActive && { color: bottomCardColors.textPrimary },
                    ]}
                  >
                    {formatClock(remainingSeconds[bottomPlayerIndex])}
                  </Text>
                </View>
              ) : (
                <View style={st.infoMeta}>
                  <Text
                    style={[
                      st.infoMetaLabel,
                      bottomIsActive && {
                        color: bottomCardColors.textSecondary,
                      },
                    ]}
                  >
                    LOCAL MATCH
                  </Text>
                </View>
              )}
            </View>
            <View style={st.wallsCol}>
              <Text
                style={[
                  st.wallsLabel,
                  bottomIsActive && { color: bottomCardColors.textSecondary },
                ]}
              >
                WALLS
              </Text>
              <WallIcon
                remaining={bottomPlayer.wallsRemaining}
                availableColor={cardWallAvailableColor}
                usedColor={cardWallUsedColor}
              />
              <Text
                style={[
                  st.wallsCount,
                  bottomIsActive && { color: bottomCardColors.textPrimary },
                ]}
              >
                {bottomPlayer.wallsRemaining}
              </Text>
            </View>
          </View>
        </View>

        {useFaceToFace && (
          <View
            style={[
              st.faceControlsBottom,
              !bottomSideCanAct && st.sideControlsDisabled,
            ]}
          >
            <View style={[st.modeToggle, st.modeToggleCompact]}>
              <TouchableOpacity
                testID="mode-move-btn-bottom"
                style={[
                  st.modeHalf,
                  st.modeHalfCompact,
                  actionMode === "move" && st.modeHalfActive,
                  !bottomSideCanAct && st.controlDisabled,
                ]}
                onPress={() => {
                  setActionMode("move");
                  setSelectedIntersection(null);
                  setWallPreview(null);
                }}
                activeOpacity={0.7}
                disabled={!bottomSideCanAct}
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={16}
                  color={
                    actionMode === "move" ? theme.accent : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    st.modeText,
                    actionMode === "move" && st.modeTextActive,
                  ]}
                >
                  MOVE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="mode-wall-btn-bottom"
                style={[
                  st.modeHalf,
                  st.modeHalfCompact,
                  actionMode === "wall" && st.modeHalfActive,
                  !bottomSideCanAct && st.controlDisabled,
                ]}
                onPress={() => setActionMode("wall")}
                disabled={
                  !bottomSideCanAct || gameState.players[cp].wallsRemaining <= 0
                }
                activeOpacity={0.7}
              >
                <Ionicons
                  name="reorder-three-outline"
                  size={16}
                  color={
                    actionMode === "wall" ? theme.accent : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    st.modeText,
                    actionMode === "wall" && st.modeTextActive,
                  ]}
                >
                  WALL
                </Text>
              </TouchableOpacity>
            </View>

            {actionMode === "wall" && (
              <TouchableOpacity
                testID="confirm-btn-bottom"
                style={[
                  st.confirmBtn,
                  st.confirmBtnCompact,
                  (!bottomSideCanAct || !wallPreview) && st.confirmDisabled,
                ]}
                onPress={
                  bottomSideCanAct && wallPreview ? handlePlaceWall : undefined
                }
                activeOpacity={0.85}
                disabled={!bottomSideCanAct}
              >
                <Text style={st.confirmText}>CONFIRM ACTION</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* MOVE / WALL Toggle */}
        {!useFaceToFace && (
          <View style={st.bottomControlsSingle}>
            <View style={st.modeToggle}>
              <TouchableOpacity
                testID="mode-move-btn"
                style={[
                  st.modeHalf,
                  actionMode === "move" && st.modeHalfActive,
                ]}
                onPress={() => {
                  setActionMode("move");
                  setSelectedIntersection(null);
                  setWallPreview(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={16}
                  color={
                    actionMode === "move" ? theme.accent : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    st.modeText,
                    actionMode === "move" && st.modeTextActive,
                  ]}
                >
                  MOVE
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="mode-wall-btn"
                style={[
                  st.modeHalf,
                  actionMode === "wall" && st.modeHalfActive,
                ]}
                onPress={() => setActionMode("wall")}
                disabled={!isHuman || gameState.players[cp].wallsRemaining <= 0}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="reorder-three-outline"
                  size={16}
                  color={
                    actionMode === "wall" ? theme.accent : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    st.modeText,
                    actionMode === "wall" && st.modeTextActive,
                  ]}
                >
                  WALL
                </Text>
              </TouchableOpacity>
            </View>

            {actionMode === "wall" && (
              <TouchableOpacity
                testID="confirm-btn"
                style={[st.confirmBtn, !wallPreview && st.confirmDisabled]}
                onPress={wallPreview ? handlePlaceWall : undefined}
                activeOpacity={0.85}
              >
                <Text style={st.confirmText}>CONFIRM ACTION</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

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
                  localLayoutMode === "face-to-face" &&
                    st.layoutSwitchTextActive,
                ]}
              >
                FACE TO FACE
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[st.logTriggerBtn, st.bottomUtility]}
          onPress={() => setShowLogPopup(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="list" size={14} color={theme.textPrimary} />
          <Text style={st.logTriggerText}>MOVE LOG</Text>
        </TouchableOpacity>
      </View>

      {/* Achievement Toast Queue */}
      <AchievementToast
        queue={achievementQueue}
        onComplete={() => setAchievementQueue([])}
      />

      {showLogPopup && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={st.logBackdrop}
            activeOpacity={1}
            onPress={() => setShowLogPopup(false)}
          />
          <View style={st.logPopupCard}>
            <View style={st.logPopupHeader}>
              <Text style={st.sectionTitle}>LOG _ SEQUENCE</Text>
              <TouchableOpacity
                onPress={() => setShowLogPopup(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={st.logPopupList}
              showsVerticalScrollIndicator={false}
            >
              {moveLog.map((e, i) => (
                <View key={i} style={st.logRow}>
                  <Text style={st.logNum}>
                    {String(e.num).padStart(2, "0")}
                  </Text>
                  <Text style={st.logType}>{e.type}</Text>
                  <Text style={st.logDetail}>{e.detail}</Text>
                </View>
              ))}
              {moveLog.length === 0 && (
                <Text style={st.logEmpty}>No moves yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {message !== "" && (
        <View testID="toast-message" style={st.toast}>
          <Text style={st.toastText}>{message}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (
  theme: ReturnType<typeof getThemeColors>,
  darkMode: boolean,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    main: { flex: 1, paddingHorizontal: 16, paddingBottom: 8 },
    topNavRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 2,
      marginBottom: 2,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "transparent",
      borderWidth: 0,
    },
    topCard: {
      flexShrink: 0,
      marginTop: 8,
      marginBottom: -6,
      transform: [{ translateY: 14 }],
    },
    boardSection: {
      flex: 1,
      justifyContent: "center",
      marginTop: 0,
      marginBottom: 0,
    },
    boardWrap: { alignItems: "center" },
    boardWrapFlipped: { transform: [{ rotate: "180deg" }] },
    topSideInverted: { transform: [{ rotate: "180deg" }] },
    bottomCard: {
      flexShrink: 0,
      marginTop: -6,
      transform: [{ translateY: -16 }],
    },
    faceControlsTop: { flexShrink: 0, marginTop: 2 },
    faceControlsBottom: { flexShrink: 0, marginTop: 2 },
    bottomControlsSingle: { flexShrink: 0, marginTop: -8 },
    bottomUtility: { flexShrink: 0 },
    layoutSwitchBar: {
      flexDirection: "row",
      backgroundColor: theme.elevated,
      borderRadius: 10,
      padding: 4,
      marginTop: 8,
      shadowColor: darkMode ? "#FFFFFF" : "#000000",
      shadowOpacity: darkMode ? 0.12 : 0.16,
      shadowRadius: 7,
      shadowOffset: { width: 0, height: 3 },
      elevation: 4,
    },
    layoutSwitchBtn: {
      flex: 1,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: "center",
      borderWidth: 0,
      backgroundColor: darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
    },
    layoutSwitchBtnActive: {
      backgroundColor: "rgba(255,122,0,0.14)",
      borderWidth: 1.5,
      borderColor: darkMode ? "rgba(255,152,64,0.9)" : "rgba(233,106,0,0.9)",
    },
    layoutSwitchText: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.1,
    },
    layoutSwitchTextActive: { color: theme.accent },
    modeToggle: {
      flexDirection: "row",
      backgroundColor: theme.elevated,
      borderRadius: 10,
      marginTop: 4,
      padding: 2,
      gap: 2,
    },
    modeToggleCompact: { marginTop: 4 },
    modeHalf: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: "transparent",
      borderRadius: 8,
    },
    modeHalfCompact: { paddingVertical: 6 },
    modeHalfActive: {
      backgroundColor: "rgba(255,122,0,0.13)",
      borderColor: darkMode ? "rgba(255,152,64,0.65)" : "rgba(233,106,0,0.58)",
    },
    modeText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    modeTextActive: { color: theme.accent },
    confirmBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: "center",
      marginTop: 6,
    },
    confirmBtnCompact: { marginTop: 4, paddingVertical: 8 },
    confirmDisabled: { opacity: 0.5 },
    sideControlsDisabled: { opacity: 0.55 },
    controlDisabled: { opacity: 0.8 },
    confirmText: {
      color: theme.background,
      fontSize: 14,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    infoCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginTop: 0,
    },
    playerCard: { position: "relative", overflow: "hidden" },
    playerPinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2.5,
      backgroundColor: theme.accent,
    },
    infoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    avatarShell: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    avatarImage: { width: "100%", height: "100%", borderRadius: 20 },
    infoMid: { flex: 1 },
    infoLabel: {
      color: theme.textSecondary,
      fontSize: 8,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.2,
    },
    infoName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 1,
    },
    infoMeta: { flexDirection: "row", gap: 8, marginTop: 3 },
    infoMetaLabel: {
      color: theme.textSecondary,
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    infoMetaValue: {
      color: theme.textPrimary,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      marginTop: 0,
    },
    infoMetaRow: { flexDirection: "row", gap: 14, marginTop: 4 },
    wallsCol: { alignItems: "flex-end", gap: 4 },
    wallsLabel: {
      color: theme.textSecondary,
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    wallsCount: {
      color: theme.textPrimary,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    logTriggerBtn: {
      marginTop: 6,
      alignSelf: "flex-end",
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.elevated,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    logTriggerText: {
      color: theme.textPrimary,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    logBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    logPopupCard: {
      position: "absolute",
      left: 14,
      right: 14,
      top: "16%",
      bottom: "16%",
      backgroundColor: theme.elevated,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.08)",
    },
    logPopupHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    logPopupList: { flex: 1 },
    sectionTitle: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2.5,
      marginBottom: 10,
    },
    logRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      gap: 12,
    },
    logNum: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      width: 24,
    },
    logType: {
      color: theme.textPrimary,
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
      flex: 1,
    },
    logDetail: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    logEmpty: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      fontStyle: "italic",
    },
    toast: {
      position: "absolute",
      bottom: 100,
      alignSelf: "center",
      backgroundColor: theme.elevated,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 10,
      zIndex: 200,
    },
    toastText: {
      color: theme.error,
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
    },
  });
