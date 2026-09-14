import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { api } from "../../../lib/api";
import { colors, typography, spacing, radius } from "../../../lib/theme";

type VendorInfo = {
  shopName: string;
  sellerName: string;
  distanceKm: number;
  rating: number;
  lat: number;
  lng: number;
  phone: string;
};

type VendorProduct = {
  productId: string;
  productName: string;
  category: string | null;
  price: number;
  stockQty: number;
  unit: string;
  imageUrl: string | null;
};

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [vendorData, productsData] = await Promise.all([
        api.get<VendorInfo>(`/sellers/${id}`),
        api.get<VendorProduct[]>(`/products/seller/${id}`),
      ]);
      setVendor(vendorData);
      setProducts(productsData);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Vendor Info */}
      <View style={styles.vendorCard}>
        <View style={styles.vendorAvatar}>
          <Ionicons name="storefront" size={32} color={colors.primary} />
        </View>
        <Text style={styles.shopName}>{vendor?.shopName ?? "Shop"}</Text>
        <Text style={styles.sellerName}>by {vendor?.sellerName}</Text>
        <View style={styles.vendorMeta}>
          {vendor?.rating !== undefined && vendor.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#fbc02d" />
              <Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
            </View>
          )}
          <Text style={styles.distanceText}>
            📍 {vendor?.distanceKm.toFixed(1)} km away
          </Text>
        </View>
      </View>

      {/* Products */}
      <Text style={styles.sectionTitle}>Available Products ({products.length})</Text>
      {products.length === 0 ? (
        <Text style={styles.emptyText}>No products available</Text>
      ) : (
        products.map((product) => (
          <TouchableOpacity
            key={product.productId}
            style={styles.productCard}
            onPress={() => router.push(`/(buyer)/vendor/${id}`)}
          >
            <View style={styles.productImage}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.productImageStyle} />
              ) : (
                <Ionicons name="leaf" size={24} color={colors.primary} />
              )}
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.productName}</Text>
              <Text style={styles.productMeta}>{product.category} • {product.unit}</Text>
              <Text style={styles.productPrice}>₹{product.price}/{product.unit}</Text>
            </View>
            <TouchableOpacity style={styles.addBtn}>
              <Ionicons name="add-circle" size={32} color={colors.primary} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.marginMobile, paddingBottom: spacing.stackLg * 3 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 56,
    marginBottom: spacing.stackMd,
  },
  headerTitle: { ...typography.headlineMd, color: colors.onSurface },
  vendorCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackLg,
    marginBottom: spacing.stackMd,
    gap: 6,
  },
  vendorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryContainer + "30",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.stackSm,
  },
  shopName: { ...typography.headlineMd, color: colors.onSurface, textAlign: "center" },
  sellerName: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  vendorMeta: { flexDirection: "row", alignItems: "center", gap: spacing.stackSm, marginTop: 4 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#fff8e1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  ratingText: { ...typography.labelBold, color: colors.onSurface },
  distanceText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  sectionTitle: { ...typography.headlineMd, color: colors.onSurface, marginBottom: spacing.stackSm },
  productGrid: { gap: spacing.stackSm },
  emptyText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: spacing.stackLg,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackSm,
    marginBottom: spacing.stackSm,
    gap: spacing.stackSm,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  productImageStyle: { width: 56, height: 56, borderRadius: radius.md },
  productInfo: { flex: 1 },
  productName: { ...typography.bodyLg, color: colors.onSurface, fontWeight: "600" },
  productMeta: { ...typography.bodySm, color: colors.onSurfaceVariant },
  productPrice: { ...typography.labelBold, color: colors.primary, marginTop: 2 },
  addBtn: { padding: 4 },
});
