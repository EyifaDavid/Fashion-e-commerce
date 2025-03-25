import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 4000,
    proxy: {
      "/api": {
        target: "http://localhost:8880",
        changeOrigin: true,
      },
    },
  },
});
