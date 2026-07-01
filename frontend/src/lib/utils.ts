import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function handleApiError(err: unknown, defaultMessage = "An error occurred. Please try again."): string {
  const e = err as { response?: { data?: { detail?: string | Array<{ msg: string }> } } }
  const detail = e?.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ")
  return defaultMessage
}
