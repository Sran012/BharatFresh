import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../lib/api";
import { colors, typography, spacing, radius } from "../../../lib/theme";

type OrderDetail = {
  assignmentId: string;
  status: string;
  acceptedAt: string;
  productName: string;
  quantity: number;
  unit: string;
  preferredPrice: number | null;
  buyer: {
    name: string | null;
    phone: string;
    lat: number;
    lng: number;
  };
  seller: {
    name: string | null;
    phone: string;
    shopName: string | null;
    lat: number | null;
    lng: number | null;
  };
};

const STATUS_STEPS = ["accepted", "preparing", "out_for_delivery", "delivered"];

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
      return colors.error;
    default:
      return colors.outline;
  }
};

const statusLabel = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get<OrderDetail>(`/orders/${id}`)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const openMaps = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Detail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Product Info */}
        <View style={styles.productCard}>
          <View style={styles.productIcon}>
            <Ionicons name="leaf" size={28} color={colors.primaryContainer} />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{order.productName}</Text>
            <Text style={styles.productQty}>
              {order.quantity} {order.unit}
              {order.preferredPrice ? ` · ₹${order.preferredPrice}` : ""}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(order.status) + "20" }]}>
            <Text style={[styles.statusText, { color: statusColor(order.status) }]}>
              {statusLabel(order.status)}
            </Text>
          </View>
        </View>

        {/* Status Timeline */}
        <View style={styles.timelineCard}>
          <Text style={styles.cardTitle}>Order Status</Text>
          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i <= currentStep;
            const isCurrent = i === currentStep;
            return (
              <View key={step} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      isCompleted && styles.timelineDotActive,
                      isCurrent && styles.timelineDotCurrent,
                    ]}
                  />
                  {i < STATUS_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        i < currentStep && styles.timelineLineActive,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.timelineLabel,
                    isCompleted && styles.timelineLabelActive,
                    !isCompleted && styles.timelineLabelInactive,
                  ]}
                >
                  {statusLabel(step)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Seller Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Seller Details</Text>
          <View style={styles.infoRow}>
            <Ionicons name="storefront" size={18} color={colors.primary} />
            <Text style={styles.infoLabel}>Shop</Text>
            <Text style={styles.infoValue}>{order.seller.shopName ?? "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={18} color={colors.primary} />
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{order.seller.name ?? "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call" size={18} color={colors.primary} />
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={[styles.infoValue, styles.phoneLink]} onPress={() => Linking.openURL(`tel:${order.seller.phone}`)}>
              {order.seller.phone}
            </Text>
          </View>
        </View>

        {/* Location */}
        {order.seller.lat && order.seller.lng && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Location</Text>
            <View style={styles.locationInfo}>
              <View style={styles.locationPin}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <Text style={styles.locationText}>Your location</Text>
              </View>
              <Ionicons name="arrow-down" size={16} color={colors.outline} />
              <View style={styles.locationPin}>
                <Ionicons name="storefront" size={20} color={colors.secondary} />
                <Text style={styles.locationText}>Seller location</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => openMaps(order.seller.lat!, order.seller.lng!, order.seller.shopName ?? "Seller")}
            >
              <Ionicons name="map" size={18} color={colors.onPrimary} />
              <Text style={styles.mapBtnText}>Open in Google Maps</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorText: {
    ...typography.bodyLg,
    color: colors.outline,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: spacing.marginMobile,
    backgroundColor: colors.surfaceContainerLowest,
  },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  content: {
    padding: spacing.marginMobile,
    paddingBottom: spacing.stackLg * 3,
    gap: spacing.stackMd,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackMd,
    gap: spacing.stackSm,
  },
  productIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  productQty: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  statusText: {
    ...typography.labelBold,
  },
  timelineCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackMd,
  },
  cardTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.stackMd,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.stackSm,
  },
  timelineLeft: {
    alignItems: "center",
    width: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 2,
    borderColor: colors.outlineVariant,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineDotCurrent: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: colors.outlineVariant,
    marginTop: 4,
  },
  timelineLineActive: {
    backgroundColor: colors.primary,
  },
  timelineLabel: {
    ...typography.bodyLg,
    paddingVertical: 0,
    lineHeight: 16,
    marginTop: -1,
  },
  timelineLabelActive: {
    color: colors.onSurface,
    fontWeight: "600",
  },
  timelineLabelInactive: {
    color: colors.outline,
  },
  infoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackMd,
    gap: spacing.stackSm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.stackSm,
  },
  infoLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    width: 50,
  },
  infoValue: {
    ...typography.bodyLg,
    color: colors.onSurface,
    fontWeight: "500",
    flex: 1,
  },
  phoneLink: {
    color: colors.primary,
    fontWeight: "600",
  },
  locationInfo: {
    alignItems: "center",
    gap: 4,
    marginBottom: spacing.stackSm,
  },
  locationPin: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    gap: 8,
  },
  mapBtnText: {
    ...typography.bodyLg,
    color: colors.onPrimary,
    fontWeight: "600",
  },
});
