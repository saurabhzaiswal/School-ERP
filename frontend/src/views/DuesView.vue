<script>
import { api, params } from '../api'
import DataTable from '../cmp/erp/table/reformated/client-page.vue'
import Pager from '../common/grid-pagination.vue'
import AppDropdown from '../cmp/erp/element/dropdown.vue'
import PanelSearch from '../common/PanelSearch.vue'
import InitialAvatar from '../common/InitialAvatar.vue'
export default {
  name: 'DuesView',
  components: { DataTable, Pager, AppDropdown, PanelSearch, InitialAvatar },
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
      error: '',
      busy: true,
      timer: null,
      loadId: 0,
      grades: Array.from({ length: 12 }, (_, i) => String(i + 1)),
      sections: ['A', 'B', 'C', 'D'],
      columns: [
        { key: 'name', label: 'Student' },
        { key: 'admissionNumber', label: 'Admission no.' },
        { key: 'classroom', label: 'Class' },
        { key: 'feeStatus', label: 'Status' },
        { key: 'amountDue', label: 'Amount due' },
      ],
    }
  },
  created() {
    if (this.user.role === 'ADMIN') this.load()
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
          `/students/dues?${params({ q: this.q, grade: this.grade, section: this.section, page: this.page, per_page: this.perPage })}`,
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
    money(value) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(
        Number(value),
      )
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
  },
}
</script>
<template>
  <div class="max-w-[1300px] mx-auto">
    <header class="mb-7">
      <p class="eyebrow mb-2">Accounts overview</p>
      <h1 class="page-title">Fee follow-up</h1>
      <p class="text-[#647e84] mt-3">
        Students with an outstanding amount. Update a record from the Students page.
      </p>
    </header>
    <div v-if="user.role !== 'ADMIN'" role="alert" class="card p-6">Admin access required.</div>
    <template v-else
      ><section class="card mb-4 p-4">
        <div class="grid gap-3 sm:grid-cols-[minmax(230px,1fr)_155px_155px]">
          <PanelSearch v-model="searchInput" placeholder="Search name or admission number" aria-label="Search dues" @search="q = $event" /><AppDropdown
            v-model="grade"
            :options="[{ value: null, label: 'All classes' }, ...grades]"
            placeholder="All classes"
            aria-label="Class filter"
          /><AppDropdown
            v-model="section"
            :options="[{ value: null, label: 'All sections' }, ...sections]"
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
        empty-message="No outstanding dues match these filters."
        ><template #cell-name="{ row }"
          ><div class="flex items-center gap-3"><InitialAvatar :name="row.name" /><strong>{{ row.name }}</strong></div></template
        ><template #cell-admissionNumber="{ row }"
          ><span class="font-mono text-xs">{{ row.admissionNumber }}</span></template
        ><template #cell-classroom="{ row }">{{ row.grade }} &middot; {{ row.section }}</template
        ><template #cell-feeStatus="{ row }"
          ><span class="badge badge-amber">{{ row.feeStatus.replace('_', ' ') }}</span></template
        ><template #cell-amountDue="{ row }"
          ><strong>{{ money(row.amountDue) }}</strong></template
        ></DataTable
      >
      <Pager
        v-if="!busy"
        :page="page"
        :per-page="perPage"
        :total="result.total"
        @change="changePage"
        @page-size="changeSize"
      />
    </template>
  </div>
</template>


