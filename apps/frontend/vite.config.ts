import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Allow dev-server access via tenant subdomains (e.g. acme.localhost:5173) —
    // Vite's Host-header check otherwise rejects unfamiliar hostnames.
    allowedHosts: true,
  },
  optimizeDeps: {
    include: ["@hrm-plus/shared", "@hrm-plus/ui"],
  },
});
