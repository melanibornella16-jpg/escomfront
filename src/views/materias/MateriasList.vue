<template>
  <div class="space-y-4">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
        <div class="flex flex-col">
          <label class="text-sm font-medium mb-1">Carrera</label>
          <select v-model.number="carreraId" class="border rounded px-3 py-2 w-80">
            <option :value="null" disabled>Seleccionar carrera</option>
            <option v-for="c in carreras" :key="c.id" :value="c.id">
              {{ c.nombre }}
            </option>
          </select>
        </div>

        <div class="flex gap-2">
          <button
            @click="buscar"
            :disabled="!carreraId"
            class="rounded px-4 py-2 text-white bg-violet-600 hover:opacity-90 disabled:opacity-60"
          >
            Buscar
          </button>

          <button
            @click="abrirCrear"
            :disabled="!carreraId"
            class="rounded px-4 py-2 text-white bg-emerald-600 hover:opacity-90 disabled:opacity-60"
          >
            Nuevo
          </button>
        </div>
      </div>

      <!-- Filtro local -->
      <input
        v-model="q"
        placeholder="Buscar por materia/profesor/cursado..."
        class="border rounded px-3 py-2 w-80"
      />
    </div>

    <!-- Tabla -->
    <div class="overflow-x-auto rounded border bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left">
            <th class="px-4 py-2">Materia</th>
            <th class="px-4 py-2">Profesor</th>
            <th class="px-4 py-2">Curso</th>
            <th class="px-4 py-2">Cursado</th>
            <th class="px-4 py-2">Libre</th>
            <th class="px-4 py-2 w-56">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <!-- estado cargando -->
          <tr v-if="cargando">
            <td colspan="6" class="px-4 py-6 text-center text-gray-400">Cargando...</td>
          </tr>

          <!-- filas -->
          <tr
            v-for="m in pageItems"
            :key="m.id"
            class="border-t"
          >
            <td class="px-4 py-2">
              <div class="font-medium">{{ m.nombre }}</div>
              <div class="text-xs text-gray-500" v-if="m.abreviado">{{ m.abreviado }}</div>
            </td>
            <td class="px-4 py-2">{{ profNombre(m.id_profesor) }}</td>
            <td class="px-4 py-2">{{ m.curso }}</td>
            <td class="px-4 py-2">{{ m.cursado === '1' ? 'Cuatrimestral' : 'Anual' }}</td>
            <td class="px-4 py-2">{{ m.libre }}</td>
            <td class="px-4 py-2 flex gap-2">
              <button
                @click="abrirEditar(m)"
                class="px-3 py-1 rounded border hover:bg-gray-50"
              >
                Editar
              </button>
              <button
                @click="onEliminar(m)"
                class="px-3 py-1 rounded text-white bg-rose-600 hover:opacity-90"
              >
                Borrar
              </button>
            </td>
          </tr>

          <!-- vacío con carrera -->
          <tr v-if="!cargando && carreraId && !filtrados.length">
            <td colspan="6" class="px-4 py-6 text-center text-gray-500">Sin resultados</td>
          </tr>

          <!-- sin carrera -->
          <tr v-if="!carreraId && !cargando">
            <td colspan="6" class="px-4 py-6 text-center text-gray-500">
              Seleccioná una carrera y presioná “Buscar”.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Paginación -->
    <div class="flex items-center justify-between pt-2">
      <div class="text-sm text-gray-600">
        Mostrando
        <strong>{{ filtrados.length === 0 ? 0 : startIndex + 1 }}</strong>-
        <strong>{{ endIndex }}</strong>
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

    <!-- Errores globales -->
    <p v-if="error" class="text-rose-600 text-sm">{{ error }}</p>

    <!-- =============== MODAL EDITAR =============== -->
    <div
      v-if="editOpen"
      class="fixed inset-0 bg-black/30 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-xl shadow p-5 w-full max-w-xl space-y-4">
        <h3 class="text-lg font-semibold">Editar materia</h3>

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
            Curso
            <input
              v-model.number="editForm.curso"
              type="number"
              min="1"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Cursado
            <select
              v-model="editForm.cursado"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="0">Anual</option>
              <option value="1">Cuatrimestral</option>
            </select>
          </label>

          <label class="text-sm">
            Libre
            <select
              v-model="editForm.libre"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="S">S</option>
              <option value="N">N</option>
            </select>
          </label>

          <label class="text-sm">
    Promociona
    <select v-model="createForm.promociona" class="mt-1 w-full border rounded px-3 py-2">
      <option value="S">S</option>
      <option value="N">N</option>
    </select>
  </label>

          <label class="text-sm">
            Promociona
            <select
              v-model="editForm.promociona"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="S">S</option>
              <option value="N">N</option>
            </select>
          </label>

          <label class="text-sm">
            Profesor titular
            <select
              v-model.number="editForm.id_profesor"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option :value="null" disabled>Seleccionar profesor</option>
              <option v-for="p in profesores" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </label>

          <label class="text-sm">
            Profesor suplente (opcional)
            <select
              v-model.number="editForm.id_suplente"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option :value="null">— Ninguno —</option>
              <option v-for="p in profesores" :key="p.id" :value="p.id">
                {{ p.name }}
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
          <li v-for="(m, i) in editErrors" :key="i">{{ m }}</li>
        </ul>
      </div>
    </div>

    <!-- =============== MODAL CREAR =============== -->
    <div
      v-if="createOpen"
      class="fixed inset-0 bg-black/30 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-xl shadow p-5 w-full max-w-xl space-y-4">
        <h3 class="text-lg font-semibold">Nueva materia</h3>

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
            Curso
            <input
              v-model.number="createForm.curso"
              type="number"
              min="1"
              class="mt-1 w-full border rounded px-3 py-2"
            />
          </label>

          <label class="text-sm">
            Cursado
            <select
              v-model="createForm.cursado"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="0">Anual</option>
              <option value="1">Cuatrimestral</option>
            </select>
          </label>

          <label class="text-sm">
            Libre
            <select
              v-model="createForm.libre"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option value="S">S</option>
              <option value="N">N</option>
            </select>
          </label>

          <label class="text-sm">
            Profesor titular
            <select
              v-model.number="createForm.id_profesor"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option :value="null" disabled>Seleccionar profesor</option>
              <option v-for="p in profesores" :key="p.id" :value="p.id">
                {{ p.name }}
              </option>
            </select>
          </label>

          <label class="text-sm">
            Profesor suplente (opcional)
            <select
              v-model.number="createForm.id_suplente"
              class="mt-1 w-full border rounded px-3 py-2"
            >
              <option :value="null">— Ninguno —</option>
              <option v-for="p in profesores" :key="p.id" :value="p.id">
                {{ p.name }}
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
import { ref, computed, watch, onMounted } from 'vue'
import { listarCarreras, type Carrera } from '@/services/carreras'
import { listarProfesores, type Profesor } from '@/services/profesores'
import {
  listarMateriasPorCarrera,
  crearMateria,
  actualizarMateria,
  eliminarMateria,
  type Materia,
  type CrearMateriaDTO,
} from '@/services/materias'

const token = localStorage.getItem('token') || ''

/* -------- Toasts reutilizables -------- */
type Toast = { id: number; type: 'success' | 'error'; text: string }
const toasts = ref<Toast[]>([])

function pushToast(type: Toast['type'], text: string, ms = 3000) {
  const id = Date.now() + Math.random()
  toasts.value.push({ id, type, text })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, ms)
}
const alertSuccess = (msg: string) => pushToast('success', msg)
const alertError = (msg: string) => pushToast('error', msg)

/* --------- datos base --------- */
const carreras = ref<Carrera[]>([])
const profesores = ref<Profesor[]>([])
const carreraId = ref<number | null>(null)

/* --------- listado --------- */
const items = ref<Materia[]>([])
const cargando = ref(false)
const error = ref('')

/* --------- filtro local --------- */
const q = ref('')
function norm(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function textoMateria(m: Materia) {
  const prof = profNombre(m.id_profesor)
  return norm(
    `${m.nombre} ${m.abreviado ?? ''} ${m.curso} ${m.cursado} ${m.libre} ${prof}`
  )
}
const filtrados = computed(() => {
  const terms = norm(q.value)
    .split(' ')
    .filter(Boolean)
  if (!terms.length) return items.value
  return items.value.filter(m =>
    terms.every(t => textoMateria(m).includes(t))
  )
})

/* --------- paginación --------- */
const pageSize = 25
const page = ref(1)

watch(filtrados, () => {
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

/* --------- helpers --------- */
function profNombre(id: number | null | undefined) {
  if (!id) return ''
  const p = profesores.value.find(x => x.id === id)
  return p?.name ?? `ID ${id}`
}

/* --------- cargar combos --------- */
async function cargarCarreras() {
  try {
    carreras.value = await listarCarreras(token)
  } catch {
    carreras.value = []
  }
}

async function cargarProfesores() {
  try {
    profesores.value = await listarProfesores(token)
  } catch {
    profesores.value = []
  }
}

/* --------- buscar materias por carrera --------- */
async function buscar() {
  if (!carreraId.value) return
  cargando.value = true
  error.value = ''

  try {
    items.value = await listarMateriasPorCarrera(token, carreraId.value)
  } catch (e: any) {
    error.value = e?.message || 'No se pudo cargar materias'
    items.value = []
  } finally {
    cargando.value = false
  }
}

/* auto-buscar al cambiar carrera */
watch(carreraId, async id => {
  if (id) {
    await buscar()
  }
})

/* --------- eliminar --------- */
async function onEliminar(m: Materia) {
  if (!confirm(`¿Eliminar ${m.nombre}?`)) return
  try {
    await eliminarMateria(token, m.id)
    items.value = items.value.filter(x => x.id !== m.id)
    alertSuccess('Materia eliminada ✅')
  } catch (e: any) {
    alertError(e?.message || 'No se pudo eliminar')
  }
}

/* ================== EDITAR ================== */
const editOpen = ref(false)
const saving = ref(false)
const editErrors = ref<string[]>([])
const editId = ref<number | null>(null)

const editForm = ref<{
  nombre: string
  abreviado: string
  curso: number
  cursado: string // "0" | "1"
  libre: 'S' | 'N'
  promociona: 'S' | 'N'
  id_profesor: number | null
  id_suplente: number | null
}>({
  nombre: '',
  abreviado: '',
  curso: 1,
  cursado: '0',
  libre: 'S',
  promociona: 'N',
  id_profesor: null,
  id_suplente: null,
})

function abrirEditar(m: Materia) {
  console.log('abrirEditar()', m)
  editId.value = m.id

  editForm.value = {
    nombre: m.nombre ?? '',
    abreviado: m.abreviado ?? '',
    curso: Number(m.curso ?? 1),
    cursado: (m.cursado ?? '0') as string,
    libre: (m.libre as 'S' | 'N') ?? 'S',
    promociona: (m.promociona as 'S' | 'N') ?? 'N',
    id_profesor: m.id_profesor ?? null,
    id_suplente: (m.id_suplente ?? null) as number | null,
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
    curso: 1,
    cursado: '0',
    libre: 'S',
    promociona: 'N',
    id_profesor: null,
    id_suplente: null,
  }
  editErrors.value = []
}

/* ================== CREAR ================== */
const createOpen = ref(false)
const createSaving = ref(false)
const createErrors = ref<string[]>([])

const createForm = ref<{
  nombre: string
  abreviado: string
  curso: number
  cursado: string
  libre: 'S' | 'N'
  promociona: 'S' | 'N';
  id_profesor: number | null
  id_suplente: number | null
}>({
  nombre: '',
  abreviado: '',
  curso: 1,
  cursado: '0',
  libre: 'S',
  promociona: 'N', // default
  id_profesor: null,
  id_suplente: null,
})

function abrirCrear() {
  createForm.value = {
    nombre: '',
    abreviado: '',
    curso: 1,
    cursado: '0',
    libre: 'S',
    promociona: 'N',
    id_profesor: null,
    id_suplente: null,
  }
  createErrors.value = []
  createOpen.value = true
}

function cerrarCrear() {
  createOpen.value = false
  createErrors.value = []
}

/* --------- validaciones frontend --------- */
function validarBase(
  f: {
    nombre: string
    curso: number
    cursado: string
    libre: 'S' | 'N'
    promociona?: 'S' | 'N';
    id_profesor: number | null
  },
  errors: string[],
) {
  if (!carreraId.value) errors.push('Debe seleccionar una carrera.')
  if (!f.nombre?.trim()) errors.push('El nombre es obligatorio.')
  if (!f.id_profesor)
    errors.push('Debe seleccionar un profesor titular.')
  if (!f.curso || f.curso < 1)
    errors.push('El curso debe ser un número mayor o igual a 1.')
  if (!['0', '1'].includes(f.cursado))
    errors.push('Cursado inválido.')
  if (!['S', 'N'].includes(f.libre))
    errors.push('Libre debe ser S o N.')
  if (f.promociona && !['S', 'N'].includes(f.promociona))
    errors.push('Promociona debe ser S o N.')
}

/* --------- guardar NUEVA materia --------- */
async function guardarCrear() {
  createErrors.value = []
  validarBase(createForm.value, createErrors.value)
  if (createErrors.value.length) {
    alertError(createErrors.value.join(' · '))
    return
  }

  try {
    createSaving.value = true

    const payload: CrearMateriaDTO = {
      nombre: createForm.value.nombre.trim(),
      abreviado: createForm.value.abreviado?.trim() || '',
      curso: Number(createForm.value.curso),
      cursado: createForm.value.cursado,
      libre: createForm.value.libre,
      promociona: createForm.value.promociona,
      id_carrera: carreraId.value as number,
      id_profesor: createForm.value.id_profesor as number,
      id_suplente: createForm.value.id_suplente || null,
    }

    const nuevo = await crearMateria(token, payload)

    // insertamos en la tabla sin refetch
    items.value = [nuevo, ...items.value]

    alertSuccess('Materia creada correctamente ✅')
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

/* --------- guardar EDICIÓN materia --------- */
async function guardarEditar() {
  console.log('guardarEditar() disparado. editId:', editId.value)

  if (editId.value == null) {
    alertError('No hay materia seleccionada para editar')
    return
  }

  editErrors.value = []
  validarBase(editForm.value, editErrors.value)
  if (editErrors.value.length) {
    alertError(editErrors.value.join(' · '))
    return
  }

  try {
    saving.value = true

    // payload para PUT (tiene que incluir promociona porque el backend lo exige)
    const payload: any = {
      nombre: editForm.value.nombre.trim(),
      abreviado: editForm.value.abreviado?.trim() || '',
      curso: Number(editForm.value.curso),
      cursado: editForm.value.cursado,
      libre: editForm.value.libre,
      promociona: editForm.value.promociona, // <-- IMPORTANTE
      id_carrera: carreraId.value as number,
      id_profesor: editForm.value.id_profesor,
      id_suplente: editForm.value.id_suplente || null,
    }

    const updated = await actualizarMateria(token, editId.value, payload)

    // reflejar cambios locales en la tabla
    items.value = items.value.map(i =>
      i.id === updated.id ? { ...i, ...updated } : i,
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

/* --------- init --------- */
onMounted(async () => {
  await Promise.all([cargarCarreras(), cargarProfesores()])

  // autoseleccionar primera carrera si querés que cargue sola
  if (!carreraId.value && carreras.value.length) {
    carreraId.value = carreras.value[0].id
  }
})
</script>
