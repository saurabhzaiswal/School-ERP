<script>
import AppDropdown from '../cmp/erp/element/dropdown.vue'
export default {
  name: 'Pager', components: { AppDropdown },
  props: { page: { type: Number, required: true }, perPage: { type: Number, required: true }, total: { type: Number, required: true }, moduleName: { type: String, default: 'records' } },
  emits: ['change', 'page-size'],
  computed: { totalPages() { return Math.max(1, Math.ceil(this.total / this.perPage)) }, from() { return this.total ? (this.page - 1) * this.perPage + 1 : 0 }, to() { return Math.min(this.page * this.perPage, this.total) } },
}
</script>
<template>
  <nav class="grid-pagination" aria-label="Table pagination">
    <p class="text-xs sm:text-sm text-[#60777d] whitespace-nowrap"><span class="hidden sm:inline">Showing </span><strong class="text-[#22464b]">{{ from }}–{{ to }}</strong> of {{ total }} {{ moduleName }}</p>
    <div class="flex items-center gap-2 sm:gap-3"><span class="hidden sm:inline text-xs text-[#60777d]">Rows per page</span><div class="w-[76px]"><AppDropdown :model-value="perPage" :options="[10, 15, 20, 50, 100]" aria-label="Rows per page" @update:model-value="$emit('page-size', Number($event))" /></div><span class="text-xs text-[#60777d] whitespace-nowrap">{{ page }} / {{ totalPages }}</span><div class="flex items-center gap-1"><button v-wave type="button" class="page-button" aria-label="Previous page" :disabled="page <= 1" @click="$emit('change', page - 1)">‹</button><button v-wave type="button" class="page-button" aria-label="Next page" :disabled="page >= totalPages" @click="$emit('change', page + 1)">›</button></div></div>
  </nav>
</template>
<style scoped lang="scss">
.grid-pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; margin-top: .6rem; padding: .8rem .25rem; border-top: 1px solid #deebe8; border-bottom: 1px solid #deebe8; }
.page-button { display: grid; place-items: center; width: 34px; height: 34px; border: 1px solid #d7e5e0; border-radius: 7px; background: white; color: #31575d; font-size: 1.4rem; line-height: 1; transition: background .15s, transform .15s; }
.page-button:hover:not(:disabled) { background: #eef7f2; transform: translateY(-1px); }
.page-button:disabled { opacity: .4; cursor: not-allowed; }
</style>


