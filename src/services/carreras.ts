// src/services/carreras.ts

const BASE = import.meta.env.VITE_API_URL || '' // ej http://localhost:8000/api/v2

export type Carrera = {
  id: number
  nombre: string
  abreviado?: string | null
  activa: 'S' | 'N'
  cant_anios: number
}

export type CrearCarreraDTO = {
  nombre: string
  abreviado?: string | null
  activa: 'S' | 'N'
  cant_anios: number
}
export type ActualizarCarreraDTO = Partial<CrearCarreraDTO>

function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// genera mensaje de error legible (422, etc)
async function safeMsg(res: Response) {
  try {
    const j = (await res.json()) as any
    const parts: string[] = []

    // a) "message" string
    if (j && typeof j === 'object') {
      if (typeof j.message === 'string') parts.push(j.message)
    }

    // b) "errors" tipo { campo: ["error1", "error2"] }
    if (j?.errors && typeof j.errors === 'object') {
      for (const [field, arr] of Object.entries(j.errors)) {
        if (Array.isArray(arr)) parts.push(`${field}: ${arr.join(' ')}`)
      }
    }

    // c) message es objeto con mensajes de validación (Laravel Validator::messages())
    // ej { message: { nombre: ["El nombre..."], ... } }
    if (j?.message && typeof j.message === 'object') {
      for (const [field, arr] of Object.entries(j.message)) {
        if (Array.isArray(arr)) parts.push(`${field}: ${arr.join(' ')}`)
      }
    }

    if (parts.length) return parts.join(' | ')
    return j?.message || j?.error || res.statusText
  } catch {
    return res.statusText
  }
}

// intenta encontrar array de carreras en varias formas
function findFirstArrayDeep(obj: any, maxDepth = 2): any[] | null {
  if (!obj || typeof obj !== 'object' || maxDepth < 0) return null
  if (Array.isArray(obj)) return obj
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) return v as any[]
    if (v && typeof v === 'object') {
      const found = findFirstArrayDeep(v, maxDepth - 1)
      if (found) return found
    }
  }
  return null
}

function normalizeList(raw: any): Carrera[] {
  if (Array.isArray(raw)) return raw

  const keys = [
    'data',
    'items',
    'carreras',
    'results',
    'list',
    'rows',
    'payload',
    'response',
    'message'
  ] as const

  for (const k of keys) {
    const v: any = raw?.[k]
    if (Array.isArray(v)) return v
    if (v && Array.isArray(v?.data)) return v.data
  }

  const deep = findFirstArrayDeep(raw, 2)
  if (deep) return deep as Carrera[]

  console.warn('[carreras.ts] No se encontró lista en la respuesta. Raw:', raw)
  return []
}

/** LISTAR carreras => Carrera[] */
export async function listarCarreras(token: string): Promise<Carrera[]> {
  const res = await fetch(`${BASE}/carrera`, {
    headers: {
      'Content-Type': 'application/json',
      ...auth(token)
    }
  })

  if (!res.ok) {
    throw new Error((await safeMsg(res)) || 'No se pudieron listar carreras')
  }

  // puede venir {message: {...pagination...}} con "data",
  // puede venir {message: [ ... ]}, puede venir array directo
  const raw = await res.json()
  return normalizeList(raw)
}

/** CREAR carrera => devuelve Carrera creada */
export async function crearCarrera(
  token: string,
  payload: CrearCarreraDTO
): Promise<Carrera> {
  const res = await fetch(`${BASE}/carrera`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...auth(token)
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    throw new Error((await safeMsg(res)) || 'No se pudo crear la carrera')
  }

  const j = (await res.json()) as any
  // esperable: { carrera: {...} } ó { message: {...} } ó {...}
  return j?.carrera ?? j?.data ?? (typeof j?.message === 'object' ? j.message : j)
}

/** ACTUALIZAR carrera => devuelve Carrera actualizada */
export async function actualizarCarrera(
  token: string,
  id: number,
  payload: ActualizarCarreraDTO
): Promise<Carrera> {
  const res = await fetch(`${BASE}/carrera/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...auth(token)
    },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    throw new Error((await safeMsg(res)) || 'No se pudo actualizar la carrera')
  }

  const j = (await res.json()) as any
  return j?.carrera ?? j?.data ?? (typeof j?.message === 'object' ? j.message : j)
}

/** ELIMINAR carrera */
export async function eliminarCarrera(
  token: string,
  id: number
): Promise<{ deleted: boolean } | any> {
  const res = await fetch(`${BASE}/carrera/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...auth(token)
    }
  })

  if (!res.ok) {
    throw new Error((await safeMsg(res)) || 'No se pudo eliminar la carrera')
  }

  // muchas APIs devuelven sólo {message:"..."} o vacío
  try {
    return await res.json()
  } catch {
    return { deleted: true }
  }
}
