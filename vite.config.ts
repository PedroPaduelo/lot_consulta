import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Add this to make environment variables available in the client
  define: {
    'process.env': {}
  },
  // Ensure proper handling of environment variables
  envPrefix: 'VITE_'
})
