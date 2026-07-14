import { createApp } from 'vue'
import '@opensig/opendesign-token/themes/responsive.token.css'
import '@opensig/opendesign-token/themes/e.light.token.css'
import '@opensig/opendesign-token/themes/e.dark.token.css'
import '@opensig/opendesign/lib/index.css'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'
import { MOCK_USERS } from './mock/data'

document.documentElement.setAttribute('data-o-theme', 'e.light')

const app = createApp(App)
app.use(router)

app.mount('#app')

const { login } = useAuth()
login(MOCK_USERS[0])