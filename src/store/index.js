import { createStore } from 'vuex'

function readUser(storage, legacyStorage) {
  try {
    const user = JSON.parse(storage.getItem('userInfo') || legacyStorage?.getItem('userInfo') || '{}')
    return user && typeof user === 'object' && !Array.isArray(user) ? user : {}
  } catch {
    return {}
  }
}

export function createAppStore(storage = localStorage, legacyStorage = sessionStorage) {
  const savedToken = storage.getItem('token')
  const token = savedToken && !['undefined', 'null'].includes(savedToken) ? savedToken : ''
  const userInfo = readUser(storage, legacyStorage)
  if (token && Object.keys(userInfo).length) {
    storage.setItem('userInfo', JSON.stringify(userInfo))
    legacyStorage?.removeItem('userInfo')
  }
  return createStore({
    state: () => ({ token, userInfo }),
    mutations: {
      SET_TOKEN(state, value) {
        state.token = typeof value === 'string' ? value : ''
        if (state.token) storage.setItem('token', state.token)
        else storage.removeItem('token')
      },
      SET_USERINFO(state, user) {
        state.userInfo = user && typeof user === 'object' && !Array.isArray(user) ? user : {}
        storage.setItem('userInfo', JSON.stringify(state.userInfo))
        legacyStorage?.removeItem('userInfo')
      },
      REMOVE_INFO(state) {
        state.token = ''
        state.userInfo = {}
        storage.removeItem('token')
        storage.removeItem('userInfo')
        legacyStorage?.removeItem('userInfo')
      }
    },
    getters: {
      getUser: state => state.userInfo,
      isAuthenticated: state => Boolean(state.token)
    }
  })
}

export default createAppStore()
