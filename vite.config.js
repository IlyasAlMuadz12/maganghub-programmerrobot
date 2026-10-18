import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Game memanggil /coderbot-api/api.php. Vite meneruskannya ke folder
// "programmer dan robot" di Apache Laragon (http://127.0.0.1/programmer%20dan%20robot/api.php).
const proxy = {
  '/coderbot-api': {
    target: 'http://127.0.0.1',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/coderbot-api/, '/programmer%20dan%20robot'),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { host: true, proxy },
  preview: { host: true, proxy },
});
