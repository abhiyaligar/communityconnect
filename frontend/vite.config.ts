import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['communityconnect-9r5x.onrender.com'],
    // or to allow any Render subdomain going forward:
    // allowedHosts: ['.onrender.com'],
  },
  preview: {
    host: true,
    allowedHosts: ['communityconnect-9r5x.onrender.com'],
    // allowedHosts: ['.onrender.com'],
  },
})