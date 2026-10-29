import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createAppStore } from '../store'
import { installAuthGuard } from '../permission'

describe('authoring route protection', () => {
  it.each(['/blog/add', '/blog/12/edit', '/my/blogs'])('redirects a visitor from %s and preserves the return address', async path => {
    localStorage.clear()
    sessionStorage.clear()
    const store = createAppStore()
    const component = { template: '<div />' }
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/login', name: 'Login', component },
      { path: '/blog/add', component, meta: { requireAuth: true } },
      { path: '/my/blogs', component, meta: { requireAuth: true } },
      { path: '/blog/:blogId/edit', component, meta: { requireAuth: true } }
    ] })
    installAuthGuard(router, store)
    await router.push(path)
    expect(router.currentRoute.value.name).toBe('Login')
    expect(router.currentRoute.value.query.redirect).toBe(path)
    store.commit('SET_TOKEN', 'test-token')
    await router.push(path)
    expect(router.currentRoute.value.path).toBe(path)
    store.commit('REMOVE_INFO')
  })
})

