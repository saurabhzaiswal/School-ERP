<script>
export default {
  name: 'AppDropdown',
  props: {
    modelValue: { type: [String, Number], default: '' },
    options: { type: Array, required: true },
    placeholder: { type: String, default: 'Select an option' },
    disabled: { type: Boolean, default: false },
    ariaLabel: { type: String, default: 'Select an option' },
  },
  emits: ['update:modelValue'],
  data() {
    return { open: false, activeIndex: 0 }
  },
  computed: {
    normalized() {
      return this.options.map((option) =>
        typeof option === 'object' ? option : { value: option, label: String(option) },
      )
    },
    selected() {
      return this.normalized.find((option) => option.value === this.modelValue)
    },
    listboxId() { return `dropdown-${this.$.uid}` },
  },
  methods: {
    toggle() {
      if (this.disabled) return
      this.open = !this.open
      if (this.open) this.activeIndex = Math.max(0, this.normalized.findIndex(option => option.value === this.modelValue))
    },
    choose(option) {
      this.$emit('update:modelValue', option.value)
      this.open = false
      this.$refs.trigger?.focus()
    },
    away() {
      this.open = false
    },
    keyboard(event) {
      if (event.key === 'Escape') {
        this.open = false
        return
      }
      if (!this.normalized.length || this.disabled) return
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        this.open = true
        this.activeIndex =
          (this.activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + this.normalized.length) %
          this.normalized.length
      }
      if (event.key === 'Enter' && this.open) {
        event.preventDefault()
        this.choose(this.normalized[this.activeIndex])
      }
    },
  },
}
</script>
<template>
  <div class="relative" v-click-away="away" @keydown="keyboard">
    <button
      ref="trigger"
      type="button"
      class="field flex items-center justify-between gap-3 text-left"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      :aria-controls="listboxId"
      :aria-activedescendant="open ? `${listboxId}-${activeIndex}` : undefined"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span :class="selected ? 'text-[#17313b]' : 'text-[#84979a]'">{{
        selected?.label || placeholder
      }}</span
      ><svg aria-hidden="true" class="size-4 shrink-0 text-[#799092] transition-transform" :class="open ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m5 7.5 5 5 5-5" /></svg>
    </button>
    <div
      v-if="open"
      class="absolute z-30 mt-1 w-full min-w-[120px] max-h-60 overflow-y-auto rounded-xl border border-[#dce7e3] bg-white p-1 shadow-xl"
      role="listbox"
      :id="listboxId"
      :aria-label="ariaLabel"
    >
      <button
        v-for="(option, index) in normalized"
        :key="option.value"
        type="button"
        role="option"
        :id="`${listboxId}-${index}`"
        tabindex="-1"
        :aria-selected="option.value === modelValue"
        class="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-[#edf6f2]"
        :class="{
          'bg-[#edf6f2] font-semibold': index === activeIndex || option.value === modelValue,
        }"
        @click="choose(option)"
      >
        <span>{{ option.label }}</span><svg v-if="option.value === modelValue" aria-hidden="true" class="float-right size-4 text-[#227267]" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m4 10 4 4 8-8" /></svg>
      </button>
    </div>
  </div>
</template>
