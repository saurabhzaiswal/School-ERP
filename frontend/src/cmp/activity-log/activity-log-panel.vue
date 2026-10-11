<script>
import moment from 'moment'
import InitialAvatar from '@/common/InitialAvatar.vue'

export default {
  name: 'ActivityLogPanel',
  components: { InitialAvatar },
  props: {
    items: { type: Array, default: () => [] },
    loading: Boolean,
    user: { type: Object, required: true },
  },
  emits: ['select'],
  methods: {
    formatDate(value) { return moment(value).format('DD MMM YYYY, h:mm A') },
    label(value) { return String(value || '').replaceAll('_', ' ').toLowerCase().replace(/^./, character => character.toUpperCase()) },
  },
}
</script>

<template>
  <section class="activity-panel card overflow-hidden" :aria-busy="loading">
    <div class="overflow-x-auto" role="region" aria-label="Activity log table" tabindex="0">
      <table class="min-w-[700px] w-full">
        <thead><tr><th scope="col">Activity</th><th scope="col">Record</th><th scope="col">By</th><th scope="col">Date & time</th><th scope="col"><span class="sr-only">Details</span></th></tr></thead>
        <tbody v-if="loading" role="status" aria-label="Loading activity">
          <tr v-for="index in 6" :key="index"><td v-for="cell in 5" :key="cell"><div class="h-4 rounded-md animate-pulse bg-[#e9f0ed]" :class="cell === 1 ? 'w-32' : 'w-20'"></div></td></tr>
        </tbody>
        <tbody v-else-if="!items.length"><tr><td colspan="5" class="py-12 text-center text-[#71888c]">No activity found for these filters.</td></tr></tbody>
        <tbody v-else>
          <tr v-for="item in items" :key="item.id" class="transition-colors">
            <td><div class="flex items-start gap-3"><span class="mt-1.5 size-2 shrink-0 rounded-full bg-[#1d7772] ring-4 ring-[#e6f3ed]" aria-hidden="true"></span><div class="min-w-0"><p class="font-semibold text-[#24454c]">{{ label(item.action) }}</p><p class="text-xs text-[#71888c] mt-1 max-w-[280px] break-words">{{ item.summary }}</p></div></div></td>
            <td><span class="badge badge-slate">{{ label(item.entityType) }}</span></td>
            <td><div class="flex items-center gap-2"><InitialAvatar :name="item.actor?.name || 'System'" /><div><span class="font-medium">{{ item.actor?.name || 'System' }}</span><span class="block text-xs text-[#71888c] mt-1">{{ item.actor?.role === 'ADMIN' ? 'Administrator' : item.actor?.role === 'TEACHER' ? 'Teacher' : '' }}</span></div></div></td>
            <td><time :datetime="item.createdAt" class="whitespace-nowrap text-[#60777d]">{{ formatDate(item.createdAt) }}</time></td>
            <td class="text-right"><button v-wave type="button" class="btn btn-secondary !px-3 !py-2 text-xs" :aria-label="`View details for ${label(item.action)}`" @click="$emit('select', item)">Details</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
