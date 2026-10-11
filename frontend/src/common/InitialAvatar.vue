<script>
export default {
  name: 'InitialAvatar',
  props: { name: { type: String, default: '' }, size: { type: String, default: 'md' } },
  computed: {
    initials() { return this.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?' },
  },
}
</script>
<template>
  <span class="inline-grid shrink-0 place-items-center rounded-full border border-[#d4e7e0] bg-[#e6f2ed] font-bold text-[#176a68]" :class="size === 'lg' ? 'size-12 text-sm' : 'size-9 text-xs'" :aria-label="`${name} initials`">{{ initials }}</span>
</template>
