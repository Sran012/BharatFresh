import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../../lib/api";
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

type Product = {
  id: string;
  name: string;
  category: string | null;
  defaultUnit: string;
  imageUrl: string | null;
};

export default function SellerInventoryScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newProductId, setNewProductId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newUnit, setNewUnit] = useState("kg");

  const loadInventory = useCallback(async () => {
    try {
      const data = await api.get<InventoryItem[]>("/seller/inventory");
      setInventory(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const loadProducts = async () => {
    try {
      const data = await api.get<Product[]>("/products");
      setProducts(data);
    } catch {
      // silent
    }
  };

  const handleAdd = async () => {
    if (!newProductId || !newPrice || !newStock) {
      Alert.alert("Error", "Fill all fields");
      return;
    }
    try {
      await api.post("/seller/inventory", {
        productId: newProductId,
        price: Number(newPrice),
        stockQty: Number(newStock),
        unit: newUnit,
      });
      setShowAdd(false);
      setNewProductId("");
      setNewPrice("");
      setNewStock("");
      loadInventory();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

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

  const handleDelete = (item: InventoryItem) => {
    Alert.alert("Remove", `Remove ${item.productName} from inventory?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/seller/inventory/${item.id}`);
            setInventory((prev) => prev.filter((i) => i.id !== item.id));
          } catch (err: any) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const openAdd = async () => {
    setShowAdd(true);
    await loadProducts();
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
      <Text style={styles.screenTitle}>Inventory</Text>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search inventory..." />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Products</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={18} color={colors.onPrimary} />
          <Text style={styles.addBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>No products yet. Add your first product!</Text>
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
              <Text style={styles.productMeta}>{item.category} • {item.unit}</Text>
              <Text style={styles.productPrice}>₹{item.price}/{item.unit}</Text>
              <Text style={styles.stockQty}>Stock: {item.stockQty} {item.unit}</Text>
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
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={colors.outline} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Product</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productPicker}>
              {products.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.productChip, newProductId === p.id && styles.productChipActive]}
                  onPress={() => { setNewProductId(p.id); setNewUnit(p.defaultUnit); }}
                >
                  <Text style={[styles.productChipText, newProductId === p.id && styles.productChipTextActive]}>
                    {p.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={newPrice}
              onChangeText={setNewPrice}
              placeholder="0"
              keyboardType="decimal-pad"
            />

            <Text style={styles.fieldLabel}>Stock Quantity</Text>
            <TextInput
              style={styles.input}
              value={newStock}
              onChangeText={setNewStock}
              placeholder="0"
              keyboardType="number-pad"
            />

            <Text style={styles.fieldLabel}>Unit</Text>
            <TextInput
              style={styles.input}
              value={newUnit}
              onChangeText={setNewUnit}
              placeholder="kg"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Add to Inventory</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 56,
    marginBottom: spacing.stackMd,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.stackSm,
  },
  sectionTitle: { ...typography.headlineMd, color: colors.onSurface },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  addBtnText: { ...typography.bodySm, color: colors.onPrimary, fontWeight: "600" },
  inventoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radius.md,
    padding: spacing.stackSm,
    marginBottom: spacing.stackSm,
    gap: spacing.stackSm,
  },
  inventoryImage: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  productImage: { width: 48, height: 48, borderRadius: radius.md },
  inventoryInfo: { flex: 1 },
  productName: { ...typography.bodyLg, color: colors.onSurface, fontWeight: "600" },
  productMeta: { ...typography.bodySm, color: colors.onSurfaceVariant },
  productPrice: { ...typography.labelBold, color: colors.primary, marginTop: 2 },
  stockQty: { ...typography.bodySm, color: colors.onSurfaceVariant },
  inventoryRight: { alignItems: "flex-end", gap: 4 },
  stockLabel: { ...typography.labelBold, color: "#2e7d32", fontSize: 10 },
  stockLabelOff: { color: colors.error },
  deleteBtn: { padding: 6 },
  emptyText: {
    ...typography.bodyLg,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: spacing.stackLg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.stackMd,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.stackMd,
  },
  modalTitle: { ...typography.headlineMd, color: colors.onSurface },
  fieldLabel: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: 6,
    marginTop: spacing.stackSm,
  },
  productPicker: { marginBottom: spacing.stackSm },
  productChip: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  productChipActive: {
    backgroundColor: colors.primary,
  },
  productChipText: {
    ...typography.bodySm,
    color: colors.onSurface,
  },
  productChipTextActive: {
    color: colors.onPrimary,
    fontWeight: "600",
  },
  input: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typography.bodyLg,
    color: colors.onSurface,
    marginBottom: spacing.stackSm,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.stackMd,
  },
  saveBtnText: { ...typography.bodyLg, color: colors.onPrimary, fontWeight: "600" },
});
