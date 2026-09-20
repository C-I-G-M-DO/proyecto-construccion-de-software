import { useSurtioTheme, useSurtioStyles } from '@/hooks/use-surtio-theme';
import Entypo from '@expo/vector-icons/Entypo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useCart } from '../context/cart_context';
import { useProducts } from '../context/product_context';

const SCREEN_PADDING = 16;
const CARD_GAP = 12;

export default function HomeScreen() {
  const theme = useSurtioTheme();
  const styles = useSurtioStyles(baseStyles);
  const { productos, obtenerProductos } = useProducts();
  const { agregarAlCarrito, carrito, disminuirDelCarrito } = useCart();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const [search, setSearch] = useState('');
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<any>(null);

  const background = theme.background;
  const text = theme.text;
  const card = theme.card;
  const border = theme.border;
  const primary = theme.primary;

  const cardWidth = (screenWidth - SCREEN_PADDING * 2 - CARD_GAP) / 2;

  const totalCarrito = useMemo(
    () => carrito.reduce((total, item) => total + item.cantidad, 0),
    [carrito],
  );

  const productosFiltrados = useMemo(() => {
    const busqueda = search.trim().toLowerCase();

    if (!busqueda) {
      return productos;
    }

    return productos.filter((item: any) =>
      String(item.nombre ?? '')
        .toLowerCase()
        .includes(busqueda),
    );
  }, [productos, search]);

  useFocusEffect(
    useCallback(() => {
      obtenerProductos();
    }, []),
  );

  function abrirEdicion(item: any) {
    router.push({
      pathname: '/edit_products',
      params: {
        id: item._id,
        nombre: item.nombre,
        precios: JSON.stringify(item.precios ?? []),
        cantidad: String(item.stock ?? 0),
      },
    });
  }

  function seleccionarProducto(item: any) {
    if (item.precios?.length === 1) {
      const precio = item.precios[0];

      agregarAlCarrito({
        id: `${item._id}-${precio.tipo}`,
        productoId: item._id,
        nombre: item.nombre,
        tipo: precio.tipo,
        precio: precio.valor,
        cantidad: 1,
        total: precio.valor,
        equivalencia: precio.equivalencia,
      });

      return;
    }

    setProductoSeleccionado(item);
    setShowTipoModal(true);
  }

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[styles.screen, { backgroundColor: background }]}
    >
      <Pressable onPress={() => router.replace('/home')} style={{ padding: 16 }}><Text style={{ color: primary }}>← Inicio</Text></Pressable>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, { color: text }]}>Registrar venta</Text>
          <Text style={[styles.subtitle, { color: text }]}>
            {productos.length === 1
              ? '1 producto registrado'
              : `${productos.length} productos registrados`}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            accessibilityLabel={`Abrir carrito. ${totalCarrito} artículos`}
            accessibilityRole="button"
            onPress={() => router.push('/cart')}
            style={({ pressed }) => [
              styles.headerButton,
              { borderColor: border, backgroundColor: card },
              pressed && styles.pressed,
            ]}
          >
            <Entypo name="shopping-cart" size={22} color={text} />

            {totalCarrito > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: primary }]}>
                <Text style={styles.cartBadgeText}>
                  {totalCarrito > 99 ? '99+' : totalCarrito}
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: card, borderColor: border },
        ]}
      >
        <Entypo name="magnifying-glass" size={20} color={text} />
        <TextInput
          accessibilityLabel="Buscar producto"
          autoCapitalize="none"
          clearButtonMode="while-editing"
          onChangeText={setSearch}
          placeholder="Buscar producto..."
          placeholderTextColor="#796763"
          returnKeyType="search"
          style={[styles.searchInput, { color: text }]}
          value={search}
        />
      </View>

      <FlatList
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={[
          styles.productList,
          { paddingBottom: insets.bottom + 150 },
          productosFiltrados.length === 0 && styles.emptyList,
        ]}
        contentInsetAdjustmentBehavior="automatic"
        data={productosFiltrados}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item: any) => String(item._id)}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: card, borderColor: border },
              ]}
            >
              <Entypo name="box" size={28} color={text} />
            </View>
            <Text style={[styles.emptyTitle, { color: text }]}>
              {search ? 'No encontramos productos' : 'No hay productos'}
            </Text>
            <Text style={[styles.emptyDescription, { color: text }]}>
              {search
                ? 'Prueba con otro nombre o limpia la búsqueda.'
                : 'Agrega el primer producto para comenzar tu inventario.'}
            </Text>
          </View>
        }
        numColumns={2}
        renderItem={({ item }: { item: any }) => {
          const totalEnCarrito = carrito
            .filter((producto) => producto.productoId === item._id)
            .reduce((total, producto) => total + producto.cantidad, 0);

          return (
            <TouchableOpacity
              activeOpacity={0.82}
              accessibilityHint="Mantén presionado para editar"
              accessibilityLabel={`${item.nombre}, RD$${item.precios?.[0]?.valor ?? 0}, stock ${item.stock ?? 0}`}
              accessibilityRole="button"
              onLongPress={() => abrirEdicion(item)}
              onPress={() => seleccionarProducto(item)}
              style={[
                styles.productCard,
                {
                  width: cardWidth,
                  backgroundColor: card,
                  borderColor: border,
                },
              ]}
            >
              <View style={styles.imageContainer}>
                {item.imagen?.trim() ? (
                  <Image
                    resizeMode="contain"
                    source={{ uri: item.imagen }}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Entypo name="image" size={34} color={border} />
                  </View>
                )}

                {totalEnCarrito > 0 && (
                  <View
                    style={[
                      styles.productBadge,
                      {
                        backgroundColor:
                          totalEnCarrito > 5 ? '#C0392B' : primary,
                      },
                    ]}
                  >
                    <Text style={styles.productBadgeText}>
                      {totalEnCarrito > 99 ? '99+' : totalEnCarrito}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.productInformation}>
                <Text
                  numberOfLines={2}
                  style={[styles.productName, { color: text }]}
                >
                  {item.nombre}
                </Text>
                <Text style={[styles.productPrice, { color: text }]}>
                  RD${item.precios?.[0]?.valor ?? 0}
                </Text>
                <Text style={[styles.productStock, { color: text }]}>
                  Stock: {item.stock ?? 0}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        accessibilityLabel="Agregar producto"
        accessibilityRole="button"
        onPress={() => router.push('/add_product')}
        style={({ pressed }) => [
          styles.addButton,
          {
            bottom: insets.bottom + 72,
            backgroundColor: primary,
          },
          pressed && styles.addButtonPressed,
        ]}
      >
        <Entypo name="plus" size={30} color="#FFFFFF" />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setShowTipoModal(false)}
        transparent
        visible={showTipoModal}
      >
        <Pressable
          onPress={() => setShowTipoModal(false)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[styles.modalCard, { backgroundColor: card }]}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: text }]}>
              Selecciona una presentación
            </Text>
            <Text style={[styles.modalProductName, { color: text }]}>
              {productoSeleccionado?.nombre}
            </Text>

            {productoSeleccionado?.precios?.map((precio: any) => {
              const itemEnCarrito = carrito.find(
                (producto) =>
                  producto.productoId === productoSeleccionado._id &&
                  producto.tipo === precio.tipo,
              );

              return (
                <View
                  key={precio.tipo}
                  style={[styles.priceOption, { borderColor: border }]}
                >
                  <View style={styles.priceHeader}>
                    <Text style={[styles.priceType, { color: text }]}>
                      {String(precio.tipo).toUpperCase()}
                    </Text>
                    <Text style={[styles.priceValue, { color: text }]}>
                      RD${precio.valor}
                    </Text>
                  </View>

                  <View style={styles.quantityControls}>
                    <Pressable
                      accessibilityLabel="Disminuir cantidad"
                      disabled={!itemEnCarrito}
                      onPress={() => {
                        if (itemEnCarrito) {
                          disminuirDelCarrito(itemEnCarrito);
                        }
                      }}
                      style={({ pressed }) => [
                        styles.quantityButton,
                        styles.removeButton,
                        !itemEnCarrito && styles.disabledButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Entypo name="minus" size={24} color="#FFFFFF" />
                    </Pressable>

                    <Text style={[styles.quantityText, { color: text }]}>
                      {itemEnCarrito?.cantidad ?? 0}
                    </Text>

                    <Pressable
                      accessibilityLabel="Aumentar cantidad"
                      onPress={() =>
                        agregarAlCarrito({
                          id: `${productoSeleccionado._id}-${precio.tipo}`,
                          productoId: productoSeleccionado._id,
                          nombre: productoSeleccionado.nombre,
                          tipo: precio.tipo,
                          precio: precio.valor,
                          cantidad: 1,
                          total: precio.valor,
                          equivalencia: precio.equivalencia,
                        })
                      }
                      style={({ pressed }) => [
                        styles.quantityButton,
                        { backgroundColor: primary },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Entypo name="plus" size={24} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <Pressable
              onPress={() => setShowTipoModal(false)}
              style={({ pressed }) => [
                styles.closeButton,
                { borderColor: border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.closeButtonText, { color: text }]}>Listo</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 8,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    opacity: 0.62,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 44,
  },
  cartBadge: {
    alignItems: 'center',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -5,
    top: -5,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  searchContainer: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: SCREEN_PADDING,
    marginTop: 18,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: 50,
    paddingVertical: 0,
  },
  productList: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 16,
  },
  productRow: {
    gap: CARD_GAP,
  },
  productCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: CARD_GAP,
    overflow: 'hidden',
  },
  imageContainer: {
    aspectRatio: 1.08,
    padding: 12,
    position: 'relative',
    width: '100%',
  },
  productImage: {
    height: '100%',
    width: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    opacity: 0.6,
  },
  productBadge: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    minWidth: 32,
    paddingHorizontal: 7,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  productBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  productInformation: {
    gap: 3,
    paddingBottom: 14,
    paddingHorizontal: 13,
  },
  productName: {
    fontSize: 17,
    fontWeight: '700',
    minHeight: 22,
  },
  productPrice: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
  },
  productStock: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    opacity: 0.65,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 100,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    marginBottom: 14,
    width: 56,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    opacity: 0.65,
    textAlign: 'center',
  },
  addButton: {
    alignItems: 'center',
    borderRadius: 30,
    height: 60,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    width: 60,
  },
  addButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.96 }],
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    borderRadius: 24,
    maxWidth: 480,
    padding: 20,
    width: '100%',
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: '#A6A6A6',
    borderRadius: 2,
    height: 4,
    marginBottom: 16,
    opacity: 0.55,
    width: 44,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalProductName: {
    fontSize: 14,
    marginBottom: 18,
    marginTop: 4,
    opacity: 0.65,
    textAlign: 'center',
  },
  priceOption: {
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 12,
    padding: 14,
  },
  priceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceType: {
    fontSize: 15,
    fontWeight: '700',
  },
  priceValue: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  quantityControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantityButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  removeButton: {
    backgroundColor: '#C0392B',
  },
  disabledButton: {
    opacity: 0.35,
  },
  quantityText: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
    paddingVertical: 13,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
});
