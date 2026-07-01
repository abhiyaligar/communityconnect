import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import axios from "axios"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleApiError(error: unknown, defaultMessage = "An error occurred. Please try again."): string {
  if (axios.isAxiosError(error)) {
    if (typeof error.response?.data?.detail === "string") {
      return error.response.data.detail
    }
  }
  return (error as Error)?.message || defaultMessage
}
