<script>
import { VueFinalModal } from 'vue-final-modal'
import { defineAsyncComponent } from 'vue'
import { api } from '../api'
import AppDropdown from '../cmp/erp/element/dropdown.vue'
import Checkbox from '../cmp/erp/element/checkbox.vue'
import ModalCloseButton from '../common/ModalCloseButton.vue'
const AppPhoneNumber = defineAsyncComponent(() => import('../cmp/erp/element/app_phonenumber.vue'))

const blank = () => ({
  name: '',
  gender: null,
  email: '',
  phoneNumber: '',
  grade: '',
  section: '',
  guardianName: '',
  active: true,
  feeStatus: 'PAID',
  amountDue: 0,
})
export default {
  name: 'StudentForm',
  components: { VueFinalModal, AppDropdown, Checkbox, ModalCloseButton, AppPhoneNumber },
  props: { student: { type: Object, default: null } },
  emits: ['saved', 'close'],
  data() {
    return {
      form: this.student ? { ...this.student, amountDue: Number(this.student.amountDue) } : blank(),
      saving: false,
      error: '',
      grades: Array.from({ length: 12 }, (_, i) => String(i + 1)),
      sections: ['A', 'B', 'C', 'D'],
    }
  },
  watch: {
    'form.feeStatus'(status) { if (status === 'PAID') this.form.amountDue = 0 },
  },
  methods: {
    async save() {
      this.error = ''
      if (
        this.form.name.trim().length < 2 || this.form.name.trim().length > 100 ||
        this.form.guardianName.trim().length < 2 || this.form.guardianName.trim().length > 100 ||
        !this.grades.includes(this.form.grade) || !this.sections.includes(this.form.section)
      ) {
        this.error = 'Enter student and guardian names (2–100 characters), class, and section.'
        return
      }
      const email = String(this.form.email || '').trim().toLowerCase()
      const phoneNumber = String(this.form.phoneNumber || '').replace(/[^\d+]/g, '')
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { this.error = 'Enter a valid student email address.'; return }
      if (phoneNumber && !/^\+[1-9]\d{6,14}$/.test(phoneNumber)) { this.error = 'Enter a phone number with country code, such as +919876543210.'; return }
      const due = Number(this.form.amountDue)
      if (
        !Number.isFinite(due) ||
        due < 0 ||
        Math.abs(Math.round(due * 100) - due * 100) > 1e-8 ||
        (this.form.feeStatus === 'PAID' ? due !== 0 : due <= 0)
      ) {
        this.error =
          'Enter a valid due amount. Paid means zero; outstanding means a positive amount.'
        return
      }
      this.saving = true
      const payload = {
        name: this.form.name.trim(),
        gender: this.form.gender || null,
        email: email || null,
        phoneNumber: phoneNumber || null,
        grade: this.form.grade,
        section: this.form.section,
        guardianName: this.form.guardianName.trim(),
        active: this.form.active,
        feeStatus: this.form.feeStatus,
        amountDue: due,
      }
      try {
        const saved = await api(this.student ? `/students/${this.student.id}` : '/students', {
          method: this.student ? 'PATCH' : 'POST',
          body: payload,
        })
        this.$emit('saved', saved)
      } catch (error) {
        this.error = error.message
        this.$toast.error(error.message)
      } finally {
        this.saving = false
      }
    },
  },
}
</script>
<template>
  <VueFinalModal
    :model-value="true"
    class="flex items-center justify-center p-0 sm:p-4"
    content-class="w-full sm:max-w-xl h-[100dvh] sm:h-auto sm:max-h-[92dvh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    @update:model-value="!$event && $emit('close')"
  >
    <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="save">
      <div class="flex justify-between items-start gap-4 border-b border-[#e8eeeb] p-5 sm:p-7">
        <div>
          <p class="eyebrow mb-2">Student record</p>
          <h2 class="page-title !text-[2rem]">{{ student ? 'Edit student' : 'Add a student' }}</h2>
          <p class="text-sm text-[#71888c] mt-2">
            {{
              student
                ? `Admission ${student.admissionNumber}`
                : 'Admission number is assigned automatically after saving.'
            }}
          </p>
        </div>
        <ModalCloseButton @click="$emit('close')" />
      </div>
      <div class="overflow-y-auto p-5 sm:p-7 grid sm:grid-cols-2 gap-4 min-h-0">
        <label class="text-sm font-semibold sm:col-span-2"
          >Student name<input
            v-model.trim="form.name"
            class="field mt-2"
            required
            minlength="2"
            maxlength="100"
            autocomplete="off"
            placeholder="Student's full name"
        /></label>
        <div><label class="text-sm font-semibold block mb-2">Gender</label><AppDropdown v-model="form.gender" :options="[{ value: null, label: 'Select gender' }, { value: 'FEMALE', label: 'Female' }, { value: 'MALE', label: 'Male' }, { value: 'OTHER', label: 'Other' }, { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' }]" aria-label="Student gender" /></div>
        <label class="text-sm font-semibold">Email address<input v-model.trim="form.email" type="email" class="field mt-2" placeholder="student@example.com" autocomplete="email" /></label>
        <div class="sm:col-span-2"><label class="text-sm font-semibold block mb-2">Phone number</label><AppPhoneNumber :model-value="form.phoneNumber || ''" placeholder="+91 98765 43210" @update:model-value="form.phoneNumber = $event" /></div>
        <div>
          <label class="text-sm font-semibold block mb-2">Class / grade</label
          ><AppDropdown
            v-model="form.grade"
            :options="grades"
            placeholder="Select class"
            aria-label="Class or grade"
          />
        </div>
        <div>
          <label class="text-sm font-semibold block mb-2">Section</label
          ><AppDropdown
            v-model="form.section"
            :options="sections"
            placeholder="Select section"
            aria-label="Section"
          />
        </div>
        <label class="text-sm font-semibold sm:col-span-2"
          >Guardian name<input
            v-model.trim="form.guardianName"
            class="field mt-2"
            required
            minlength="2"
            maxlength="100"
            autocomplete="off"
            placeholder="Guardian's full name"
        /></label>
        <div><label class="text-sm font-semibold block mb-2">Fee status</label><AppDropdown v-model="form.feeStatus" :options="[{ value: 'PAID', label: 'Paid' }, { value: 'PENDING', label: 'Pending' }, { value: 'PARTIALLY_PAID', label: 'Partially paid' }]" aria-label="Fee status" /></div>
        <label class="text-sm font-semibold"
          >Amount due<input
            v-model.number="form.amountDue"
            class="field mt-2"
            type="number"
            min="0"
            max="99999999"
            step="0.01"
            required
            :disabled="form.feeStatus === 'PAID'"
            placeholder="0.00"
        /></label>
        <div class="text-sm sm:col-span-2"><Checkbox v-model="form.active"><template #label>Active student</template></Checkbox></div>
        <p v-if="error" role="alert" class="text-sm text-[#ae493b] sm:col-span-2">{{ error }}</p>
      </div>
      <div class="flex justify-end gap-2 border-t border-[#e8eeeb] p-5 sm:px-7">
        <button v-wave type="button" class="btn btn-secondary" @click="$emit('close')">
          Cancel</button
        ><button v-wave class="btn btn-primary" :disabled="saving">
          {{ saving ? 'Saving…' : 'Save student' }}
        </button>
      </div>
    </form>
  </VueFinalModal>
</template>


