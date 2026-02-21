<template>
  <div class="space-y-4">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold">Carreras</h2>

      <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          v-model="q"
          placeholder="Buscar por nombre / abreviatura..."
          class="border rounded px-3 py-2 w-64"
        />
        <button
          @click="abrirCrear"
          class="rounded px-4 py-2 text-white bg-emerald-600 hover:opacity-90"
        >
          Nueva
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="overflow-x-auto rounded border bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left">
            <th class="px-4 py-2">Nombre</th>
            <th class="px-4 py-2">Abreviado</th>
            <th class="px-4 py-2">Activa</th>
            <th class="px-4 py-2">Años</th>
            <th class="px-4 py-2 w-56">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <!-- loading -->
          <tr v-if="cargando">
            <td colspan="5" class="px-4 py-6 text-center text-gray-400">
              Cargando...
            </td>
          </tr>

          <!-- filas -->
          <tr
            v-for="c in pageItems"
            :key="c.id"
            class="border-t"
          >
            <td class="px-4 py-2 font-medium">
              {{ c.nombre || '—' }}
            </td>
            <td class="px-4 py-2">
              {{ c.abreviado || '—' }}
            </td>
            <td class="px-4 py-2">
              <span
                class="inline-block rounded px-2 py-0.5 text-xs font-semibold"
                :class="c.activa === 'S'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'"
              >
                {{ c.activa === 'S' ? 'Sí' : 'No' }}
              </span>
            </td>
            <td class="px-4 py-2">
              {{ c.cant_anios ?? '—' }}
            </td>
            <td class="px-4 py-2 flex gap-2 flex-wrap">
              <button
                @click="abrirEditar(c)"
                class="px-3 py-1 rounded border hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                @click="onEliminar(c)"
                class="px-3 py-1 rounded text-white bg-rose-600 hover:opacity-90"
              >
                Borrar
              </button>
            </td>
          </tr>

          <!-- sin resultados -->
          <tr v-if="!cargando && !pageItems.length">
            <td
              colspan="5"
              class="px-4 py-6 text-center text-gray-500"
            >
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
        de <strong>{{ filtrados.length }}</strong>
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
      class="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-40"
    >
      <div class="bg-white rounded-xl shadow p-5 w-full max-w-xl space-y-4">
        <h3 class="text-lg font-semibold">Editar carrera</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="text-sm">
            Nombre
            <input
              v-model="editForm.nombre"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Abreviado
            <input
              v-model="editForm.abreviado"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Activa
            <select
              v-model="editForm.activa"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="S">S</option>
              <option value="N">N</option>
            </select>
          </label>

          <label class="text-sm">
            Cantidad de años
            <input
              v-model.number="editForm.cant_anios"
              type="number"
              min="1"
              class="mt-1 w-full border rounded px-3 py-2"
            />
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
          <li v-for="(m, i) in editErrors" :key="i">{{ m }}</li>
        </ul>
      </div>
    </div>

    <!-- MODAL CREAR -->
    <div
      v-if="createOpen"
      class="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-40"
    >
      <div class="bg-white rounded-xl shadow p-5 w-full max-w-xl space-y-4">
        <h3 class="text-lg font-semibold">Nueva carrera</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="text-sm">
            Nombre
            <input
              v-model="createForm.nombre"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Abreviado
            <input
              v-model="createForm.abreviado"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Activa
            <select
              v-model="createForm.activa"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="S">S</option>
              <option value="N">N</option>
            </select>
          </label>

          <label class="text-sm">
            Cantidad de años
            <input
              v-model.number="createForm.cant_anios"
              type="number"
              min="1"
              class="mt-1 w-full border rounded px-3 py-2"
            />
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

    <!-- TOASTS -->
    <div class="fixed top-3 right-3 space-y-2 z-50">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="px-4 py-2 rounded text-white shadow"
        :class="t.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'"
      >
        {{ t.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  listarCarreras,
  crearCarrera,
  actualizarCarrera,
  eliminarCarrera,
  type Carrera,
  type CrearCarreraDTO
} from '@/services/carreras'

const token = localStorage.getItem('token') || ''

/* ---------- toasts ---------- */
type Toast = { id: number; type: 'success' | 'error'; text: string }
const toasts = ref<Toast[]>([])
function pushToast(type: Toast['type'], text: string, ms = 3000) {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, type, text })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, ms)
}
const alertSuccess = (t: string) => pushToast('success', t)
const alertError = (t: string) => pushToast('error', t)

/* ---------- listado base ---------- */
const items = ref<Carrera[]>([])
const cargando = ref(false)
const error = ref('')

/* limpio: sólo carreras que tengan id válido */
const cleanItems = computed(() =>
  items.value.filter(c => c && c.id != null)
)

/* ---------- filtro texto ---------- */
const q = ref('')
function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function hay(c: Carrera) {
  return norm(
    `${c.nombre} ${c.abreviado ?? ''} ${c.activa ?? ''} ${c.cant_anios ?? ''}`
  )
}
const filtrados = computed(() => {
  const terms = norm(q.value).split(' ').filter(Boolean)
  if (!terms.length) return cleanItems.value
  return cleanItems.value.filter(c =>
    terms.every(t => hay(c).includes(t))
  )
})

/* ---------- paginación ---------- */
const pageSize = 25
const page = ref(1)
watch([filtrados], () => {
  page.value = 1
})
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filtrados.value.length / pageSize))
)
const startIndex = computed(() => (page.value - 1) * pageSize)
const endIndex = computed(() =>
  Math.min(startIndex.value + pageSize, filtrados.value.length)
)
const pageItems = computed(() =>
  filtrados.value.slice(startIndex.value, endIndex.value)
)

/* ---------- cargar listado ---------- */
async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const arr = await listarCarreras(token)
    items.value = Array.isArray(arr) ? arr : []
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cargar carreras'
    items.value = []
  } finally {
    cargando.value = false
  }
}

/* ---------- eliminar ---------- */
async function onEliminar(c: Carrera) {
  console.log('onEliminar()', c)
  if (!c.id) {
    alertError('No hay carrera seleccionada para borrar')
    return
  }
  if (!confirm(`¿Eliminar la carrera "${c.nombre}"?`)) return
  try {
    await eliminarCarrera(token, c.id)
    items.value = items.value.filter(x => x.id !== c.id)
    alertSuccess('Carrera eliminada ✅')
  } catch (e: any) {
    alertError(e?.message || 'No se pudo eliminar')
  }
}

/* ---------- modal editar ---------- */
const editOpen = ref(false)
const saving = ref(false)
const editErrors = ref<string[]>([])
const editId = ref<number | null>(null)
const editForm = ref<{
  nombre: string
  abreviado: string
  activa: 'S' | 'N'
  cant_anios: number | null
}>({
  nombre: '',
  abreviado: '',
  activa: 'S',
  cant_anios: 1
})

function abrirEditar(c: Carrera) {
  console.log('abrirEditar()', c)
  editId.value = c.id ?? null
  editForm.value = {
    nombre: c.nombre ?? '',
    abreviado: c.abreviado ?? '',
    activa: (c.activa as 'S' | 'N') ?? 'S',
    cant_anios: Number(c.cant_anios ?? 1)
  }
  editErrors.value = []
  editOpen.value = true
}

function cerrarEditar() {
  editOpen.value = false
  editId.value = null
  editForm.value = {
    nombre: '',
    abreviado: '',
    activa: 'S',
    cant_anios: 1
  }
  editErrors.value = []
}

/* ---------- modal crear ---------- */
const createOpen = ref(false)
const createSaving = ref(false)
const createErrors = ref<string[]>([])
const createForm = ref<{
  nombre: string
  abreviado: string
  activa: 'S' | 'N'
  cant_anios: number | null
}>({
  nombre: '',
  abreviado: '',
  activa: 'S',
  cant_anios: 1
})

function abrirCrear() {
  createForm.value = {
    nombre: '',
    abreviado: '',
    activa: 'S',
    cant_anios: 1
  }
  createErrors.value = []
  createOpen.value = true
}
function cerrarCrear() {
  createOpen.value = false
  createErrors.value = []
}

/* ---------- validaciones ---------- */
function validarCarreraBase(
  f: { nombre: string; activa: string; cant_anios: number | null },
  errors: string[]
) {
  if (!f.nombre?.trim()) errors.push('El nombre es obligatorio.')
  if (!['S', 'N'].includes(f.activa))
    errors.push('Activa debe ser S o N.')
  if (!f.cant_anios || f.cant_anios < 1)
    errors.push('La cantidad de años debe ser >= 1.')
}

/* ---------- guardar crear ---------- */
async function guardarCrear() {
  createErrors.value = []
  validarCarreraBase(createForm.value, createErrors.value)
  if (createErrors.value.length) return

  try {
    createSaving.value = true

    const payload: CrearCarreraDTO = {
      nombre: createForm.value.nombre.trim(),
      abreviado: createForm.value.abreviado?.trim() || '',
      activa: createForm.value.activa,
      cant_anios: Number(createForm.value.cant_anios ?? 1)
    }

    const nueva = await crearCarrera(token, payload)

    items.value = [nueva, ...items.value]

    alertSuccess('Carrera creada ✅')
    cerrarCrear()
  } catch (e: any) {
    const msg = (e?.message ?? 'No se pudo crear').toString()
    createErrors.value = msg
      .split(' | ')
      .map((s: string) => s.trim())
      .filter(Boolean)

    alertError(createErrors.value.join(' · ') || 'No se pudo crear')
  } finally {
    createSaving.value = false
  }
}

/* ---------- guardar editar ---------- */
async function guardarEditar() {
  console.log('guardarEditar() disparado. editId:', editId.value)

  if (editId.value == null) {
    alertError('No hay carrera seleccionada para editar')
    return
  }

  editErrors.value = []
  validarCarreraBase(editForm.value, editErrors.value)
  if (editErrors.value.length) return

  try {
    saving.value = true

    const payload: any = {
      nombre: editForm.value.nombre.trim(),
      abreviado: editForm.value.abreviado?.trim() || '',
      activa: editForm.value.activa,
      cant_anios: Number(editForm.value.cant_anios ?? 1)
    }

    const updated = await actualizarCarrera(token, editId.value, payload)

    items.value = items.value.map(i =>
      i.id === updated.id ? { ...i, ...updated } : i
    )

    alertSuccess('Cambios guardados ✅')
    cerrarEditar()
  } catch (e: any) {
    const msg = (e?.message ?? 'No se pudo guardar').toString()
    editErrors.value = msg
      .split(' | ')
      .map((s: string) => s.trim())
      .filter(Boolean)

    alertError(editErrors.value.join(' · ') || 'No se pudo guardar')
  } finally {
    saving.value = false
  }
}

/* ---------- init ---------- */
onMounted(() => {
  void cargar()
})
</script>
