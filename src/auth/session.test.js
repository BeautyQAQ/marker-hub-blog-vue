import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAppStore } from '../store'
import { restoreSession } from './session'

beforeEach(() => { localStorage.clear(); sessionStorage.clear() })

function signedInStore() {
  const store = createAppStore()
  store.commit('SET_TOKEN', 'existing-token')
  store.commit('SET_USERINFO', { id: 7, username: '旧名称' })
  return store
}

describe('identity verification after a reload', () => {
  it('refreshes the safe profile from /me', async () => {
    const store = signedInStore()
    const api = { get: vi.fn().mockResolvedValue({ data: { data: { id: 7, username: '新名称' } } }) }
    await restoreSession(store, api)
    expect(api.get).toHaveBeenCalledWith('/me', expect.objectContaining({ skipAuthRedirect: true, silent: true }))
    expect(store.getters.getUser.username).toBe('新名称')
    expect(JSON.parse(localStorage.getItem('userInfo')).username).toBe('新名称')
  })

  it('retains the cached identity and token when the network is unavailable', async () => {
    const store = signedInStore()
    await restoreSession(store, { get: vi.fn().mockRejectedValue(new Error('offline')) })
    expect(store.state.token).toBe('existing-token')
    expect(store.getters.getUser.id).toBe(7)
  })

  it.each([401, 403])('clears a session that /me rejects with HTTP %i', async status => {
    const store = signedInStore()
    await restoreSession(store, { get: vi.fn().mockRejectedValue({ response: { status } }) })
    expect(store.getters.isAuthenticated).toBe(false)
    expect(store.getters.getUser).toEqual({})
  })

  it('does not overwrite a newer login when an older verification finishes late', async () => {
    const store = signedInStore()
    let finish
    const pending = restoreSession(store, { get: () => new Promise(resolve => { finish = resolve }) })
    store.commit('SET_TOKEN', 'new-token')
    store.commit('SET_USERINFO', { id: 8, username: '新用户' })
    finish({ data: { data: { id: 7, username: '旧用户' } } })
    await pending
    expect(store.getters.getUser.id).toBe(8)
  })
})
