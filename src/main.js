import { createApp } from 'vue'
import { installElement } from './plugins/element'
import App from './App.vue'
import router from './router'
import store from './store'
import api from './axios'
import './permission'
import './style.css'
import { restoreSession } from './auth/session'

const app = createApp(App)
app.config.globalProperties.$axios = api
async function bootstrap() {
  await restoreSession(store, api)
  installElement(app)
  app.use(store).use(router).mount('#app')
}

bootstrap()
