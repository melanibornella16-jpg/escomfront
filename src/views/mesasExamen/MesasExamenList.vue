<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold">Mesas de Examen</h2>
      <div class="flex gap-2 flex-wrap">
        <select v-model.number="filterTurnoId" class="border rounded px-3 py-2">
          <option :value="0">Todos los turnos</option>
          <option v-for="t in turnos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
        </select>
        <input v-model="q" placeholder="Buscar por materia / docente..." class="border rounded px-3 py-2 w-80" />
        <button @click="abrirCrear" class="rounded px-4 py-2 text-white bg-emerald-600 hover:opacity-90">Nuevo</button>
      </div>
    </div>

    <div class="overflow-x-auto rounded border bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left">
            <th class="px-4 py-2">ID</th>
            <th class="px-4 py-2">Fecha</th>
            <th class="px-4 py-2">Hora</th>
            <th class="px-4 py-2">Turno</th>
            <th class="px-4 py-2">Materia 1</th>
            <th class="px-4 py-2">Materia 2</th>
            <th class="px-4 py-2">Materia 3</th>
            <th class="px-4 py-2 w-72">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="8" class="px-4 py-6 text-center text-gray-400">Cargando...</td>
          </tr>

          <tr v-for="m in pageItems" :key="m.id" class="border-t">
            <td class="px-4 py-2">{{ m.id }}</td>
            <td class="px-4 py-2">{{ m.fecha }}</td>
            <td class="px-4 py-2">{{ m.hora }}</td>
            <td class="px-4 py-2">{{ m.turno }}</td>
            <td class="px-4 py-2">{{ m.materia1 }}</td>
            <td class="px-4 py-2">{{ m.materia2 }}</td>
            <td class="px-4 py-2">{{ m.materia3 }}</td>
            <td class="px-4 py-2 flex flex-wrap gap-2">
              <button @click="abrirEditar(m)" class="px-3 py-1 rounded border hover:bg-gray-50">Editar</button>
              <router-link :to="`/notas-examen/${m.id}`" class="px-3 py-1 rounded border hover:bg-gray-50">Notas</router-link>
              <router-link :to="`/actas-examen?examenId=${m.id}`" class="px-3 py-1 rounded border hover:bg-gray-50">Acta</router-link>
              <button @click="onEliminar(m)" class="px-3 py-1 rounded text-white bg-rose-600 hover:opacity-90">Borrar</button>
            </td>
          </tr>

          <tr v-if="!cargando && !filtrados.length">
            <td colspan="8" class="px-4 py-6 text-center text-gray-500">Sin resultados</td>
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
      <div class="bg-white rounded-xl shadow p-5 w-full max-w-3xl space-y-4">
        <h3 class="text-lg font-semibold">{{ editId ? 'Editar mesa' : 'Nueva mesa' }}</h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="text-sm">
            Turno
            <select v-model.number="form.id_turnoex" class="mt-1 w-full border rounded px-3 py-2">
              <option v-for="t in turnos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
            </select>
          </label>

          <label class="text-sm">
            Fecha
            <input v-model="form.fecha" type="date" class="mt-1 w-full border rounded px-3 py-2" />
          </label>

          <label class="text-sm">
            Hora (HH:mm)
            <input v-model="form.hora" type="time" class="mt-1 w-full border rounded px-3 py-2" />
          </label>

          <div class="sm:col-span-2 border rounded p-3 bg-gray-50">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label class="text-sm">
                Materia 1
                <select v-model.number="form.id_materia_1" class="mt-1 w-full border rounded px-3 py-2">
                  <option v-for="m in materias" :key="m.id" :value="m.id">{{ m.nombre }}</option>
                </select>
              </label>
              <label class="text-sm">
                Materia 2
                <select v-model.number="form.id_materia_2" class="mt-1 w-full border rounded px-3 py-2">
                  <option v-for="m in materias" :key="m.id" :value="m.id">{{ m.nombre }}</option>
                </select>
              </label>
              <label class="text-sm">
                Materia 3
                <select v-model.number="form.id_materia_3" class="mt-1 w-full border rounded px-3 py-2">
                  <option v-for="m in materias" :key="m.id" :value="m.id">{{ m.nombre }}</option>
                </select>
              </label>
            </div>
          </div>

          <div class="sm:col-span-2 border rounded p-3 bg-gray-50">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label class="text-sm">
                Suplente (mesa)
                <select v-model.number="form.id_suplente" class="mt-1 w-full border rounded px-3 py-2">
                  <option v-for="p in profesores" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </label>
              <label class="text-sm">
                Auxiliar 1
                <select v-model.number="form.id_aux_1" class="mt-1 w-full border rounded px-3 py-2">
                  <option v-for="p in profesores" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </label>
              <label class="text-sm">
                Auxiliar 2
                <select v-model.number="form.id_aux_2" class="mt-1 w-full border rounded px-3 py-2">
                  <option v-for="p in profesores" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </label>
            </div>
          </div>
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
import type { MesaExamen } from '@/services/mesasExamen'
import { actualizarMesaExamen, crearMesaExamen, eliminarMesaExamen, listarMesasExamen, listarMesasPorTurno, obtenerMesaExamen } from '@/services/mesasExamen'
import type { TurnoExamen } from '@/services/turnosExamen'
import { listarTurnosExamen } from '@/services/turnosExamen'
import type { Materia } from '@/services/materias'
import { listarTodasMaterias } from '@/services/materias'
import type { Profesor } from '@/services/profesores'
import { listarProfesores } from '@/services/profesores'

const auth = useAuthStore()

const items = ref<MesaExamen[]>([])
const cargando = ref(false)
const error = ref('')

const turnos = ref<TurnoExamen[]>([])
const materias = ref<Materia[]>([])
const profesores = ref<Profesor[]>([])

const filterTurnoId = ref<number>(0)
const q = ref('')
const page = ref(1)
const pageSize = 10

const modalOpen = ref(false)
const editId = ref<number | null>(null)
const saving = ref(false)
const modalError = ref('')

const form = reactive({
  id_turnoex: 0,
  fecha: '',
  hora: '',
  id_materia_1: 0,
  id_materia_2: 0,
  id_materia_3: 0,
  id_suplente: 0,
  id_aux_1: 0,
  id_aux_2: 0,
})

async function cargarCatalogos() {
  try {
    const [t, m, p] = await Promise.all([
      listarTurnosExamen(auth.token),
      listarTodasMaterias(auth.token),
      listarProfesores(auth.token),
    ])
    turnos.value = t
    materias.value = m
    profesores.value = p

    if (!form.id_turnoex && t.length) form.id_turnoex = t[0].id
    if (!form.id_materia_1 && m.length) form.id_materia_1 = m[0].id
    if (!form.id_materia_2 && m.length) form.id_materia_2 = m[0].id
    if (!form.id_materia_3 && m.length) form.id_materia_3 = m[0].id
    if (!form.id_suplente && p.length) form.id_suplente = p[0].id
    if (!form.id_aux_1 && p.length) form.id_aux_1 = p[0].id
    if (!form.id_aux_2 && p.length) form.id_aux_2 = p[0].id
  } catch (e: any) {
    // no rompas toda la pantalla por catálogo, pero dejá señal
    console.warn('Error cargando catálogos:', e?.message || e)
  }
}

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const resp = filterTurnoId.value
      ? await listarMesasPorTurno(auth.token, filterTurnoId.value)
      : await listarMesasExamen(auth.token)
    items.value = resp.items
  } catch (e: any) {
    error.value = e?.message || 'Error al cargar mesas'
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargarCatalogos()
  await cargar()
})

watch(filterTurnoId, () => {
  page.value = 1
  cargar()
})

const filtrados = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return items.value
  return items.value.filter((m) => {
    const blob = `${m.materia1} ${m.materia2} ${m.materia3} ${m.docente_materia1} ${m.docente_materia2} ${m.docente_materia3} ${m.turno}`.toLowerCase()
    return blob.includes(term)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtrados.value.length / pageSize)))
watch(filtrados, () => { page.value = 1 })

const startIndex = computed(() => (page.value - 1) * pageSize)
const endIndex = computed(() => Math.min(filtrados.value.length, startIndex.value + pageSize))
const pageItems = computed(() => filtrados.value.slice(startIndex.value, endIndex.value))

function abrirCrear() {
  editId.value = null
  modalError.value = ''

  // defaults razonables
  form.id_turnoex = turnos.value[0]?.id || 0
  form.fecha = ''
  form.hora = ''
  form.id_materia_1 = materias.value[0]?.id || 0
  form.id_materia_2 = materias.value[0]?.id || 0
  form.id_materia_3 = materias.value[0]?.id || 0
  form.id_suplente = profesores.value[0]?.id || 0
  form.id_aux_1 = profesores.value[0]?.id || 0
  form.id_aux_2 = profesores.value[0]?.id || 0

  modalOpen.value = true
}

async function abrirEditar(m: MesaExamen) {
  editId.value = m.id
  modalError.value = ''
  try {
    const raw = await obtenerMesaExamen(auth.token, m.id)
    form.id_turnoex = Number(raw.id_turnoex)
    form.fecha = raw.fecha
    form.hora = raw.hora
    form.id_materia_1 = Number(raw.id_materia_1)
    form.id_materia_2 = Number(raw.id_materia_2)
    form.id_materia_3 = Number(raw.id_materia_3)
    form.id_suplente = Number(raw.id_suplente)
    form.id_aux_1 = Number(raw.id_aux_1)
    form.id_aux_2 = Number(raw.id_aux_2)
  } catch (e: any) {
    modalError.value = e?.message || 'No se pudo precargar la mesa para editar'
  }
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
      id_turnoex: Number(form.id_turnoex),
      fecha: form.fecha,
      hora: form.hora,
      id_materia_1: Number(form.id_materia_1),
      id_materia_2: Number(form.id_materia_2),
      id_materia_3: Number(form.id_materia_3),
      id_suplente: Number(form.id_suplente),
      id_aux_1: Number(form.id_aux_1),
      id_aux_2: Number(form.id_aux_2),
    }

    if (editId.value) {
      await actualizarMesaExamen(auth.token, editId.value, payload)
    } else {
      await crearMesaExamen(auth.token, payload)
    }

    await cargar()
    modalOpen.value = false
  } catch (e: any) {
    modalError.value = e?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}

async function onEliminar(m: MesaExamen) {
  if (!confirm(`¿Eliminar mesa #${m.id}?`)) return
  try {
    await eliminarMesaExamen(auth.token, m.id)
    await cargar()
  } catch (e: any) {
    alert(e?.message || 'No se pudo eliminar')
  }
}
</script>
