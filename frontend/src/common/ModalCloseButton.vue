<template>
  <button
    type="button"
    :disabled="disabled"
    aria-label="Close"
    class="text-gray-400 p-1 hover:text-gray-600 modal-close-btn flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
    @click="onClick"
  >
    <svg class="size-4" aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="m4 4 12 12M16 4 4 16"/></svg>
  </button>
</template>

<script>
export default {
  name: 'ModalCloseButton',

  props: {
    disabled: {
      type: Boolean,
      default: false
    }
  },

  emits: ['click'],

  methods: {
    onClick() {
      if (this.disabled) return
      this.$emit('click')
    }
  }
}
</script>
