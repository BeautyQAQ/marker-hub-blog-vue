import { describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import DeleteBlogButton from './DeleteBlogButton.vue'

function mountDelete({ confirm = vi.fn().mockResolvedValue(), remove = vi.fn().mockResolvedValue({}) } = {}) {
  const wrapper = shallowMount(DeleteBlogButton, {
    props: { blogId: 12, title: '草稿标题' },
    global: {
      mocks: { $confirm: confirm, $axios: { delete: remove }, $message: { success: vi.fn() } },
      stubs: { ElButton: { template: '<button><slot /></button>' }, ElAlert: { props: ['title'], template: '<p>{{ title }}</p>' } }
    }
  })
  return { wrapper, confirm, remove }
}

describe('delete confirmation and retry', () => {
  it('does not delete or emit when confirmation is cancelled', async () => {
    const { wrapper, remove } = mountDelete({ confirm: vi.fn().mockRejectedValue('cancel') })
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(remove).not.toHaveBeenCalled()
    expect(wrapper.emitted('deleted')).toBeUndefined()
    expect(wrapper.vm.busy).toBe(false)
    wrapper.unmount()
  })

  it('preserves the article after failure and permits a confirmed retry', async () => {
    const remove = vi.fn().mockRejectedValueOnce(new Error('删除暂不可用')).mockResolvedValueOnce({})
    const { wrapper, confirm } = mountDelete({ remove })
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(confirm.mock.calls[0][0]).toContain('草稿标题')
    expect(remove).toHaveBeenCalledWith('/blog/12')
    expect(wrapper.text()).toContain('删除暂不可用')
    expect(wrapper.emitted('deleted')).toBeUndefined()
    await wrapper.find('button').trigger('click')
    await flushPromises()
    expect(remove).toHaveBeenCalledTimes(2)
    expect(wrapper.emitted('deleted')).toEqual([[12]])
    wrapper.unmount()
  })
})
