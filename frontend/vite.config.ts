import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            if (/jspdf|html2canvas|dompurify/.test(id)) return 'pdf';
            if (/react-router|react-dom|\/react\//.test(id)) return 'react';
          }
        },
      },
    },
  },
  server: {
    proxy: {
      '/process':  'http://localhost:8001',
      '/download': 'http://localhost:8001',
      '/api':      'http://localhost:8001',
      '/logs':     'http://localhost:8001',
      '/auth':     'http://localhost:8001',
      '/health':   'http://localhost:8001',
      // /n8n passe désormais par le backend (qui vérifie le JWT puis relaie vers
      // n8n) : on ne le proxifie plus directement vers le service n8n.
      '/n8n':      'http://localhost:8001',
    },
  },
})
