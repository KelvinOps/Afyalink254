// ============================================
// FILE 1: src/components/ui/toaster.tsx
// ============================================
"use client"

import { ToastProvider, ToastViewport } from "@/app/components/ui/toast"

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}