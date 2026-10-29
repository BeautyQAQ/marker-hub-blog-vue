import { describe, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { reactive } from 'vue'
import MyBlogs from './MyBlogs.vue'

function mountManagement(query = {}) {
  const route = reactive({ query })
  const push = vi.fn(async target => { route.query = target.query })
  const get = vi.fn(async (_url, { params }) => ({ data: { data: {
    records: params.currentPage === 2
      ? [{ id: 12, title: '第二页文章', status: params.status ?? 1 }]
      : [{ id: 11, title: '第一页文章', status: params.status ?? 0 }],
    current: params.currentPage, size: 5, total: 6
  } } }))
  const wrapper = shallowMount(MyBlogs, {
    global: {
      mocks: { $route: route, $router: { push }, $axios: { get } },
      directives: { loading() {} },
      stubs: {
        BlogHeader: true,
        RouterLink: { template: '<a><slot /></a>' },
        DeleteBlogButton: { props: ['blogId'], emits: ['deleted'], template: '<button class="delete" @click="$emit(\'deleted\', blogId)">删除</button>' },
        ElPagination: { emits: ['current-change'], template: '<button class="next-page" @click="$emit(\'current-change\', 2)">下一页</button>' },
        ElAlert: { props: ['title'], template: '<p>{{ title }}</p>' },
        ElButton: true,
        ElEmpty: true
      }
    }
  })
  return { wrapper, route, get, push }
}

describe('author article management', () => {
  it('restores route state, filters on the server and resets pagination when the filter changes', async () => {
    const { wrapper, get, push } = mountManagement({ page: '2', status: '1' })
    await flushPromises()
    expect(get).toHaveBeenLastCalledWith('/my/blogs', { params: { currentPage: 2, pageSize: 5, status: 1 } })
    expect(wrapper.text()).toContain('第二页文章')
    expect(wrapper.text()).toContain('已发布')
    await wrapper.find('select').setValue('0')
    await flushPromises()
    expect(push).toHaveBeenLastCalledWith({ name: 'MyBlogs', query: { status: '0' } })
    expect(get).toHaveBeenLastCalledWith('/my/blogs', { params: { currentPage: 1, pageSize: 5, status: 0 } })
    expect(wrapper.text()).toContain('草稿')
    await wrapper.find('.next-page').trigger('click')
    await flushPromises()
    expect(get).toHaveBeenLastCalledWith('/my/blogs', { params: { currentPage: 2, pageSize: 5, status: 0 } })
    wrapper.unmount()
  })

  it('returns to the previous page after deleting the last article on a later page', async () => {
    const { wrapper, get, push } = mountManagement({ page: '2', status: '0' })
    await flushPromises()
    await wrapper.find('.delete').trigger('click')
    await flushPromises()
    expect(push).toHaveBeenLastCalledWith({ name: 'MyBlogs', query: { status: '0' } })
    expect(get).toHaveBeenLastCalledWith('/my/blogs', { params: { currentPage: 1, pageSize: 5, status: 0 } })
    expect(wrapper.text()).toContain('第一页文章')
    wrapper.unmount()
  })
})
