const BASE = import.meta.env.VITE_API_URL || ''

export type TurnoExamen = {
  id: number
  nombre: string
  estado: 'A' | 'N'
  prox_orden: number
  vista: number | string
  fecha_inscripcion?: string | null
}

export type CrearTurnoExamenDTO = {
  nombre: string
  estado: 'A' | 'N'
  prox_orden?: number
  vista: number | string
  fecha_inscripcion?: string | null
}

export type ActualizarTurnoExamenDTO = Partial<CrearTurnoExamenDTO>

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
        // Laravel validator: { message: { campo: [..] } }
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

function normalizeList(raw: any): TurnoExamen[] {
  if (Array.isArray(raw)) return raw
  const v = raw?.message ?? raw?.data ?? raw
  return Array.isArray(v) ? (v as TurnoExamen[]) : []
}

export async function listarTurnosExamen(token: string): Promise<TurnoExamen[]> {
  const res = await fetch(`${BASE}/turno`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudieron listar los turnos')
  return normalizeList(await res.json())
}

export async function crearTurnoExamen(token: string, payload: CrearTurnoExamenDTO) {
  const res = await fetch(`${BASE}/turno`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo crear el turno')
  return res.json()
}

export async function actualizarTurnoExamen(token: string, id: number, payload: CrearTurnoExamenDTO) {
  const res = await fetch(`${BASE}/turno/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo actualizar el turno')
  return res.json()
}

export async function eliminarTurnoExamen(token: string, id: number) {
  const res = await fetch(`${BASE}/turno/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo eliminar el turno')
  return res.json().catch(() => ({ deleted: true }))
}
