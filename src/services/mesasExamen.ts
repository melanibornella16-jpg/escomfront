const BASE = import.meta.env.VITE_API_URL || ''

export type MesaExamen = {
  id: number
  fecha: string
  hora: string
  turno: string
  // vienen ya “humanizados” por el backend
  materia1: string
  docente_materia1: string
  suplente_materia1: string
  materia2: string
  docente_materia2: string
  suplente_materia2: string
  materia3: string
  docente_materia3: string
  suplente_materia3: string
  suplente: string
  auxiliar1: string
  auxiliar2: string
}

export type CrearMesaExamenDTO = {
  id_materia_1: number
  id_materia_2: number
  id_materia_3: number
  id_suplente: number
  id_aux_1: number
  id_aux_2: number
  fecha: string // YYYY-MM-DD
  hora: string  // HH:mm
  id_turnoex: number
}

export type ActualizarMesaExamenDTO = CrearMesaExamenDTO

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

function normalizeList(raw: any): MesaExamen[] {
  if (Array.isArray(raw)) return raw
  const v = raw?.message ?? raw?.data ?? raw
  return Array.isArray(v) ? (v as MesaExamen[]) : []
}

export async function listarMesasExamen(token: string): Promise<{ items: MesaExamen[]; pagination?: any }>
{
  const res = await fetch(`${BASE}/examen`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudieron listar las mesas')
  const raw = await res.json()
  return { items: normalizeList(raw), pagination: raw?.pagination }
}

export async function listarMesasPorTurno(token: string, turnoId: number): Promise<{ items: MesaExamen[]; pagination?: any }>
{
  const res = await fetch(`${BASE}/examen/turno/${turnoId}`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudieron listar las mesas del turno')
  const raw = await res.json()
  return { items: normalizeList(raw), pagination: raw?.pagination }
}

export type MesaExamenRaw = {
  id: number
  id_materia_1: number
  id_materia_2: number
  id_materia_3: number
  id_suplente: number
  id_aux_1: number
  id_aux_2: number
  fecha: string
  hora: string
  id_turnoex: number
}

/** OBTENER mesa con IDs (para edición) */
export async function obtenerMesaExamen(token: string, id: number): Promise<MesaExamenRaw> {
  const res = await fetch(`${BASE}/examen/${id}`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo obtener la mesa')
  const raw = (await res.json()) as any
  return (raw?.message ?? raw) as MesaExamenRaw
}

export async function crearMesaExamen(token: string, payload: CrearMesaExamenDTO) {
  const res = await fetch(`${BASE}/examen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo crear la mesa')
  return res.json()
}

export async function actualizarMesaExamen(token: string, id: number, payload: ActualizarMesaExamenDTO) {
  const res = await fetch(`${BASE}/examen/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo actualizar la mesa')
  return res.json()
}

export async function eliminarMesaExamen(token: string, id: number) {
  const res = await fetch(`${BASE}/examen/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo eliminar la mesa')
  return res.json().catch(() => ({ deleted: true }))
}
