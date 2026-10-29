import { describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import BlogEdit from './BlogEdit.vue'
import { createAppStore } from '../store'

vi.mock('md-editor-v3', () => ({ MdEditor: { template: '<textarea />' }, config: vi.fn() }))

function mountEditor({ route = reactive({ params: {} }), api } = {}) {
  localStorage.clear()
  sessionStorage.clear()
  const store = createAppStore()
  store.commit('SET_TOKEN', 'test-token')
  store.commit('SET_USERINFO', { id: 7, username: '作者' })
  return shallowMount(BlogEdit, {
    global: {
      plugins: [store],
      mocks: { $route: route, $router: { push: vi.fn() }, $axios: api || { get: vi.fn(), post: vi.fn() }, $message: { success: vi.fn() } },
      directives: { loading() {} },
      stubs: {
        BlogHeader: true,
        ElForm: { methods: { validate: () => Promise.resolve(true), clearValidate() {} }, template: '<form><slot /></form>' },
        ElFormItem: { template: '<div><slot /></div>' },
        ElInput: true,
        ElButton: { template: '<button><slot /></button>' },
        ElAlert: { props: ['title'], template: '<p>{{ title }}</p>' }
      }
    }
  })
}

describe('article editing failure recovery', () => {
  it('keeps content and allows retry after a failed save', async () => {
    const api = { post: vi.fn().mockRejectedValueOnce(new Error('后端暂不可用')).mockResolvedValueOnce({ data: { code: '20000' } }) }
    const wrapper = mountEditor({ api })
    await wrapper.setData({ editForm: { id: '', title: '标题', description: '摘要', content: '# 保留内容' } })
    await wrapper.vm.submitForm()
    expect(wrapper.vm.editForm.content).toBe('# 保留内容')
    expect(wrapper.text()).toContain('后端暂不可用')
    expect(wrapper.vm.submitting).toBe(false)
    await wrapper.vm.submitForm()
    expect(api.post).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.hasChanges).toBe(false)
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/blogs')
    wrapper.unmount()
  })

  it('does not leave the new-article page loading when an earlier edit request finishes late', async () => {
    let resolveRequest
    const api = { get: vi.fn(() => new Promise(resolve => { resolveRequest = resolve })) }
    const route = reactive({ params: { blogId: '12' } })
    const wrapper = mountEditor({ route, api })
    expect(wrapper.vm.loading).toBe(true)
    route.params = {}
    await flushPromises()
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.editForm.id).toBe('')
    resolveRequest({ data: { data: { id: 12, userId: 7, title: '旧文章', description: '', content: '' } } })
    await flushPromises()
    expect(wrapper.vm.loading).toBe(false)
    expect(wrapper.vm.editForm.id).toBe('')
    wrapper.unmount()
  })

  it('blocks accidental duplicate saves while validation is resolving', async () => {
    let finishSave
    const api = { post: vi.fn(() => new Promise(resolve => { finishSave = resolve })) }
    const wrapper = mountEditor({ api })
    await wrapper.setData({ editForm: { id: '', title: '标题', description: '摘要', content: '内容' } })
    const first = wrapper.vm.submitForm()
    const second = wrapper.vm.submitForm()
    await flushPromises()
    expect(api.post).toHaveBeenCalledOnce()
    finishSave({})
    await Promise.all([first, second])
    wrapper.unmount()
  })
})
