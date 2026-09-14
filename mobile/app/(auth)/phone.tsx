import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../lib/api";
import { colors, typography, spacing, radius } from "../../lib/theme";

export default function PhoneScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 7) {
      Alert.alert("Error", "Enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const formatted = trimmed.startsWith("+") ? trimmed : `+91${trimmed}`;
      await api.post("/auth/send-otp", { phone: formatted });
      router.push({ pathname: "/(auth)/otp", params: { phone: formatted } });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="leaf" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>Bharat Fresh</Text>
          <Text style={styles.subtitle}>Fresh produce from local farms</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+91</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor={colors.outline}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Sending..." : "Send OTP"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.marginMobile,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.stackLg * 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.stackMd,
  },
  title: {
    ...typography.headlineLgMobile,
    color: colors.primary,
    marginBottom: spacing.stackSm,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  form: {
    gap: spacing.stackMd,
  },
  label: {
    ...typography.labelBold,
    color: colors.onSurface,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.stackSm,
  },
  prefix: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  prefixText: {
    ...typography.bodyLg,
    color: colors.onSurface,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...typography.bodyLg,
    color: colors.onSurface,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.stackSm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.bodyLg,
    color: colors.onPrimary,
    fontWeight: "600",
  },
  footer: {
    ...typography.bodyMd,
    color: colors.outline,
    textAlign: "center",
    marginTop: spacing.stackLg * 2,
  },
});
