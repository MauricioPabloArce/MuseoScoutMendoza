
function validateDynamicFieldValue(text) {
  if (!text) return { valid: true }
  const trimmed = text.trim()
  if (!trimmed) return { valid: true }

  const firstChar = trimmed.charAt(0)
  if (firstChar.toLowerCase() === firstChar && firstChar.toUpperCase() !== firstChar) {
    return { valid: false, error: "El texto debe comenzar con mayúscula inicial." }
  }

  const words = trimmed.split(/\s+/)
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    if (!/[A-ZÁÉÍÓÚÑÜ]/.test(word)) continue

    if (i === 0) {
      const restOfWord = word.slice(1)
      if (/[A-ZÁÉÍÓÚÑÜ]/.test(restOfWord) && !word.includes(".")) {
        return { valid: false, error: `La palabra "${word}" tiene mayúsculas indebidas. Si es una abreviatura, debe contener puntos (ej: S.A.A.C.).` }
      }
    } else {
      if (!word.includes(".")) {
        return { valid: false, error: `La palabra "${word}" no debe llevar mayúsculas. Solo se permiten en la primera palabra o en abreviaturas con puntos (ej: S.A.A.C.).` }
      }
    }
  }

  return { valid: true }
}

console.log(validateDynamicFieldValue("S.A.A.C."));
console.log(validateDynamicFieldValue("Hola mundo"));
console.log(validateDynamicFieldValue("Hola S.A.A.C."));
console.log(validateDynamicFieldValue("hola mundo"));
console.log(validateDynamicFieldValue("Hola Mundo"));
console.log(validateDynamicFieldValue("HOLA mundo"));

