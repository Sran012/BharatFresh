import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, radius } from "../lib/theme";

type Props = {
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
};

export function QuantitySelector({ value, onIncrease, onDecrease, min = 1 }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.btn, value <= min && styles.btnDisabled]}
        onPress={onDecrease}
        disabled={value <= min}
      >
        <Ionicons name="remove" size={18} color={value <= min ? colors.outline : colors.primary} />
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity style={styles.btn} onPress={onIncrease}>
        <Ionicons name="add" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    gap: 12,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  value: {
    ...typography.bodyLg,
    fontWeight: "600",
    color: colors.onSurface,
    minWidth: 20,
    textAlign: "center",
  },
});
