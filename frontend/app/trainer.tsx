import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../src/theme/colors";
import { useGameContext } from "../src/storage/GameContext";
import { LessonBoard } from "../src/components/LessonBoard";

const SECTIONS = [
  {
    id: "rules",
    title: "RULES",
    icon: "book-outline",
    items: [
      {
        title: "Board Setup",
        content:
          "Quoridor is played on a 9x9 grid. Each player starts at opposite ends of the board with 10 walls each. The objective is to reach the opposite side before your opponent.",
        visual: {
          type: "boardSetup",
          boardSize: 240,
          description: "Players start at row 1 and row 9, goal is opposite row",
        },
      },
      {
        title: "Movement",
        content:
          "On your turn, you can either move your pawn one space orthogonally (up, down, left, right) or place a wall. Pawns cannot move diagonally.",
        visual: {
          type: "movement",
          boardSize: 240,
          description:
            "Player can move up, down, left, or right to adjacent cells",
        },
      },
      {
        title: "Wall Placement",
        content:
          "Walls are placed between two rows or columns and span exactly two cell widths. Walls cannot overlap or cross other walls. You must always leave at least one path to the goal for both players.",
        visual: {
          type: "wallPlacement",
          boardSize: 240,
          description: "Walls span exactly 2 cells and cannot block all paths",
        },
      },
      {
        title: "Jumping",
        content:
          "If your pawn is adjacent to your opponent, you can jump over them. If a wall or board edge blocks the jump, you can move diagonally instead.",
        visual: {
          type: "jumping",
          boardSize: 240,
          description:
            "Jump over opponent (left) or move diagonally if blocked (right)",
        },
      },
      {
        title: "Winning",
        content:
          "The first player to reach any cell on their goal row wins the game. Player 1 aims for row 1 (top), Player 2 aims for row 9 (bottom).",
        visual: {
          type: "winning",
          boardSize: 240,
          description: "Reaching goal row results in immediate victory",
        },
      },
    ],
  },
  {
    id: "strategy",
    title: "STRATEGY",
    icon: "flash-outline",
    items: [
      {
        title: "Path Efficiency",
        content:
          "Always calculate the shortest path to your goal. BFS (Breadth-First Search) is the algorithm that determines optimal routing. Make moves that shorten your path.",
        visual: {
          type: "pathEfficiency",
          boardSize: 240,
          description: "Blue = shortest path. Always minimize moves to goal",
        },
      },
      {
        title: "Wall Economy",
        content:
          "Walls are limited resources. Each wall should either significantly lengthen your opponent's path or protect your own route. Don't waste walls on minor disruptions.",
        visual: {
          type: "wallEconomy",
          boardSize: 240,
          description:
            "Left: Poor wall (minor disruption). Right: Good wall (blocks path)",
        },
      },
      {
        title: "The Corridor Trap",
        content:
          "Force your opponent into a narrow corridor where their movement options are limited. This creates opportunities for you to advance while they navigate around walls.",
        visual: {
          type: "corridorTrap",
          boardSize: 240,
          description:
            "Strategic walls create narrow pathways limiting opponent movement",
        },
      },
      {
        title: "Defensive Walls",
        content:
          "Sometimes the best wall is one that protects your own shortest path rather than blocking your opponent. Secure your route before attacking.",
        visual: {
          type: "defensiveWalls",
          boardSize: 240,
          description:
            "Walls protecting your path are as valuable as offensive walls",
        },
      },
    ],
  },
  {
    id: "advanced",
    title: "ADVANCED",
    icon: "skull-outline",
    items: [
      {
        title: "Tempo Control",
        content:
          "Each wall placement costs you a move. If you're ahead in position, advance. If you're behind, use walls strategically to catch up.",
        visual: {
          type: "tempoControl",
          boardSize: 240,
          description:
            "Ahead: Move forward. Behind: Deploy walls to gain distance",
        },
      },
      {
        title: "Endgame Theory",
        content:
          "When both players have few walls remaining, the game becomes a pure race. Position yourself so that your remaining walls can create the maximum disruption.",
        visual: {
          type: "endgame",
          boardSize: 240,
          description:
            "Late game: Limited walls, maximum positioning importance",
        },
      },
      {
        title: "Symmetry Breaking",
        content:
          "In opening positions, breaking symmetry early can give you an advantage. The first player to create an asymmetric board state often controls the tempo.",
        visual: {
          type: "symmetryBreaking",
          boardSize: 240,
          description: "Asymmetry advantages: Limits opponent predictability",
        },
      },
      {
        title: "Wall Sacrifice",
        content:
          "Sometimes placing a wall that your opponent can easily route around is worthwhile if it forces them to use an extra move, giving you a tempo advantage.",
        visual: {
          type: "wallSacrifice",
          boardSize: 240,
          description:
            "Sacrificial placement forces opponent into sub-optimal moves",
        },
      },
    ],
  },
];

export default function TrainerScreen() {
  const router = useRouter();
  const { settings } = useGameContext();
  const [activeSection, setActiveSection] = useState("rules");
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const theme = getThemeColors(settings.darkMode);
  const st = useMemo(() => createStyles(theme), [theme]);

  const section = SECTIONS.find((s) => s.id === activeSection)!;

  const renderVisualLesson = (item: any) => {
    if (!item.visual) return null;

    const { type, boardSize, description } = item.visual;

    // Helper to create empty 9x9 board
    const emptyBoard = () =>
      Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => ({ type: "empty" as const })),
      );

    switch (type) {
      case "boardSetup": {
        const board = emptyBoard();
        // Player 1 at position 5,4 (row 5, col 4, center-ish top)
        board[0][4] = { type: "pawn1" };
        // Player 2 at position 5,4 (row 8, col 4, center-ish bottom)
        board[8][4] = { type: "pawn2" };
        // Goals
        for (let c = 0; c < 9; c++) {
          board[0][c] = { type: "goal" };
          board[8][c] = { type: "goal" };
        }
        return (
          <LessonBoard
            cells={board}
            size={boardSize}
            title="Starting Position"
            description={description}
          />
        );
      }

      case "movement": {
        const board = emptyBoard();
        board[4][4] = { type: "pawn1" };
        board[3][4] = { type: "highlight" };
        board[5][4] = { type: "highlight" };
        board[4][3] = { type: "highlight" };
        board[4][5] = { type: "highlight" };
        return (
          <LessonBoard
            cells={board}
            size={boardSize}
            title="Valid Moves (Orange = Valid)"
            description={description}
          />
        );
      }

      case "wallPlacement": {
        const board = emptyBoard();
        board[4][4] = { type: "pawn1" };
        const walls = [
          { row: 2, col: 3, orientation: "h" as const },
          { row: 5, col: 5, orientation: "v" as const },
        ];
        return (
          <LessonBoard
            cells={board}
            walls={walls}
            size={boardSize}
            title="Wall Examples"
            description={description}
          />
        );
      }

      case "jumping": {
        const board = emptyBoard();
        board[4][4] = { type: "pawn1" };
        board[4][5] = { type: "pawn2" };
        board[4][6] = { type: "highlight" };
        board[3][5] = { type: "highlight" };
        board[5][5] = { type: "highlight" };
        return (
          <LessonBoard
            cells={board}
            size={boardSize}
            title="Jump & Diagonal Options"
            description={description}
          />
        );
      }

      case "winning": {
        const board = emptyBoard();
        board[0][4] = { type: "goal" };
        board[1][4] = { type: "pawn1" };
        for (let c = 0; c < 9; c++) board[0][c] = { type: "goal" };
        return (
          <LessonBoard
            cells={board}
            size={boardSize}
            title="Victory Position"
            description={description}
          />
        );
      }

      case "pathEfficiency": {
        const board = emptyBoard();
        board[4][4] = { type: "pawn1" };
        for (let c = 0; c < 9; c++) board[0][c] = { type: "goal" };
        // Show path
        board[3][4] = { type: "highlight" };
        board[2][4] = { type: "highlight" };
        board[1][4] = { type: "highlight" };
        return (
          <LessonBoard
            cells={board}
            size={boardSize}
            title="Shortest Path to Goal"
            description={description}
          />
        );
      }

      case "wallEconomy": {
        const board = emptyBoard();
        board[4][2] = { type: "pawn1" };
        board[4][6] = { type: "pawn2" };
        for (let c = 0; c < 9; c++) board[0][c] = { type: "goal" };
        const walls = [
          { row: 4, col: 3, orientation: "v" as const },
          { row: 4, col: 5, orientation: "v" as const },
        ];
        return (
          <LessonBoard
            cells={board}
            walls={walls}
            size={boardSize}
            title="Strategic Wall Placement"
            description={description}
          />
        );
      }

      case "corridorTrap": {
        const board = emptyBoard();
        board[3][4] = { type: "pawn1" };
        board[5][6] = { type: "pawn2" };
        const walls = [
          { row: 2, col: 4, orientation: "h" as const },
          { row: 4, col: 3, orientation: "v" as const },
          { row: 4, col: 5, orientation: "v" as const },
          { row: 6, col: 4, orientation: "h" as const },
        ];
        return (
          <LessonBoard
            cells={board}
            walls={walls}
            size={boardSize}
            title="Creating a Corridor"
            description={description}
          />
        );
      }

      case "defensiveWalls": {
        const board = emptyBoard();
        board[4][4] = { type: "pawn1" };
        board[4][6] = { type: "pawn2" };
        for (let c = 0; c < 9; c++) board[0][c] = { type: "goal" };
        const walls = [
          { row: 3, col: 3, orientation: "v" as const },
          { row: 3, col: 4, orientation: "v" as const },
        ];
        return (
          <LessonBoard
            cells={board}
            walls={walls}
            size={boardSize}
            title="Protecting Your Path"
            description={description}
          />
        );
      }

      case "tempoControl": {
        const board = emptyBoard();
        board[2][4] = { type: "pawn1" };
        board[6][4] = { type: "pawn2" };
        for (let c = 0; c < 9; c++) board[0][c] = { type: "goal" };
        return (
          <LessonBoard
            cells={board}
            size={boardSize}
            title="Position Advantage Control"
            description={description}
          />
        );
      }

      case "endgame": {
        const board = emptyBoard();
        board[1][4] = { type: "pawn1" };
        board[7][4] = { type: "pawn2" };
        for (let c = 0; c < 9; c++) board[0][c] = { type: "goal" };
        const walls = [{ row: 3, col: 4, orientation: "h" as const }];
        return (
          <LessonBoard
            cells={board}
            walls={walls}
            size={boardSize}
            title="Endgame with Few Walls"
            description={description}
          />
        );
      }

      case "symmetryBreaking": {
        const board = emptyBoard();
        board[4][4] = { type: "pawn1" };
        board[4][4] = { type: "pawn2" };
        const walls = [
          { row: 3, col: 2, orientation: "h" as const },
          { row: 3, col: 5, orientation: "h" as const },
        ];
        return (
          <LessonBoard
            cells={board}
            walls={walls}
            size={boardSize}
            title="Breaking Symmetry"
            description={description}
          />
        );
      }

      case "wallSacrifice": {
        const board = emptyBoard();
        board[3][4] = { type: "pawn1" };
        board[5][5] = { type: "pawn2" };
        for (let c = 0; c < 9; c++) board[0][c] = { type: "goal" };
        const walls = [
          { row: 4, col: 5, orientation: "h" as const },
          { row: 4, col: 6, orientation: "h" as const },
        ];
        return (
          <LessonBoard
            cells={board}
            walls={walls}
            size={boardSize}
            title="Sacrificial Wall"
            description={description}
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={st.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={st.backBtn}
          activeOpacity={0.6}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        <Text style={st.label}>LEARNING CENTER</Text>
        <Text style={st.heading}>TRAINER</Text>

        {/* Section Tabs */}
        <View style={st.tabs}>
          {SECTIONS.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={[st.tab, activeSection === s.id && st.tabActive]}
              onPress={() => {
                setActiveSection(s.id);
                setExpandedItem(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={s.icon as any}
                size={16}
                color={
                  activeSection === s.id
                    ? theme.background
                    : theme.textSecondary
                }
              />
              <Text
                style={[st.tabText, activeSection === s.id && st.tabTextActive]}
              >
                {s.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={st.contentArea}>
          {section.items.map((item, i) => {
            const isExpanded = expandedItem === `${section.id}-${i}`;
            return (
              <TouchableOpacity
                key={i}
                style={st.contentCard}
                onPress={() =>
                  setExpandedItem(isExpanded ? null : `${section.id}-${i}`)
                }
                activeOpacity={0.7}
              >
                {isExpanded && <View style={st.cardPinstripe} />}
                <View style={st.cardHeader}>
                  <Text style={st.cardNum}>
                    {String(i + 1).padStart(2, "0")}
                  </Text>
                  <Text style={st.cardTitle}>{item.title}</Text>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={theme.textSecondary}
                  />
                </View>
                {isExpanded && (
                  <View style={st.expandedContent}>
                    <Text style={st.cardContent}>{item.content}</Text>
                    {item.visual && (
                      <View style={st.visualContainer}>
                        {renderVisualLesson(item)}
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { paddingHorizontal: 20 },
    backBtn: { width: 44, height: 44, justifyContent: "center", marginTop: 8 },
    label: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    heading: {
      color: theme.textPrimary,
      fontSize: 32,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 4,
      marginBottom: 20,
    },
    tabs: { flexDirection: "row", gap: 8 },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: theme.elevated,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    tabActive: { backgroundColor: theme.accent },
    tabText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    tabTextActive: { color: theme.background },
    contentArea: { marginTop: 20, gap: 8 },
    contentCard: {
      backgroundColor: theme.elevated,
      borderRadius: 12,
      padding: 16,
      overflow: "hidden",
      position: "relative",
    },
    cardPinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.accent,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    cardNum: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      width: 24,
    },
    cardTitle: {
      color: theme.textPrimary,
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      flex: 1,
    },
    expandedContent: { marginTop: 12 },
    cardContent: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      lineHeight: 21,
      paddingLeft: 36,
    },
    visualContainer: { marginTop: 16, paddingLeft: 36, paddingRight: 12 },
  });
