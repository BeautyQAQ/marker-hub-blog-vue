import { createApp } from 'vue'
import { installElement } from './plugins/element'
import App from './App.vue'
import router from './router'
import store from './store'
import api from './axios'
import './permission'
import './style.css'

const app = createApp(App)
app.config.globalProperties.$axios = api
installElement(app)
app.use(store).use(router).mount('#app')
