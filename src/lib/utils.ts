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

/**
 * Valida que un campo dinámico cumpla con las reglas estrictas:
 * 1. La primera letra debe ser mayúscula.
 * 2. Las demás letras deben ser minúsculas, a menos que sean parte de una abreviatura (contengan puntos, ej: S.A.A.C.).
 */
export function validateDynamicFieldValue(text: string): { valid: boolean; error?: string } {
  if (!text) return { valid: true }
  const trimmed = text.trim()
  if (!trimmed) return { valid: true }

  const firstChar = trimmed.charAt(0)
  // Si empieza con una letra y está en minúscula
  if (firstChar.toLowerCase() === firstChar && firstChar.toUpperCase() !== firstChar) {
    return { valid: false, error: "El texto debe comenzar con mayúscula inicial." }
  }

  const words = trimmed.split(/\s+/)
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    // Skip words without uppercase letters
    if (!/[A-ZÁÉÍÓÚÑÜ]/.test(word)) continue

    // For the first word, the first letter is allowed to be uppercase
    if (i === 0) {
      const restOfWord = word.slice(1)
      if (/[A-ZÁÉÍÓÚÑÜ]/.test(restOfWord) && !word.includes('.')) {
        return { valid: false, error: `La palabra "${word}" tiene mayúsculas indebidas. Si es una abreviatura, debe contener puntos (ej: S.A.A.C.).` }
      }
    } else {
      // For other words, any uppercase means it must contain a dot (abbreviation)
      if (!word.includes('.')) {
        return { valid: false, error: `La palabra "${word}" no debe llevar mayúsculas. Solo se permiten en la primera palabra o en abreviaturas con puntos (ej: S.A.A.C.).` }
      }
    }
  }

  return { valid: true }
}
