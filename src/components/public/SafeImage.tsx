"use client"

import { useState } from "react"

export default function SafeImage({ src, alt, className, fallbackPrefix }: { src: string, alt: string, className?: string, fallbackPrefix?: string }) {
  const [error, setError] = useState(false)

  if (error || !src) {
    if (fallbackPrefix) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 group-hover:bg-gray-100 transition-colors">
          <span className="font-serif text-3xl font-bold opacity-30">{fallbackPrefix}</span>
        </div>
      )
    }
    return null
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      onError={() => setError(true)} 
    />
  )
}
