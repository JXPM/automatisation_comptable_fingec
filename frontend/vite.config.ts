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
      '/process':  'http://localhost:8000',
      '/download': 'http://localhost:8000',
      '/logs':     'http://localhost:8000',
      '/n8n': {
        target: 'http://localhost:5678',
        rewrite: (path) => path.replace(/^\/n8n/, ''),
      },
    },
  },
})
