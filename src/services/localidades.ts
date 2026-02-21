// src/services/localidades.ts
const BASE = import.meta.env.VITE_API_URL || ''

export type Localidad = { id: number; nombre: string; id_provincia?: number }

function auth(token: string) { return { Authorization: `Bearer ${token}` } }

async function safeMsg(res: Response) {
  try {
    const j = await res.json()
    if (typeof j?.message === 'string') return j.message
    if (Array.isArray(j?.message)) return j.message.join(' | ')
    if (j?.errors) return Object.values(j.errors).flat().join(' | ')
    return res.statusText
  } catch { return res.statusText }
}

function normalizeList(raw: any): Localidad[] {
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw?.message)) return raw.message
  if (Array.isArray(raw?.data)) return raw.data
  return []
}

export async function listarLocalidades(token: string): Promise<Localidad[]> {
  const res = await fetch(`${BASE}/localidad`, {
    headers: { 'Content-Type': 'application/json', ...auth(token) }
  })
  if (!res.ok) throw new Error((await safeMsg(res)) || 'No se pudo listar localidades')
  const raw = await res.json()
  return normalizeList(raw)
}
