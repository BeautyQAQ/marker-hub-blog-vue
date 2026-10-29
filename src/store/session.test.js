import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { nextTick } from 'vue'
import BlogHeader from '../components/Header.vue'
import { createAppStore } from './index'

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })
afterEach(() => { localStorage.clear(); sessionStorage.clear() })

describe('visitor and persisted login state', () => {
  it('renders a first-time visitor safely and reacts to login without remounting', async () => {
    const store = createAppStore()
    const wrapper = shallowMount(BlogHeader, {
      global: { plugins: [store], stubs: { RouterLink: { template: '<a><slot /></a>' }, ElButton: { template: '<button><slot /></button>' } } }
    })
    expect(wrapper.text()).toContain('登录')
    expect(wrapper.text()).not.toContain('发表文章')
    store.commit('SET_TOKEN', 'test-token')
    store.commit('SET_USERINFO', { id: 7, username: '测试用户' })
    await nextTick()
    expect(wrapper.text()).toContain('测试用户')
    expect(wrapper.text()).toContain('发表文章')
    const restored = createAppStore()
    expect(restored.getters.isAuthenticated).toBe(true)
    expect(restored.getters.getUser.id).toBe(7)
    wrapper.unmount()
  })

  it('recovers from damaged saved user data', () => {
    localStorage.setItem('userInfo', '{broken json')
    localStorage.setItem('token', 'undefined')
    const store = createAppStore()
    expect(store.getters.getUser).toEqual({})
    expect(store.getters.isAuthenticated).toBe(false)
  })

  it('migrates the existing session user alongside the persisted token', () => {
    localStorage.setItem('token', 'test-token')
    sessionStorage.setItem('userInfo', JSON.stringify({ id: 7, username: '原用户' }))
    const store = createAppStore()
    expect(store.getters.getUser.username).toBe('原用户')
    expect(JSON.parse(localStorage.getItem('userInfo')).id).toBe(7)
    expect(sessionStorage.getItem('userInfo')).toBeNull()
  })

  it('logs out locally even when the server request fails', async () => {
    const store = createAppStore()
    store.commit('SET_TOKEN', 'test-token')
    store.commit('SET_USERINFO', { id: 7, username: '测试用户' })
    const push = vi.fn()
    const wrapper = shallowMount(BlogHeader, {
      global: { plugins: [store], mocks: { $axios: { get: vi.fn().mockRejectedValue(new Error('offline')) }, $router: { push } }, stubs: { RouterLink: true, ElButton: true } }
    })
    await wrapper.vm.logout()
    expect(store.getters.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('userInfo')).toBeNull()
    expect(push).toHaveBeenCalledWith('/login')
    wrapper.unmount()
  })
})

