import { Stack } from "expo-router";
import { AuthProvider, useAuth } from "../lib/auth";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../lib/theme";

function RootLayoutInner() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {user ? (
        user.role === "seller" ? (
          <Stack.Screen name="(seller)" />
        ) : (
          <Stack.Screen name="(buyer)" />
        )
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
