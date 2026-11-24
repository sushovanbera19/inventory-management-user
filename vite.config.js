import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "@/..." always points at src/
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // The admin panel uses 5173; the shop runs next to it on 5180.
  server: { port: 5180 },
})
