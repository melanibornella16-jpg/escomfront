<template>
  <div class="space-y-4">
    <div class="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <h2 class="text-xl font-semibold">Notas de Examen</h2>
      <div class="flex gap-2 flex-wrap">
        <select v-model.number="filterTurnoId" class="border rounded px-3 py-2">
          <option :value="0">Todos los turnos</option>
          <option v-for="t in turnos" :key="t.id" :value="t.id">{{ t.nombre }}</option>
        </select>
        <input v-model="q" placeholder="Buscar mesa por materia / fecha..." class="border rounded px-3 py-2 w-80" />
      </div>
    </div>

    <div class="overflow-x-auto rounded border bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr class="text-left">
            <th class="px-4 py-2">Mesa</th>
            <th class="px-4 py-2">Fecha</th>
            <th class="px-4 py-2">Hora</th>
            <th class="px-4 py-2">Turno</th>
            <th class="px-4 py-2">Materias</th>
            <th class="px-4 py-2 w-40">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="6" class="px-4 py-6 text-center text-gray-400">Cargando...</td>
          </tr>

          <tr v-for="m in pageItems" :key="m.id" class="border-t">
            <td class="px-4 py-2">#{{ m.id }}</td>
            <td class="px-4 py-2">{{ m.fecha }}</td>
            <td class="px-4 py-2">{{ m.hora }}</td>
            <td class="px-4 py-2">{{ m.turno }}</td>
            <td class="px-4 py-2">
              <div class="text-xs text-gray-600">{{ m.materia1 }} · {{ m.materia2 }} · {{ m.materia3 }}</div>
            </td>
            <td class="px-4 py-2">
              <router-link :to="`/notas-examen/${m.id}`" class="px-3 py-1 rounded border hover:bg-gray-50">
                Asentar
              </router-link>
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { MesaExamen } from '@/services/mesasExamen'
import { listarMesasExamen, listarMesasPorTurno } from '@/services/mesasExamen'
import type { TurnoExamen } from '@/services/turnosExamen'
import { listarTurnosExamen } from '@/services/turnosExamen'

const auth = useAuthStore()

const items = ref<MesaExamen[]>([])
const turnos = ref<TurnoExamen[]>([])
const cargando = ref(false)
const error = ref('')

const filterTurnoId = ref(0)
const q = ref('')
const page = ref(1)
const pageSize = 10

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
  try {
    turnos.value = await listarTurnosExamen(auth.token)
  } catch {}
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
    const blob = `${m.id} ${m.fecha} ${m.hora} ${m.turno} ${m.materia1} ${m.materia2} ${m.materia3}`.toLowerCase()
    return blob.includes(term)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtrados.value.length / pageSize)))
watch(filtrados, () => {
  page.value = 1
})

const startIndex = computed(() => (page.value - 1) * pageSize)
const endIndex = computed(() => Math.min(filtrados.value.length, startIndex.value + pageSize))
const pageItems = computed(() => filtrados.value.slice(startIndex.value, endIndex.value))
</script>
