import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],

  server: {
    proxy: {
      // 🎯 Intercepta todas las peticiones que empiezan con '/api' (ej: /api/usuario)
      '/api': {
        // 📍 El target es solo el dominio y puerto de Laravel
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
       
        // 🪄 CORRECCIÓN CLAVE:
        // Reemplaza el prefijo que interceptamos ('/api')
        // por el prefijo real de tu API en Laravel ('/api/v2').
        // Ejemplo: /api/usuario se convierte en /api/v2/usuario antes de enviarse a Laravel.
        rewrite: (path) => path.replace(/^\/api/, '/api/v2'),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
