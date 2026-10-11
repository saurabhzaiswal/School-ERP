<script>
export default {
  name: 'AppMenu',
  props: { user: { type: Object, required: true } },
}
</script>
<template>
  <nav class="px-3 pb-4" aria-label="Main navigation">
    <p class="px-3 pb-2 pt-5 text-[10px] uppercase tracking-[.16em] text-[#80adb3]">Workspace</p>
    <router-link to="/students" class="nav-link" active-class="nav-active"><span class="nav-icon">S</span> Students</router-link>
    <router-link to="/attendance" class="nav-link" active-class="nav-active"><span class="nav-icon">A</span> Attendance</router-link>
    <router-link v-if="user.role === 'ADMIN'" to="/dues" class="nav-link" active-class="nav-active"><span class="nav-icon">F</span> Fee follow-up</router-link>
    <p class="px-3 pb-2 pt-7 text-[10px] uppercase tracking-[.16em] text-[#80adb3]">Administration</p>
    <router-link v-if="user.role === 'ADMIN'" to="/users" class="nav-link" active-class="nav-active"><span class="nav-icon">U</span> User management</router-link>
    <router-link to="/activity" class="nav-link" active-class="nav-active"><span class="nav-icon">L</span> Activity log</router-link>
  </nav>
</template>
<style scoped lang="scss">
.nav-link { display: flex; align-items: center; gap: .8rem; margin-bottom: .2rem; padding: .72rem .9rem; color: #c5dbdc; border-radius: 9px; font-size: .88rem; font-weight: 600; transition: background .15s, color .15s; }
.nav-link:hover, .nav-active { background: #2c5962; color: #fff; }
.nav-icon { display: grid; place-items: center; width: 1.35rem; height: 1.35rem; background: #ffffff1a; border-radius: .35rem; font-size: .68rem; font-weight: 700; }
</style>
