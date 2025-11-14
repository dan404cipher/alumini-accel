import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
    // 👇 Add safe reload configuration
    watch: {
      usePolling: true, // safer across OS and Docker
      interval: 50, // check for changes every 500ms (slows down hot reload slightly)
    },
    hmr: {
      overlay: true, // show errors on screen
      timeout: 50, // small debounce before reloading
    },
    strictPort: true, // keeps port 8080 fixed
  },

  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
  