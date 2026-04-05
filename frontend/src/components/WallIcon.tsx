import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";

interface WallIconProps {
  total?: number;
  remaining: number;
  availableColor?: string;
  usedColor?: string;
}

export default function WallIcon({
  total = 10,
  remaining,
  availableColor,
  usedColor,
}: WallIconProps) {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.wall,
            {
              backgroundColor:
                i < remaining
                  ? availableColor || theme.wallAvailable
                  : usedColor || theme.wallUsed,
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
      flexDirection: "row",
      gap: 3,
      alignItems: "center",
    },
    wall: {
      width: 3,
      height: 14,
      borderRadius: 1,
    },
  });
