import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convierte un texto a Sentence case:
 * Primera letra de la frase en mayúscula, el resto en minúscula.
 * No modifica valores vacíos, nulos o undefined.
 */
export function toSentenceCase(text: string | null | undefined): string {
  if (!text) return text as string
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
}

/**
 * Igual que toSentenceCase pero preserva las palabras que el usuario
 * escribió después de la primera (no fuerza minúsculas en el resto).
 * Útil para nombres propios dentro de un campo de descripción larga.
 */
export function toSentenceCasePreserve(text: string | null | undefined): string {
  if (!text) return text as string
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}
