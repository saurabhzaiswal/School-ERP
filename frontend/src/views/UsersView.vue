<script>
import { api, params } from '../api'
import DataTable from '../cmp/erp/table/reformated/client-page.vue'
import Pager from '../common/grid-pagination.vue'
import UserFormModal from '../components/UserFormModal.vue'
import UserProfileModal from '../components/UserProfileModal.vue'
import { useSessionStore } from '../stores/session'
import TabList from '../common/tab_list.vue'
import AppDropdown from '../cmp/erp/element/dropdown.vue'
import PanelSearch from '../common/PanelSearch.vue'
import InitialAvatar from '../common/InitialAvatar.vue'
export default {
  name: 'UsersView', components: { DataTable, Pager, UserFormModal, UserProfileModal, TabList, AppDropdown, PanelSearch, InitialAvatar },
  props: { user: { type: Object, required: true } },
  data() { return { q: '', searchInput: '', role: null, statusFilter: '', page: 1, perPage: 20, result: { items: [], total: 0 }, stats: { total: 0, admins: 0, teachers: 0, inactive: 0 }, statsLoading: true, loading: true, error: '', timer: null, loadId: 0, formOpen: false, editing: null, profile: null, columns: [{ key: 'person', label: 'User' }, { key: 'role', label: 'Role' }, { key: 'access', label: 'Class access' }, { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions' }] } },
  created() { this.load(); this.loadStats() },
  beforeUnmount() { clearTimeout(this.timer); this.loadId++ },
  watch: { q() { this.search() }, role() { this.search() }, statusFilter() { this.search() } },
  methods: {
    search() { this.page = 1; clearTimeout(this.timer); this.timer = setTimeout(() => this.load(), 300) },
    async load() { const id = ++this.loadId; this.loading = true; this.error = ''; try { const result = await api(`/users?${params({ q: this.q, role: this.role, active: this.statusFilter, page: this.page, per_page: this.perPage })}`); if (id === this.loadId) this.result = result } catch (error) { if (id === this.loadId) this.error = error.message } finally { if (id === this.loadId) this.loading = false } },
    async loadStats() { this.statsLoading = true; try { this.stats = await api('/users/stats') } catch { /* list error is displayed separately */ } finally { this.statsLoading = false } },
    changePage(page) { this.page = page; this.load() },
    changeSize(size) { this.page = 1; this.perPage = size; this.load() },
    edit(row = null) { this.editing = row; this.formOpen = true },
    saved(savedUser) { this.formOpen = false; this.$toast.success(this.editing ? 'User updated.' : 'User created.'); if (savedUser.id === this.user.id) useSessionStore().refresh(); this.load(); this.loadStats() },
    assignments(row) { return row.role === 'ADMIN' ? 'All classes' : row.assignments?.map(item => `${item.grade} ${item.section}`).join(', ') || 'None' },
    initials(row) { return row.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() },
  },
}
</script>
<template>
  <div class="max-w-[1300px] mx-auto">
    <header class="flex flex-wrap items-end justify-between gap-4 mb-7"><div><p class="eyebrow mb-2">Administration</p><h1 class="page-title">User management</h1><p class="text-[#647e84] mt-3">Create staff accounts and control class access.</p></div><button v-wave class="btn btn-primary" @click="edit()">+ Add user</button></header>
    <section class="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5" aria-label="User counts"><div v-for="card in [{ label: 'Total users', value: stats.total }, { label: 'Teachers', value: stats.teachers }, { label: 'Administrators', value: stats.admins }, { label: 'Inactive', value: stats.inactive }]" :key="card.label" class="card p-4 sm:p-5"><p class="text-xs text-[#728b8c]">{{ card.label }}</p><div v-if="statsLoading" class="mt-3 h-8 w-16 rounded-md animate-pulse bg-[#e9f0ed]" role="status" aria-label="Loading count"></div><p v-else class="mt-2 text-2xl sm:text-3xl font-semibold text-[#1a414a]">{{ card.value }}</p></div></section>
    <TabList v-model="statusFilter" class="mb-4" :tabs="[{ label: 'All users', value: '' }, { label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }]" aria-label="Account status" />
    <section class="card p-4 mb-4 grid gap-3 sm:grid-cols-[minmax(220px,1fr)_190px]"><PanelSearch v-model="searchInput" placeholder="Search name or email" aria-label="Search users" @search="q = $event" /><AppDropdown v-model="role" :options="[{ label: 'All roles', value: null }, { label: 'Administrators', value: 'ADMIN' }, { label: 'Teachers', value: 'TEACHER' }]" placeholder="All roles" aria-label="Role filter" /></section>
    <p v-if="error" role="alert" class="mb-4 text-sm text-[#ae493b]">{{ error }}</p>
    <DataTable :columns="columns" :rows="result.items" :loading="loading" empty-message="No users match this search.">
      <template #cell-person="{ row }"><div class="flex items-center gap-3"><InitialAvatar :name="row.name" /><div class="min-w-0"><p class="font-semibold text-[#17313b]">{{ row.name }}</p><p class="text-xs text-[#72868a] break-all">{{ row.email }}</p><p v-if="row.phoneNumber" class="text-xs text-[#72868a]">{{ row.phoneNumber }}</p></div></div></template>
      <template #cell-role="{ row }"><span class="badge badge-slate">{{ row.role === 'ADMIN' ? 'Administrator' : 'Teacher' }}</span></template>
      <template #cell-access="{ row }">{{ assignments(row) }}</template>
      <template #cell-status="{ row }"><span :class="['badge', row.active ? 'badge-green' : 'badge-red']">{{ row.active ? 'Active' : 'Inactive' }}</span></template>
      <template #cell-actions="{ row }"><div class="flex gap-3 justify-end md:justify-start"><button v-wave class="text-[#176a68] font-semibold text-sm" @click="profile = row">View</button><button v-wave class="text-[#176a68] font-semibold text-sm" @click="edit(row)">Edit</button></div></template>
    </DataTable>
    <Pager v-if="!loading" :page="page" :per-page="perPage" :total="result.total" @change="changePage" @page-size="changeSize" />
    <UserFormModal v-if="formOpen" :user="editing" :current-user-id="user.id" @saved="saved" @close="formOpen = false" />
    <UserProfileModal v-if="profile" :user="profile" @close="profile = null" />
  </div>
</template>


