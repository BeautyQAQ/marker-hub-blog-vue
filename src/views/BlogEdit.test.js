import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import { ElForm, ElFormItem } from 'element-plus'
import BlogEdit from './BlogEdit.vue'
import { createAppStore } from '../store'

vi.mock('md-editor-v3', () => ({ MdEditor: { template: '<textarea />' }, config: vi.fn() }))

function mountEditor({ route = reactive({ params: {} }), api, realValidation = false } = {}) {
  localStorage.clear()
  sessionStorage.clear()
  const store = createAppStore()
  store.commit('SET_TOKEN', 'test-token')
  store.commit('SET_USERINFO', { id: 7, username: '作者' })
  return (realValidation ? mount : shallowMount)(BlogEdit, {
    global: {
      plugins: [store],
      components: { ElForm, ElFormItem },
      mocks: { $route: route, $router: { push: vi.fn() }, $axios: api || { get: vi.fn(), post: vi.fn() }, $message: { success: vi.fn() } },
      directives: { loading() {} },
      stubs: {
        BlogHeader: true,
        ElForm: realValidation ? false : { methods: { validate: () => Promise.resolve(true), clearValidate() {} }, template: '<form><slot /></form>' },
        ElFormItem: realValidation ? false : { template: '<div><slot /></div>' },
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
    await wrapper.setData({ editForm: { id: '', title: '标题', description: '摘要', content: '# 保留内容', status: 0 } })
    await wrapper.vm.submitForm()
    expect(wrapper.vm.editForm.content).toBe('# 保留内容')
    expect(wrapper.text()).toContain('后端暂不可用')
    expect(wrapper.vm.submitting).toBe(false)
    await wrapper.vm.submitForm()
    expect(api.post).toHaveBeenCalledTimes(2)
    expect(wrapper.vm.hasChanges).toBe(false)
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith('/my/blogs')
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
    await wrapper.setData({ editForm: { id: '', title: '标题', description: '摘要', content: '内容', status: 0 } })
    const first = wrapper.vm.submitForm()
    const second = wrapper.vm.submitForm()
    await flushPromises()
    expect(api.post).toHaveBeenCalledOnce()
    finishSave({})
    await Promise.all([first, second])
    wrapper.unmount()
  })

  it.each([[0, '保存草稿'], [1, '发布文章']])('submits explicit status %i from its action button and omits an empty id', async (status, label) => {
    const api = { post: vi.fn().mockResolvedValue({ data: { code: '20001' } }) }
    const wrapper = mountEditor({ api })
    await wrapper.setData({ editForm: { id: '', title: '标题', description: '', content: '# 内容', status: 0 } })
    await wrapper.findAll('button').find(button => button.text() === label).trigger('click')
    await flushPromises()
    expect(api.post).toHaveBeenCalledWith('/blog/edit', { title: '标题', description: '', content: '# 内容', status })
    expect(wrapper.vm.hasChanges).toBe(false)
    wrapper.unmount()
  })

  it.each([0, 1])('restores status %i and resets content to the loaded article', async status => {
    const blog = { id: 12, userId: 7, title: '已有文章', description: '', content: '原文', status }
    const wrapper = mountEditor({ route: reactive({ params: { blogId: '12' } }), api: { get: vi.fn().mockResolvedValue({ data: { data: blog } }) } })
    await flushPromises()
    expect(wrapper.vm.editForm.status).toBe(status)
    await wrapper.setData({ editForm: { ...wrapper.vm.editForm, content: '新文', status: status === 1 ? 0 : 1 } })
    await wrapper.findAll('button').find(button => button.text() === '重置').trigger('click')
    expect(wrapper.vm.editForm.content).toBe('原文')
    expect(wrapper.vm.editForm.status).toBe(status)
    expect(wrapper.vm.hasChanges).toBe(false)
    wrapper.unmount()
  })

  it('validates the real form limits and allows an empty summary', async () => {
    const api = { post: vi.fn().mockResolvedValue({}) }
    const wrapper = mountEditor({ api, realValidation: true })
    await wrapper.setData({ editForm: { id: '', title: 'a'.repeat(256), description: '', content: '正文', status: 0 } })
    await wrapper.vm.submitForm(0)
    expect(api.post).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('标题不能超过 255 个字符')
    await wrapper.setData({ editForm: { ...wrapper.vm.editForm, title: 'a'.repeat(255) } })
    await wrapper.vm.submitForm(0)
    expect(api.post).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
})
