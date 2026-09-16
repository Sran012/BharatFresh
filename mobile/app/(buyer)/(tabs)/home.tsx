import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../../../lib/api";
import { useLocation } from "../../../lib/useLocation";
import { SearchBar } from "../../../components/SearchBar";
import { CategoryChips } from "../../../components/CategoryChips";
import { ProductCard } from "../../../components/ProductCard";
import { VendorCard } from "../../../components/VendorCard";
import { colors, typography, spacing, radius } from "../../../lib/theme";

type Product = {
  inventoryItemId: string;
  productId: string;
  productName: string;
  category: string | null;
  sellerId: string;
  shopName: string | null;
  price: number;
  stockQty: number;
  unit: string;
  distanceKm: number;
};

type Vendor = {
  sellerId: string;
  userId: string;
  shopName: string | null;
  sellerName: string | null;
  serviceLat: number | null;
  serviceLng: number | null;
  serviceRadiusKm: number;
  rating: number;
  distanceKm: number;
};

export default function HomeScreen() {
  const { location } = useLocation();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const lat = location?.latitude ?? 28.6139;
  const lng = location?.longitude ?? 77.2090;

  const loadData = async () => {
    try {
      const [prods, vends] = await Promise.all([
        api.get<Product[]>(`/products/nearby?lat=${lat}&lng=${lng}&radius=10`),
        api.get<Vendor[]>(`/sellers/nearby?lat=${lat}&lng=${lng}&radius=10`),
      ]);
      setProducts(prods);
      setVendors(vends);
    } catch {
      // silent — will show empty state
    }
  };

  useEffect(() => {
    loadData();
  }, [lat, lng]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.productName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || p.category?.toLowerCase().includes(category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.location} numberOfLines={1}>
            {location ? "Near You" : "Set your location"}
          </Text>
        </View>
        <Text style={styles.brand}>Bharat Fresh</Text>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={colors.outline} />
        </View>
      </View>

      {/* Search */}
      <SearchBar value={search} onChangeText={setSearch} />

      {/* Hero Banner */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Fresh from local farms to your home</Text>
          <TouchableOpacity style={styles.heroBtn} onPress={() => router.push("/(buyer)/home")}>
            <Text style={styles.heroBtnText}>Order Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>
        <CategoryChips selected={category} onSelect={setCategory} />
      </View>

      {/* Vendors Near You */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vendors Near You</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>
        <View style={styles.vendorList}>
          {vendors.length === 0 ? (
            <Text style={styles.emptyText}>No vendors found nearby</Text>
          ) : (
            vendors.slice(0, 4).map((v) => (
              <VendorCard
                key={v.sellerId}
                name={v.shopName ?? v.sellerName ?? "Vendor"}
                rating={v.rating}
                distance={`${v.distanceKm.toFixed(1)} km`}
                tag="Direct from Farm"
                onPress={() => router.push(`/(buyer)/vendor/${v.sellerId}`)}
              />
            ))
          )}
        </View>
      </View>

      {/* Fresh Arrivals */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fresh Arrivals</Text>
          <Text style={styles.viewAll}>View All</Text>
        </View>
        <FlatList
          horizontal
          data={filteredProducts}
          keyExtractor={(item) => item.inventoryItemId}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productRow}
          renderItem={({ item }) => (
            <ProductCard
              name={item.productName}
              unit={item.unit}
              price={item.price}
            />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No products available</Text>}
        />
      </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.stackMd,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  location: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  brand: {
    ...typography.headlineMd,
    color: colors.primary,
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  hero: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radius.lg,
    height: 160,
    marginTop: spacing.stackMd,
    overflow: "hidden",
  },
  heroContent: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.stackMd,
  },
  heroTitle: {
    ...typography.headlineMd,
    color: colors.onPrimaryContainer,
    marginBottom: spacing.stackSm,
  },
  heroBtn: {
    backgroundColor: colors.secondaryContainer,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  heroBtnText: {
    ...typography.labelBold,
    color: colors.onSecondaryContainer,
  },
  section: {
    marginTop: spacing.stackLg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.stackSm,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  viewAll: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: "600",
  },
  vendorList: {
    gap: spacing.stackSm,
  },
  productRow: {
    gap: spacing.stackSm,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.outline,
    paddingVertical: spacing.stackLg,
  },
});
