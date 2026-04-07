import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";

interface WallIconProps {
  remaining: number;
  availableColor?: string;
}

export default function WallIcon({
  remaining,
  availableColor,
}: WallIconProps) {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);
  const styles = useMemo(() => createStyles(), []);
  const wallCount = Math.max(0, remaining);
  const wallWidth = 3;
  const wallHeight = 12;
  const wallGap = 4;
  const containerWidth = wallCount > 0 ? wallCount * wallWidth + (wallCount - 1) * wallGap : 0;

  return (
    <View style={[styles.container, { width: containerWidth, height: wallHeight }]}>
      {Array.from({ length: wallCount }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.wall,
            {
              left: i * (wallWidth + wallGap),
              backgroundColor:
                availableColor || theme.wallAvailable,
            },
          ]}
        />
      ))}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      position: "relative",
    },
    wall: {
      position: "absolute",
      width: 3,
      height: 12,
      borderRadius: 1,
    },
  });
