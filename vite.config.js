import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/bangaloresuk/', // so it works when deployed in any subfolder
})
