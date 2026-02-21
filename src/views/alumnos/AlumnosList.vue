<template>
  <div class="space-y-4">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold">Alumnos</h2>
      <div class="flex gap-2">
        <input
          v-model="q"
          placeholder="Buscar por nombre/apellido/email..."
          class="border rounded px-3 py-2 w-80"
        />
        <button
          @click="abrirCrear"
          class="rounded px-4 py-2 text-white bg-emerald-600 hover:opacity-90"
        >
          Nuevo
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="overflow-x-auto rounded border bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left">
            <th class="px-4 py-2">ID</th>
            <th class="px-4 py-2">Nombre</th>
            <th class="px-4 py-2">Email</th>
            <th class="px-4 py-2 w-56">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="4" class="px-4 py-6 text-center text-gray-400">
              Cargando...
            </td>
          </tr>

          <tr
            v-for="a in pageItems"
            :key="a.id"
            class="border-t"
          >
            <td class="px-4 py-2">{{ a.id }}</td>
            <td class="px-4 py-2">{{ a.name }}</td>
            <td class="px-4 py-2">{{ a.email }}</td>
            <td class="px-4 py-2 flex gap-2">
              <button
                @click="abrirEditar(a)"
                class="px-3 py-1 rounded border hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                @click="onEliminar(a)"
                class="px-3 py-1 rounded text-white bg-rose-600 hover:opacity-90"
              >
                Borrar
              </button>
            </td>
          </tr>

          <tr v-if="!cargando && !filtrados.length">
            <td colspan="4" class="px-4 py-6 text-center text-gray-500">
              Sin resultados
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-between pt-2">
      <div class="text-sm text-gray-600">
        Mostrando
        <strong>{{ startIndex + 1 }}</strong>-<strong>{{ endIndex }}</strong>
        de
        <strong>{{ filtrados.length }}</strong>
      </div>
      <div class="flex gap-2">
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :disabled="page === 1"
          @click="page = 1"
        >
          « Primero
        </button>
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :disabled="page === 1"
          @click="page--"
        >
          ‹ Anterior
        </button>
        <span class="px-2 py-1">
          Página {{ page }} / {{ totalPages }}
        </span>
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :disabled="page === totalPages"
          @click="page++"
        >
          Siguiente ›
        </button>
        <button
          class="px-3 py-1 rounded border disabled:opacity-50"
          :disabled="page === totalPages"
          @click="page = totalPages"
        >
          Última »
        </button>
      </div>
    </div>

    <p v-if="error" class="text-rose-600 text-sm">{{ error }}</p>

    <!-- MODAL EDITAR -->
    <div
      v-if="editOpen"
      class="fixed inset-0 bg-black/30 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-xl shadow p-5 w-full max-w-xl space-y-4">
        <h3 class="text-lg font-semibold">Editar alumno</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="text-sm">
            Nombre completo
            <input
              v-model="editForm.name"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Email
            <input
              v-model="editForm.email"
              type="email"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            DNI
            <input
              v-model="editForm.dni"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Teléfono
            <input
              v-model="editForm.telefono"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Domicilio
            <input
              v-model="editForm.domicilio"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            ID Localidad
            <input
              v-model.number="editForm.id_localidad"
              type="number"
              min="1"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Activo
            <select
              v-model="editForm.activo"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="S">S</option>
              <option value="N">N</option>
            </select>
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="cerrarEditar"
            class="px-3 py-2 rounded border hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            @click="guardarEditar"
            :disabled="saving"
            class="px-4 py-2 rounded text-white bg-violet-600 hover:opacity-90 disabled:opacity-60"
          >
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>

        <ul
          v-if="editErrors.length"
          class="text-rose-600 text-sm list-disc pl-5"
        >
          <li v-for="(m,i) in editErrors" :key="i">{{ m }}</li>
        </ul>
      </div>
    </div>

    <!-- MODAL CREAR -->
    <div
      v-if="createOpen"
      class="fixed inset-0 bg-black/30 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-xl shadow p-5 w-full max-w-xl space-y-4">
        <h3 class="text-lg font-semibold">Nuevo alumno</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="text-sm">
            Nombre completo
            <input
              v-model="createForm.name"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Email
            <input
              v-model="createForm.email"
              type="email"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Contraseña
            <input
              v-model="createForm.password"
              type="password"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            DNI
            <input
              v-model="createForm.dni"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Teléfono
            <input
              v-model="createForm.telefono"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Domicilio
            <input
              v-model="createForm.domicilio"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            ID Localidad
            <input
              v-model.number="createForm.id_localidad"
              type="number"
              min="1"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Activo
            <select
              v-model="createForm.activo"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="S">S</option>
              <option value="N">N</option>
            </select>
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            @click="cerrarCrear"
            class="px-3 py-2 rounded border hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            @click="guardarCrear"
            :disabled="createSaving"
            class="px-4 py-2 rounded text-white bg-emerald-600 hover:opacity-90 disabled:opacity-60"
          >
            {{ createSaving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>

        <ul
          v-if="createErrors.length"
          class="text-rose-600 text-sm list-disc pl-5"
        >
          <li v-for="(m, i) in createErrors" :key="i">{{ m }}</li>
        </ul>
      </div>
    </div>

    <!-- Toast verde -->
    <Transition name="fade">
      <div
        v-if="toast.show"
        class="fixed top-4 right-4 z-50 flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 shadow px-4 py-3 text-sm"
        role="status"
        aria-live="polite"
      >
        <span class="mt-0.5">✅</span>
        <div class="font-medium">{{ toast.msg }}</div>
        <button
          class="ml-2 text-emerald-800/70 hover:underline"
          @click="toast.show = false"
          aria-label="Cerrar notificación"
        >
          Cerrar
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  listarAlumnos,
  eliminarAlumno,
  actualizarAlumno,
  crearAlumno,
  type Alumno
} from '@/services/alumnos'

const token = localStorage.getItem('token') || ''

// estado tabla / carga
const items = ref<Alumno[]>([])
const q = ref('')
const cargando = ref(false)
const error = ref('')

// toast éxito
const toast = ref<{ show: boolean; msg: string }>({ show: false, msg: '' })
function showSuccess(msg: string) {
  toast.value = { show: true, msg }
  setTimeout(() => {
    toast.value.show = false
  }, 3500)
}

// normalizar para búsqueda
function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function buildHaystack(a: Alumno) {
  const name = a.name || ''
  const noComma = name.replace(',', ' ')
  return norm(`${name} ${noComma} ${a.email} ${a.dni ?? ''} ${a.telefono ?? ''}`)
}

const filtrados = computed(() => {
  const arr = Array.isArray(items.value) ? items.value : []
  const terms = norm(q.value).split(' ').filter(Boolean)
  if (!terms.length) return arr
  return arr.filter(a => {
    const hay = buildHaystack(a)
    return terms.every(t => hay.includes(t))
  })
})

// paginación
const pageSize = 25
const page = ref(1)
watch([filtrados], () => {
  page.value = 1
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtrados.value.length / pageSize)))
const startIndex = computed(() => (page.value - 1) * pageSize)
const endIndex = computed(() => Math.min(startIndex.value + pageSize, filtrados.value.length))
const pageItems = computed(() => filtrados.value.slice(startIndex.value, endIndex.value))

// cargar alumnos
async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const data = await listarAlumnos(token)
    items.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cargar alumnos'
    items.value = []
  } finally {
    cargando.value = false
  }
}

// eliminar alumno
async function onEliminar(a: Alumno) {
  if (!confirm(`¿Eliminar ${a.name}?`)) return
  try {
    await eliminarAlumno(token, a.id)
    items.value = items.value.filter(x => x.id !== a.id)
    showSuccess(`Alumno "${a.name}" eliminado`)
  } catch (e: any) {
    alert(e?.message || 'No se pudo eliminar')
  }
}

// ----- EDITAR -----
const editOpen = ref(false)
const saving = ref(false)
const editErrors = ref<string[]>([])
const editId = ref<number | null>(null)

const editForm = ref<{
  name: string
  email: string
  dni?: string
  telefono?: string
  domicilio?: string
  id_localidad?: number | null
  activo?: 'S' | 'N'
}>({
  name: '',
  email: '',
  dni: '',
  telefono: '',
  domicilio: '',
  id_localidad: null,
  activo: 'S'
})

function abrirEditar(a: Alumno) {
  editId.value = a.id
  editForm.value = {
    name: a.name ?? '',
    email: a.email ?? '',
    dni: a.dni ?? '',
    telefono: a.telefono ?? '',
    domicilio: a.domicilio ?? '',
    id_localidad: (a.id_localidad ?? null) as number | null,
    activo: (a.activo ?? 'S') as 'S' | 'N'
  }
  editErrors.value = []
  editOpen.value = true
}

function cerrarEditar() {
  editOpen.value = false
  editId.value = null
  editForm.value = {
    name: '',
    email: '',
    dni: '',
    telefono: '',
    domicilio: '',
    id_localidad: null,
    activo: 'S'
  }
  editErrors.value = []
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
function isDigitsOrEmpty(s?: string) {
  return !s || /^[0-9]+$/.test(s)
}

async function guardarEditar() {
  if (editId.value == null) return

  editErrors.value = []

  if (!editForm.value.name || !editForm.value.email) {
    editErrors.value.push('Nombre y email son obligatorios.')
  }
  if (editForm.value.email && !isEmail(editForm.value.email)) {
    editErrors.value.push('El email no es válido.')
  }
  if (!isDigitsOrEmpty(editForm.value.dni)) {
    editErrors.value.push('El DNI debe contener solo números.')
  }
  if (!isDigitsOrEmpty(editForm.value.telefono)) {
    editErrors.value.push('El teléfono debe contener solo números.')
  }
  if (editErrors.value.length) return

  try {
    saving.value = true

    const payload: any = {
      name: editForm.value.name.trim(),
      email: editForm.value.email.trim(),
    }
    if (editForm.value.dni !== undefined) payload.dni = editForm.value.dni?.trim() || null
    if (editForm.value.telefono !== undefined) payload.telefono = editForm.value.telefono?.trim() || null
    if (editForm.value.domicilio !== undefined) payload.domicilio = editForm.value.domicilio?.trim() || null
    if (editForm.value.id_localidad !== undefined) payload.id_localidad = editForm.value.id_localidad ?? null
    if (editForm.value.activo !== undefined) payload.activo = editForm.value.activo

    const updated = await actualizarAlumno(token, editId.value, payload)

    items.value = items.value.map(i => i.id === updated.id ? { ...i, ...updated } : i)

    cerrarEditar()
    showSuccess(`Alumno "${updated.name}" actualizado ✅`)
  } catch (e: any) {
    const msg = (e?.message ?? 'No se pudo guardar').toString()
    editErrors.value = msg.split(' | ').map((s: string) => s.trim()).filter(Boolean)
  } finally {
    saving.value = false
  }
}

// ----- CREAR -----
const createOpen = ref(false)
const createSaving = ref(false)
const createErrors = ref<string[]>([])

const createForm = ref<{
  name: string
  email: string
  password: string
  dni?: string
  telefono?: string
  domicilio?: string
  id_localidad?: number | null
  activo?: 'S' | 'N'
}>({
  name: '',
  email: '',
  password: '',
  dni: '',
  telefono: '',
  domicilio: '',
  id_localidad: null,
  activo: 'S'
})

function abrirCrear() {
  createForm.value = {
    name: '',
    email: '',
    password: '',
    dni: '',
    telefono: '',
    domicilio: '',
    id_localidad: null,
    activo: 'S'
  }
  createErrors.value = []
  createOpen.value = true
}

function cerrarCrear() {
  createOpen.value = false
  createErrors.value = []
}

async function guardarCrear() {
  createErrors.value = []

  if (!createForm.value.name || !createForm.value.email || !createForm.value.password) {
    createErrors.value.push('Nombre, email y contraseña son obligatorios.')
  }
  if (createForm.value.email && !isEmail(createForm.value.email)) {
    createErrors.value.push('El email no es válido.')
  }
  if (!isDigitsOrEmpty(createForm.value.dni)) {
    createErrors.value.push('El DNI debe contener solo números.')
  }
  if (!isDigitsOrEmpty(createForm.value.telefono)) {
    createErrors.value.push('El teléfono debe contener solo números.')
  }
  if (createErrors.value.length) return

  try {
    createSaving.value = true

    const payload: any = {
      name: createForm.value.name.trim(),
      email: createForm.value.email.trim(),
      password: createForm.value.password.trim(),
      activo: createForm.value.activo ?? 'S',
      rol: 'E', // alumno
    }

    if (createForm.value.dni) payload.dni = createForm.value.dni.trim()
    if (createForm.value.telefono) payload.telefono = createForm.value.telefono.trim()
    if (createForm.value.domicilio) payload.domicilio = createForm.value.domicilio.trim()
    if (createForm.value.id_localidad != null) {
      payload.id_localidad = Number(createForm.value.id_localidad)
    }

    const nuevo = await crearAlumno(token, payload)
    items.value = [nuevo, ...items.value]

    cerrarCrear()
    showSuccess(`Alumno "${nuevo.name}" creado con éxito ✅`)
  } catch (e: any) {
    const msg = (e?.message ?? 'No se pudo crear').toString()
    createErrors.value = msg.split(' | ').map((s: string) => s.trim()).filter(Boolean)
  } finally {
    createSaving.value = false
  }
}

onMounted(() => {
  void cargar()
})
</script>

<style scoped>
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.fade-enter-active,
.fade-leave-active {
  transition: all 180ms ease;
}
</style>
