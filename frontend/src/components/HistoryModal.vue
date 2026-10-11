<script>
import { VueFinalModal } from 'vue-final-modal'
import moment from 'moment'
import { api, params } from '../api'
import Pager from './Pager.vue'
import ModalCloseButton from '../common/ModalCloseButton.vue'
import InitialAvatar from '../common/InitialAvatar.vue'
export default {
  name: 'HistoryModal',
  components: { VueFinalModal, Pager, ModalCloseButton, InitialAvatar },
  props: { student: { type: Object, required: true } },
  emits: ['close'],
  data() {
    return { page: 1, perPage: 10, result: { items: [], total: 0 }, loading: true, error: '' }
  },
  created() {
    this.load()
  },
  methods: {
    formatDate(value) {
      return moment(value).format('DD MMM YYYY')
    },
    async load() {
      this.loading = true
      this.error = ''
      try {
        this.result = await api(
          `/attendance/student/${this.student.id}?${params({ page: this.page, per_page: this.perPage })}`,
        )
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },
    changePage(page) {
      this.page = page
      this.load()
    },
    changeSize(size) {
      this.page = 1
      this.perPage = size
      this.load()
    },
  },
}
</script>
<template>
  <VueFinalModal
    :model-value="true"
    class="flex items-center justify-center p-0 sm:p-4"
    content-class="w-full sm:max-w-2xl h-[100dvh] sm:h-auto sm:min-h-[470px] sm:max-h-[90dvh] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    @update:model-value="!$event && $emit('close')"
  >
    <header class="flex justify-between items-start gap-3 p-5 sm:p-6 border-b border-[#e8eeeb]">
      <div class="flex items-center gap-3">
        <InitialAvatar :name="student.name" size="lg" />
        <div>
        <p class="eyebrow mb-2">Attendance history</p>
        <h2 class="font-[inherit] text-2xl">{{ student.name }}</h2>
        <p class="text-sm text-[#789094] mt-1">{{ student.admissionNumber }}</p>
        </div>
      </div>
      <ModalCloseButton @click="$emit('close')" />
    </header>
    <div class="min-h-0 overflow-y-auto flex-1 p-5 sm:p-6">
      <div v-if="loading" class="space-y-4" role="status" aria-label="Loading attendance history"><div v-for="index in 5" :key="index" class="flex items-center justify-between border-b border-[#edf0ee] py-3"><div class="h-4 w-28 rounded animate-pulse bg-[#e9f0ed]"></div><div class="h-6 w-20 rounded-full animate-pulse bg-[#e9f0ed]"></div></div></div>
      <p v-else-if="error" role="alert" class="text-[#ae493b] text-sm">{{ error }}</p>
      <p v-else-if="!result.items.length" class="text-[#71888c] text-sm py-8 text-center">
        No attendance recorded yet.
      </p>
      <div
        v-for="item in result.items"
        :key="item.id"
        class="flex items-center justify-between border-b border-[#edf0ee] py-3 text-sm"
      >
        <span>{{ formatDate(item.date) }}</span
        ><span
          :class="[
            'badge',
            item.status === 'PRESENT'
              ? 'badge-green'
              : item.status === 'LATE'
                ? 'badge-amber'
                : 'badge-red',
          ]"
          >{{ item.status }}</span
        >
      </div>
    </div>
    <Pager
      v-if="!loading && result.total"
      :page="page"
      :per-page="perPage"
      :total="result.total"
      @change="changePage"
      @page-size="changeSize"
    />
  </VueFinalModal>
</template>


