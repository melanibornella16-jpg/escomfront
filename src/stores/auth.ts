import { defineStore } from 'pinia'
import { me, login as apiLogin, logout as apiLogout } from '@/services/api'

const TOKEN_KEY = 'token'
const USUARIO = ''

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    user: localStorage.getItem(USUARIO) || '',
  }),
  getters: {
    isAuthenticated: (s) => !!s.token
  },
  actions: {
    async login(email: string, password: string) {
      const { token, user } = await apiLogin(email, password);
      console.log('Token', token);
      console.log('Usuario', user);
      this.token = token
      localStorage.setItem(TOKEN_KEY, token)
      //this.user = await me(token)
      localStorage.setItem(USUARIO, user.name)
    },
    async restore() {
      if (!this.token) return
      try {
        // this.user = await me(this.token)
      } catch {
        this.logout()
      }
    },
    async logout() {
      try { await apiLogout(this.token) } catch {}
      this.token = ''
      this.user = ''
      localStorage.removeItem(TOKEN_KEY)
    }
  }
})
