import { create } from 'zustand';
import { ALL_ORDERS } from '@/lib/dummy-orders';

export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  stock: number;
  sales: number;
  rating: number;
  status: string;
  image: string;
  sku: string;
};

export type Order = {
  id: string;
  customer: string;
  date: string;
  items: number;
  total: number;
  status: string;
  paymentStatus: string;
};

const INITIAL_PRODUCTS: Product[] = [
  { id: "P1", name: "Aurora Wireless Headphones", category: "electronics", brand: "Zii Audio", price: 129.99, stock: 250, sales: 117, rating: 4.8, status: "Active", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=200&auto=format&fit=crop", sku: "SEED-001" },
  { id: "P2", name: "Everyday Cotton Tee", category: "fashion", brand: "Zii Wear", price: 19.99, stock: 750, sales: 131, rating: 4.9, status: "Active", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=200&auto=format&fit=crop", sku: "SEED-002" },
  { id: "P3", name: "Ceramic Pour-Over Coffee Set", category: "home-kitchen", brand: "Zii Home", price: 39.99, stock: 250, sales: 59, rating: 4.5, status: "Active", image: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=200&auto=format&fit=crop", sku: "SEED-003" },
  { id: "P4", name: "Smart Fitness Watch", category: "electronics", brand: "Zii Tech", price: 199.99, stock: 15, sales: 256, rating: 4.6, status: "Active", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=200&auto=format&fit=crop", sku: "SEED-004" },
  { id: "P5", name: "Leather Messenger Bag", category: "fashion", brand: "Zii Wear", price: 89.99, stock: 0, sales: 42, rating: 4.7, status: "Out of Stock", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=200&auto=format&fit=crop", sku: "SEED-005" },
];

interface SellerStoreState {
  products: Product[];
  orders: Order[];
  
  // Product Actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Order Actions
  updateOrderStatus: (id: string, status: string) => void;
  updateOrderPayment: (id: string, paymentStatus: string) => void;
}

export const useSellerStore = create<SellerStoreState>((set) => ({
  products: INITIAL_PRODUCTS,
  orders: ALL_ORDERS,

  addProduct: (product) => set((state) => ({
    products: [
      { ...product, id: `P${Math.floor(Math.random() * 10000)}` },
      ...state.products
    ]
  })),

  updateProduct: (id, updatedFields) => set((state) => ({
    products: state.products.map(p => p.id === id ? { ...p, ...updatedFields } : p)
  })),

  deleteProduct: (id) => set((state) => ({
    products: state.products.filter(p => p.id !== id)
  })),

  updateOrderStatus: (id, status) => set((state) => ({
    orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
  })),

  updateOrderPayment: (id, paymentStatus) => set((state) => ({
    orders: state.orders.map(o => o.id === id ? { ...o, paymentStatus } : o)
  }))
}));
