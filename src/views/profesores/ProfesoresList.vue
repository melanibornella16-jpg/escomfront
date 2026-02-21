<template>
  <div class="space-y-4">
    <!-- Header + botón Nuevo -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold">Profesores</h2>
      <div class="flex gap-2">
        <input
          v-model="q"
          placeholder="Buscar por nombre/email..."
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
            <td colspan="4" class="px-4 py-6 text-center text-gray-400">Cargando...</td>
          </tr>

          <tr
            v-for="p in pageItems"
            :key="p.id"
            class="border-t"
          >
            <td class="px-4 py-2">{{ p.id }}</td>
            <td class="px-4 py-2">{{ p.name }}</td>
            <td class="px-4 py-2">{{ p.email }}</td>
            <td class="px-4 py-2 flex gap-2">
              <button
                @click="abrirEditar(p)"
                class="px-3 py-1 rounded border hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                @click="onEliminar(p)"
                class="px-3 py-1 rounded text-white bg-rose-600 hover:opacity-90"
              >
                Borrar
              </button>
            </td>
          </tr>

          <tr v-if="!cargando && !filtrados.length">
            <td colspan="4" class="px-4 py-6 text-center text-gray-500">Sin resultados</td>
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
        <span class="px-2 py-1">Página {{ page }} / {{ totalPages }}</span>
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

    <!-- Error general -->
    <p v-if="error" class="text-rose-600 text-sm">{{ error }}</p>

    <!-- Modal Editar -->
    <div
      v-if="editOpen"
      class="fixed inset-0 bg-black/30 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-xl shadow p-5 w-full max-w-xl space-y-4">
        <h3 class="text-lg font-semibold">Editar profesor</h3>

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
            Localidad
            <select
              v-model.number="editForm.id_localidad"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option :value="null" disabled>Seleccionar localidad</option>
              <option
                v-for="loc in localidades"
                :key="loc.id"
                :value="loc.id"
              >
                {{ loc.nombre }}
              </option>
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

    <!-- Modal Crear -->
    <div
      v-if="createOpen"
      class="fixed inset-0 bg-black/30 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-xl shadow p-5 w-full max-w-xl space-y-4">
        <h3 class="text-lg font-semibold">Nuevo profesor</h3>

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
            Localidad
            <select
              v-model.number="createForm.id_localidad"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option :value="null" disabled>Seleccionar localidad</option>
              <option
                v-for="loc in localidades"
                :key="loc.id"
                :value="loc.id"
              >
                {{ loc.nombre }}
              </option>
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

    <!-- Toast verde flotante -->
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
import { listarLocalidades, type Localidad } from '@/services/localidades'
import {
  listarProfesores,
  crearProfesor,
  actualizarProfesor,
  eliminarProfesor,
  type Profesor
} from '@/services/profesores'

const token = localStorage.getItem('token') || ''

// datos tabla
const items = ref<Profesor[]>([])
const q = ref('')
const cargando = ref(false)
const error = ref('')

// toast de éxito
const toast = ref<{ show: boolean; msg: string }>({ show: false, msg: '' })
function showSuccess(msg: string) {
  toast.value = { show: true, msg }
  setTimeout(() => {
    toast.value.show = false
  }, 3500)
}

// helpers de búsqueda
function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function haystack(p: Profesor) {
  return norm(`${p.name ?? ''} ${p.email ?? ''} ${p.dni ?? ''} ${p.telefono ?? ''}`)
}

const filtrados = computed(() => {
  const terms = norm(q.value).split(' ').filter(Boolean)
  if (!terms.length) return items.value
  return items.value.filter(p => terms.every(t => haystack(p).includes(t)))
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

async function refrescar() {
  cargando.value = true
  error.value = ''
  try {
    items.value = await listarProfesores(token)
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cargar profesores'
    items.value = []
  } finally {
    cargando.value = false
  }
}

async function onEliminar(p: Profesor) {
  if (!confirm(`¿Eliminar ${p.name}?`)) return
  try {
    await eliminarProfesor(token, p.id)
    items.value = items.value.filter(x => x.id !== p.id)
    showSuccess(`Profesor "${p.name}" eliminado`)
  } catch (e: any) {
    alert(e?.message || 'No se pudo eliminar')
  }
}

// --- Editar ---
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
  id_localidad: number | null
}>({
  name: '',
  email: '',
  dni: '',
  telefono: '',
  domicilio: '',
  id_localidad: null
})

// --- Crear ---
const createOpen = ref(false)
const createSaving = ref(false)
const createErrors = ref<string[]>([])
const createForm = ref<{
  name: string
  email: string
  password: string
  dni: string
  telefono?: string
  domicilio: string
  id_localidad: number | null
}>({
  name: '',
  email: '',
  password: '',
  dni: '',
  telefono: '',
  domicilio: '',
  id_localidad: null
})

// localidades
const localidades = ref<Localidad[]>([])
async function cargarLocalidades() {
  try {
    localidades.value = await listarLocalidades(token)
  } catch {
    localidades.value = []
  }
}

function abrirCrear() {
  createForm.value = {
    name: '',
    email: '',
    password: '',
    dni: '',
    telefono: '',
    domicilio: '',
    id_localidad: null
  }
  createErrors.value = []
  void cargarLocalidades()
  createOpen.value = true
}
function cerrarCrear() {
  createOpen.value = false
  createErrors.value = []
}

function abrirEditar(p: Profesor) {
  editId.value = p.id
  editForm.value = {
    name: p.name ?? '',
    email: p.email ?? '',
    dni: p.dni ?? '',
    telefono: p.telefono ?? '',
    domicilio: (p as any).domicilio ?? '',
    id_localidad: (p as any).id_localidad ?? null
  }
  editErrors.value = []
  void cargarLocalidades()
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
    id_localidad: null
  }
  editErrors.value = []
}

// validadores básicos front
function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}
function digitsOrEmpty(s?: string) {
  return !s || /^[0-9]+$/.test(s)
}

async function guardarCrear() {
  createErrors.value = []

  // validaciones mínimas
  if (
    !createForm.value.name ||
    !createForm.value.email ||
    !createForm.value.password ||
    !createForm.value.domicilio
  ) {
    createErrors.value.push('Nombre, email, contraseña y domicilio son obligatorios.')
  }
  if (createForm.value.email && !isEmail(createForm.value.email)) {
    createErrors.value.push('Email inválido.')
  }
  if (createForm.value.dni && !digitsOrEmpty(createForm.value.dni)) {
    createErrors.value.push('DNI debe ser numérico.')
  }
  if (createForm.value.telefono && !digitsOrEmpty(createForm.value.telefono)) {
    createErrors.value.push('Teléfono debe ser numérico.')
  }
  if (createErrors.value.length) return

  try {
    createSaving.value = true

    // armamos payload limpio para el back
    const payload: any = {
      name: createForm.value.name.trim(),
      email: createForm.value.email.trim(),
      password: createForm.value.password.trim(),
      dni: createForm.value.dni?.trim(),
      domicilio: createForm.value.domicilio.trim(),
      telefono: createForm.value.telefono?.trim(),
      rol: 'D', // docente
    }

    if (createForm.value.id_localidad != null) {
      payload.id_localidad = createForm.value.id_localidad
    }

    const nuevo = await crearProfesor(token, payload)

    // metemos el nuevo profesor en la lista visible
    items.value = [nuevo, ...items.value]

    cerrarCrear()
    showSuccess(`Profesor "${nuevo.name}" creado con éxito ✅`)
  } catch (e: any) {
    createErrors.value = (
      e?.message ?? 'No se pudo crear'
    )
      .toString()
      .split(' | ')
      .map((s: string) => s.trim())
      .filter(Boolean)
  } finally {
    createSaving.value = false
  }
}

async function guardarEditar() {
  if (editId.value == null) return

  editErrors.value = []

  if (!editForm.value.name || !editForm.value.email) {
    editErrors.value.push('Nombre y email son obligatorios.')
  }
  if (editForm.value.email && !isEmail(editForm.value.email)) {
    editErrors.value.push('Email inválido.')
  }
  if (!digitsOrEmpty(editForm.value.dni)) {
    editErrors.value.push('DNI debe ser numérico.')
  }
  if (!digitsOrEmpty(editForm.value.telefono)) {
    editErrors.value.push('Teléfono debe ser numérico.')
  }
  if (editErrors.value.length) return

  try {
    saving.value = true

    const payload: any = {
      name: editForm.value.name.trim(),
      email: editForm.value.email.trim(),
      dni: editForm.value.dni?.trim() || null,
      telefono: editForm.value.telefono?.trim() || null,
      domicilio: editForm.value.domicilio?.trim() || null,
      id_localidad: editForm.value.id_localidad ?? null
    }

    const updated = await actualizarProfesor(token, editId.value, payload)

    // reemplazamos en la tabla el registro editado
    items.value = items.value.map(i => (i.id === updated.id ? { ...i, ...updated } : i))

    cerrarEditar()
    showSuccess(`Profesor "${updated.name}" actualizado ✅`)
  } catch (e: any) {
    editErrors.value = (
      e?.message ?? 'No se pudo guardar'
    )
      .toString()
      .split(' | ')
      .map((s: string) => s.trim())
      .filter(Boolean)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void refrescar()
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
