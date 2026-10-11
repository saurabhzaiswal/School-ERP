import axios from 'axios'

let csrfToken = ''
const client = axios.create({ baseURL: '/api', withCredentials: true, timeout: 15000 })

client.interceptors.request.use((config) => {
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase()) && csrfToken) {
    config.headers['x-csrf-token'] = csrfToken
  }
  return config
})

client.interceptors.response.use(
  (response) => {
    if (response.headers['x-csrf-token']) csrfToken = response.headers['x-csrf-token']
    return response
  },
  async (error) => {
    if (error.response?.headers?.['x-csrf-token']) csrfToken = error.response.headers['x-csrf-token']
    const endpoint = String(error.config?.url || '')
    if (error.response?.status === 401 && !['/auth/login', '/auth/profile'].includes(endpoint)) {
      csrfToken = ''
      const [{ useSessionStore }, { default: router }] = await Promise.all([import('./stores/session'), import('./router')])
      useSessionStore().clear()
      if (router.currentRoute.value.path !== '/login') await router.replace({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
    }
    const raw = error.response?.data?.message
    const message = Array.isArray(raw)
      ? raw.join('; ')
      : raw ||
        (error.code === 'ECONNABORTED' ? 'The request timed out. Please retry.' : error.message)
    const normalized = new Error(message)
    normalized.status = error.response?.status
    return Promise.reject(normalized)
  },
)

export async function api(path, options = {}) {
  const { body, ...config } = options
  const response = await client.request({
    url: path,
    data: typeof body === 'string' ? JSON.parse(body) : body,
    ...config,
  })
  return response.data
}

export function params(data) {
  return new URLSearchParams(
    Object.entries(data).filter(([, value]) => value !== '' && value != null),
  ).toString()
}

export default client
