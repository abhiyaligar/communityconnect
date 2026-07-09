import axios from "axios"
import { toast } from "sonner"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
const MAX_RETRIES = 3

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // for HttpOnly refresh cookie
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor — attach access token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Helper to check if an error is transient/retryable
function isRetryableError(error: any) {
  // 1. No response received (e.g. network disconnect, DNS error, timeout)
  if (!error.response) {
    return true
  }

  const status = error.response.status
  // 2. Rate limit (429) or Server errors (500, 502, 503, 504)
  return status === 429 || (status >= 500 && status <= 504)
}

// Helper to determine if a request method is safe to retry
function isSafeToRetry(config: any) {
  const method = config.method?.toLowerCase()
  // GET is safe. Other methods (POST/PUT/DELETE) are only retryable if there was no response
  // (meaning the request likely didn't process on the server yet).
  return method === "get"
}

// Response interceptor — auto-refresh token on 401 & retry transient failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(error)
    }

    // 1. Response interceptor — auto-refresh token on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/token/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = res.data.access_token
        localStorage.setItem("access_token", newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        window.location.href = "/login"
        return Promise.reject(error)
      }
    }

    // 2. Transient Error Retry Logic (Network drops, Server 5xx, Rate Limits)
    originalRequest._retryCount = originalRequest._retryCount || 0

    const isRetryable = isRetryableError(error)
    const isSafe = isSafeToRetry(originalRequest) || !error.response

    if (isRetryable && isSafe && originalRequest._retryCount < MAX_RETRIES) {
      originalRequest._retryCount += 1

      // Calculate exponential backoff delay with minor jitter (up to 500ms)
      const backoffDelay = Math.pow(2, originalRequest._retryCount) * 1000 + Math.random() * 500

      const errorMsg = !error.response
        ? "Network connection issue"
        : `Server error (${error.response.status})`

      // Visual feedback via Sonner toast (deduplicated by request url)
      toast.warning(
        `${errorMsg}. Retrying... (Attempt ${originalRequest._retryCount} of ${MAX_RETRIES})`,
        {
          id: `retry-${originalRequest.url}`,
          duration: Math.max(backoffDelay, 2500),
        }
      )

      // Delay execution
      await new Promise((resolve) => setTimeout(resolve, backoffDelay))

      // Resubmit request
      return api(originalRequest)
    }

    return Promise.reject(error)
  }
)

export default api

