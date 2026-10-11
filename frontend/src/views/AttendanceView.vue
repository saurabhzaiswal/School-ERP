<script>
import moment from 'moment'
import { api, params } from '../api'
import AppDropdown from '../cmp/erp/element/dropdown.vue'
import AppDatePicker from '../cmp/erp/element/app_datepicker.vue'
import DataTable from '../cmp/erp/table/reformated/client-page.vue'
import Pager from '../common/grid-pagination.vue'
import InitialAvatar from '../common/InitialAvatar.vue'
export default {
  name: 'AttendanceView',
  components: { AppDropdown, AppDatePicker, DataTable, Pager, InitialAvatar },
  props: { user: { type: Object, required: true } },
  data() {
    return {
      grade: '',
      section: '',
      date: moment().format('YYYY-MM-DD'),
      page: 1,
      perPage: 20,
      result: null,
      choices: {},
      busy: false,
      saving: '',
      error: '',
      grades: Array.from({ length: 12 }, (_, i) => String(i + 1)),
      sections: ['A', 'B', 'C', 'D'],
      columns: [
        { key: 'student', label: 'Student' },
        { key: 'admissionNumber', label: 'Admission no.' },
        { key: 'mark', label: 'Current mark' },
        { key: 'choose', label: 'Choose mark' },
        { key: 'action', label: 'Action' },
      ],
    }
  },
  computed: {
    gradeOptions() {
      return this.user.role === 'ADMIN'
        ? this.grades
        : [...new Set(this.user.assignments.map((a) => a.grade))]
    },
    sectionOptions() {
      return this.user.role === 'ADMIN'
        ? this.sections
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
    if (this.user.role === 'TEACHER' && this.user.assignments.length) {
      this.grade = this.user.assignments[0].grade
      this.section = this.user.assignments[0].section
      this.load()
    }
  },
  methods: {
    async load() {
      if (!this.grade || !this.section || !this.date) {
        this.error = 'Choose a class, section, and date.'
        return
      }
      this.error = ''
      this.busy = true
      try {
        this.result = await api(
          `/attendance?${params({ grade: this.grade, section: this.section, date: this.date, page: this.page, per_page: this.perPage })}`,
        )
        this.choices = Object.fromEntries(
          this.result.items.map((item) => [item.id, item.attendance?.status || '']),
        )
      } catch (error) {
        this.result = null
        this.error = error.message
        this.$toast.error(error.message)
      } finally {
        this.busy = false
      }
    },
    viewRegister() {
      this.page = 1
      this.load()
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
    async save(student) {
      const status = this.choices[student.id]
      if (!status) return
      this.saving = student.id
      this.error = ''
      try {
        await api(student.attendance ? `/attendance/${student.attendance.id}` : '/attendance', {
          method: student.attendance ? 'PUT' : 'POST',
          body: student.attendance
            ? { status }
            : { studentId: student.id, date: this.date, status },
        })
        await this.load()
        this.$toast.success(`${student.name}: attendance saved.`)
      } catch (error) {
        this.error = error.message
        this.$toast.error(error.message)
      } finally {
        this.saving = ''
      }
    },
  },
}
</script>
<template>
  <div class="max-w-[1300px] mx-auto">
    <header class="mb-7">
      <p class="eyebrow mb-2">Daily register</p>
      <h1 class="page-title">Attendance</h1>
      <p class="text-[#647e84] mt-3">
        Record present, absent, or late. Existing marks can be corrected.
      </p>
    </header>
    <form
      class="card p-4 sm:p-5 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] items-end"
      @submit.prevent="viewRegister"
    >
      <div>
        <label class="text-sm font-semibold block mb-2">Class / grade</label
        ><AppDropdown
          v-model="grade"
          :options="gradeOptions"
          placeholder="Select class"
          aria-label="Class or grade"
        />
      </div>
      <div>
        <label class="text-sm font-semibold block mb-2">Section</label
        ><AppDropdown
          v-model="section"
          :options="sectionOptions"
          placeholder="Select section"
          aria-label="Section"
        />
      </div>
      <label class="text-sm font-semibold"
        >Date<AppDatePicker v-model="date" class="mt-2" required /></label
      ><button v-wave class="btn btn-primary" :disabled="busy">
        {{ busy ? 'Loading…' : 'View register' }}
      </button>
    </form>
    <p v-if="error" role="alert" class="mt-4 text-sm text-[#ae493b]">{{ error }}</p>
    <template v-if="result || busy"
      ><div v-if="result" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 mb-4">
        <div v-for="(number, label) in result.totals" :key="label" class="card p-4">
          <div class="text-xs uppercase tracking-wider text-[#6a8588]">{{ label }}</div>
          <div class="font-[inherit] text-3xl mt-2">{{ number }}</div>
        </div>
      </div>
      <div class="mt-5">
        <DataTable
          :columns="columns"
          :rows="result?.items || []"
          :loading="busy"
          empty-message="No active students in this class and section."
          ><template #cell-student="{ row }"
            ><div class="flex items-center gap-3"><InitialAvatar :name="row.name" /><strong>{{ row.name }}</strong></div></template
          ><template #cell-admissionNumber="{ row }"
            ><span class="font-mono text-xs">{{ row.admissionNumber }}</span></template
          ><template #cell-mark="{ row }"
            ><span
              :class="[
                'badge',
                row.attendance?.status === 'PRESENT'
                  ? 'badge-green'
                  : row.attendance?.status === 'ABSENT'
                    ? 'badge-red'
                    : row.attendance?.status === 'LATE'
                      ? 'badge-amber'
                      : 'badge-slate',
              ]"
              >{{ row.attendance?.status || 'UNMARKED' }}</span
            ></template
          ><template #cell-choose="{ row }"
            ><AppDropdown
              v-model="choices[row.id]"
              :options="[
                { value: 'PRESENT', label: 'Present' },
                { value: 'ABSENT', label: 'Absent' },
                { value: 'LATE', label: 'Late' },
              ]"
              placeholder="Choose status"
              :aria-label="`Attendance for ${row.name}`" /></template
          ><template #cell-action="{ row }"
            ><button
              v-wave
              v-tooltip="row.attendance ? 'Correct this mark' : 'Record this mark'"
              class="btn btn-secondary !py-2"
              :disabled="
                saving === row.id || !choices[row.id] || choices[row.id] === row.attendance?.status
              "
              @click="save(row)"
            >
              {{ row.attendance ? 'Correct' : 'Record' }}
            </button></template
          ></DataTable
        >
      </div>
      <Pager
        v-if="result && !busy"
        :page="page"
        :per-page="perPage"
        :total="result.total"
        @change="changePage"
        @page-size="changeSize"
      />
    </template>
    <div v-else class="card mt-5 p-8 text-center text-sm text-[#71888c]">
      Choose a class and section to open the daily register.
    </div>
  </div>
</template>





