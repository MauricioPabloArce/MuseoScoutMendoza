"use client"

import { useState } from "react"
import { X, ZoomIn } from "lucide-react"

export default function ImageLightbox({ 
  src, 
  alt, 
  caption, 
  className 
}: { 
  src: string; 
  alt: string; 
  caption?: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div 
        className={`relative group cursor-zoom-in ${className || ''}`}
        onClick={() => setIsOpen(true)}
      >
        <img 
          src={src} 
          alt={alt}
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
          <ZoomIn className="text-white drop-shadow-md" size={32} />
        </div>
        {caption && (
          <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <p className="text-sm md:text-base font-medium">{caption}</p>
          </figcaption>
        )}
      </div>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(false)
            }}
          >
            <X size={32} />
          </button>
          
          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img 
              src={src} 
              alt={alt}
              className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            {caption && (
              <p className="text-white mt-4 text-lg font-medium text-center">{caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
