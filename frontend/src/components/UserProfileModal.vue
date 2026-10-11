<script>
import { VueFinalModal } from 'vue-final-modal'
import moment from 'moment'
import ModalCloseButton from '../common/ModalCloseButton.vue'
export default {
  name: 'UserProfileModal', components: { VueFinalModal, ModalCloseButton },
  props: { user: { type: Object, required: true } }, emits: ['close'],
  computed: {
    initials() { return this.user.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() },
    classList() { return this.user.assignments?.map(row => `Class ${row.grade} · ${row.section}`).join(', ') || 'All classes' },
    joined() { return this.user.createdAt ? moment(this.user.createdAt).format('DD MMM YYYY') : '—' },
  },
}
</script>
<template>
  <VueFinalModal :model-value="true" class="flex items-center justify-center p-0 sm:p-4" content-class="w-full sm:max-w-xl h-[100dvh] sm:h-auto sm:max-h-[90dvh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" @update:model-value="!$event && $emit('close')">
    <header class="flex items-center justify-between border-b border-[#e7eeed] px-5 py-4 sm:px-7"><h2 class="text-lg font-bold">Your profile</h2><ModalCloseButton @click="$emit('close')" /></header>
    <div class="overflow-y-auto p-5 sm:p-7">
      <div class="flex items-center gap-4 pb-6 border-b border-[#e7eeed]"><span class="grid size-16 shrink-0 place-items-center rounded-full bg-[#deeee8] text-[#216c65] text-xl font-bold">{{ initials }}</span><div class="min-w-0"><p class="font-bold text-xl">{{ user.name }}</p><p class="text-sm text-[#6c8487] break-all">{{ user.email }}</p></div></div>
      <dl class="grid sm:grid-cols-2 gap-4 pt-6 text-sm"><div class="profile-field"><dt>Role</dt><dd>{{ user.role === 'ADMIN' ? 'Administrator' : 'Teacher' }}</dd></div><div class="profile-field"><dt>Joined</dt><dd>{{ joined }}</dd></div><div class="profile-field"><dt>Gender</dt><dd>{{ user.gender ? user.gender.replaceAll('_', ' ').toLowerCase() : 'Not provided' }}</dd></div><div class="profile-field"><dt>Phone number</dt><dd>{{ user.phoneNumber || 'Not provided' }}</dd></div><div class="profile-field sm:col-span-2"><dt>Class access</dt><dd>{{ classList }}</dd></div></dl>
    </div>
    <footer class="flex justify-end border-t border-[#e7eeed] p-5"><button v-wave type="button" class="btn btn-secondary" @click="$emit('close')">Close</button></footer>
  </VueFinalModal>
</template>
<style scoped lang="scss">.profile-field { padding: .9rem; border: 1px solid #e4ece9; border-radius: .7rem; background: #fafcfb; dt { color: #718589; font-size: .75rem; margin-bottom: .4rem; } dd { font-weight: 650; } }</style>
