import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Dimensions,
  FlatList,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { api } from "../../../lib/api";
import { useLocation } from "../../../lib/useLocation";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, typography, spacing, radius } from "../../../lib/theme";
import { SearchBar } from "../../../components/SearchBar";

type Vendor = {
  sellerId: string;
  userId: string;
  shopName: string | null;
  sellerName: string | null;
  serviceLat: number | null;
  serviceLng: number | null;
  distanceKm: number;
  rating: number;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.75;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { location, loading: locLoading } = useLocation();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("near");
  const mapRef = useRef<MapView>(null);

  const loadVendors = useCallback(async () => {
    try {
      const lat = location?.latitude ?? 28.6139;
      const lng = location?.longitude ?? 77.2090;
      const data = await api.get<Vendor[]>(
        `/sellers/nearby?lat=${lat}&lng=${lng}&radius=10`
      );
      setVendors(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const filtered = vendors.filter((v) =>
    v.shopName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const initialRegion = {
    latitude: location?.latitude ?? 28.6139,
    longitude: location?.longitude ?? 77.2090,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  if (locLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="menu" size={24} color={colors.onSurface} />
          <Text style={styles.headerTitle}>Bharat Fresh</Text>
        </View>
        <View style={styles.avatarSmall}>
          <Ionicons name="person" size={16} color={colors.outline} />
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by vendor or area"
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {[
          { key: "near", label: "Near Me" },
          { key: "farm", label: "Direct Farm" },
          { key: "rated", label: "Top Rated" },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.listToggle}>
          <Ionicons name="list" size={18} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
        {filtered.map((vendor) => (
          <Marker
            key={vendor.sellerId}
            coordinate={{ latitude: vendor.serviceLat ?? 28.6139, longitude: vendor.serviceLng ?? 77.2090 }}
            onPress={() => router.push(`/(buyer)/vendor/${vendor.sellerId}`)}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerIcon}>
                <Ionicons name="leaf" size={16} color={colors.onPrimary} />
              </View>
              <Text style={styles.markerLabel}>{vendor.shopName ?? "Vendor"}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Bottom Vendor Cards */}
      <View style={styles.bottomSheet}>
        <FlatList
          data={filtered}
          keyExtractor={(v) => v.sellerId}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardList}
          renderItem={({ item: vendor }) => (
            <TouchableOpacity
              style={styles.vendorCard}
              onPress={() => router.push(`/(buyer)/vendor/${vendor.sellerId}`)}
            >
              <View style={styles.cardImage}>
                <Ionicons name="storefront" size={32} color={colors.primary} />
                {vendor.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={10} color="#fbc02d" />
                    <Text style={styles.ratingText}>{vendor.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardName}>{vendor.shopName ?? "Vendor"}</Text>
                <View style={styles.cardBadges}>
                  <View style={styles.farmBadge}>
                    <Text style={styles.farmBadgeText}>Direct from Farm</Text>
                  </View>
                </View>
                <Text style={styles.cardDistance}>
                  📍 {vendor.distanceKm.toFixed(1)} km away
                </Text>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => router.push(`/(buyer)/vendor/${vendor.sellerId}`)}
                >
                  <Text style={styles.viewBtnText}>View Produce</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No vendors found nearby</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.stackSm,
    backgroundColor: colors.surfaceContainerLowest,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.stackSm },
  headerTitle: { ...typography.headlineLgMobile, color: colors.onSurface },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: spacing.marginMobile,
    paddingBottom: spacing.stackSm,
    backgroundColor: colors.surfaceContainerLowest,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.stackSm,
    paddingHorizontal: spacing.marginMobile,
    paddingVertical: spacing.stackSm,
    backgroundColor: colors.surfaceContainerLowest,
  },
  filterChip: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primaryContainer,
  },
  filterText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: colors.onPrimary,
    fontWeight: "600",
  },
  listToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
  },
  markerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.onPrimary,
  },
  markerLabel: {
    ...typography.labelBold,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: 2,
    overflow: "hidden",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "35%",
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.stackSm,
    paddingBottom: 80,
  },
  cardList: {
    paddingHorizontal: spacing.marginMobile,
    gap: spacing.stackSm,
  },
  vendorCard: {
    width: CARD_WIDTH,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: "hidden",
  },
  cardImage: {
    height: 120,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  ratingBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  ratingText: {
    ...typography.labelBold,
    color: colors.onSurface,
    fontSize: 10,
  },
  cardContent: {
    padding: spacing.stackSm,
    gap: 6,
  },
  cardName: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  cardBadges: {
    flexDirection: "row",
    gap: 6,
  },
  farmBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  farmBadgeText: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: "500",
  },
  cardDistance: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  viewBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
  },
  viewBtnText: {
    ...typography.bodyMd,
    color: colors.onPrimary,
    fontWeight: "600",
  },
  emptyText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: spacing.stackLg,
  },
});
