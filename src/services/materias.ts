const BASE = import.meta.env.VITE_API_URL || '' // ej: http://localhost:8000/api/v2

export type Materia = {
  id: number
  nombre: string
  abreviado: string
  curso: number
  cursado: string          // "0" anual | "1" cuatrimestral
  libre: 'S' | 'N'
  promociona?: 'S' | 'N'
  id_carrera: number
  id_profesor: number
  id_suplente?: number | null
}

export type CrearMateriaDTO = {
  nombre: string
  abreviado: string
  curso: number
  cursado: string
  libre: 'S' | 'N'
  promociona?: 'S' | 'N'
  id_carrera: number
  id_profesor: number
  id_suplente?: number | null
}

export type ActualizarMateriaDTO = Partial<CrearMateriaDTO>

function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// arma mensaje legible desde Laravel {errors:{campo:[...]} ...}
async function safeMsg(res: Response) {
  try {
    const j = (await res.json()) as any
    const parts: string[] = []

    if (j && typeof j === 'object') {
      if (typeof j.message === 'string') {
        parts.push(j.message)
      }

      if (j.errors && typeof j.errors === 'object') {
        for (const [field, arr] of Object.entries(j.errors)) {
          if (Array.isArray(arr)) {
            parts.push(`${field}: ${arr.join(' ')}`)
          }
        }
      }
    }

    if (parts.length) return parts.join(' | ')
    return j?.message || j?.error || res.statusText
  } catch {
    return res.statusText
  }
}

// busca el primer array en distintas formas de respuesta del backend
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

function normalizeList(raw: any): Materia[] {
  if (Array.isArray(raw)) return raw

  const keys = [
    'data',
    'items',
    'materias',
    'results',
    'list',
    'rows',
    'payload',
    'response',
    'message',
  ] as const

  for (const k of keys) {
    const v: any = raw?.[k]
    if (Array.isArray(v)) return v
    if (v && Array.isArray(v?.data)) return v.data
  }

  const deep = findFirstArrayDeep(raw, 2)
  if (deep) return deep as Materia[]

  console.warn('[materias.ts] No se encontró lista en la respuesta. Raw:', raw)
  return []
}

/**
 * LISTAR materias por carrera SIEMPRE usando /materia ó /materia?carrera_id
 * y NUNCA usando /carrera/{id}/materia porque esa no trae el id y rompe editar/borrar.
 */
export async function listarMateriasPorCarrera(
  token: string,
  carreraId: number,
): Promise<Materia[]> {

  // 1) Intento preferido: /materia?carrera_id=ID  (si la tenés en tu API v2)
  try {
    const res = await fetch(
      `${BASE}/materia?carrera_id=${encodeURIComponent(carreraId)}`,
      {
        headers: { 'Content-Type': 'application/json', ...auth(token) },
      },
    )

    if (res.ok) {
      const raw = await res.json()
      const list = normalizeList(raw)

      // acá deberíamos tener objetos completos con .id
      return list as Materia[]
    } else {
      console.info(
        '[materias.ts] /materia?carrera_id no OK:',
        res.status,
        await safeMsg(res),
      )
    }
  } catch (e) {
    console.info('[materias.ts] Error /materia?carrera_id:', e)
  }

  // 2) Fallback total: /materia (todas) y filtramos
  const resAll = await fetch(`${BASE}/materia`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })

  if (!resAll.ok) {
    throw new Error(
      (await safeMsg(resAll)) || 'No se pudieron listar materias',
    )
  }

  const rawAll = await resAll.json()
  const listAll = normalizeList(rawAll)

  // nos quedamos solo con las de esa carrera
  return listAll.filter(
    (m: any) => Number(m?.id_carrera) === Number(carreraId),
  ) as Materia[]
}

/** LISTAR todas las materias (para selects globales, ej: Mesas de Examen) */
export async function listarTodasMaterias(token: string): Promise<Materia[]> {
  const res = await fetch(`${BASE}/materia`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) },
  })

  if (!res.ok) {
    throw new Error((await safeMsg(res)) || 'No se pudieron listar materias')
  }

  const raw = await res.json()
  return normalizeList(raw)
}

/** CREAR materia */
export async function crearMateria(
  token: string,
  payload: CrearMateriaDTO,
): Promise<Materia> {
  const res = await fetch(`${BASE}/materia`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...auth(token),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(
      (await safeMsg(res)) || 'No se pudo crear la materia',
    )
  }

  const j = (await res.json()) as any
  return (
    j?.materia ??
    j?.data ??
    (typeof j?.message === 'object' ? j.message : j)
  )
}

/** ACTUALIZAR materia */
export async function actualizarMateria(
  token: string,
  id: number,
  payload: ActualizarMateriaDTO,
): Promise<Materia> {
  const res = await fetch(`${BASE}/materia/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...auth(token),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(
      (await safeMsg(res)) || 'No se pudo actualizar la materia',
    )
  }

  const j = (await res.json()) as any
  return (
    j?.materia ??
    j?.data ??
    (typeof j?.message === 'object' ? j.message : j)
  )
}

/** ELIMINAR materia */
export async function eliminarMateria(
  token: string,
  id: number,
): Promise<any> {
  const res = await fetch(`${BASE}/materia/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...auth(token),
    },
  })

  if (!res.ok) {
    throw new Error(
      (await safeMsg(res)) || 'No se pudo eliminar la materia',
    )
  }

  try {
    return await res.json()
  } catch {
    return { deleted: true }
  }
}
