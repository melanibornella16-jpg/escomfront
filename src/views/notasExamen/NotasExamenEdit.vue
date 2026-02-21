<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold">Asentar notas</h2>
        <div class="text-sm text-gray-600">Mesa #{{ examenId }}</div>
      </div>
      <div class="flex gap-2">
        <router-link to="/notas-examen" class="px-3 py-2 rounded border hover:bg-gray-50">
          Volver
        </router-link>
        <button @click="guardarCambios" :disabled="saving || !dirtyCount" class="px-4 py-2 rounded text-white bg-violet-600 hover:opacity-90 disabled:opacity-50">
          {{ saving ? 'Guardando...' : `Guardar (${dirtyCount})` }}
        </button>
      </div>
    </div>

    <p v-if="error" class="text-rose-600 text-sm">{{ error }}</p>

    <div v-if="cargando" class="text-gray-500">Cargando inscriptos...</div>

    <div v-else class="overflow-x-auto rounded border bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left">
            <th class="px-4 py-2">Alumno</th>
            <th class="px-4 py-2">Carrera</th>
            <th class="px-4 py-2">Materia</th>
            <th class="px-4 py-2 w-36">Fecha rindió</th>
            <th class="px-4 py-2 w-28">Nota</th>
            <th class="px-4 py-2 w-28">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.inscripcionId" class="border-t">
            <td class="px-4 py-2">{{ r.alumnoNombre }}</td>
            <td class="px-4 py-2">{{ r.carreraNombre }}</td>
            <td class="px-4 py-2">{{ r.materiaNombre }}</td>
            <td class="px-4 py-2">
              <input v-model="r.fechaRindio" type="date" class="border rounded px-2 py-1 w-40" @change="markDirty(r)" />
            </td>
            <td class="px-4 py-2">
              <input v-model.number="r.nota" type="number" min="0" max="10" step="1" class="border rounded px-2 py-1 w-24" @input="markDirty(r)" />
            </td>
            <td class="px-4 py-2">
              <select v-model="r.estado" class="border rounded px-2 py-1" @change="onEstadoChange(r)">
                <option value="REGULAR">REGULAR</option>
                <option value="AUSENTE">AUSENTE</option>
              </select>
            </td>
          </tr>

          <tr v-if="!rows.length">
            <td colspan="6" class="px-4 py-6 text-center text-gray-500">
              No hay alumnos inscriptos para esta mesa.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="text-xs text-gray-500">
      Nota técnica: el backend exige varios campos para actualizar una inscripción (id_user, id_materia, fecha, nro_orden, cursada...).
      Para no inventar datos, al guardar buscamos el registro crudo de cada inscripción y actualizamos solo calificación/fecha_rindio.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { listarAlumnosInscriptos, obtenerInscripcion, actualizarInscripcion } from '@/services/notasExamen'

const route = useRoute()
const auth = useAuthStore()

const examenId = Number(route.params.examenId)

const cargando = ref(false)
const error = ref('')
const saving = ref(false)

type Row = {
  inscripcionId: number
  alumnoNombre: string
  carreraNombre: string
  materiaNombre: string
  fechaRindio: string
  nota: number | null
  estado: 'REGULAR' | 'AUSENTE'
  dirty: boolean
  // Cache del registro crudo para evitar pedirlo 2 veces (precarga + guardado)
  _raw?: any
}

const rows = reactive<Row[]>([])

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const inscriptos = await listarAlumnosInscriptos(auth.token, examenId)
    rows.splice(0, rows.length)
    for (const i of inscriptos) {
      rows.push({
        inscripcionId: i.id,
        alumnoNombre: i.alumno_nombre,
        carreraNombre: i.carrera_nombre,
        materiaNombre: i.materia_nombre,
        fechaRindio: '',
        nota: null,
        estado: 'REGULAR',
        dirty: false,
      })
    }

    // Precarga: 1 request por fila. Guardamos el "raw" para reutilizarlo al guardar.
    // Ojo: si tenés muchas inscripciones, esto puede tardar; ideal sería que el backend
    // incluya calificacion/fecha_rindio en listarAlumnosInscriptos y evitar este N+1.
    // Controlamos concurrencia para que no explote el backend si hay muchos alumnos.
    const concurrency = 8
    const queue = [...rows]
    const runners = Array.from({ length: Math.min(concurrency, queue.length) }).map(async () => {
      while (queue.length) {
        const r = queue.shift()!
        try {
          const raw = await obtenerInscripcion(auth.token, r.inscripcionId)
          r._raw = raw
          r.fechaRindio = (raw.fecha_rindio ?? '') as any
          r.nota = (raw.calificacion ?? null) as any
          r.estado = raw.calificacion == null ? 'AUSENTE' : 'REGULAR'
        } catch {
          // ignorar
        }
      }
    })
    await Promise.all(runners)
  } catch (e: any) {
    error.value = e?.message || 'Error al cargar inscriptos'
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

function markDirty(r: Row) {
  r.dirty = true
}

function onEstadoChange(r: Row) {
  if (r.estado === 'AUSENTE') {
    r.nota = null
    r.fechaRindio = ''
  }
  r.dirty = true
}

const dirtyCount = computed(() => rows.filter((r) => r.dirty).length)

async function guardarCambios() {
  if (!dirtyCount.value) return
  saving.value = true
  error.value = ''

  try {
    // Guardamos solo filas tocadas
    const dirtyRows = rows.filter((r) => r.dirty)

    // Guardado en pool para no hacer todo 1 por 1 (más rápido) pero sin reventar el server.
    const concurrency = 5
    const runPool = async <T>(list: T[], worker: (item: T) => Promise<void>, limit: number) => {
      const queue = [...list]
      const runners = Array.from({ length: Math.min(limit, queue.length) }).map(async () => {
        while (queue.length) {
          const item = queue.shift()!
          await worker(item)
        }
      })
      await Promise.all(runners)
    }

    await runPool(
      dirtyRows,
      async (r) => {
        // Reusar raw si existe; si no, lo pedimos (caso raro).
        const raw = r._raw ?? (await obtenerInscripcion(auth.token, r.inscripcionId))

        await actualizarInscripcion(auth.token, r.inscripcionId, {
          id_user: raw.id_user,
          id_materia: raw.id_materia,
          id_examen: raw.id_examen,
          fecha: raw.fecha,
          nro_orden: raw.nro_orden,
          cursada: raw.cursada,
          fecha_rindio: r.estado === 'AUSENTE' ? null : (r.fechaRindio || null),
          calificacion: r.estado === 'AUSENTE' ? null : (r.nota ?? null),
        })

        // mantener cache consistente
        r._raw = { ...raw, fecha_rindio: r.estado === 'AUSENTE' ? null : (r.fechaRindio || null), calificacion: r.estado === 'AUSENTE' ? null : (r.nota ?? null) }
        r.dirty = false
      },
      concurrency,
    )
  } catch (e: any) {
    error.value = e?.message || 'Error al guardar'
  } finally {
    saving.value = false
  }
}
</script>
