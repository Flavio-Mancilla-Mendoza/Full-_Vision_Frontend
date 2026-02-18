// Configuración de navegación del Navbar

export interface NavItem {
  label: string;
  path?: string;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

export const NAV_CONFIG: NavItem[] = [
  { label: "Hombres", path: "/hombres" },
  { label: "Mujeres", path: "/mujer" },
  { label: "Niños", path: "/ninos" },
  // { label: "Lentes de contacto", path: "/lentes-contacto" }, // Temporalmente oculto
  { label: "Examen de vista", path: "/citas", requiresAuth: true },
  { label: "Mis Citas", path: "/mis-citas", requiresAuth: true },
  { label: "Mis Pedidos", path: "/mis-pedidos", requiresAuth: true },
  { label: "Carrito", path: "/cart", requiresAuth: true },
  { label: "Admin", path: "/admin/dashboard", requiresAuth: true, adminOnly: true },
];
