import * as React from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      // Simple alert-based toast for now
      if (variant === "destructive") {
        alert(`❌ ${title}\n${description}`);
      } else {
        alert(`✓ ${title}\n${description}`);
      }
    }
  }
}
