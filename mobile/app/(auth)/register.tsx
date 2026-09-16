import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { colors, typography, spacing, radius } from "../../lib/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [role, setRole] = useState<"buyer" | "seller" | null>(null);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Enter your name");
      return;
    }
    if (!role) {
      Alert.alert("Error", "Select a role");
      return;
    }

    setLoading(true);
    try {
      await register({ name: name.trim(), role, shopName: shopName.trim() || undefined });
      // auth state changes and root layout redirects
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Complete Profile</Text>
      <Text style={styles.subtitle}>Tell us about yourself</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your name"
          placeholderTextColor={colors.outline}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>I am a</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleCard, role === "buyer" && styles.roleCardActive]}
            onPress={() => setRole("buyer")}
          >
            <Ionicons
              name="cart"
              size={28}
              color={role === "buyer" ? colors.onPrimary : colors.primary}
            />
            <Text style={[styles.roleText, role === "buyer" && styles.roleTextActive]}>
              Buyer
            </Text>
            <Text style={[styles.roleDesc, role === "buyer" && styles.roleDescActive]}>
              I want to buy fresh produce
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, role === "seller" && styles.roleCardActive]}
            onPress={() => setRole("seller")}
          >
            <Ionicons
              name="storefront"
              size={28}
              color={role === "seller" ? colors.onPrimary : colors.primary}
            />
            <Text style={[styles.roleText, role === "seller" && styles.roleTextActive]}>
              Seller
            </Text>
            <Text style={[styles.roleDesc, role === "seller" && styles.roleDescActive]}>
              I want to sell produce
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {role === "seller" && (
        <View style={styles.field}>
          <Text style={styles.label}>Shop Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your shop name"
            placeholderTextColor={colors.outline}
            value={shopName}
            onChangeText={setShopName}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Setting up..." : "Continue"}
        </Text>
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
    paddingTop: 60,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: spacing.stackSm,
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.stackLg * 2,
  },
  field: {
    marginBottom: spacing.stackMd,
  },
  label: {
    ...typography.labelBold,
    color: colors.onSurface,
    textTransform: "uppercase",
    marginBottom: spacing.stackSm,
  },
  input: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  roleRow: {
    flexDirection: "row",
    gap: spacing.stackSm,
  },
  roleCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
    padding: spacing.stackMd,
    alignItems: "center",
  },
  roleCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleText: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginTop: spacing.stackSm,
  },
  roleTextActive: {
    color: colors.onPrimary,
  },
  roleDesc: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    marginTop: spacing.stackSm,
  },
  roleDescActive: {
    color: colors.onPrimaryContainer,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.stackLg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.bodyLg,
    color: colors.onPrimary,
    fontWeight: "600",
  },
});
