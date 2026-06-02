import API_CONFIG from '../config/api'

/** Origin бэкенда без суффикса /v1 — для статики /uploads/... */
export function getServerOrigin(): string {
  const base = API_CONFIG.getBaseURL().replace(/\/$/, '')
  if (base.endsWith('/v1')) {
    return base.slice(0, -3)
  }
  return API_CONFIG.getAuthBaseURL().replace(/\/$/, '')
}

/** Преобразует путь с API (/uploads/...) в полный URL для <img src>. */
export function resolveImageUrl(path?: string | null): string | undefined {
  if (!path || !path.trim()) return undefined
  if (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const origin = getServerOrigin()
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`
}
