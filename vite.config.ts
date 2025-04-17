import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Define envPrefix to ensure variables starting with VITE_ are exposed
  envPrefix: 'VITE_',
  // No need for `define: { 'process.env': {} }` with modern Vite versions
  // when using `import.meta.env`
})
