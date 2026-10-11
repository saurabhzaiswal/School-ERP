<script>
import { api, params } from '../api'
import Pager from '../common/grid-pagination.vue'
import ActivityDetailModal from '../cmp/activity-log/activity-log-detail-modal.vue'
import ActivityLogPanel from '../cmp/activity-log/activity-log-panel.vue'
import PanelSearch from '../common/PanelSearch.vue'
import AppDropdown from '../cmp/erp/element/dropdown.vue'
import AppDatePicker from '../cmp/erp/element/app_datepicker.vue'

export default {
  name: 'ActivityView',
  components: { Pager, ActivityDetailModal, ActivityLogPanel, PanelSearch, AppDropdown, AppDatePicker },
  props: { user: { type: Object, required: true } },
  data() {
    return { q: '', searchInput: '', scope: 'all', role: null, dateFrom: '', dateTo: '', page: 1, perPage: 20, result: { items: [], total: 0 }, loading: true, error: '', detail: null, timer: null, loadId: 0 }
  },
  created() { this.load() },
  beforeUnmount() { clearTimeout(this.timer); this.loadId++ },
  watch: {
    q() { this.page = 1; clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300) },
    scope(value) { this.page = 1; if (value === 'mine' && this.role !== null) { this.role = null; return }; this.load() },
    role() { this.page = 1; this.load() },
    dateFrom() { this.page = 1; this.load() },
    dateTo() { this.page = 1; this.load() },
  },
  methods: {
    async load() {
      if (this.dateFrom && this.dateTo && this.dateFrom > this.dateTo) { this.loadId++; this.error = 'Start date must be on or before end date.'; this.loading = false; return }
      const id = ++this.loadId
      this.loading = true
      this.error = ''
      try {
        const result = await api(`/activity?${params({ q: this.q, actorId: this.user.role === 'ADMIN' && this.scope === 'mine' ? this.user.id : null, role: this.user.role === 'ADMIN' && this.scope === 'all' ? this.role : null, dateFrom: this.dateFrom, dateTo: this.dateTo, page: this.page, per_page: this.perPage })}`)
        if (id === this.loadId) this.result = result
      } catch (error) {
        if (id === this.loadId) this.error = error.message
      } finally {
        if (id === this.loadId) this.loading = false
      }
    },
    changePage(page) { this.page = page; this.load() },
    changeSize(size) { this.page = 1; this.perPage = size; this.load() },
    clearDates() { this.dateFrom = ''; this.dateTo = '' },
  },
}
</script>
<template>
  <div class="max-w-[1300px] mx-auto">
    <header class="mb-7"><p class="eyebrow mb-2">Audit trail</p><h1 class="page-title">Activity log</h1><p class="text-[#647e84] mt-3">{{ user.role === 'ADMIN' ? 'See who changed student, attendance, and staff records.' : 'Review the changes you made.' }}</p></header>
    <section class="card p-4 sm:p-5 mb-4">
      <div v-if="user.role === 'ADMIN'" class="mb-4 flex gap-2"><button v-wave type="button" class="btn" :class="scope === 'all' ? 'btn-primary' : 'btn-secondary'" @click="scope = 'all'">Everyone</button><button v-wave type="button" class="btn" :class="scope === 'mine' ? 'btn-primary' : 'btn-secondary'" @click="scope = 'mine'">My activity</button></div>
      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_170px_180px_180px_auto] items-end">
        <div><label class="text-sm font-semibold block mb-2">Search</label><PanelSearch v-model="searchInput" placeholder="Search action, person, or summary" aria-label="Search activity" @search="q = $event" /></div>
        <div v-if="user.role === 'ADMIN' && scope === 'all'"><label class="text-sm font-semibold block mb-2">Staff role</label><AppDropdown v-model="role" :options="[{ value: null, label: 'All roles' }, { value: 'ADMIN', label: 'Administrators' }, { value: 'TEACHER', label: 'Teachers' }]" aria-label="Filter by staff role" /></div>
        <div><label class="text-sm font-semibold block mb-2">From date</label><AppDatePicker v-model="dateFrom" placeholder="From date" :max-date="dateTo || null" /></div>
        <div><label class="text-sm font-semibold block mb-2">To date</label><AppDatePicker v-model="dateTo" placeholder="To date" :min-date="dateFrom || null" /></div>
        <button v-if="dateFrom || dateTo" type="button" class="btn btn-secondary whitespace-nowrap" @click="clearDates">Clear dates</button>
      </div>
    </section>
    <p v-if="error" role="alert" class="mb-4 text-sm text-[#ae493b]">{{ error }}</p>
    <ActivityLogPanel :items="result.items" :loading="loading" :user="user" @select="detail = $event" />
    <Pager v-if="!loading" :page="page" :per-page="perPage" :total="result.total" @change="changePage" @page-size="changeSize" />
    <ActivityDetailModal v-if="detail" :activity="detail" @close="detail = null" />
  </div>
</template>
