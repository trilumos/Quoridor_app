import React, { useMemo } from "react";
import { View, StyleSheet, Text, useWindowDimensions } from "react-native";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";

interface BoardCell {
  type: "empty" | "pawn1" | "pawn2" | "goal" | "highlight" | "blocked";
}

interface BoardVisualizerProps {
  cells: BoardCell[][];
  walls?: { row: number; col: number; orientation: "h" | "v" }[];
  size: number;
  title?: string;
  description?: string;
}

export function LessonBoard({
  cells,
  walls = [],
  size,
  title,
  description,
}: BoardVisualizerProps) {
  const { width, fontScale } = useWindowDimensions();
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme), [theme]);
  const isDark = settings.darkMode;

  const responsiveSize = Math.max(
    180,
    Math.min(size, width - 72 - Math.max(0, fontScale - 1) * 24),
  );
  const cellSize = responsiveSize / 9;
  const wallThickness = 3;
  const WALL_COLOR = isDark
    ? theme.wallAvailable
    : theme.wallPlaced;
  const WALL_EDGE_COLOR = isDark
    ? theme.overlay
    : theme.border;
  const HIGHLIGHT_COLOR = theme.validMove;
  const BLOCKED_COLOR = theme.errorAlpha12;

  const getCellColor = (cell: BoardCell): string => {
    switch (cell.type) {
      case "pawn1":
        return theme.accent;
      case "pawn2":
        return theme.player2;
      case "goal":
        return "transparent";
      case "highlight":
        return HIGHLIGHT_COLOR;
      case "blocked":
        return BLOCKED_COLOR;
      default:
        return "transparent";
    }
  };

  const getCellContent = (cell: BoardCell): string => {
    switch (cell.type) {
      case "pawn1":
        return "P1";
      case "pawn2":
        return "P2";
      case "goal":
        return "🚩";
      default:
        return "";
    }
  };

  const getCellTextStyle = (
    cell: BoardCell,
  ): { fontSize: number; color?: string } => {
    if (cell.type === "pawn1" || cell.type === "pawn2") {
      return { fontSize: 11, color: theme.background };
    }
    if (cell.type === "goal") {
      return { fontSize: 16 };
    }
    return { fontSize: 11 };
  };

  return (
    <View style={st.container}>
      {title && (
        <Text style={st.title} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
          {title}
        </Text>
      )}

      <View style={[st.boardContainer, { width: responsiveSize, height: responsiveSize }]}>
        {/* Grid */}
        {cells.map((row, r) =>
          row.map((cell, c) => (
            <View
              key={`${r}-${c}`}
              style={[
                st.cell,
                {
                  left: c * cellSize,
                  top: r * cellSize,
                  width: cellSize,
                  height: cellSize,
                  borderColor: theme.borderFocus,
                  borderWidth: 1,
                  backgroundColor: getCellColor(cell),
                },
              ]}
            >
              {cell.type !== "empty" && (
                <Text style={[st.cellText, getCellTextStyle(cell)]}>
                  {getCellContent(cell)}
                </Text>
              )}
            </View>
          )),
        )}

        {/* Walls */}
        {walls.map((wall, idx) => {
          if (wall.orientation === "h") {
            return (
              <View
                key={`wall-h-${idx}`}
                style={[
                  st.wall,
                  {
                    left: wall.col * cellSize,
                    top: (wall.row + 1) * cellSize - wallThickness / 2,
                    width: cellSize * 2,
                    height: wallThickness,
                    backgroundColor: WALL_COLOR,
                    borderWidth: 0.5,
                    borderColor: WALL_EDGE_COLOR,
                  },
                ]}
              />
            );
          } else {
            return (
              <View
                key={`wall-v-${idx}`}
                style={[
                  st.wall,
                  {
                    left: (wall.col + 1) * cellSize - wallThickness / 2,
                    top: wall.row * cellSize,
                    width: wallThickness,
                    height: cellSize * 2,
                    backgroundColor: WALL_COLOR,
                    borderWidth: 0.5,
                    borderColor: WALL_EDGE_COLOR,
                  },
                ]}
              />
            );
          }
        })}
      </View>

      {description && (
        <Text style={st.description} numberOfLines={4}>
          {description}
        </Text>
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { marginVertical: 12, alignItems: "center" },
    boardContainer: {
      position: "relative",
      backgroundColor: theme.surfaceLowest,
      borderRadius: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.borderFocus,
    },
    cell: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
    },
    cellText: { fontWeight: "bold" },
    wall: { position: "absolute" },
    title: {
      color: theme.accent,
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 8,
      letterSpacing: 1,
      textAlign: "center",
    },
    description: {
      color: theme.textSecondary,
      fontSize: 12,
      marginTop: 8,
      textAlign: "center",
      lineHeight: 18,
      maxWidth: "100%",
    },
  });
