import { createApp } from 'vue'
// Token 必须在组件样式之前引入
import '@opensig/opendesign-token/themes/responsive.token.css'
import '@opensig/opendesign-token/themes/e.light.token.css'
import '@opensig/opendesign-token/themes/e.dark.token.css'
import '@opensig/opendesign/lib/index.css'
import App from './App.vue'
import router from './router'

// openEuler theme 必须设置在 html 元素上
document.documentElement.setAttribute('data-o-theme', 'e.light')

const app = createApp(App)
app.use(router)
app.mount('#app')
