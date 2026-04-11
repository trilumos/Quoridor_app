import React, { useMemo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Position, Wall, GameState, ActionMode } from "../game/types";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";

interface GameBoardProps {
  gameState: GameState;
  actionMode: ActionMode;
  validMoves: Position[];
  wallPreview: Wall | null;
  onCellPress: (row: number, col: number) => void;
  onIntersectionPress: (row: number, col: number) => void;
  boardSize: number;
  flipped?: boolean;
}

const WALL_THICKNESS = 5;
const GRID_LINE_THICKNESS = 1.4;

const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function PawnGlow({
  x,
  y,
  size,
  color,
}: {
  x: number;
  y: number;
  size: number;
  color: string;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withSequence(
        withTiming(0.6, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    ),
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          zIndex: 8,
        },
        animatedStyle,
      ]}
    />
  );
}

export default React.memo(function GameBoard({
  gameState,
  actionMode,
  validMoves,
  wallPreview,
  onCellPress,
  onIntersectionPress,
  boardSize,
  flipped = false,
}: GameBoardProps) {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const gridLineColor = withAlpha(theme.accent, settings.darkMode ? 0.24 : 0.28);

  const { cellSize, gapSize, step } = useMemo(() => {
    const gs = Math.max(4, Math.round(boardSize / 55));
    const cs = (boardSize - 8 * gs) / 9;
    return { cellSize: cs, gapSize: gs, step: cs + gs };
  }, [boardSize]);

  const isValidMove = (r: number, c: number) =>
    validMoves.some((m) => m.row === r && m.col === c);

  const pawnSize = cellSize * 0.55;
  const glowSize = cellSize * 0.75;
  const hintDotSize = Math.max(cellSize * 0.24, 6);
  const activePlayerColor = gameState.players[gameState.currentPlayer].color;
  const validMoveDotTint = withAlpha(
    activePlayerColor,
    settings.darkMode ? 0.42 : 0.36,
  );

  const getWallStyle = (wall: Wall) => {
    if (wall.orientation === "horizontal") {
      return {
        left: wall.col * step,
        top: wall.row * step + cellSize + (gapSize - WALL_THICKNESS) / 2,
        width: 2 * cellSize + gapSize,
        height: WALL_THICKNESS,
      };
    }
    return {
      left: wall.col * step + cellSize + (gapSize - WALL_THICKNESS) / 2,
      top: wall.row * step,
      width: WALL_THICKNESS,
      height: 2 * cellSize + gapSize,
    };
  };

  // Subtle grid lines
  const gridLines = useMemo(() => {
    const lines: React.ReactNode[] = [];
    for (let r = 0; r < 8; r++) {
      lines.push(
        <View
          key={`hl-${r}`}
          style={{
            position: "absolute",
            left: 0,
            top: r * step + cellSize + gapSize / 2 - GRID_LINE_THICKNESS / 2,
            width: boardSize,
            height: GRID_LINE_THICKNESS,
            backgroundColor: gridLineColor,
          }}
        />,
      );
    }
    for (let c = 0; c < 8; c++) {
      lines.push(
        <View
          key={`vl-${c}`}
          style={{
            position: "absolute",
            left: c * step + cellSize + gapSize / 2 - GRID_LINE_THICKNESS / 2,
            top: 0,
            width: GRID_LINE_THICKNESS,
            height: boardSize,
            backgroundColor: gridLineColor,
          }}
        />,
      );
    }
    return lines;
  }, [boardSize, cellSize, gapSize, step, gridLineColor]);

  // Cell coordinate list
  const cells = useMemo(() => {
    const result: { r: number; c: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        result.push({ r, c });
      }
    }
    return result;
  }, []);

  // Pawns
  const pawns = gameState.players.map((player, i) => {
    const px = player.position.col * step + (cellSize - pawnSize) / 2;
    const py = player.position.row * step + (cellSize - pawnSize) / 2;
    const gx = player.position.col * step + (cellSize - glowSize) / 2;
    const gy = player.position.row * step + (cellSize - glowSize) / 2;
    const pawnColor = i === 0 ? theme.player1 : theme.player2;
    const glowColor = i === 0 ? theme.player1Glow : theme.player2Glow;

    return (
      <React.Fragment key={`pawn-${i}`}>
        <PawnGlow x={gx} y={gy} size={glowSize} color={glowColor} />
        <View
          testID={`pawn-${i}`}
          style={{
            position: "absolute",
            left: px,
            top: py,
            width: pawnSize,
            height: pawnSize,
            borderRadius: pawnSize / 2,
            backgroundColor: pawnColor,
            zIndex: 9,
          }}
        />
      </React.Fragment>
    );
  });

  // Intersection touch zones (wall mode)
  const intersections =
    actionMode === "wall"
      ? (() => {
          const zones: React.ReactNode[] = [];
          const touchSize = Math.max(gapSize * 3.5, 28);
          for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
              const cx = c * step + cellSize + gapSize / 2;
              const cy = r * step + cellSize + gapSize / 2;
              zones.push(
                <TouchableOpacity
                  key={`int-${r}-${c}`}
                  testID={`intersection-${r}-${c}`}
                  onPress={() => onIntersectionPress(r, c)}
                  style={{
                    position: "absolute",
                    left: cx - touchSize / 2,
                    top: cy - touchSize / 2,
                    width: touchSize,
                    height: touchSize,
                    zIndex: 10,
                  }}
                />,
              );
            }
          }
          return zones;
        })()
      : null;

  if (boardSize <= 0 || cellSize <= 0) return null;

  return (
    <View
      testID="game-board"
      style={[
        styles.board,
        {
          width: boardSize,
          height: boardSize,
          backgroundColor: theme.boardBg,
          transform: flipped ? [{ rotate: "180deg" }] : [],
        },
      ]}
    >
      {gridLines}

      {cells.map(({ r, c }) => {
        const valid = actionMode === "move" && isValidMove(r, c);
        return (
          <TouchableOpacity
            key={`c-${r}-${c}`}
            testID={`cell-${r}-${c}`}
            activeOpacity={valid ? 0.6 : 1}
            onPress={() => onCellPress(r, c)}
            style={{
              position: "absolute",
              left: c * step,
              top: r * step,
              width: cellSize,
              height: cellSize,
              borderRadius: 0,
              backgroundColor: "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {valid && (
              <View
                style={{
                  width: hintDotSize,
                  height: hintDotSize,
                  borderRadius: hintDotSize / 2,
                  backgroundColor: validMoveDotTint,
                }}
              />
            )}
          </TouchableOpacity>
        );
      })}

      {gameState.walls.map((wall, i) => {
        const ws = getWallStyle(wall);
        const wallColor =
          wall.owner !== undefined
            ? gameState.players[wall.owner].color
            : theme.accent;
        return (
          <View
            key={`wall-${i}`}
            testID={`wall-${i}`}
            style={{
              position: "absolute",
              ...ws,
              backgroundColor: wallColor,
              borderRadius: 1.5,
              zIndex: 5,
            }}
          />
        );
      })}

      {wallPreview &&
        (() => {
          const ws = getWallStyle(wallPreview);
          return (
            <View
              testID="wall-preview"
              style={{
                position: "absolute",
                ...ws,
                backgroundColor: activePlayerColor,
                opacity: 0.42,
                borderRadius: 1.5,
                zIndex: 6,
              }}
            />
          );
        })()}

      {pawns}
      {intersections}
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    borderRadius: 0,
    position: "relative",
    overflow: "hidden",
  },
});
