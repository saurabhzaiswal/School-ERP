<script>
import { useSessionStore } from '../stores/session'
import AppInput from '../cmp/erp/element/app_input.vue'
export default {
  components: { AppInput },
  data() {
    return { email: '', password: '', busy: false, error: '' }
  },
  methods: {
    async submit() {
      this.busy = true
      this.error = ''
      try {
        const user = await useSessionStore().signIn(this.email, this.password)
        if (!user) throw new Error('Could not load your account. Please sign in again.')
        const redirect = String(this.$route.query.redirect || '')
        await this.$router.replace(redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/students')
      } catch (error) {
        this.error = error.message
      } finally {
        this.busy = false
      }
    },
  },
}
</script>
<template>
  <main class="min-h-screen grid lg:grid-cols-2 bg-[#f5f6f2]">
    <section class="hidden lg:flex bg-[#173b45] text-white p-16 flex-col justify-between">
      <div class="font-bold tracking-wide">S / School ERP</div>
      <div>
        <p class="text-[#9ec3c2] uppercase text-xs tracking-[.2em] mb-6">Office workspace</p>
        <h1 class="font-[inherit] text-6xl leading-[1.08] max-w-lg">
          The school day, in clear view.
        </h1>
        <p class="mt-6 max-w-md text-[#bcd3d2] leading-7">
          Student records, daily attendance, and fee follow-up in one focused workspace.
        </p>
      </div>
      <div class="text-[#83a9ac] text-xs">Private demo environment</div>
    </section>
    <section class="grid place-items-center p-5">
      <form class="card w-full max-w-md p-7 sm:p-10" @submit.prevent="submit">
        <p class="eyebrow">Welcome back</p>
        <h2 class="page-title mt-2">Sign in to your workspace</h2>
        <p class="mt-3 text-sm text-[#648087]">Use a local demo account from the setup guide.</p>
        <label class="block mt-8 text-sm font-semibold"
          >Email address<AppInput
            v-model.trim="email"
            input-type="email"
            input-class="field mt-2"
            placeholder="you@school.edu"
            autocomplete="username"
            required /></label
        ><label class="block mt-5 text-sm font-semibold"
          >Password<AppInput
            v-model="password"
            input-type="password"
            input-class="field mt-2"
            placeholder="Enter your password"
            autocomplete="current-password"
            required
        /></label>
        <p v-if="error" role="alert" class="text-sm text-[#ae493b] mt-4">{{ error }}</p>
        <button v-wave class="btn btn-primary w-full mt-7" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </section>
  </main>
</template>


