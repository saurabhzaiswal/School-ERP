<script>
import AppMenu from './app_menu.vue'
export default {
  name: 'SideNavbar', components: { AppMenu },
  props: { user: { type: Object, required: true }, navOpen: Boolean },
  emits: ['toggle', 'profile', 'logout'],
  computed: { initials() { return this.user.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() } },
}
</script>
<template>
  <aside class="app-sidebar shrink-0 text-white lg:w-[252px] lg:min-h-screen">
    <div class="flex items-center justify-between px-5 py-5 lg:px-6 lg:pt-7">
      <router-link to="/students" class="flex items-center gap-3" aria-label="School ERP home"><span class="grid size-10 place-items-center rounded-xl bg-[#e2f2ee] text-[#18444b] font-bold text-lg">S</span><span><strong class="block text-[15px] tracking-tight">School ERP</strong><small class="block text-[#9bc4c8] text-[11px] mt-0.5">Staff workspace</small></span></router-link>
      <button type="button" class="lg:hidden rounded-lg px-3 py-2 text-sm border border-white/20" aria-label="Toggle navigation" :aria-expanded="navOpen" @click="$emit('toggle')">Menu</button>
    </div>
    <AppMenu :class="navOpen ? 'block' : 'hidden lg:block'" :user="user" />
    <div :class="['sidebar-account px-4 py-4 lg:block', navOpen ? 'block' : 'hidden']"><button type="button" class="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-white/10" @click="$emit('profile')"><span class="grid size-9 shrink-0 place-items-center rounded-full bg-[#d5ece5] text-[#174a50] text-xs font-bold">{{ initials }}</span><span class="min-w-0"><strong class="block truncate text-sm">{{ user.name }}</strong><small class="block text-[#a7c6c8] text-xs">{{ user.role === 'ADMIN' ? 'Administrator' : 'Teacher' }}</small></span></button><button type="button" class="mt-3 w-full rounded-lg px-4 py-2 text-left text-xs text-[#c2dcdd] hover:bg-white/10" @click="$emit('logout')">Sign out</button></div>
  </aside>
</template>
<style scoped lang="scss">
.app-sidebar { background: #173b45; position: relative; }
.sidebar-account { border-top: 1px solid #ffffff22; }
@media (min-width: 1024px) {
  .app-sidebar { position: fixed; top: 0; left: 0; width: 252px; height: 100dvh; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; z-index: 20; }
  .sidebar-account { margin-top: auto; }
}
</style>
