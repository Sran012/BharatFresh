import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../lib/api";
import { QuantitySelector } from "../../../components/QuantitySelector";
import { colors, typography, spacing, radius } from "../../../lib/theme";

type CartItem = {
  id: string;
  productId: string;
  productName: string;
  category: string | null;
  quantity: number;
  unit: string;
  preferredPrice: number | null;
  note: string | null;
};

type Address = {
  id: string;
  label: string;
  fullAddress: string;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
};

export default function CartScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [cart, addrs] = await Promise.all([
        api.get<CartItem[]>("/cart"),
        api.get<Address[]>("/buyer/addresses"),
      ]);
      setItems(cart);
      setAddresses(addrs);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  const updateQuantity = async (itemId: string, newQty: number) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const removeItem = async (itemId: string) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert("Empty Cart", "Add items before placing an order");
      return;
    }

    setChecking(true);
    try {
      const result = await api.post<{
        marketRequestId: string;
        expiresAt: string;
        itemCount: number;
      }>("/orders/checkout");

      Alert.alert(
        "Order Placed!",
        `Your market request has been sent to ${result.itemCount} nearby seller(s). You'll be notified when a seller accepts.`,
        [
          {
            text: "View Orders",
            onPress: () => {
              setItems([]);
              router.push("/(buyer)/orders");
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setChecking(false);
    }
  };

  // Bill calculation (offline payment model — showing estimated totals)
  const itemTotal = items.reduce(
    (sum, item) => sum + (item.preferredPrice ?? 0) * item.quantity,
    0
  );
  const deliveryFee = 0;
  const taxes = Math.round(itemTotal * 0.05 * 100) / 100;
  const total = itemTotal + deliveryFee + taxes;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerIcon}>
          <Ionicons name="clipboard-outline" size={22} color={colors.primary} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Your Items */}
        <Text style={styles.sectionTitle}>Your Items</Text>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={48} color={colors.outline} />
            <Text style={styles.emptyText}>Your cart is empty</Text>
            <TouchableOpacity onPress={() => router.push("/(buyer)/home")}>
              <Text style={styles.emptyLink}>Browse Products</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemImage}>
                <Ionicons name="leaf" size={28} color={colors.primaryContainer} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.productName}</Text>
                <Text style={styles.itemUnit}>{item.unit}</Text>
                <Text style={styles.itemPrice}>
                  {item.preferredPrice ? `₹${item.preferredPrice}` : "Price TBD"}
                </Text>
              </View>
              <QuantitySelector
                value={item.quantity}
                onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                onDecrease={() => {
                  if (item.quantity <= 1) {
                    removeItem(item.id);
                  } else {
                    updateQuantity(item.id, item.quantity - 1);
                  }
                }}
              />
            </View>
          ))
        )}

        {/* Delivery Address */}
        {defaultAddress && (
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <Ionicons name="location" size={18} color={colors.primary} />
              <Text style={styles.addressLabel}>DELIVERY ADDRESS</Text>
              <TouchableOpacity>
                <Text style={styles.changeBtn}>Change</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addressName}>{defaultAddress.label}</Text>
            <Text style={styles.addressText}>{defaultAddress.fullAddress}</Text>
          </View>
        )}

        {!defaultAddress && (
          <TouchableOpacity style={styles.addressCard}>
            <Ionicons name="location-outline" size={18} color={colors.outline} />
            <Text style={styles.addAddressText}>Add Delivery Address</Text>
          </TouchableOpacity>
        )}

        {/* Bill Details */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{itemTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, styles.free]}>FREE</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & Charges</Text>
            <Text style={styles.billValue}>₹{taxes.toFixed(2)}</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>To Pay</Text>
            <Text style={styles.billTotalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      {items.length > 0 && (
        <View style={styles.bottomBar}>
          <View>
            <Text style={styles.bottomLabel}>Total Amount</Text>
            <Text style={styles.bottomTotal}>₹{total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, checking && styles.checkoutBtnDisabled]}
            onPress={handleCheckout}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.checkoutBtnText}>Place Order</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.onPrimary} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: spacing.marginMobile,
    backgroundColor: colors.surfaceContainerLowest,
  },
  headerTitle: {
    ...typography.headlineMd,
    color: colors.primary,
  },
  headerIcon: {
    position: "absolute",
    right: spacing.marginMobile,
    top: 56,
  },
  scroll: {
    padding: spacing.marginMobile,
    paddingBottom: 120,
  },
  sectionTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.stackMd,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackSm,
    marginBottom: spacing.stackSm,
    gap: spacing.stackSm,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    ...typography.bodyLg,
    fontWeight: "600",
    color: colors.onSurface,
  },
  itemUnit: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  itemPrice: {
    ...typography.priceDisplay,
    color: colors.primary,
  },
  addressCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackMd,
    marginTop: spacing.stackLg,
    gap: spacing.stackSm,
  },
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addressLabel: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    flex: 1,
  },
  changeBtn: {
    ...typography.bodyMd,
    color: colors.primary,
    fontWeight: "600",
  },
  addressName: {
    ...typography.bodyLg,
    fontWeight: "600",
    color: colors.onSurface,
  },
  addressText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  addAddressText: {
    ...typography.bodyLg,
    color: colors.outline,
  },
  billCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackMd,
    marginTop: spacing.stackMd,
    gap: spacing.stackSm,
  },
  billTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: 4,
  },
  billRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  billLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  billValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: "500",
  },
  free: {
    color: colors.primary,
    fontWeight: "600",
  },
  billDivider: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginVertical: 4,
  },
  billTotalLabel: {
    ...typography.bodyLg,
    fontWeight: "700",
    color: colors.onSurface,
  },
  billTotalValue: {
    ...typography.priceDisplay,
    color: colors.primary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderTopColor: colors.outlineVariant,
    borderTopWidth: 1,
    paddingHorizontal: spacing.marginMobile,
    paddingTop: 12,
    paddingBottom: 32,
  },
  bottomLabel: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  bottomTotal: {
    ...typography.priceDisplay,
    color: colors.primary,
    fontSize: 22,
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 6,
  },
  checkoutBtnDisabled: {
    opacity: 0.6,
  },
  checkoutBtnText: {
    ...typography.bodyLg,
    color: colors.onPrimary,
    fontWeight: "700",
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
