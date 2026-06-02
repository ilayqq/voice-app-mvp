const DEFAULT_API_BASE_URL = 'https://sam.x64.kz/api/v1'
const AUTH_API_BASE_URL = 'https://sam.x64.kz/api'
// const AUTH_API_BASE_URL = 'http://localhost:8080'
// const DEFAULT_API_BASE_URL = 'http://localhost:8080/v1'

export const API_CONFIG = {
  get baseURL(): string {
    return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
  },

  getBaseURL(): string {
    return this.baseURL
  },

  getAuthBaseURL(): string {
    return AUTH_API_BASE_URL
  }
}

export default API_CONFIG

