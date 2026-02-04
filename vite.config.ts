import { defineConfig, PluginOption, UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  // Load ESM-only dev plugins dynamically to avoid Node `require` errors
  const devPlugins: PluginOption[] = [];
  if (mode === "development") {
    try {
      // lovable-tagger is ESM-only; import it dynamically
      // and call its factory only in dev mode.
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access
      const mod = await import("lovable-tagger");
      if (mod?.componentTagger) devPlugins.push(mod.componentTagger());
    } catch (e) {
      // Keep going if the plugin can't be loaded; log at runtime.
      // Vite will show meaningful errors if plugin fails.
      // eslint-disable-next-line no-console
      console.warn("lovable-tagger not loaded:", e);
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
      // Pre-transform known dependencies
      warmup: {
        clientFiles: ["./src/main.tsx", "./src/App.tsx", "./src/pages/Index.tsx"],
      },
    },
    plugins: [
      react(),
      ...devPlugins,
      // Analizador de bundle solo en build
      mode === "production" &&
        visualizer({
          filename: "dist/bundle-analysis.html",
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@full-vision/shared": path.resolve(__dirname, "./shared/src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React core - mantener separado
            "react-core": ["react", "react-dom"],
            // Router - separado por lazy loading
            "react-router": ["react-router-dom"],
            // UI library - chunking más granular
            "radix-ui": [
              "@radix-ui/react-alert-dialog",
              "@radix-ui/react-avatar",
              "@radix-ui/react-checkbox",
              "@radix-ui/react-dialog",
              "@radix-ui/react-dropdown-menu",
              "@radix-ui/react-label",
              "@radix-ui/react-navigation-menu",
              "@radix-ui/react-popover",
              "@radix-ui/react-progress",
              "@radix-ui/react-radio-group",
              "@radix-ui/react-scroll-area",
              "@radix-ui/react-select",
              "@radix-ui/react-separator",
              "@radix-ui/react-slider",
              "@radix-ui/react-switch",
              "@radix-ui/react-tabs",
              "@radix-ui/react-toast",
              "@radix-ui/react-tooltip",
            ],
            // Query lib - cargar solo cuando sea necesario
            "query-lib": ["@tanstack/react-query"],
            // Supabase - chunk separado para lazy loading de auth
            supabase: ["@supabase/supabase-js"],
            // Utilities - chunk pequeño para funciones comunes
            utils: ["clsx", "class-variance-authority", "tailwind-merge"],
            // Date utilities - cargar solo en páginas que lo necesiten
            "date-utils": ["date-fns", "moment"],
            // Icons - chunk separado pero optimizado
            icons: ["lucide-react"],
            // Performance libs
            performance: ["web-vitals", "react-intersection-observer"],
            // Forms - chunk separado para formularios
            forms: ["react-hook-form", "@hookform/resolvers", "zod"],
            // Calendar components - chunk separado
            calendar: ["react-big-calendar", "react-day-picker"],
            // Image processing - chunk separado
            images: ["browser-image-compression"],
            // Carousel - chunk separado
            carousel: ["embla-carousel-react"],
            // State management
            state: ["zustand"],
          },
        },
      },
      // Optimizar tamaño de chunks
      chunkSizeWarningLimit: 400, // Reducido para chunks más pequeños
      // Source maps solo en desarrollo
      sourcemap: mode === "development",
      // Usar esbuild para minificación rápida
      minify: "esbuild",
      // CSS code splitting
      cssCodeSplit: true,
      // Target ES2020 para mejor optimización
      target: "es2020",
      // Eliminar console.log en producción
      ...(mode === "production" && {
        esbuild: {
          drop: ["console", "debugger"],
          legalComments: "none", // Remover comentarios legales
        },
      }),
      // Optimización de assets
      assetsInlineLimit: 4096, // Inline assets menores a 4KB
      cssMinify: true,
    },
    // Performance optimizations
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "@tanstack/react-query", "react-intersection-observer"],
      // Excluir dependencias que se cargan dinámicamente or are ESM-only
      exclude: ["web-vitals", "lovable-tagger"],
    },
    // CSS optimizations
    css: {
      devSourcemap: mode === "development",
    },
  };
});
