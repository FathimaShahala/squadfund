import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // sends the httpOnly refresh cookie
})

// Access token lives in memory only (safer than localStorage).
// On page reload, AuthContext gets a new one using the refresh cookie.
let accessToken = null
export const setAccessToken = (token) => {
  accessToken = token
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// If a request fails with 401, refresh the token once and retry it.
let refreshing = null
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isAuthCall = original?.url?.startsWith('/auth/')

    if (error.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        refreshing ??= api.post('/auth/refresh').finally(() => (refreshing = null))
        const { data } = await refreshing
        setAccessToken(data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        setAccessToken(null)
        window.dispatchEvent(new Event('auth:logout'))
      }
    }
    return Promise.reject(error)
  }
)

export default api
