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
      {/* Thumbnail */}
      <div
        className={`cursor-zoom-in group ${className || ''}`}
        onClick={() => setIsOpen(true)}
      >
        <div className="relative w-full h-full overflow-hidden">
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
          </div>
        </div>
        {caption && (
          <p className="text-xs text-gray-500 mt-1 px-1 text-center leading-snug">{caption}</p>
        )}
      </div>

      {/* Lightbox Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors z-10"
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
