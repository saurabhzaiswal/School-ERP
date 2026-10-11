<template>
  <div class="w-full mt-2 grid-pagination">
    <!-- {{ pagination }} -->
    <div
      class="flex items-center justify-between gap-3 border-t border-b border-[#E1EAF3] px-0 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 grid-pagination__bar"
    >
      <div class="text-left pr-2 min-w-0 grid-pagination__summary whitespace-nowrap">
        <span class="hidden sm:inline grid-pagination__showing-label">Showing </span>
        <span class="font-medium text-[#2F2F2F] grid-pagination__range"
          >{{ displayFrom }}-{{ displayTo }}</span
        >
        <span class="grid-pagination__total sm:whitespace-nowrap">
          of {{ pagination?.total ?? 0 }} {{ moduleName }}</span
        >
      </div>

      <div
        class="flex flex-wrap items-center gap-2 sm:gap-3 sm:w-full w-auto justify-between sm:justify-end grid-pagination__controls"
      >
        <div
          class="whitespace-nowrap text-[11px] sm:text-sm sm:block hidden grid-pagination__page-hint"
        >
          The page you're on
        </div>

        <Dropdown
          :options="per_page_options"
          :selectedOption="selectedPerPageOption"
          :compareKey="'code'"
          :clearable="false"
          :showIcon="false"
          :showCheckIcon="false"
          @option-selected="handlePerPageOptionSelected"
          class="!w-[70px] grid-pagination__per-page-dropdown"
          :classOverrides="'bg-transparent border border-[#E1EAF3] rounded px-2 py-1 text-sm'"
          :dropdownClassOverrides="'max-w-[70px] min-w-[70px]'"
        />

        <div class="flex items-center gap-1 grid-pagination__nav-btns">
          <button
            v-wave="{ color: '#E1EAF3' }"
            class="pagination-btn grid-pagination__prev-btn"
            :disabled="isFirstPage"
            :class="{ 'disabled-btn': isFirstPage }"
            @click="backPage"
          >
            <span class="material-symbols-outlined grid-pagination__prev-icon"> chevron_left </span>
          </button>

          <button
            v-wave="{ color: '#E1EAF3' }"
            class="pagination-btn grid-pagination__next-btn"
            :disabled="isLastPage"
            :class="{ 'disabled-btn': isLastPage }"
            @click="nextPage"
          >
            <span class="material-symbols-outlined grid-pagination__next-icon">
              chevron_right
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GridPagination',
  components: {},
  props: {
    pagination: {
      type: Object,
      default: () => {}
    },

    moduleName: {
      type: String,
      default: 'Products'
    }
  },
  emits: ['pageSizeUpdated', 'passcurrent'],
  data() {
    return {
      per_page_options: [
        {
          code: 10,
          name: '10'
        },
        {
          code: 15,
          name: '15'
        },
        {
          code: 20,
          name: '20'
        },
        {
          code: 50,
          name: '50'
        },
        {
          code: 100,
          name: '100'
        }
      ],
      selectedPerPageOption: {
        code: 10,
        name: '10'
      },
      currentPage: 1
    }
  },
  mounted() {
    this.syncFromPagination()
  },
  methods: {
    syncFromPagination() {
      const p = this.pagination || {}
      this.currentPage = p.current_page || 1
      const pp = p.per_page
      if (pp != null) {
        const opt = this.per_page_options.find((o) => o.code === Number(pp))
        if (opt) this.selectedPerPageOption = { ...opt }
      }
    },
    handlePerPageOptionSelected(option) {
      this.selectedPerPageOption = option
      this.$emit('pageSizeUpdated', option.code)
    },
    nextPage() {
      if (navigator.vibrate) navigator.vibrate(10)

      const totalPages = Number(this.pagination?.total_pages) || 0
      if (totalPages > 0 && this.currentPage < totalPages) {
        this.$emit('passcurrent', this.currentPage + 1)
      }
    },
    backPage() {
      if (this.currentPage > 1) this.$emit('passcurrent', this.currentPage - 1)
    }
  },
  computed: {
    displayFrom() {
      const p = this.pagination || {}
      if (p.from != null && p.from !== undefined) return p.from
      const total = Number(p.total) || 0
      if (!total) return 0
      const per = Number(p.per_page) || 10
      return (this.currentPage - 1) * per + 1
    },
    displayTo() {
      const p = this.pagination || {}
      if (p.to != null && p.to !== undefined) return p.to
      const total = Number(p.total) || 0
      const per = Number(p.per_page) || 10
      return Math.min(this.currentPage * per, total)
    },

    isFirstPage() {
      return this.currentPage <= 1
    },
    isLastPage() {
      return this.currentPage >= (this.pagination?.total_pages || 1)
    }
  },
  watch: {
    pagination: {
      handler() {
        this.syncFromPagination()
      },
      deep: true
    }
  }
}
</script>

<style lang="scss" scoped>
.pagination-btn {
  padding: 6px;
  border: 1px solid #e1eaf3;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  transition: all 0.15s ease;
}

/* Hover */
.pagination-btn:hover {
  background-color: #f5f9ff;
  transform: scale(1.05);
}

/* Click */
.pagination-btn:active {
  transform: scale(0.92);
  background-color: #e8f0fe;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Disabled state */
.disabled-btn {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  transform: none !important;
}
</style>
