export const APP_BASE = import.meta.env.VITE_APP_BASE || 'VITE_APP_BASE_PLACEHOLDER'

let APP_URL_IN = import.meta.env.VITE_APP_FULL_URL || 'VITE_APP_FULL_URL_PLACEHOLDER'
export const APP_URL = APP_URL_IN.endsWith('/') ? APP_URL_IN : `${APP_URL_IN}/`

export const API_BASE = import.meta.env.VITE_APP_API_URL || 'VITE_APP_API_URL_PLACEHOLDER'
export const ENDPOINTS = {
  openapi: `${API_BASE}/openapi.json`,
  fim: `${API_BASE}/fim`,
  historicalQuantiles: `${API_BASE}/timeseries/historical-quantiles`
}
