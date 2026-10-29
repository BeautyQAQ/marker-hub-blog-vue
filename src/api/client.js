import axios from 'axios'

const successCodes = new Set([200, '200', '20000', '20001'])

export function createApiClient({ baseURL = '/api', getToken = () => '', onUnauthorized = () => {}, notifyError = () => {} } = {}) {
  const client = axios.create({ baseURL, timeout: 10000 })
  client.interceptors.request.use(config => {
    const token = getToken()
    if (token && !config.headers.has('Authorization')) config.headers.Authorization = token
    return config
  })
  client.interceptors.response.use(response => {
    if (successCodes.has(response.data?.code)) return response
    const error = new Error(response.data?.msg || '请求失败，请稍后重试')
    error.response = response
    if (!response.config.silent) notifyError(error.message)
    return Promise.reject(error)
  }, async error => {
    const status = error.response?.status
    if (status === 401) {
      if (error.config?.skipAuthRedirect) {
        error.message = error.response?.data?.msg || '身份验证失败，请重新登录'
      } else {
        await onUnauthorized(error)
        error.message = '登录已失效，请重新登录'
      }
    } else if (status === 403) {
      error.message = '权限不足，无法访问'
    } else if (status === 404) {
      error.message = error.response?.data?.msg || '请求的接口或内容不存在'
    } else if (error.code === 'ECONNABORTED') {
      error.message = '请求超时，请稍后重试'
    } else {
      error.message = error.response?.data?.msg || (error.response ? '服务暂时不可用，请稍后重试' : '无法连接服务，请检查网络或后端服务')
    }
    if (!error.config?.silent) notifyError(error.message)
    return Promise.reject(error)
  })
  return client
}
