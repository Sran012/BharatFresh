import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { colors, typography, spacing, radius } from "../../lib/theme";

export default function OtpScreen() {
  const router = useRouter();
  const { phone: paramPhone } = useLocalSearchParams<{ phone: string }>();
  const [phone, setPhone] = useState<string | null>(null);
  const { signIn } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const resolved = paramPhone || null;
    if (resolved) {
      setPhone(resolved);
    } else {
      AsyncStorage.getItem("otp_phone").then((p) => setPhone(p));
    }
  }, [paramPhone]);

  const handleVerify = async () => {
    if (!phone) {
      Alert.alert("Error", "Phone number missing. Go back and try again.");
      return;
    }
    if (code.length < 6) {
      Alert.alert("Error", "Enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn(phone!, code);
      if (result.needsRegistration) {
        router.replace({ pathname: "/(auth)/register" });
      }
      // if not needsRegistration, auth state changes and root layout redirects
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{"\n"}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="------"
          placeholderTextColor={colors.outlineVariant}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Verifying..." : "Verify"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resend} onPress={async () => {
          if (!phone) return;
          try {
            await api.post("/auth/send-otp", { phone });
            Alert.alert("Sent", "A new OTP has been sent.");
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        }}>
          <Text style={styles.resendText}>
            Didn't receive the code?{" "}
            <Text style={styles.resendLink}>Resend</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: 60,
  },
  back: {
    marginBottom: spacing.stackLg,
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
  phone: {
    fontWeight: "600",
    color: colors.onSurface,
  },
  otpInput: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 16,
    paddingVertical: 18,
    ...typography.headlineLg,
    color: colors.onSurface,
    letterSpacing: 12,
    marginBottom: spacing.stackMd,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.bodyLg,
    color: colors.onPrimary,
    fontWeight: "600",
  },
  resend: {
    marginTop: spacing.stackLg,
    alignItems: "center",
  },
  resendText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: "600",
  },
});
