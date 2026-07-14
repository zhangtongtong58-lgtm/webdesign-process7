const { build } = require('vite')
const vue = require('@vitejs/plugin-vue')
const { viteSingleFile } = require('vite-plugin-singlefile')
const { fileURLToPath, URL } = require('node:url')
const path = require('node:path')

build({
  root: __dirname,
  base: './',
  plugins: [vue.default || vue(), viteSingleFile()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', `file://${__dirname}/`)),
    },
  },
  build: {
    outDir: 'dist',
  },
}).then(() => {
  console.log('Build complete!')
}).catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})