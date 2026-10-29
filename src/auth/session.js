export async function restoreSession(store, api) {
  const token = store.state.token
  if (!token) return
  try {
    const response = await api.get('/me', { timeout: 3000, silent: true, skipAuthRedirect: true })
    if (store.state.token !== token) return
    const user = response.data.data
    if (user && user.id != null) store.commit('SET_USERINFO', user)
  } catch (error) {
    // A temporarily unavailable backend must not discard a persisted session.
    if ([401, 403].includes(error.response?.status) && store.state.token === token) store.commit('REMOVE_INFO')
  }
}
