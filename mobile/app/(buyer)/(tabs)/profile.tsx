import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, radius } from "../../../lib/theme";

type Address = {
  id: string;
  label: string;
  fullAddress: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut, refreshUser } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAddresses = useCallback(async () => {
    try {
      const data = await api.get<Address[]>("/buyer/addresses");
      setAddresses(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  const handleSaveName = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await api.put("/buyer/profile", { name: name.trim() });
      await refreshUser();
      setEditing(false);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <Text style={[styles.screenTitle, { paddingTop: insets.top + 16 }]}>Profile</Text>

      {/* Avatar + Info */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.outline} />
        </View>
        {editing ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveName}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setEditing(false); setName(user?.name ?? ""); }}>
              <Text style={styles.cancelBtn}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.userName}>{user?.name ?? "Set your name"}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Edit Profile", "Coming soon")}>
          <Ionicons name="person-outline" size={20} color={colors.onSurface} />
          <Text style={styles.menuLabel}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.outline} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("My Addresses", "Coming soon")}>
          <Ionicons name="location-outline" size={20} color={colors.onSurface} />
          <Text style={styles.menuLabel}>My Addresses</Text>
          <View style={styles.menuRight}>
            <Text style={styles.menuBadge}>{addresses.length}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.outline} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert("Notifications", "Coming soon")}>
          <Ionicons name="notifications-outline" size={20} color={colors.onSurface} />
          <Text style={styles.menuLabel}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.outline} />
        </TouchableOpacity>
      </View>

      {/* Addresses List */}
      {addresses.length > 0 && (
        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Saved Addresses</Text>
          {addresses.map((addr) => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Ionicons
                  name={addr.label === "home" ? "home" : addr.label === "work" ? "briefcase" : "location"}
                  size={18}
                  color={colors.primary}
                />
                <Text style={styles.addressLabel}>{addr.label}</Text>
                {addr.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressText}>{addr.fullAddress}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.marginMobile,
    paddingBottom: spacing.stackLg * 3,
  },
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
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.stackSm,
  },
  nameInput: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtnText: {
    ...typography.bodyMd,
    color: colors.onPrimary,
    fontWeight: "600",
  },
  cancelBtn: {
    ...typography.bodyMd,
    color: colors.outline,
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
  menuRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  menuBadge: {
    ...typography.labelBold,
    color: colors.primary,
    backgroundColor: colors.primaryContainer + "30",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  addressSection: {
    marginBottom: spacing.stackMd,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.stackSm,
  },
  addressCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackMd,
    marginBottom: spacing.stackSm,
    gap: 6,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressLabel: {
    ...typography.bodyLg,
    fontWeight: "600",
    color: colors.onSurface,
    textTransform: "capitalize",
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  defaultText: {
    ...typography.labelBold,
    color: colors.primary,
    fontSize: 10,
  },
  addressText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
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
