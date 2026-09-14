import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, radius, spacing } from "../lib/theme";

type Props = {
  name: string;
  unit: string;
  price: number;
  imageUrl?: string;
  onAdd?: () => void;
};

export function ProductCard({ name, unit, price, imageUrl, onAdd }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="leaf" size={28} color={colors.primaryContainer} />
          </View>
        )}
        <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.7}>
          <Ionicons name="add" size={20} color={colors.onSecondaryContainer} />
        </TouchableOpacity>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.unit}>Per {unit}</Text>
        <Text style={styles.price}>{price}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  imageWrap: {
    height: 110,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    padding: spacing.stackSm,
    gap: 2,
  },
  name: {
    ...typography.bodyMd,
    fontWeight: "600",
    color: colors.onSurface,
  },
  unit: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  price: {
    ...typography.priceDisplay,
    color: colors.primary,
  },
});
