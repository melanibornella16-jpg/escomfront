<template>
  <div class="min-h-screen grid place-items-center bg-gray-50">
    <div class="w-full max-w-md p-6 rounded-[--radius-card] bg-white shadow">
      <h2 class="text-2xl font-bold mb-1">Ingresar</h2>
      <p class="text-sm text-gray-500 mb-6">Accedé a tu panel</p>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#7c3aed]"
            placeholder="usuario@dominio.com"
          />
        </div>
        <div>
          <label class="block text-sm mb-1">Contraseña</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-[#7c3aed]"
            placeholder="••••••••"
          />
        </div>

        <button
          :disabled="loading"
          class="w-full rounded-[1rem] py-2 text-white bg-[#7c3aed] hover:opacity-90 disabled:opacity-60"
        >
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>

        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

        <p class="text-xs text-gray-500">
          Tip (mock): <code>admin@demo.com</code> / <code>demo123</code>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('admin@demo.com')
const password = ref('demo123')
const loading = ref(false)
const error = ref('')
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

onMounted(() => {
  // restaura sesión si la hay
  auth.restore().then(() => {
    if (auth.isAuthenticated) {
      router.replace((route.query.redirect as string) || '/')
    }
  })
})

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.replace((route.query.redirect as string) || '/')
  } catch (e: any) {
    error.value = e?.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>
