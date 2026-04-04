import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("react") || id.includes("scheduler")) {
            return "react-vendor";
          }

          if (id.includes("@mui") || id.includes("@emotion")) {
            return "mui-vendor";
          }

          if (
            id.includes("chart.js") ||
            id.includes("recharts") ||
            id.includes("@mui/x-charts") ||
            id.includes("html2canvas") ||
            id.includes("jspdf")
          ) {
            return "charts-pdf-vendor";
          }

          if (id.includes("axios") || id.includes("papaparse") || id.includes("xlsx")) {
            return "data-vendor";
          }

          return "vendor";
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    cors: true,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
})
