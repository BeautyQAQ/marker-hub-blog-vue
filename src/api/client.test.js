import { describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'
import { createApiClient } from './client'

function successAdapter(data) {
  return async config => ({ config, status: 200, statusText: 'OK', headers: {}, data })
}

describe('API compatibility and failure recovery', () => {
  it.each([200, '200', '20000', '20001'])('accepts backend success code %s even with null data', async code => {
    const client = createApiClient()
    client.defaults.adapter = successAdapter({ code, msg: '成功', data: null })
    await expect(client.get('/blogs')).resolves.toMatchObject({ data: { code, data: null } })
  })

  it('sends the current token and reports top-level business errors', async () => {
    const notifyError = vi.fn()
    const client = createApiClient({ getToken: () => 'test-token', notifyError })
    client.defaults.adapter = successAdapter({ code: '40001', msg: '标题不能为空', data: null })
    await expect(client.post('/blog/edit', {})).rejects.toThrow('标题不能为空')
    expect(notifyError).toHaveBeenCalledWith('标题不能为空')
    client.defaults.adapter = successAdapter({ code: '20000', data: null })
    const response = await client.get('/blogs')
    expect(response.config.headers.Authorization).toBe('test-token')
  })

  it('handles network failures that have no HTTP response', async () => {
    const notifyError = vi.fn()
    const client = createApiClient({ notifyError })
    client.defaults.adapter = async () => { throw new AxiosError('Network Error', 'ERR_NETWORK') }
    await expect(client.get('/blogs')).rejects.toThrow('无法连接服务')
    expect(notifyError).toHaveBeenCalledOnce()
  })

  it('clears the session and redirects on HTTP 401', async () => {
    const onUnauthorized = vi.fn()
    const notifyError = vi.fn()
    const client = createApiClient({ onUnauthorized, notifyError })
    client.defaults.adapter = async config => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, { status: 401, data: { msg: 'expired' } })
    }
    await expect(client.post('/blog/edit', {})).rejects.toThrow('登录已失效')
    expect(onUnauthorized).toHaveBeenCalledOnce()
    expect(notifyError).toHaveBeenCalledWith('登录已失效，请重新登录')
  })
})

