import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, radius, spacing } from "../lib/theme";

type Props = {
  name: string;
  rating: number;
  distance: string;
  tag?: string;
  imageUrl?: string;
  onPress?: () => void;
};

export function VendorCard({ name, rating, distance, tag, imageUrl, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="storefront" size={24} color={colors.primaryContainer} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <View style={styles.meta}>
          <Ionicons name="star" size={14} color={colors.secondary} />
          <Text style={styles.rating}>{rating.toFixed(1)}</Text>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.distance}>{distance}</Text>
        </View>
        {tag ? (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.outline} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackSm,
    gap: spacing.stackSm,
  },
  imageWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.bodyLg,
    fontWeight: "600",
    color: colors.onSurface,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    ...typography.bodyMd,
    fontWeight: "600",
    color: colors.onSurface,
    fontSize: 13,
  },
  dot: {
    ...typography.bodyMd,
    color: colors.outline,
  },
  distance: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontSize: 13,
  },
  tag: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  tagText: {
    ...typography.labelBold,
    color: colors.primary,
    fontSize: 10,
  },
});
