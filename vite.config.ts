import { defineConfig } from "vite";

export default defineConfig({
  server: {
    open: false,
  },
  preview: {
    host: true,
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/phaser")) {
            return "phaser";
          }

          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
});
