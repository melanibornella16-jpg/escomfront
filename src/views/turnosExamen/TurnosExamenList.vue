<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold">Turnos de Examen</h2>
      <div class="flex gap-2">
        <input v-model="q" placeholder="Buscar por nombre..." class="border rounded px-3 py-2 w-80" />
        <button @click="abrirCrear" class="rounded px-4 py-2 text-white bg-emerald-600 hover:opacity-90">
          Nuevo
        </button>
      </div>
    </div>

    <div class="overflow-x-auto rounded border bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left">
            <th class="px-4 py-2">ID</th>
            <th class="px-4 py-2">Nombre</th>
            <th class="px-4 py-2">Estado</th>
            <th class="px-4 py-2">Vista</th>
            <th class="px-4 py-2">Fecha inscripción</th>
            <th class="px-4 py-2 w-56">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="6" class="px-4 py-6 text-center text-gray-400">Cargando...</td>
          </tr>

          <tr v-for="t in pageItems" :key="t.id" class="border-t">
            <td class="px-4 py-2">{{ t.id }}</td>
            <td class="px-4 py-2">{{ t.nombre }}</td>
            <td class="px-4 py-2">{{ t.estado }}</td>
            <td class="px-4 py-2">{{ t.vista }}</td>
            <td class="px-4 py-2">{{ t.fecha_inscripcion || '—' }}</td>
            <td class="px-4 py-2 flex gap-2">
              <button @click="abrirEditar(t)" class="px-3 py-1 rounded border hover:bg-gray-50">Editar</button>
              <button @click="onEliminar(t)" class="px-3 py-1 rounded text-white bg-rose-600 hover:opacity-90">Borrar</button>
            </td>
          </tr>

          <tr v-if="!cargando && !filtrados.length">
            <td colspan="6" class="px-4 py-6 text-center text-gray-500">Sin resultados</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-between pt-2">
      <div class="text-sm text-gray-600">
        Mostrando <strong>{{ startIndex + 1 }}</strong>-<strong>{{ endIndex }}</strong> de <strong>{{ filtrados.length }}</strong>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-1 rounded border disabled:opacity-50" :disabled="page === 1" @click="page = 1">« Primero</button>
        <button class="px-3 py-1 rounded border disabled:opacity-50" :disabled="page === 1" @click="page--">‹ Anterior</button>
        <span class="px-2 py-1">Página {{ page }} / {{ totalPages }}</span>
        <button class="px-3 py-1 rounded border disabled:opacity-50" :disabled="page === totalPages" @click="page++">Siguiente ›</button>
        <button class="px-3 py-1 rounded border disabled:opacity-50" :disabled="page === totalPages" @click="page = totalPages">Última »</button>
      </div>
    </div>

    <p v-if="error" class="text-rose-600 text-sm">{{ error }}</p>

    <!-- MODAL (Crear / Editar) -->
    <div v-if="modalOpen" class="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div class="bg-white rounded-xl shadow p-5 w-full max-w-xl space-y-4">
        <h3 class="text-lg font-semibold">{{ editId ? 'Editar turno' : 'Nuevo turno' }}</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="text-sm sm:col-span-2">
            Nombre
            <input v-model="form.nombre" class="mt-1 w-full border rounded px-3 py-2" />
          </label>

          <label class="text-sm">
            Estado
            <select v-model="form.estado" class="mt-1 w-full border rounded px-3 py-2">
              <option value="A">A</option>
              <option value="N">N</option>
            </select>
          </label>

          <label class="text-sm">
            Vista (0/1)
            <input v-model="form.vista" class="mt-1 w-full border rounded px-3 py-2" />
          </label>

          <label class="text-sm">
            Próx. orden
            <input v-model.number="form.prox_orden" type="number" min="0" class="mt-1 w-full border rounded px-3 py-2" />
          </label>

          <label class="text-sm">
            Fecha inscripción
            <input v-model="form.fecha_inscripcion" type="date" class="mt-1 w-full border rounded px-3 py-2" />
          </label>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button @click="cerrarModal" class="px-3 py-2 rounded border hover:bg-gray-50">Cancelar</button>
          <button @click="guardar" :disabled="saving" class="px-4 py-2 rounded text-white bg-violet-600 hover:opacity-90 disabled:opacity-60">
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>

        <p v-if="modalError" class="text-rose-600 text-sm">{{ modalError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { TurnoExamen } from '@/services/turnosExamen'
import { actualizarTurnoExamen, crearTurnoExamen, eliminarTurnoExamen, listarTurnosExamen } from '@/services/turnosExamen'

const auth = useAuthStore()

const items = ref<TurnoExamen[]>([])
const cargando = ref(false)
const error = ref('')

const q = ref('')
const page = ref(1)
const pageSize = 10

const modalOpen = ref(false)
const editId = ref<number | null>(null)
const saving = ref(false)
const modalError = ref('')

const form = reactive({
  nombre: '',
  estado: 'A' as 'A' | 'N',
  prox_orden: 0,
  vista: 1 as any,
  fecha_inscripcion: '' as string | null,
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    items.value = await listarTurnosExamen(auth.token)
  } catch (e: any) {
    error.value = e?.message || 'Error al cargar turnos'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return items.value
  return items.value.filter((t) => t.nombre?.toLowerCase().includes(term))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtrados.value.length / pageSize)))
watch(filtrados, () => { page.value = 1 })

const startIndex = computed(() => (page.value - 1) * pageSize)
const endIndex = computed(() => Math.min(filtrados.value.length, startIndex.value + pageSize))
const pageItems = computed(() => filtrados.value.slice(startIndex.value, endIndex.value))

function abrirCrear() {
  editId.value = null
  form.nombre = ''
  form.estado = 'A'
  form.prox_orden = 0
  form.vista = 1
  form.fecha_inscripcion = ''
  modalError.value = ''
  modalOpen.value = true
}

function abrirEditar(t: TurnoExamen) {
  editId.value = t.id
  form.nombre = t.nombre
  form.estado = t.estado
  form.prox_orden = Number(t.prox_orden ?? 0)
  form.vista = t.vista ?? 1
  form.fecha_inscripcion = (t.fecha_inscripcion ?? '') as any
  modalError.value = ''
  modalOpen.value = true
}

function cerrarModal() {
  modalOpen.value = false
}

async function guardar() {
  saving.value = true
  modalError.value = ''
  try {
    const payload = {
      nombre: form.nombre,
      estado: form.estado,
      prox_orden: Number(form.prox_orden ?? 0),
      vista: form.vista,
      fecha_inscripcion: form.fecha_inscripcion || null,
    }

    if (editId.value) {
      await actualizarTurnoExamen(auth.token, editId.value, payload)
    } else {
      await crearTurnoExamen(auth.token, payload)
    }

    await cargar()
    modalOpen.value = false
  } catch (e: any) {
    modalError.value = e?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function onEliminar(t: TurnoExamen) {
  if (!confirm(`¿Eliminar turno "${t.nombre}"?`)) return
  try {
    await eliminarTurnoExamen(auth.token, t.id)
    await cargar()
  } catch (e: any) {
    alert(e?.message || 'No se pudo eliminar')
  }
}
</script>
