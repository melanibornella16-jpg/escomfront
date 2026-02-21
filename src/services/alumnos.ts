// src/services/alumnos.ts

const BASE = import.meta.env.VITE_API_URL || '' // ej: http://localhost:8000/api/v2

export type Alumno = {
  id: number
  name: string
  email: string
  dni?: string | null
  domicilio?: string | null
  id_localidad?: number | null
  telefono?: string | null
  activo?: 'S' | 'N'
  // rol no es estrictamente necesario para pintar la tabla, pero lo podrías agregar si querés
  rol?: string
}

export type CrearAlumnoDTO = {
  name: string
  email: string
  password: string
  dni?: string
  domicilio?: string
  id_localidad?: number
  telefono?: string
  activo?: 'S' | 'N'
  rol?: string // le vamos a mandar 'E'
}

export type ActualizarAlumnoDTO = Partial<CrearAlumnoDTO>

function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

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

function normalizeList(raw: any): Alumno[] {
  if (Array.isArray(raw)) return raw
  const keys = ['data', 'items', 'usuarios', 'alumnos', 'results', 'list', 'rows', 'payload', 'response'] as const
  for (const k of keys) {
    const v: any = raw?.[k]
    if (Array.isArray(v)) return v
    if (v && Array.isArray(v?.data)) return v.data
  }
  const deep = findFirstArrayDeep(raw, 2)
  if (deep) return deep as Alumno[]
  console.warn('[alumnos.ts] No se encontró lista en la respuesta. Raw:', raw)
  return []
}

/** LISTAR alumnos (rol = E) => siempre devuelve Alumno[] */
export async function listarAlumnos(token: string): Promise<Alumno[]> {
  const res = await fetch(`${BASE}/usuario/rol/E`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) }
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo listar alumnos')

  const raw = await res.json()
  return normalizeList(raw)
}

/** OBTENER uno */
export async function obtenerAlumno(token: string, id: number): Promise<Alumno> {
  const res = await fetch(`${BASE}/usuario/${id}`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) }
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo obtener el alumno')

  // el back responde { message: {...} } o directo
  const j = await res.json()
  return (j?.message ?? j) as Alumno
}

/** CREAR alumno */
export async function crearAlumno(token: string, payload: CrearAlumnoDTO): Promise<Alumno> {
  const resCreate = await fetch(`${BASE}/usuario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload)
  })

  if (!resCreate.ok) {
    throw new Error((await safeMsg(resCreate)) || 'No se pudo crear el alumno')
  }

  // backend responde { user: {...} }
  const data = await resCreate.json() as any
  const usuario = data.user ?? data

  console.log('✅ alumno creado OK ->', usuario)

  return usuario as Alumno
}

/** ACTUALIZAR alumno */
export async function actualizarAlumno(token: string, id: number, payload: ActualizarAlumnoDTO): Promise<Alumno> {
  const res = await fetch(`${BASE}/usuario/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    throw new Error((await safeMsg(res)) || 'No se pudo actualizar el alumno')
  }

  // backend responde { message: '...', user: {...} }
  const j = await res.json() as any
  const usuarioActualizado = j.user ?? j

  return usuarioActualizado as Alumno
}

/** ELIMINAR alumno */
export async function eliminarAlumno(token: string, id: number): Promise<{ deleted: boolean } | any> {
  const res = await fetch(`${BASE}/usuario/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth(token) }
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo eliminar el alumno')

  try {
    return await res.json()
  } catch {
    return { deleted: true }
  }
}
