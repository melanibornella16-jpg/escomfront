<template>
  <header class="border-b bg-white/70 backdrop-blur">
    <div class="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
      <h1 class="text-lg font-semibold">
        <span class="text-[--color-primary]">Vue</span> Dashboard
      </h1>
      <div class="flex items-center gap-3">
        <div v-if="user" class="text-sm text-gray-600">
          {{ user.name }} · {{ user.email }}
        </div>
        <button
          class="rounded-full px-4 py-2 text-white bg-[--color-primary] hover:opacity-90"
          @click="onLogout"
        >
          Salir
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { user } = storeToRefs(auth)

async function onLogout() {
  await auth.logout()
  window.location.href = '/login'
}
</script>
