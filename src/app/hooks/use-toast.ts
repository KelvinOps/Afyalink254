// src/hooks/use-toast.ts
"use client"

import * as React from "react"
import { useToast as useToastContext } from "@/app/components/ui/toast"

export function useToast() {
  const context = useToastContext()
  
  const toast = React.useCallback((props: {
    title?: React.ReactNode
    description?: React.ReactNode
    variant?: "default" | "destructive"
    duration?: number
  }) => {
    return context.addToast({
      ...props,
      variant: props.variant || "default",
      duration: props.duration ?? 5000
    })
  }, [context])
  
  return { toast }
}