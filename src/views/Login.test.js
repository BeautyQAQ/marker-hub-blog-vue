import { describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { AxiosError } from 'axios'
import Login from './Login.vue'
import { createAppStore } from '../store'
import { createApiClient } from '../api/client'

describe('login error recovery', () => {
  it('shows a credential error without ending an existing session, then allows a successful retry', async () => {
    localStorage.clear()
    sessionStorage.clear()
    const store = createAppStore()
    store.commit('SET_TOKEN', 'existing-token')
    const onUnauthorized = vi.fn()
    const api = createApiClient({ getToken: () => store.state.token, onUnauthorized })
    api.defaults.adapter = async config => {
      expect(config.skipAuthRedirect).toBe(true)
      expect(config.headers.Authorization).toBeNull()
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, { status: 401, data: { msg: '账号或密码错误' } })
    }
    const push = vi.fn()
    const wrapper = shallowMount(Login, {
      global: {
        plugins: [store],
        mocks: { $axios: api, $router: { push }, $route: { query: { redirect: '/blog/add' } } },
        stubs: {
          BlogHeader: true,
          ElForm: { methods: { validate: () => Promise.resolve(true) }, template: '<form><slot /></form>' },
          ElFormItem: { template: '<div><slot /></div>' },
          ElInput: true,
          ElButton: { template: '<button><slot /></button>' },
          ElAlert: { props: ['title'], template: '<p>{{ title }}</p>' }
        }
      }
    })
    await wrapper.setData({ form: { username: 'test-user', password: 'incorrect' } })
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('账号或密码错误')
    expect(onUnauthorized).not.toHaveBeenCalled()
    expect(store.state.token).toBe('existing-token')
    expect(wrapper.vm.submitting).toBe(false)
    api.defaults.adapter = async config => ({ config, status: 200, headers: { authorization: 'new-token' }, data: { code: '20001', data: { id: 7, username: 'test-user' } } })
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(store.state.token).toBe('new-token')
    expect(push).toHaveBeenCalledWith('/blog/add')
    wrapper.unmount()
    localStorage.clear()
  })
})
