/**
 * Normaliza un string para busquedas: minusculas, sin acentos, sin espacios extra.
 */
export function norm(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
