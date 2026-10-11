<script>
export default {
  name: 'PanelSearch',
  props: {
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: 'Search…' },
    debounceMs: { type: Number, default: 350 },
    ariaLabel: { type: String, default: 'Search records' },
  },
  emits: ['update:modelValue', 'search'],
  data() { return { localValue: this.modelValue, timer: null } },
  watch: {
    modelValue(value) { if (value !== this.localValue) this.localValue = value },
    localValue(value) {
      this.$emit('update:modelValue', value)
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.$emit('search', value.trim()), this.debounceMs)
    },
  },
  beforeUnmount() { clearTimeout(this.timer) },
  methods: {
    collapse() { this.$refs.inputEl?.blur() },
  },
}
</script>
<template>
  <div class="panel-search flex items-center min-w-0 flex-1 max-w-md">
    <div class="panel-search__field flex items-center w-full rounded-lg border border-[var(--fade-border-color)] bg-white px-3 py-2 shadow-sm min-w-0 transition-all duration-200 focus-within:border-[#2b837d] focus-within:ring-[3px] focus-within:ring-[#d8eeea]">
      <svg aria-hidden="true" class="text-[#71888c] mr-2 shrink-0" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.8" cy="10.8" r="6.8"/><path stroke-linecap="round" d="m16 16 5 5"/></svg>
      <input ref="inputEl" v-model="localValue" type="search" :placeholder="placeholder" :aria-label="ariaLabel" class="w-full min-h-7 outline-none text-sm text-[#17313b] placeholder-[#819599] bg-transparent" autocomplete="off" @keydown.esc="collapse" />
    </div>
  </div>
</template>
