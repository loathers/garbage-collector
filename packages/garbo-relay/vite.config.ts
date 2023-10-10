import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: "garbage-collector/[name].js",
        chunkFileNames: "garbage-collector/[name].js",
        assetFileNames: "garbage-collector/[name].[ext]",
      },
    },
  },
  plugins: [react()],
});
