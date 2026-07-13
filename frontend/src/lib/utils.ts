import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleApiError(error: unknown, defaultMessage = "An error occurred. Please try again."): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === "string") {
      return detail
    }
    if (Array.isArray(detail)) {
      return detail.map((e: { msg?: string }) => e.msg).filter(Boolean).join("; ")
    }
  }
  return (error as Error)?.message || defaultMessage
}

export function getImageUrl(url?: string): string {
  if (!url) return ""
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url
  }
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
  const serverRoot = apiBase.replace("/api/v1", "")
  return `${serverRoot}${url.startsWith("/") ? "" : "/"}${url}`
}
