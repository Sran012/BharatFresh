import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../lib/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, radius } from "../../../lib/theme";

export default function SellerProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.screenTitle, { paddingTop: insets.top + 16 }]}>Profile</Text>

      {/* Avatar + Info */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.outline} />
        </View>
        <Text style={styles.userName}>{user?.name ?? "Seller"}</Text>
        <Text style={styles.userPhone}>{user?.phone}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="storefront" size={14} color={colors.primary} />
          <Text style={styles.roleText}>Seller Account</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Edit Profile", "Coming soon")}>
          <Ionicons name="person-outline" size={20} color={colors.onSurface} />
          <Text style={styles.menuLabel}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.outline} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Shop Settings", "Coming soon")}>
          <Ionicons name="storefront-outline" size={20} color={colors.onSurface} />
          <Text style={styles.menuLabel}>Shop Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.outline} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Help & Support", "Coming soon")}>
          <Ionicons name="help-circle-outline" size={20} color={colors.onSurface} />
          <Text style={styles.menuLabel}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.outline} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.marginMobile, paddingBottom: spacing.stackLg * 3 },
  screenTitle: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: spacing.stackLg,
  },
  avatarSection: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackLg,
    marginBottom: spacing.stackMd,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.stackSm,
  },
  userName: {
    ...typography.headlineMd,
    color: colors.onSurface,
    textAlign: "center",
  },
  userPhone: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryContainer + "30",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    marginTop: spacing.stackSm,
  },
  roleText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: "500",
  },
  menuSection: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    marginBottom: spacing.stackMd,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.stackSm,
    paddingHorizontal: spacing.stackMd,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  menuLabel: {
    ...typography.bodyLg,
    color: colors.onSurface,
    flex: 1,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.errorContainer,
    borderRadius: radius.md,
    paddingVertical: 16,
    marginTop: spacing.stackMd,
  },
  logoutText: {
    ...typography.bodyLg,
    color: colors.error,
    fontWeight: "600",
  },
});
