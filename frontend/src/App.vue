<script>
import { useSessionStore } from './stores/session'
import { ModalsContainer } from 'vue-final-modal'
import UserProfileModal from './components/UserProfileModal.vue'
import SideNavbar from './common/sideNavbar.vue'
import TopNavbar from './common/topNavbar.vue'

export default {
  name: 'App',
  components: { ModalsContainer, UserProfileModal, SideNavbar, TopNavbar },
  data() { return { navOpen: false, profileOpen: false } },
  computed: {
    session() { return useSessionStore() },
    user() { return this.session.user },
    isLogin() { return this.$route.path === '/login' },
  },
  watch: {
    '$route.meta.title': { immediate: true, handler(title) { document.title = `${title || 'Workspace'} | School ERP`; this.navOpen = false } },
  },
  methods: {
    async logout() {
      try { await this.session.signOut() }
      catch { this.$toast.error('Signed out locally. Please retry if your session remains active elsewhere.') }
      finally { await this.$router.replace('/login') }
    },
  },
}
</script>
<template>
  <router-view v-if="isLogin" />
  <div v-else-if="user" class="min-h-screen lg:pl-[252px] bg-[#f6f8f8]">
    <SideNavbar :user="user" :nav-open="navOpen" @toggle="navOpen = !navOpen" @profile="profileOpen = true" @logout="logout" />
    <main class="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-10 lg:py-9"><TopNavbar :user="user" :title="$route.meta.title" @profile="profileOpen = true" /><router-view :user="user" /></main>
    <UserProfileModal v-if="profileOpen" :user="user" @close="profileOpen = false" />
  </div>
  <ModalsContainer />
</template>
