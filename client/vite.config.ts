import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Prevent CORS issues with Clerk and Cloudflare
    cors: {
      origin: "*",
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
      credentials: true,
    },
    // Configure proxy to avoid Cloudflare challenges in development
    proxy: {
      // Proxy Clerk authentication requests
      "/api/clerk": {
        target: "https://clerk.clerk.accounts.dev", // Use the actual domain from your Clerk publishable key
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/clerk/, ""),
        configure: (proxy) => {
          proxy.on("error", (err) => {
            console.log("Proxy error:", err);
          });
        },
      },
    },
  },
  // Important to use SPA mode for routing
  appType: "spa",
})
