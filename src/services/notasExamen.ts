const BASE = import.meta.env.VITE_API_URL || ''

export type AlumnoInscripto = {
  id: number // id de inscripción
  alumno_id: number
  alumno_nombre: string
  materia_id: number | null
  materia_nombre: string
  carrera_nombre: string
}

export type InscripcionUpdateDTO = {
  id_user: number
  id_materia: number
  id_examen: number
  fecha: string // fecha de inscripción (YYYY-MM-DD)
  nro_orden: number
  cursada: string // '0'/'1' o lo que uses
  fecha_rindio?: string | null
  calificacion?: number | null
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

async function safeMsg(res: Response) {
  try {
    const j = (await res.json()) as any
    const parts: string[] = []

    if (j && typeof j === 'object') {
      if (typeof j.message === 'string') parts.push(j.message)
      if (j.message && typeof j.message === 'object') {
        for (const [field, arr] of Object.entries(j.message)) {
          if (Array.isArray(arr)) parts.push(`${field}: ${arr.join(' ')}`)
        }
      }
      if (j.errors && typeof j.errors === 'object') {
        for (const [field, arr] of Object.entries(j.errors)) {
          if (Array.isArray(arr)) parts.push(`${field}: ${arr.join(' ')}`)
        }
      }
    }

    return parts.length ? parts.join(' | ') : j?.message || j?.error || res.statusText
  } catch {
    return res.statusText
  }
}

function normalizeList(raw: any): AlumnoInscripto[] {
  if (Array.isArray(raw)) return raw
  const v = raw?.message ?? raw?.data ?? raw
  return Array.isArray(v) ? (v as AlumnoInscripto[]) : []
}

/**
 * Trae alumnos inscriptos a una mesa (examen)
 * GET /examen/inscripcion/mesa/{id}
 */
export async function listarAlumnosInscriptos(token: string, examenId: number): Promise<AlumnoInscripto[]> {
  const res = await fetch(`${BASE}/examen/inscripcion/mesa/${examenId}`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudieron listar los inscriptos')
  return normalizeList(await res.json())
}

/**
 * Filtra inscriptos por materia dentro de la misma mesa
 * GET /examen/inscripcion/mesa/{id}/materia/{idMat}
 */
export async function listarAlumnosInscriptosMateria(
  token: string,
  examenId: number,
  materiaId: number,
): Promise<AlumnoInscripto[]> {
  const res = await fetch(`${BASE}/examen/inscripcion/mesa/${examenId}/materia/${materiaId}`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudieron listar los inscriptos de la materia')
  return normalizeList(await res.json())
}

/**
 * Actualiza inscripción (incluye nota y fecha_rindio)
 * PUT /examen/inscripcion/{id}
 */
export async function actualizarInscripcion(token: string, inscripcionId: number, payload: InscripcionUpdateDTO) {
  const res = await fetch(`${BASE}/examen/inscripcion/${inscripcionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo actualizar la inscripción')
  return res.json()
}

export type InscripcionRaw = {
  id: number
  id_user: number
  id_materia: number
  id_examen: number
  fecha: string
  nro_orden: number
  cursada: string
  fecha_rindio?: string | null
  calificacion?: number | null
}

/** OBTENER inscripción cruda (para completar payload de update) */
export async function obtenerInscripcion(token: string, inscripcionId: number): Promise<InscripcionRaw> {
  const res = await fetch(`${BASE}/examen/inscripcion/${inscripcionId}`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo obtener la inscripción')
  const raw = (await res.json()) as any
  return (raw?.message ?? raw) as InscripcionRaw
}
