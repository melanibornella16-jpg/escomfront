const BASE = import.meta.env.VITE_API_URL || ''


type User = { id: number; name: string; email: string; email_verified_at: string | null; dni: string; domicilio: string; id_localidad: number; telefono: string; activo: string;
  created_at: string | null; update_at: string;
 }

type LoginResp = { token: string, user: User }








export async function login(email: string, password: string): Promise<LoginResp> {
  // Si usás proxy, podés llamar a '/api/auth/login'
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!res.ok) {
    const msg = await safeMsg(res)
    throw new Error(msg || 'Credenciales inválidas')
  }
  return res.json()
}

export async function me(token: string): Promise<User> {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    const msg = await safeMsg(res)
    throw new Error(msg || 'Token inválido')
  }
  return res.json()
}

export async function logout(token: string) {
  await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  }).catch(() => {})
}

async function safeMsg(res: Response) {
  try {
    const j = await res.json()
    return j?.message || j?.error
  } catch {
    return res.statusText
  }
}
