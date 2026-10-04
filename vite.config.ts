import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // maplibre-gl's web worker breaks under Vite's dep pre-bundling
  // (it 404s on /node_modules/.vite/deps/maplibre-gl-worker.mjs), so exclude it.
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
})
