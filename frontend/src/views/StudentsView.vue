<script>
import { api, params } from '../api'
import DataTable from '../cmp/erp/table/reformated/client-page.vue'
import Pager from '../common/grid-pagination.vue'
import StudentForm from '../components/StudentForm.vue'
import HistoryModal from '../components/HistoryModal.vue'
import AppDropdown from '../cmp/erp/element/dropdown.vue'
import PanelSearch from '../common/PanelSearch.vue'
import InitialAvatar from '../common/InitialAvatar.vue'
export default {
  name: 'StudentsView',
  components: { DataTable, Pager, StudentForm, HistoryModal, AppDropdown, PanelSearch, InitialAvatar },
  props: { user: { type: Object, required: true } },
  data() {
    return {
      q: '',
      searchInput: '',
      grade: null,
      section: null,
      page: 1,
      perPage: 20,
      result: { items: [], total: 0 },
      formOpen: false,
      editing: null,
      historyStudent: null,
      error: '',
      busy: true,
      timer: null,
      loadId: 0,
      allGrades: Array.from({ length: 12 }, (_, i) => String(i + 1)),
      allSections: ['A', 'B', 'C', 'D'],
    }
  },
  computed: {
    columns() {
      return [
        { key: 'student', label: 'Student' },
        { key: 'admission', label: 'Admission no.' },
        { key: 'classroom', label: 'Class' },
        { key: 'guardianName', label: 'Guardian' },
        { key: 'contact', label: 'Contact' },
        ...(this.user.role === 'ADMIN' ? [{ key: 'fees', label: 'Fee status' }] : []),
        { key: 'actions', label: 'Record' },
      ]
    },
    gradeOptions() {
      return this.user.role === 'ADMIN'
        ? this.allGrades
        : [...new Set(this.user.assignments.map((a) => a.grade))]
    },
    sectionOptions() {
      return this.user.role === 'ADMIN'
        ? this.allSections
        : [
            ...new Set(
              this.user.assignments
                .filter((a) => !this.grade || a.grade === this.grade)
                .map((a) => a.section),
            ),
          ]
    },
  },
  created() {
    this.load()
  },
  beforeUnmount() {
    clearTimeout(this.timer)
    this.loadId++
  },
  watch: {
    q() {
      this.debounced()
    },
    grade() {
      this.section = null
      this.debounced()
    },
    section() {
      this.debounced()
    },
  },
  methods: {
    debounced() {
      this.page = 1
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.load(), 300)
    },
    async load() {
      const current = ++this.loadId
      this.busy = true
      this.error = ''
      try {
        const result = await api(
          `/students?${params({ q: this.q, grade: this.grade, section: this.section, page: this.page, per_page: this.perPage })}`,
        )
        if (current === this.loadId) this.result = result
      } catch (error) {
        if (current === this.loadId) {
          this.error = error.message
          this.$toast.error(error.message)
        }
      } finally {
        if (current === this.loadId) this.busy = false
      }
    },
    changePage(page) {
      this.page = page
      this.load()
    },
    changeSize(size) {
      this.perPage = size
      this.page = 1
      this.load()
    },
    openForm(student = null) {
      this.editing = student
      this.formOpen = true
    },
    saved(student) {
      this.formOpen = false
      this.$toast.success(
        this.editing
          ? 'Student updated.'
          : `Student added with admission ${student.admissionNumber}.`,
      )
      this.load()
    },
    money(value) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
        Number(value),
      )
    },
  },
}
</script>
<template>
  <div class="max-w-[1300px] mx-auto">
    <header class="flex flex-wrap justify-between items-end gap-4 mb-7">
      <div>
        <p class="eyebrow mb-2">Directory</p>
        <h1 class="page-title">Students</h1>
        <p class="text-[#647e84] mt-3">Find student records and review their attendance.</p>
      </div>
      <button v-if="user.role === 'ADMIN'" v-wave class="btn btn-primary" @click="openForm()">
        + Add student
      </button>
    </header>
    <section class="card mb-4 p-4">
      <div class="grid gap-3 sm:grid-cols-[minmax(230px,1fr)_155px_155px]">
        <PanelSearch v-model="searchInput" placeholder="Search name or admission number" aria-label="Search students" @search="q = $event" /><AppDropdown
          v-model="grade"
          :options="[{ value: null, label: 'All classes' }, ...gradeOptions]"
          placeholder="All classes"
          aria-label="Class filter"
        /><AppDropdown
          v-model="section"
          :options="[{ value: null, label: 'All sections' }, ...sectionOptions]"
          placeholder="All sections"
          aria-label="Section filter"
        />
      </div>
    </section>
    <p v-if="error" role="alert" class="mb-4 text-sm text-[#ae493b]">{{ error }}</p>
    <DataTable
      :columns="columns"
      :rows="result.items"
      :loading="busy"
      empty-message="No students match these filters."
    >
      <template #cell-student="{ row }"><div class="flex items-center gap-3"><InitialAvatar :name="row.name" /><div><div class="font-semibold">{{ row.name }}</div><span v-if="row.gender" class="text-xs text-[#71888c] capitalize">{{ row.gender.replaceAll('_', ' ').toLowerCase() }}</span><span v-if="!row.active" class="text-xs text-[#9a6970]">{{ row.gender ? ' · ' : '' }}Inactive</span></div></div></template>
      <template #cell-admission="{ row }"
        ><span class="font-mono text-xs">{{ row.admissionNumber }}</span></template
      >
      <template #cell-classroom="{ row }">{{ row.grade }} &middot; {{ row.section }}</template>
      <template #cell-contact="{ row }"><div class="text-xs"><span v-if="row.email" class="block break-all">{{ row.email }}</span><span v-if="row.phoneNumber" class="block text-[#71888c]">{{ row.phoneNumber }}</span><span v-if="!row.email && !row.phoneNumber" class="text-[#9baeb0]">—</span></div></template>
      <template #cell-fees="{ row }"
        ><span :class="['badge', row.feeStatus === 'PAID' ? 'badge-green' : 'badge-amber']">{{
          row.feeStatus.replace('_', ' ')
        }}</span>
        <div v-if="row.feeStatus !== 'PAID'" class="text-xs mt-1 text-[#6a7d82]">
          {{ money(row.amountDue) }} due
        </div></template
      >
      <template #cell-actions="{ row }"
        ><div class="flex justify-end  gap-3">
          <button
            v-wave
            v-tooltip="'View attendance history'"
            class="text-[#176a68] font-semibold text-sm"
            @click="historyStudent = row"
          >
            History</button
          ><button
            v-if="user.role === 'ADMIN'"
            v-wave
            v-tooltip="'Edit student information'"
            class="text-[#176a68] font-semibold text-sm"
            @click="openForm(row)"
          >
            Edit
          </button>
        </div></template
      >
    </DataTable>
    <Pager
      v-if="!busy"
      :page="page"
      :per-page="perPage"
      :total="result.total"
      @change="changePage"
      @page-size="changeSize"
    />
    <StudentForm v-if="formOpen" :student="editing" @saved="saved" @close="formOpen = false" />
    <HistoryModal v-if="historyStudent" :student="historyStudent" @close="historyStudent = null" />
  </div>
</template>


