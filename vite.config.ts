import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
declare const global: Window;

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    //Comment this for Amplify deployment but uncomment for local yarn run
    //global: typeof global === 'undefined' && Window,
  },
  plugins: [react()],
})
