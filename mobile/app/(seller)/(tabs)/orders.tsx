import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../lib/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, radius } from "../../../lib/theme";

type MarketRequest = {
  requestItemId: string;
  requestId: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  preferredPrice: number | null;
  buyerLat: number;
  buyerLng: number;
  expiresAt: string;
  distanceKm: number;
};

type SellerOrder = {
  assignmentId: string;
  status: string;
  acceptedAt: string;
  productName: string;
  quantity: number;
  unit: string;
  buyerName: string | null;
  buyerPhone: string;
  buyerLocation: { lat: number; lng: number };
};

export default function SellerOrdersScreen() {
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<MarketRequest[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "active">("requests");

  const loadData = useCallback(async () => {
    try {
      const [reqsData, ordersData] = await Promise.all([
        api.get<MarketRequest[]>("/seller/requests"),
        api.get<SellerOrder[]>("/orders/seller"),
      ]);
      setRequests(reqsData);
      setOrders(ordersData.filter((o) => o.status === "pending" || o.status === "confirmed"));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAccept = async (item: MarketRequest) => {
    try {
      await api.post(`/seller/requests/${item.requestItemId}/accept`);
      setRequests((prev) => prev.filter((r) => r.requestItemId !== item.requestItemId));
      loadData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleIgnore = (item: MarketRequest) => {
    setRequests((prev) => prev.filter((r) => r.requestItemId !== item.requestItemId));
  };

  const openMaps = (lat: number, lng: number) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "#ff9800";
      case "confirmed": return colors.primary;
      case "delivered": return "#2e7d32";
      default: return colors.outline;
    }
  };

  const activeOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed");

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.screenTitle, { paddingTop: insets.top + 16 }]}>Orders</Text>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "requests" && styles.tabActive]}
          onPress={() => setActiveTab("requests")}
        >
          <Text style={[styles.tabText, activeTab === "requests" && styles.tabTextActive]}>
            Requests ({requests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.tabActive]}
          onPress={() => setActiveTab("active")}
        >
          <Text style={[styles.tabText, activeTab === "active" && styles.tabTextActive]}>
            Active ({activeOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <>
          {requests.length === 0 ? (
            <Text style={styles.emptyText}>No pending requests</Text>
          ) : (
            requests.map((item) => (
              <View key={item.requestItemId} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.productBadge}>
                    <Ionicons name="leaf" size={14} color={colors.primary} />
                    <Text style={styles.productName}>{item.productName}</Text>
                  </View>
                  <View style={styles.distanceBadge}>
                    <Ionicons name="navigate" size={12} color={colors.primary} />
                    <Text style={styles.distanceText}>{item.distanceKm.toFixed(1)} km</Text>
                  </View>
                </View>

                <View style={styles.requestDetails}>
                  <Text style={styles.detailLabel}>Qty: {item.quantity} {item.unit}</Text>
                  {item.preferredPrice && (
                    <Text style={styles.detailLabel}>Budget: ₹{item.preferredPrice}/{item.unit}</Text>
                  )}
                  <Text style={styles.detailLabel}>
                    Expires: {new Date(item.expiresAt).toLocaleTimeString()}
                  </Text>
                </View>

                <View style={styles.requestActions}>
                  <TouchableOpacity style={styles.ignoreBtn} onPress={() => handleIgnore(item)}>
                    <Text style={styles.ignoreBtnText}>Ignore</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
                    <Text style={styles.acceptBtnText}>Accept Order</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      )}

      {/* Active Orders Tab */}
      {activeTab === "active" && (
        <>
          {activeOrders.length === 0 ? (
            <Text style={styles.emptyText}>No active orders</Text>
          ) : (
            activeOrders.map((order) => (
              <View key={order.assignmentId} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.productName}>{order.productName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + "20" }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <Text style={styles.detailLabel}>Qty: {order.quantity} {order.unit}</Text>
                  <Text style={styles.detailLabel}>Buyer: {order.buyerName ?? "Guest"}</Text>
                  <Text style={styles.detailLabel}>Phone: {order.buyerPhone}</Text>
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={styles.navigateBtn}
                    onPress={() => openMaps(order.buyerLocation.lat, order.buyerLocation.lng)}
                  >
                    <Ionicons name="navigate" size={16} color={colors.onPrimary} />
                    <Text style={styles.navigateBtnText}>Navigate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => Linking.openURL(`tel:${order.buyerPhone}`)}
                  >
                    <Ionicons name="call" size={16} color={colors.primary} />
                    <Text style={styles.callBtnText}>Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.marginMobile, paddingBottom: spacing.stackLg * 4 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  screenTitle: {
    ...typography.headlineLgMobile,
    color: colors.onSurface,
    marginBottom: spacing.stackMd,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.stackMd,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.full,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.onPrimary,
    fontWeight: "600",
  },
  requestCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackMd,
    marginBottom: spacing.stackSm,
    gap: spacing.stackSm,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  productName: {
    ...typography.bodyLg,
    color: colors.onSurface,
    fontWeight: "600",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryContainer + "30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  distanceText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: "500",
  },
  requestDetails: { gap: 4 },
  detailLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  requestActions: {
    flexDirection: "row",
    gap: spacing.stackSm,
    marginTop: spacing.stackSm,
  },
  ignoreBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  ignoreBtnText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    ...typography.bodyMd,
    color: colors.onPrimary,
    fontWeight: "600",
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
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.labelBold,
    fontSize: 11,
    textTransform: "capitalize",
  },
  orderDetails: { gap: 4 },
  orderActions: {
    flexDirection: "row",
    gap: spacing.stackSm,
    marginTop: spacing.stackSm,
  },
  navigateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  navigateBtnText: {
    ...typography.bodyMd,
    color: colors.onPrimary,
    fontWeight: "600",
  },
  callBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  callBtnText: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: "600",
  },
  emptyText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: spacing.stackLg * 2,
  },
});
