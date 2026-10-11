<script>
import { VueFinalModal } from 'vue-final-modal'
import moment from 'moment'
import ModalCloseButton from '../common/ModalCloseButton.vue'
export default {
  name: 'ActivityDetailModal', components: { VueFinalModal, ModalCloseButton }, props: { activity: { type: Object, required: true } }, emits: ['close'],
  computed: {
    when() { return moment(this.activity.createdAt).format('DD MMM YYYY, h:mm A') },
    fields() { return Object.entries(this.activity.details || {}).map(([key, value]) => ({ key, value: Array.isArray(value) ? value.map(item => typeof item === 'object' && item ? `Class ${item.grade} ${item.section}` : String(item)).join(', ') : String(value) })) },
  },
}
</script>
<template>
  <VueFinalModal :model-value="true" class="flex items-center justify-center p-0 sm:p-4" content-class="w-full sm:max-w-xl h-[100dvh] sm:h-auto sm:max-h-[90dvh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden" @update:model-value="!$event && $emit('close')">
    <header class="flex items-center justify-between px-5 py-4 sm:px-7 border-b border-[#e8eeeb]"><div><p class="eyebrow mb-1">Audit trail</p><h2 class="text-xl font-bold">Activity details</h2></div><ModalCloseButton @click="$emit('close')" /></header>
    <div class="overflow-y-auto p-5 sm:p-7 text-sm"><p class="rounded-xl bg-[#f3f8f6] border border-[#dfebe5] p-4 font-semibold">{{ activity.summary }}</p><dl class="grid sm:grid-cols-2 gap-4 mt-5"><div><dt class="text-xs text-[#778a8e]">When</dt><dd class="font-semibold mt-1">{{ when }}</dd></div><div><dt class="text-xs text-[#778a8e]">Actor</dt><dd class="font-semibold mt-1">{{ activity.actor?.name }}</dd><small class="text-[#71858a] break-all">{{ activity.actor?.email }}</small></div><div><dt class="text-xs text-[#778a8e]">Action</dt><dd class="font-semibold mt-1">{{ activity.action.replaceAll('_', ' ') }}</dd></div><div><dt class="text-xs text-[#778a8e]">Record</dt><dd class="font-semibold mt-1">{{ activity.entityType }}</dd><small class="font-mono text-[#71858a] break-all">{{ activity.entityId }}</small></div><div v-for="field in fields" :key="field.key"><dt class="text-xs text-[#778a8e] capitalize">{{ field.key }}</dt><dd class="font-semibold mt-1 break-words">{{ field.value }}</dd></div></dl></div>
    <footer class="flex justify-end border-t border-[#e8eeeb] p-5"><button v-wave type="button" class="btn btn-secondary" @click="$emit('close')">Close</button></footer>
  </VueFinalModal>
</template>
