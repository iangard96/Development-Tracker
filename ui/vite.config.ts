import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [
      "famous-coats-cough.loca.lt",
      "great-donuts-visit.loca.lt",
      "salty-eyes-notice.loca.lt",
    ],
  },
})
