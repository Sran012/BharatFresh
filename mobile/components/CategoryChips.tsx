import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors, typography, radius, spacing } from "../lib/theme";

const CATEGORIES = ["All", "Leafy Greens", "Root Veggies", "Fruits", "Organic", "Herbs"];

type Props = {
  selected: string;
  onSelect: (cat: string) => void;
};

export function CategoryChips({ selected, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[styles.chip, selected === cat && styles.chipActive]}
          onPress={() => onSelect(cat)}
        >
          <Text style={[styles.chipText, selected === cat && styles.chipTextActive]}>
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.stackSm,
    paddingVertical: spacing.stackSm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
  },
  chipActive: {
    backgroundColor: "#e8f5e9",
  },
  chipText: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.primary,
  },
});
