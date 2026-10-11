<script>
import { VueFinalModal } from 'vue-final-modal'
import { defineAsyncComponent } from 'vue'
import AppDropdown from '../cmp/erp/element/dropdown.vue'
import Checkbox from '../cmp/erp/element/checkbox.vue'
import ModalCloseButton from '../common/ModalCloseButton.vue'
const AppPhoneNumber = defineAsyncComponent(() => import('../cmp/erp/element/app_phonenumber.vue'))
import { api } from '../api'

const blank = () => ({ name: '', email: '', gender: null, phoneNumber: '', role: 'TEACHER', active: true, password: '', assignments: [{ grade: '', section: '' }] })
export default {
  name: 'UserFormModal', components: { VueFinalModal, AppDropdown, Checkbox, ModalCloseButton, AppPhoneNumber },
  props: { user: { type: Object, default: null }, currentUserId: { type: String, required: true } }, emits: ['saved', 'close'],
  data() { return { form: this.user ? { name: this.user.name, email: this.user.email, gender: this.user.gender, phoneNumber: this.user.phoneNumber || '', role: this.user.role, active: this.user.active, password: '', assignments: this.user.assignments?.map(({ grade, section }) => ({ grade, section })) || [] } : blank(), busy: false, error: '', grades: Array.from({ length: 12 }, (_, i) => String(i + 1)), sections: ['A', 'B', 'C', 'D'] } },
  watch: { 'form.role'(role) { if (role === 'ADMIN') this.form.assignments = []; else if (!this.form.assignments.length) this.form.assignments = [{ grade: '', section: '' }] } },
  methods: {
    addClass() { this.form.assignments.push({ grade: '', section: '' }) },
    removeClass(index) { this.form.assignments.splice(index, 1) },
    async save() {
      this.error = ''
      const name = this.form.name.trim(), email = this.form.email.trim().toLowerCase()
      const phoneNumber = String(this.form.phoneNumber || '').replace(/[^\d+]/g, '')
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.error = 'Enter a name and valid email address.'; return }
      if (phoneNumber && !/^\+[1-9]\d{6,14}$/.test(phoneNumber)) { this.error = 'Enter a phone number with country code, such as +919876543210.'; return }
      if (!this.user && this.form.password.length < 10) { this.error = 'A new user needs a password of at least 10 characters.'; return }
      if (this.form.password && this.form.password.length < 10) { this.error = 'Password must contain at least 10 characters.'; return }
      const assignments = this.form.role === 'ADMIN' ? [] : this.form.assignments.map(row => ({ grade: row.grade, section: row.section }))
      if (this.form.role === 'TEACHER' && (!assignments.length || assignments.some(row => !row.grade || !row.section))) { this.error = 'Assign each teacher at least one class and section.'; return }
      if (new Set(assignments.map(row => `${row.grade}:${row.section}`)).size !== assignments.length) { this.error = 'Remove duplicate class assignments.'; return }
      const payload = { name, email, gender: this.form.gender || null, phoneNumber: phoneNumber || null, role: this.form.role, active: this.form.active, assignments, ...(this.form.password ? { password: this.form.password } : {}) }
      this.busy = true
      try { const saved = await api(this.user ? `/users/${this.user.id}` : '/users', { method: this.user ? 'PATCH' : 'POST', body: payload }); this.$emit('saved', saved) }
      catch (error) { this.error = error.message; this.$toast.error(error.message) }
      finally { this.busy = false }
    },
  },
}
</script>
<template>
  <VueFinalModal :model-value="true" class="flex items-center justify-center p-0 sm:p-4" content-class="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:max-h-[92dvh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" @update:model-value="!$event && $emit('close')">
    <form class="flex flex-col min-h-0" @submit.prevent="save">
      <header class="flex justify-between items-start gap-4 border-b border-[#e8eeeb] p-5 sm:p-7"><div><p class="eyebrow mb-2">Team access</p><h2 class="page-title !text-[2rem]">{{ user ? 'Edit user' : 'Add a user' }}</h2><p class="text-sm text-[#71888c] mt-2">Set the role and the classes this person can access.</p></div><ModalCloseButton @click="$emit('close')" /></header>
      <div class="overflow-y-auto min-h-0 p-5 sm:p-7 grid gap-4 sm:grid-cols-2">
        <label class="text-sm font-semibold">Full name<input v-model="form.name" type="text" class="field mt-2" placeholder="Staff member's full name" required minlength="2" maxlength="100" autocomplete="name" /></label>
        <label class="text-sm font-semibold">Email address<input v-model="form.email" type="email" class="field mt-2" placeholder="name@school.edu" required autocomplete="email" /></label>
        <div><label class="text-sm font-semibold block mb-2">Gender</label><AppDropdown v-model="form.gender" :options="[{ value: null, label: 'Select gender' }, { value: 'FEMALE', label: 'Female' }, { value: 'MALE', label: 'Male' }, { value: 'OTHER', label: 'Other' }, { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' }]" aria-label="Staff gender" /></div>
        <div><label class="text-sm font-semibold block mb-2">Phone number</label><AppPhoneNumber :model-value="form.phoneNumber || ''" placeholder="+91 98765 43210" @update:model-value="form.phoneNumber = $event" /></div>
        <div><label class="text-sm font-semibold block mb-2">Role</label><AppDropdown v-model="form.role" :options="[{ value: 'TEACHER', label: 'Teacher' }, { value: 'ADMIN', label: 'Administrator' }]" aria-label="Role" :disabled="user?.id === currentUserId" /></div>
        <label class="text-sm font-semibold">{{ user ? 'New password (optional)' : 'Temporary password' }}<input v-model="form.password" type="password" class="field mt-2" placeholder="At least 10 characters" :required="!user" minlength="10" autocomplete="new-password" /><span class="block mt-1 text-xs text-[#798b8f]">At least 10 characters. Share it privately.</span></label>
        <div v-if="form.role === 'TEACHER'" class="sm:col-span-2"><div class="flex items-center justify-between mb-3"><h3 class="text-sm font-bold">Class assignments</h3><button type="button" class="text-sm font-semibold text-[#176a68]" @click="addClass">+ Add class</button></div><div v-for="(row, index) in form.assignments" :key="index" class="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2"><AppDropdown v-model="row.grade" :options="grades" placeholder="Class" aria-label="Class" /><AppDropdown v-model="row.section" :options="sections" placeholder="Section" aria-label="Section" /><button type="button" class="rounded-lg px-2 text-[#a3453e]" aria-label="Remove class" @click="removeClass(index)">×</button></div></div>
        <div class="sm:col-span-2 text-sm"><Checkbox v-model="form.active" :disabled="user?.id === currentUserId"><template #label>Active account <span class="text-[#7d9093]">(inactive users cannot sign in)</span></template></Checkbox></div>
        <p v-if="error" role="alert" class="sm:col-span-2 text-sm text-[#ae493b]">{{ error }}</p>
      </div>
      <footer class="flex justify-end gap-2 border-t border-[#e8eeeb] p-5 sm:px-7"><button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button><button v-wave type="submit" class="btn btn-primary" :disabled="busy">{{ busy ? 'Saving…' : user ? 'Save changes' : 'Create user' }}</button></footer>
    </form>
  </VueFinalModal>
</template>


