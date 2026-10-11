<script>
import TableSkeleton from './TableSkeleton.vue'
export default {
  name: 'DataTable', components: { TableSkeleton },
  props: { columns: { type: Array, required: true }, rows: { type: Array, required: true }, loading: Boolean, emptyMessage: { type: String, default: 'No records found.' }, rowKey: { type: String, default: 'id' } },
}
</script>
<template>
  <div class="data-table" :aria-busy="loading">
    <div v-if="loading" class="card overflow-hidden"><TableSkeleton :columns="columns.length" /></div>
    <div v-else-if="!rows.length" class="card flex flex-col items-center justify-center px-6 py-14 text-center"><span class="grid size-12 place-items-center rounded-xl bg-[#edf4f1] text-2xl text-[#51817a]" aria-hidden="true">⌕</span><p class="mt-4 font-semibold text-[#24454c]">Nothing to show yet</p><p class="mt-1 text-sm text-[#71888c]">{{ emptyMessage }}</p></div>
    <div v-else class="card overflow-hidden">
      <div class="hidden md:block overflow-x-auto max-h-[min(70vh,780px)] overflow-y-auto">
        <table class="data-table__table"><thead><tr><th v-for="column in columns" :key="column.key" scope="col" :class="{ 'text-right': column.key === 'actions' || column.key === 'details' }">{{ column.label }}</th></tr></thead><tbody><tr v-for="row in rows" :key="row[rowKey]"><td v-for="column in columns" :key="column.key" :class="{ 'text-right': column.key === 'actions' || column.key === 'details' }"><slot :name="`cell-${column.key}`" :row="row">{{ row[column.key] }}</slot></td></tr></tbody></table>
      </div>
      <div class="md:hidden divide-y divide-[#e5ece9]"><article v-for="row in rows" :key="row[rowKey]" class="px-4 py-3"><div v-for="column in columns" :key="column.key" class="grid grid-cols-[minmax(90px,36%)_1fr] items-start gap-3 py-2 text-sm"><span class="text-xs font-semibold text-[#71888c] uppercase tracking-wide pt-1">{{ column.label }}</span><div class="min-w-0 text-right break-words"><slot :name="`cell-${column.key}`" :row="row">{{ row[column.key] }}</slot></div></div></article></div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.data-table__table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
.data-table__table th { position: sticky; top: 0; z-index: 2; padding: .88rem 1rem; border-bottom: 1px solid #dae5e1; background: #f7faf8; color: #57767c; font-size: .7rem; font-weight: 750; letter-spacing: .07em; text-transform: uppercase; white-space: nowrap; }
.data-table__table td { padding: .82rem 1rem; border-bottom: 1px solid #edf1ef; color: #25464c; font-size: .84rem; vertical-align: middle; }
.data-table__table tr:last-child td { border-bottom: 0; }
.data-table__table tbody tr { transition: background .16s; }
.data-table__table tbody tr:hover td { background: #f3faf6; }
</style>
