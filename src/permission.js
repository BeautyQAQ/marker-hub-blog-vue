import router from './router'
import store from './store'

export function installAuthGuard(targetRouter, targetStore) {
  return targetRouter.beforeEach(to => {
    if (to.matched.some(record => record.meta.requireAuth) && !targetStore.getters.isAuthenticated) {
      return { name: 'Login', query: { redirect: to.fullPath } }
    }
  })
}

installAuthGuard(router, store)
