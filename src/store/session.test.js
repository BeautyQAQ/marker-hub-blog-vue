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
      global: { plugins: [store], mocks: { $axios: { post: vi.fn().mockRejectedValue(new Error('offline')) }, $router: { push } }, stubs: { RouterLink: true, ElButton: true } }
    })
    await wrapper.vm.logout()
    expect(store.getters.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('userInfo')).toBeNull()
    expect(push).toHaveBeenCalledWith('/login')
    wrapper.unmount()
  })

  it('keeps the session when the editor cancels navigation before logout', async () => {
    const store = createAppStore()
    store.commit('SET_TOKEN', 'test-token')
    const post = vi.fn()
    const wrapper = shallowMount(BlogHeader, {
      global: { plugins: [store], mocks: { $axios: { post }, $router: { push: vi.fn().mockResolvedValue({ type: 4 }) } }, stubs: { RouterLink: true, ElButton: true } }
    })
    await wrapper.vm.logout()
    expect(post).not.toHaveBeenCalled()
    expect(store.getters.isAuthenticated).toBe(true)
    wrapper.unmount()
  })

  it('can log out while already on the login page', async () => {
    const store = createAppStore()
    store.commit('SET_TOKEN', 'old-token')
    const post = vi.fn().mockResolvedValue({})
    const push = vi.fn().mockResolvedValue({ type: 16 })
    const wrapper = shallowMount(BlogHeader, {
      global: { plugins: [store], mocks: { $route: { name: 'Login' }, $axios: { post }, $router: { push } }, stubs: { RouterLink: true, ElButton: { template: '<button><slot /></button>' } } }
    })
    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(store.getters.isAuthenticated).toBe(false))
    expect(push).not.toHaveBeenCalled()
    expect(post).toHaveBeenCalledWith('/logout', null, { headers: { Authorization: 'old-token' } })
    wrapper.unmount()
  })

  it('revokes the captured token without clearing a newer login', async () => {
    const store = createAppStore()
    store.commit('SET_TOKEN', 'old-token')
    let finishLogout
    const post = vi.fn(() => new Promise(resolve => { finishLogout = resolve }))
    const wrapper = shallowMount(BlogHeader, {
      global: { plugins: [store], mocks: { $route: { name: 'Blogs' }, $axios: { post }, $router: { push: vi.fn() } }, stubs: { RouterLink: true, ElButton: { template: '<button><slot /></button>' } } }
    })
    await wrapper.find('button').trigger('click')
    await vi.waitFor(() => expect(post).toHaveBeenCalledOnce())
    store.commit('SET_TOKEN', 'new-token')
    store.commit('SET_USERINFO', { id: 8, username: '新用户' })
    finishLogout({})
    await vi.waitFor(() => expect(wrapper.vm.loggingOut).toBe(false))
    expect(post).toHaveBeenCalledWith('/logout', null, { headers: { Authorization: 'old-token' } })
    expect(store.state.token).toBe('new-token')
    expect(store.getters.getUser.id).toBe(8)
    wrapper.unmount()
  })
})

