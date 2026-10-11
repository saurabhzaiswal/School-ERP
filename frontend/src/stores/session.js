import { defineStore } from 'pinia'
import { api } from '../api'

export const useSessionStore = defineStore('session', {
  state: () => ({ user: null, ready: false, pending: null }),
  actions: {
    async initialize() {
      if (this.ready) return this.user
      if (this.pending) return this.pending
      this.pending = this.refresh()
      try { return await this.pending }
      finally { this.pending = null }
    },
    async refresh() {
      try { this.user = await api('/auth/me') }
      catch { this.user = null }
      finally { this.ready = true }
      return this.user
    },
    async signIn(email, password) {
      await api('/auth/login', { method: 'POST', body: { email, password } })
      this.ready = false
      return this.refresh()
    },
    async signOut() {
      try { await api('/auth/logout', { method: 'POST' }) }
      finally { this.clear() }
    },
    clear() { this.user = null; this.ready = true; this.pending = null },
  },
})
