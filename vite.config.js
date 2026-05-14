import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Pre-bundle heavy deps so the browser gets them from cache immediately
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      'framer-motion',
      'firebase/app', 'firebase/auth', 'firebase/firestore',
      'lucide-react',
      'react-hot-toast',
    ],
  },
  server: {
    // Faster HMR overlay
    hmr: { overlay: true },
  },
  build: {
    // Use esbuild (default) – drop console.log in production
    minify: 'esbuild',
    target: 'esnext',
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase – split auth/firestore/analytics separately
          if (id.includes('firebase/auth'))      return 'firebase-auth';
          if (id.includes('firebase/firestore')) return 'firebase-firestore';
          if (id.includes('firebase/app') || id.includes('firebase/analytics')) return 'firebase-core';
          // Framer Motion is large – its own chunk
          if (id.includes('framer-motion'))      return 'framer-motion';
          // React core
          if (id.includes('react-dom') || id.includes('react-router-dom') || id.includes('/react/')) return 'react-vendor';
          // Lucide icons tree-shaken per file but group the lib chunk
          if (id.includes('lucide-react'))       return 'lucide';
          // Small UI libs together
          if (id.includes('react-hot-toast') || id.includes('react-confetti')) return 'ui-vendor';
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
