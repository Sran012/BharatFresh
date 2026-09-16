import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { api } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, radius } from "../../../lib/theme";
import { SearchBar } from "../../../components/SearchBar";

type InventoryItem = {
  id: string;
  productId: string;
  productName: string;
  category: string | null;
  price: number;
  stockQty: number;
  unit: string;
  inStock: boolean;
  imageUrl: string | null;
  description: string | null;
};

type SellerStats = {
  todayEarnings: number;
  totalOrders: number;
};

export default function SellerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<SellerStats>({ todayEarnings: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sellerOnline, setSellerOnline] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [inventoryData, ordersData] = await Promise.all([
        api.get<InventoryItem[]>("/seller/inventory"),
        api.get<any[]>("/orders/seller"),
      ]);
      setInventory(inventoryData);

      const today = new Date().toISOString().split("T")[0];
      const todayOrders = ordersData.filter((o: any) => o.acceptedAt.startsWith(today));
      setStats({
        todayEarnings: todayOrders.reduce((sum: number, o: any) => sum + (o.totalPrice ?? 0), 0),
        totalOrders: ordersData.filter((o: any) => o.status === "pending" || o.status === "confirmed").length,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleStock = async (item: InventoryItem) => {
    try {
      await api.put(`/seller/inventory/${item.id}`, {
        inStock: !item.inStock,
        price: item.price,
        stockQty: item.stockQty,
      });
      setInventory((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, inStock: !i.inStock } : i))
      );
    } catch {
      // silent
    }
  };

  const filtered = inventory.filter((item) =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="location" size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>Bharat Fresh</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.onlineLabel}>Online</Text>
          <Switch
            value={sellerOnline}
            onValueChange={setSellerOnline}
            trackColor={{ false: colors.outlineVariant, true: colors.primary + "80" }}
            thumbColor={sellerOnline ? colors.primary : colors.outline}
          />
          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={16} color={colors.outline} />
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.earningsCard]}>
          <Text style={styles.statValue}>₹{stats.todayEarnings}</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </View>
        <View style={[styles.statCard, styles.ordersCard]}>
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
      </View>

      {/* Search */}
      <View style={{ marginBottom: spacing.stackLg }}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search your products..." />
      </View>

      {/* Inventory */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Inventory</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterBtnText}>Filters</Text>
          <Ionicons name="funnel" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>No products in inventory</Text>
      ) : (
        filtered.map((item) => (
          <View key={item.id} style={styles.inventoryCard}>
            <View style={styles.inventoryImage}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
              ) : (
                <Ionicons name="leaf" size={24} color={colors.primary} />
              )}
            </View>
            <View style={styles.inventoryInfo}>
              <Text style={styles.productName}>{item.productName}</Text>
              <Text style={styles.productMeta}>
                {item.category} • {item.unit}
              </Text>
              <Text style={styles.productPrice}>₹{item.price}/{item.unit}</Text>
            </View>
            <View style={styles.inventoryRight}>
              <Text style={[styles.stockLabel, !item.inStock && styles.stockLabelOff]}>
                {item.inStock ? "In Stock" : "Sold Out"}
              </Text>
              <Switch
                value={item.inStock}
                onValueChange={() => toggleStock(item)}
                trackColor={{ false: colors.outlineVariant, true: colors.primary + "80" }}
                thumbColor={item.inStock ? colors.primary : colors.outline}
              />
              <TouchableOpacity style={styles.editBtn}>
                <Ionicons name="pencil" size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push("/(seller)/inventory")}>
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.marginMobile, paddingBottom: spacing.stackLg * 4 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.stackMd,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { ...typography.headlineLgMobile, color: colors.onSurface },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  onlineLabel: { ...typography.bodySm, color: colors.primary },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.stackSm,
    marginBottom: spacing.stackLg,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.stackMd,
  },
  earningsCard: {
    backgroundColor: "#e8f5e9",
  },
  ordersCard: {
    backgroundColor: "#fff8e1",
  },
  statValue: {
    ...typography.headlineXl,
    color: colors.onSurface,
    fontWeight: "700",
  },
  statLabel: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.stackMd,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  filterBtnText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: "500",
  },
  inventoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackMd,
    marginBottom: spacing.stackSm,
    gap: spacing.stackMd,
  },
  inventoryImage: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  inventoryInfo: { flex: 1 },
  productName: {
    ...typography.bodyLg,
    color: colors.onSurface,
    fontWeight: "600",
  },
  productMeta: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  productPrice: {
    ...typography.labelBold,
    color: colors.primary,
    marginTop: 2,
  },
  inventoryRight: {
    alignItems: "flex-end",
    gap: spacing.stackSm,
  },
  stockLabel: {
    ...typography.labelBold,
    color: "#2e7d32",
    fontSize: 10,
  },
  stockLabelOff: {
    color: colors.error,
  },
  editBtn: {
    padding: 6,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: spacing.marginMobile,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  emptyText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: spacing.stackLg,
  },
});
