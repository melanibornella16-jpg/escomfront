// src/services/profesores.ts
// Patrón: token por argumento, throw en error. Normaliza listado y expone CRUD por /usuario.

const BASE = import.meta.env.VITE_API_URL || '' // ej: http://localhost:8000/api/v2

export type Profesor = {
  id: number
  name: string
  email: string
  dni?: string | null
  domicilio?: string | null
  id_localidad?: number | null
  telefono?: string | null
  activo?: 'S' | 'N'
  rol?: string // en la DB puede venir 'D' o lo que guardes
}

export type CrearProfesorDTO = {
  name: string
  email: string
  password: string
  dni: string
  domicilio?: string
  id_localidad?: number
  telefono?: string
  rol?: string // vamos a mandar 'D'
}

export type ActualizarProfesorDTO = Partial<CrearProfesorDTO> & {
  activo?: string
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// ---- safeMsg: compone mensajes de validación Laravel en texto legible
async function safeMsg(res: Response) {
  try {
    const j = (await res.json()) as any

    const parts: string[] = []
    if (j && typeof j === 'object') {
      if (j.message && typeof j.message === 'string') parts.push(j.message)

      if (j.errors && typeof j.errors === 'object') {
        for (const [field, arr] of Object.entries(j.errors)) {
          if (Array.isArray(arr)) parts.push(`${field}: ${arr.join(' ')}`)
        }
      }
    }

    if (parts.length) return parts.join(' | ')
    return j?.message || j?.error || res.statusText
  } catch {
    return res.statusText
  }
}

/** Busca array en estructuras comunes o anidadas (profundidad 2) */
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

function normalizeList(raw: any): Profesor[] {
  // caso simple: ya es array
  if (Array.isArray(raw)) return raw

  // probá claves típicas
  const keys = ['data', 'items', 'usuarios', 'profesores', 'results', 'list', 'rows', 'payload', 'response'] as const
  for (const k of keys) {
    const v: any = raw?.[k]
    if (Array.isArray(v)) return v
    if (v && Array.isArray(v?.data)) return v.data
  }

  // búsqueda recursiva superficial
  const deep = findFirstArrayDeep(raw, 2)
  if (deep) return deep as Profesor[]

  console.warn('[profesores.ts] No se encontró lista en la respuesta. Raw:', raw)
  return []
}

/** LISTAR profesores (rol = D) => siempre devuelve Profesor[] */
export async function listarProfesores(token: string): Promise<Profesor[]> {
  const res = await fetch(`${BASE}/usuario/rol/D`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) }
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo listar profesores')

  const raw = await res.json()
  return normalizeList(raw)
}

/** OBTENER uno (no la estás usando todavía en la vista, pero la dejo defensiva) */
export async function obtenerProfesor(token: string, id: number): Promise<Profesor> {
  const res = await fetch(`${BASE}/usuario/${id}`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) }
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo obtener el profesor')

  // tu backend hace: return response()->json(['message' => $registro],200);
  const raw = await res.json() as any
  return (raw.message ?? raw) as Profesor
}

/** CREAR profesor */
export async function crearProfesor(token: string, payload: CrearProfesorDTO): Promise<Profesor> {
  const resCreate = await fetch(`${BASE}/usuario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  })

  if (!resCreate.ok) {
    throw new Error((await safeMsg(resCreate)) || 'No se pudo crear el usuario')
  }

  // backend responde { "user": { ...campos... } }
  const data = await resCreate.json() as any
  const usuario = data.user ?? data

  console.log('✅ creado OK ->', usuario)

  return usuario as Profesor
}

/** ACTUALIZAR profesor */
export async function actualizarProfesor(token: string, id: number, payload: ActualizarProfesorDTO): Promise<Profesor> {
  const res = await fetch(`${BASE}/usuario/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo actualizar el profesor')

  // backend responde { message: 'Registro modificado...', user: {...} }
  const data = await res.json() as any
  const usuarioActualizado = data.user ?? data

  return usuarioActualizado as Profesor
}

/** ELIMINAR profesor */
export async function eliminarProfesor(token: string, id: number): Promise<{ deleted: boolean } | any> {
  const res = await fetch(`${BASE}/usuario/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth(token) }
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo eliminar el profesor')

  try {
    return await res.json()
  } catch {
    return { deleted: true }
  }
}
