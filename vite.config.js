import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import { fileURLToPath, pathToFileURL } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const vercelDevPlugin = () => ({
  name: 'vercel-dev-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // 1. Handle rewrites (e.g., /logo.png -> /logo.webp)
      if (req.url === '/logo.png') {
        req.url = '/logo.webp';
        return next();
      }
      if (req.url.startsWith('/assets/im/') && (req.url.endsWith('.png') || req.url.endsWith('.jpg') || req.url.endsWith('.jpeg'))) {
        req.url = req.url.replace(/\.(png|jpg|jpeg)$/, '.webp');
        return next();
      }

      // 2. Handle /api/* requests
      if (req.url.startsWith('/api/')) {
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        const pathname = urlObj.pathname;
        const apiFilePath = path.resolve(__dirname, `.${pathname}.js`);

        if (!fs.existsSync(apiFilePath)) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `API endpoint ${pathname} not found` }));
          return;
        }

        try {
          // Read request body if needed
          let body = '';
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            body = await new Promise((resolve, reject) => {
              let data = '';
              req.on('data', chunk => { data += chunk; });
              req.on('end', () => resolve(data));
              req.on('error', err => reject(err));
            });
          }

          let parsedBody = {};
          if (body && req.headers['content-type']?.includes('application/json')) {
            try {
              parsedBody = JSON.parse(body);
            } catch {
              // Ignore body parsing errors
            }
          }

          // Wrap req/res to support Vercel helper properties and methods
          const reqWrapper = Object.create(req);
          reqWrapper.query = Object.fromEntries(urlObj.searchParams);
          reqWrapper.body = parsedBody;
          reqWrapper.cookies = {};

          const resWrapper = Object.create(res);
          resWrapper.status = function(statusCode) {
            res.statusCode = statusCode;
            return this;
          };
          resWrapper.json = function(data) {
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'application/json');
            }
            res.end(JSON.stringify(data));
            return this;
          };
          resWrapper.send = function(data) {
            res.end(data);
            return this;
          };

          // Dynamically import the handler file using pathToFileURL for cross-platform support
          const fileUrl = pathToFileURL(apiFilePath).href;
          const handlerModule = await import(`${fileUrl}?t=${Date.now()}`);
          const handler = handlerModule.default;

          if (typeof handler === 'function') {
            await handler(reqWrapper, resWrapper);
          } else {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Default export of ${pathname}.js is not a function` }));
          }
        } catch (err) {
          console.error(`Error executing local API ${pathname}:`, err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Internal server error.' }));
        }
        return;
      }

      next();
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), vercelDevPlugin()],
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
    minify: 'esbuild',
    target: 'esnext',
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    assetsInlineLimit: 4096,
    cssMinify: 'esbuild',
    esbuildOptions: {
      drop: ['console', 'debugger'],
      legalComments: 'none',
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
    chunkSizeWarningLimit: 700
  }
})
