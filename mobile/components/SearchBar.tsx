import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, radius, spacing } from "../lib/theme";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = "Search fresh vegetables..." }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={colors.outline} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.outline}
        value={value}
        onChangeText={onChangeText}
      />
      <Ionicons name="mic" size={20} color={colors.outline} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: spacing.stackSm,
  },
  input: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.onSurface,
    padding: 0,
  },
});
