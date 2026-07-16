import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      // RT6: 70% mínimo en utils/ y en los componentes testeados
      include: [
        'src/utils/**',
        'src/components/Transferencia.jsx',
        'src/components/Auth.jsx',
        'src/components/Historial.jsx',
      ],
      thresholds: {
        lines: 70,
      },
    }
  }
})
