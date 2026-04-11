import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../../src/theme/colors";
import { useGameContext } from "../../src/storage/GameContext";

export default function TabLayout() {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.spaceTextSecondary,
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_700Bold",
          fontSize: 9,
          fontWeight: "700",
          letterSpacing: 1.1,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "HOME",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: "THEMES",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="color-palette-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "PROFILE",
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "SETTINGS",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rank"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
