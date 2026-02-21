<template>
  <div class="min-h-screen flex bg-gray-50">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r hidden md:block">
      <div class="px-4 py-4 border-b">
        <h1 class="text-lg font-semibold"><span class="text-violet-600">Vue</span> Panel</h1>
      </div>
      <nav class="p-3 space-y-1">
        <RouterLink to="/" class="block px-3 py-2 rounded hover:bg-gray-100" :class="isActive('/')">
          🏠 Inicio
        </RouterLink>
        <RouterLink to="/alumnos" class="block px-3 py-2 rounded hover:bg-gray-100" :class="isActive('/alumnos')">
          🎓 Alumnos
        </RouterLink>
        <RouterLink to="/profesores" class="block px-3 py-2 rounded hover:bg-gray-100" :class="isActive('/profesores')">
          👩‍🏫 Profesores
        </RouterLink>
        <RouterLink to="/materias" class="block px-3 py-2 rounded hover:bg-gray-100" :class="isActive('/materias')">
          📚 Materias
        </RouterLink>
        <RouterLink to="/carreras" class="block px-3 py-2 rounded hover:bg-gray-100" :class="isActive('/carreras')">
          🏛️ Carreras
        </RouterLink>

        <div class="pt-2 mt-2 border-t text-xs uppercase tracking-wide text-gray-400 px-3">
          Exámenes
        </div>
        <RouterLink to="/turnos-examen" class="block px-3 py-2 rounded hover:bg-gray-100" :class="isActive('/turnos-examen')">
          🗓️ Turnos
        </RouterLink>
        <RouterLink to="/mesas-examen" class="block px-3 py-2 rounded hover:bg-gray-100" :class="isActive('/mesas-examen')">
          🧾 Mesas
        </RouterLink>
        <RouterLink to="/notas-examen" class="block px-3 py-2 rounded hover:bg-gray-100" :class="isActive('/notas-examen')">
          ✅ Notas
        </RouterLink>
        <RouterLink to="/actas-examen" class="block px-3 py-2 rounded hover:bg-gray-100" :class="isActive('/actas-examen')">
          🖨️ Actas
        </RouterLink>
      </nav>
    </aside>

    <!-- Content -->
    <div class="flex-1 flex flex-col">
      <header class="bg-white border-b">
        <div class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div class="md:hidden">
            <!-- si querés: botón para abrir sidebar en mobile -->
            <span class="text-sm text-gray-500">Menú</span>
          </div>
          <div class="font-medium">Dashboard</div>
          <button @click="onLogout"
                  class="rounded px-4 py-2 text-white bg-violet-600 hover:opacity-90">
            Salir
          </button>
        </div>
      </header>

      <main class="mx-auto max-w-6xl w-full px-4 py-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

function isActive(path: string) {
  return route.path === path ? 'bg-gray-100 font-medium' : ''
}

async function onLogout() {
  await auth.logout()
  window.location.href = '/login'
}
</script>
