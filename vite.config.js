import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// O tablet do galpão (Fire HD 8 7ª gen, Android 5.1) só roda navegador antigo:
// o alvo padrão do Vite 6 é Chrome 107+, alto demais. es2019 cobre Chrome 73+.
// Isso resolve SINTAXE, não APIs novas — se algo quebrar num navegador muito
// velho (Silk do Fire OS), o próximo passo é @vitejs/plugin-legacy.
const ALVO_NAVEGADOR = 'es2019'

// https://vite.dev/config/
export default defineConfig({
  build: { target: ALVO_NAVEGADOR },
  esbuild: { target: ALVO_NAVEGADOR },
  optimizeDeps: { esbuildOptions: { target: ALVO_NAVEGADOR } },
  plugins: [
    react(),
    VitePWA({
      // Instalável na tela inicial e abre em tela cheia; o service worker
      // garante que o app carregue sem internet (a wifi do galpão cai).
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon-64.png', 'icone-192.png', 'icone-512.png', 'icone-512-maskable.png'],
      manifest: {
        name: 'Caixa da Reciclagem',
        short_name: 'Caixa',
        description: 'Controle de caixa do galpão: compras, vendas e fechamento do dia.',
        lang: 'pt-BR',
        // Relativos: o app funciona na raiz do domínio ou numa subpasta.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b1220',
        theme_color: '#0b1220',
        icons: [
          { src: 'icone-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icone-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icone-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
})
