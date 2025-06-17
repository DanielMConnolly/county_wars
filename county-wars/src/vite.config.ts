import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwindcss(),
      {
        name: 'ignore-json-hmr',
        handleHotUpdate({ file, server }) {
          if (file.endsWith('user-counties.json')) {
            console.log('Ignoring HMR for:', file)
            return []
          }
        }
      }
  ],
  server: {
    hmr: false,
    watch: {
      ignored: ['**/user-counties.json']
    }
  }
})
