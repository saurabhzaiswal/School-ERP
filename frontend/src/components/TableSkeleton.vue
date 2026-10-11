<script>
export default {
  props: { columns: { type: Number, default: 5 }, rows: { type: Number, default: 5 } },
}
</script>
<template>
  <div class="p-4 animate-pulse" role="status" aria-label="Loading table">
    <div v-for="row in rows" :key="row" class="flex gap-5 py-4 border-b border-[#edf0ee]">
      <div
        v-for="col in columns"
        :key="col"
        class="h-3 rounded-full bg-[#e9efec]"
        :style="{ width: `${col === 1 ? 24 : 13}%` }"
      ></div>
    </div>
    <span class="sr-only">Loading records…</span>
  </div>
</template>
