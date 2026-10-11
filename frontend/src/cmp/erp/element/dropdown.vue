<script>
import { createPopper } from '@popperjs/core'

export default {
  name: 'AppDropdown',
  props: {
    modelValue: { type: [String, Number, null], default: null },
    options: { type: Array, required: true },
    placeholder: { type: String, default: 'Select an option' },
    disabled: { type: Boolean, default: false },
    ariaLabel: { type: String, default: 'Select an option' },
  },
  emits: ['update:modelValue'],
  data() { return { open: false, activeIndex: 0, popper: null } },
  computed: {
    normalized() { return this.options.map(option => typeof option === 'object' ? option : { value: option, label: String(option) }) },
    selected() { return this.normalized.find(option => option.value === this.modelValue) },
    listboxId() { return `dropdown-${this.$.uid}` },
  },
  mounted() { document.addEventListener('pointerdown', this.onDocumentPointerDown, true) },
  beforeUnmount() { document.removeEventListener('pointerdown', this.onDocumentPointerDown, true); this.popper?.destroy() },
  methods: {
    async show() {
      if (this.disabled || this.open) return
      this.activeIndex = Math.max(0, this.normalized.findIndex(option => option.value === this.modelValue))
      this.open = true
      await this.$nextTick()
      if (!this.open || !this.$refs.menu) return
      this.popper = createPopper(this.$refs.trigger, this.$refs.menu, {
        placement: 'bottom-start',
        strategy: 'fixed',
        modifiers: [
          { name: 'offset', options: { offset: [0, 5] } },
          { name: 'flip', options: { fallbackPlacements: ['top-start'], boundary: 'viewport', padding: 8 } },
          { name: 'preventOverflow', options: { boundary: 'viewport', padding: 8 } },
          { name: 'sameWidth', enabled: true, phase: 'beforeWrite', requires: ['computeStyles'], fn: ({ state }) => { state.styles.popper.width = `${state.rects.reference.width}px` }, effect: ({ state }) => { state.elements.popper.style.width = `${state.elements.reference.offsetWidth}px` } },
        ],
      })
    },
    hide() { this.open = false; this.popper?.destroy(); this.popper = null },
    toggle() { if (this.open) this.hide(); else this.show() },
    choose(option) { this.$emit('update:modelValue', option.value); this.hide(); this.$refs.trigger?.focus() },
    onDocumentPointerDown(event) {
      if (this.open && !this.$refs.trigger?.contains(event.target) && !this.$refs.menu?.contains(event.target)) this.hide()
    },
    keyboard(event) {
      if (event.key === 'Escape') { this.hide(); this.$refs.trigger?.focus(); return }
      if (this.disabled || !this.normalized.length) return
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (!this.open) this.show()
        else this.activeIndex = (this.activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + this.normalized.length) % this.normalized.length
      }
      if (event.key === 'Enter' && this.open) { event.preventDefault(); this.choose(this.normalized[this.activeIndex]) }
    },
  },
}
</script>
<template>
  <div class="relative" @keydown="keyboard">
    <button ref="trigger" type="button" class="field flex items-center justify-between gap-3 text-left" :disabled="disabled" :aria-label="ariaLabel" :aria-expanded="open" :aria-controls="open ? listboxId : undefined" aria-haspopup="listbox" @click="toggle">
      <span :class="selected ? 'text-[#17313b]' : 'text-[#84979a]'">{{ selected?.label || placeholder }}</span>
      <svg aria-hidden="true" class="size-4 shrink-0 text-[#799092] transition-transform" :class="open ? 'rotate-180' : ''" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="m5 7.5 5 5 5-5" /></svg>
    </button>
    <Teleport to="body">
      <div v-if="open" :id="listboxId" ref="menu" role="listbox" :aria-label="ariaLabel" class="z-[10050] max-h-60 min-w-[120px] overflow-y-auto rounded-xl border border-[#dce7e3] bg-white p-1 shadow-xl">
        <button v-for="(option, index) in normalized" :id="`${listboxId}-${index}`" :key="String(option.value)" type="button" role="option" tabindex="-1" :aria-selected="option.value === modelValue" class="w-full rounded-lg px-3 py-2.5 text-left text-sm hover:bg-[#edf6f2]" :class="{ 'bg-[#edf6f2] font-semibold': index === activeIndex || option.value === modelValue }" @click="choose(option)">
          <span>{{ option.label }}</span><svg v-if="option.value === modelValue" aria-hidden="true" class="float-right size-4 text-[#227267]" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m4 10 4 4 8-8" /></svg>
        </button>
      </div>
    </Teleport>
  </div>
</template>
