// src/hooks/useCartDrawer.ts - Hook para manejar el estado del cart drawer
import { create } from "zustand";

interface CartDrawerStore {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setOpen: (open: boolean) => void;
}

export const useCartDrawer = create<CartDrawerStore>((set) => ({
  isOpen: false,
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  setOpen: (open: boolean) => set({ isOpen: open }),
}));
