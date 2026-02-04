// src/app/components/Viewport.tsx
'use client'

import { useEffect } from 'react'

export function Viewport() {
  useEffect(() => {
    // Set viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (!viewportMeta) {
      const meta = document.createElement('meta')
      meta.name = 'viewport'
      meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover'
      document.head.appendChild(meta)
    } else {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover')
    }
  }, [])

  return null
}