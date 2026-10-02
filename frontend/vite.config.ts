import { foldkit } from "@foldkit/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  plugins: [foldkit(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 1337,
    strictPort: true,
    proxy: { "/api": { target: "http://localhost:1339", changeOrigin: false } },
  },
  optimizeDeps: { entries: ["src/entry.ts"] },
});
