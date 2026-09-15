import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,       // Must match backend CORS: allow_origins=["http://localhost:5173"]
    strictPort: true, // Fail clearly if 5173 is taken instead of silently picking another port
  },
})
