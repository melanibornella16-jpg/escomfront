<template>
  <section class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    <RouterLink to="/alumnos" class="rounded bg-white p-5 shadow hover:shadow-md transition">
      <h3 class="text-sm text-gray-500">Alumnos</h3>
      <p class="mt-2 text-2xl font-semibold">Gestionar</p>
    </RouterLink>
    <RouterLink to="/profesores" class="rounded bg-white p-5 shadow hover:shadow-md transition">
      <h3 class="text-sm text-gray-500">Profesores</h3>
      <p class="mt-2 text-2xl font-semibold">Gestionar</p>
    </RouterLink>
    <RouterLink to="/materias" class="rounded bg-white p-5 shadow hover:shadow-md transition">
      <h3 class="text-sm text-gray-500">Materias</h3>
      <p class="mt-2 text-2xl font-semibold">Gestionar</p>
    </RouterLink>
    <RouterLink to="/carreras" class="rounded bg-white p-5 shadow hover:shadow-md transition">
      <h3 class="text-sm text-gray-500">Carreras</h3>
      <p class="mt-2 text-2xl font-semibold">Gestionar</p>
    </RouterLink>
  </section>

  <section class="mt-8 rounded bg-white p-6 shadow">
    <h2 class="text-xl font-semibold">Bienvenido 👋 {{ usuario }} </h2>
    <p class="text-gray-600 mt-2">Seleccioná una opción del menú o desde las tarjetas.</p>
  </section>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const USUARIO= ''
const auth = useAuthStore()
const usuario = localStorage.getItem(USUARIO) 
</script>
