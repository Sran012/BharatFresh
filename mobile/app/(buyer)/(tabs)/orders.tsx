import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, radius } from "../../../lib/theme";

type Order = {
  assignmentId: string | null;
  assignmentStatus: string | null;
  acceptedAt: string | null;
  requestItemId: string;
  requestItemStatus: string;
  productName: string;
  quantity: number;
  unit: string;
  preferredPrice: number | null;
  marketRequestId: string;
  marketRequestStatus: string;
  expiresAt: string;
  seller: {
    shopName: string | null;
    sellerName: string | null;
    phone: string;
    lat: number | null;
    lng: number | null;
  } | null;
  buyerLocation: { lat: number; lng: number };
};

const statusColor = (status: string) => {
  switch (status) {
    case "accepted":
    case "preparing":
      return colors.primary;
    case "out_for_delivery":
      return colors.secondary;
    case "delivered":
      return colors.success;
    case "cancelled":
    case "expired":
      return colors.error;
    default:
      return colors.outline;
  }
};

const statusLabel = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await api.get<Order[]>("/orders/buyer");
      setOrders(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const activeOrders = orders.filter(
    (o) =>
      o.assignmentId &&
      o.assignmentStatus &&
      !["delivered", "cancelled"].includes(o.assignmentStatus)
  );

  const pendingOrders = orders.filter(
    (o) => !o.assignmentId && o.marketRequestStatus === "pending"
  );

  const pastOrders = orders.filter(
    (o) =>
      !o.assignmentId ||
      (o.assignmentStatus && ["delivered", "cancelled"].includes(o.assignmentStatus))
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={[styles.screenTitle, { paddingTop: insets.top + 16 }]}>My Orders</Text>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Orders</Text>
          {activeOrders.map((order) => (
            <TouchableOpacity
              key={order.requestItemId}
              style={styles.orderCard}
              onPress={() => router.push(`/(buyer)/order/${order.assignmentId}`)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{order.productName}</Text>
                  <Text style={styles.productQty}>
                    {order.quantity} {order.unit}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(order.assignmentStatus!) + "20" }]}>
                  <Text style={[styles.statusText, { color: statusColor(order.assignmentStatus!) }]}>
                    {statusLabel(order.assignmentStatus!)}
                  </Text>
                </View>
              </View>
              {order.seller && (
                <View style={styles.sellerRow}>
                  <Ionicons name="storefront" size={14} color={colors.outline} />
                  <Text style={styles.sellerName}>
                    {order.seller.shopName ?? order.seller.sellerName ?? "Seller"}
                  </Text>
                  <Ionicons name="call" size={14} color={colors.primary} />
                  <Text style={styles.sellerPhone}>{order.seller.phone}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Pending Requests (no seller yet) */}
      {pendingOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waiting for Seller</Text>
          {pendingOrders.map((order) => (
            <View key={order.requestItemId} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{order.productName}</Text>
                  <Text style={styles.productQty}>
                    {order.quantity} {order.unit}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: colors.warning + "20" }]}>
                  <Text style={[styles.statusText, { color: colors.secondary }]}>
                    Pending
                  </Text>
                </View>
              </View>
              <Text style={styles.pendingHint}>
                Nearby sellers are being notified...
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Orders</Text>
          {pastOrders.map((order) => (
            <TouchableOpacity
              key={order.requestItemId}
              style={styles.orderCard}
              onPress={() => order.assignmentId && router.push(`/(buyer)/order/${order.assignmentId}`)}
            >
              <View style={styles.orderHeader}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{order.productName}</Text>
                  <Text style={styles.productQty}>
                    {order.quantity} {order.unit}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(order.assignmentStatus ?? order.marketRequestStatus) + "20" }]}>
                  <Text style={[styles.statusText, { color: statusColor(order.assignmentStatus ?? order.marketRequestStatus) }]}>
                    {statusLabel(order.assignmentStatus ?? order.marketRequestStatus)}
                  </Text>
                </View>
              </View>
              {order.seller && (
                <View style={styles.sellerRow}>
                  <Ionicons name="storefront" size={14} color={colors.outline} />
                  <Text style={styles.sellerName}>
                    {order.seller.shopName ?? order.seller.sellerName ?? "Seller"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {orders.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={48} color={colors.outline} />
          <Text style={styles.emptyText}>No orders yet</Text>
          <TouchableOpacity onPress={() => router.push("/(buyer)/home")}>
            <Text style={styles.emptyLink}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  screenTitle: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: spacing.stackLg,
  },
  section: {
    marginBottom: spacing.stackLg,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.stackSm,
  },
  orderCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackMd,
    marginBottom: spacing.stackSm,
    gap: spacing.stackSm,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    ...typography.bodyLg,
    fontWeight: "600",
    color: colors.onSurface,
  },
  productQty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.labelBold,
    fontSize: 11,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingTop: spacing.stackSm,
  },
  sellerName: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  sellerPhone: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: "600",
  },
  pendingHint: {
    ...typography.bodyMd,
    color: colors.outline,
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.stackLg * 3,
    gap: spacing.stackSm,
  },
  emptyText: {
    ...typography.bodyLg,
    color: colors.outline,
  },
  emptyLink: {
    ...typography.bodyLg,
    color: colors.primary,
    fontWeight: "600",
  },
});
