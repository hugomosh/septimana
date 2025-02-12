import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/septimana/',
  server: {
    allowedHosts: ["5173-hugomosh-septimana-2v03m459hld.ws-us117.gitpod.io"],
  },
});
