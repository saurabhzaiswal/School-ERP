<script>
import Dropdown from '@/cmp/erp/element/dropdown.vue'
export default {
  name: 'GridPagination', components: { Dropdown },
  props: { page: { type: Number, required: true }, perPage: { type: Number, required: true }, total: { type: Number, required: true }, moduleName: { type: String, default: 'records' } },
  emits: ['change', 'page-size'],
  computed: { totalPages() { return Math.max(1, Math.ceil(this.total / this.perPage)) }, from() { return this.total ? (this.page - 1) * this.perPage + 1 : 0 }, to() { return Math.min(this.page * this.perPage, this.total) } },
}
</script>
<template>
  <nav class="w-full mt-2 grid-pagination" aria-label="Table pagination">
    <div class="flex flex-wrap items-center justify-between gap-3 border-t border-b border-[#e1eaf3] px-0 sm:px-4 py-3 text-xs sm:text-sm text-[#60777d] grid-pagination__bar">
      <div class="text-left pr-2 min-w-0 whitespace-nowrap"><span class="hidden sm:inline">Showing </span><span class="font-semibold text-[#25464c]">{{ from }}–{{ to }}</span> of {{ total }} {{ moduleName }}</div>
      <div class="flex flex-wrap items-center gap-2 sm:gap-3 sm:w-auto w-auto justify-end"><span class="hidden sm:inline">Rows per page</span><div class="w-[76px]"><Dropdown :model-value="perPage" :options="[10, 15, 20, 50, 100]" aria-label="Rows per page" @update:model-value="$emit('page-size', Number($event))" /></div><span class="whitespace-nowrap">{{ page }} / {{ totalPages }}</span><div class="flex items-center gap-1"><button v-wave="{ color: '#e1eaf3' }" type="button" class="pagination-btn" aria-label="Previous page" :disabled="page <= 1" @click="$emit('change', page - 1)">‹</button><button v-wave="{ color: '#e1eaf3' }" type="button" class="pagination-btn" aria-label="Next page" :disabled="page >= totalPages" @click="$emit('change', page + 1)">›</button></div></div>
    </div>
  </nav>
</template>
<style scoped lang="scss">
.pagination-btn { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #d7e5e0; border-radius: 7px; background: white; color: #31575d; font-size: 1.4rem; line-height: 1; transition: background .15s, transform .15s; }
.pagination-btn:hover:not(:disabled) { background: #eef7f2; transform: translateY(-1px); }
.pagination-btn:disabled { opacity: .4; cursor: not-allowed; }
</style>
