import { ElMessage } from 'element-plus'
import { createApiClient } from './api/client'
import store from './store'
import router from './router'

export default createApiClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  getToken: () => store.state.token,
  onUnauthorized(error) {
    const requestToken = error?.config?.headers?.Authorization
    if (requestToken && requestToken !== store.state.token) return
    store.commit('REMOVE_INFO')
    if (router.currentRoute.value.name !== 'Login') {
      return router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    }
  },
  notifyError: message => ElMessage.error(message)
})
