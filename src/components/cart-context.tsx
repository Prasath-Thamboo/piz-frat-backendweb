"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type CartSupplement = { id: string; name: string; priceCents: number };

export type CartItem = {
  key: string;
  productId: string;
  productName: string;
  unitPriceCents: number;
  quantity: number;
  supplements: CartSupplement[];
};

const STORAGE_KEY = "pf-cart";
const EMPTY_CART: CartItem[] = [];

function cartItemKey(productId: string, supplementIds: string[]) {
  return `${productId}::${[...supplementIds].sort().join(",")}`;
}

// Panier synchronisé avec localStorage via un store externe (useSyncExternalStore) :
// pas de valeur côté serveur, donc pas d'effet à déclencher au montage.
function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return EMPTY_CART;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

let cartItems: CartItem[] = loadFromStorage();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cartItems;
}

function getServerSnapshot() {
  return EMPTY_CART;
}

function storeAddItem(input: {
  productId: string;
  productName: string;
  unitPriceCents: number;
  supplements: CartSupplement[];
}) {
  const key = cartItemKey(input.productId, input.supplements.map((s) => s.id));
  const existing = cartItems.find((item) => item.key === key);
  cartItems = existing
    ? cartItems.map((item) =>
        item.key === key ? { ...item, quantity: item.quantity + 1 } : item,
      )
    : [
        ...cartItems,
        {
          key,
          productId: input.productId,
          productName: input.productName,
          unitPriceCents: input.unitPriceCents,
          quantity: 1,
          supplements: input.supplements,
        },
      ];
  persist();
  emit();
}

function storeSetQuantity(key: string, quantity: number) {
  cartItems =
    quantity <= 0
      ? cartItems.filter((item) => item.key !== key)
      : cartItems.map((item) => (item.key === key ? { ...item, quantity } : item));
  persist();
  emit();
}

function storeRemoveItem(key: string) {
  cartItems = cartItems.filter((item) => item.key !== key);
  persist();
  emit();
}

function storeClear() {
  cartItems = [];
  persist();
  emit();
}

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  addItem: typeof storeAddItem;
  setQuantity: typeof storeSetQuantity;
  removeItem: typeof storeRemoveItem;
  clear: typeof storeClear;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotalCents = useMemo(
    () =>
      items.reduce((sum, item) => {
        const unit =
          item.unitPriceCents +
          item.supplements.reduce((s, sup) => s + sup.priceCents, 0);
        return sum + unit * item.quantity;
      }, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotalCents,
      addItem: storeAddItem,
      setQuantity: storeSetQuantity,
      removeItem: storeRemoveItem,
      clear: storeClear,
    }),
    [items, itemCount, subtotalCents],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé sous CartProvider");
  return ctx;
}
