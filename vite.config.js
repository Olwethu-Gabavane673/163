import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
});
