<template>
  <div class="client-portal-grid-wrapper w-full client-portal-grid-view">
    <div
      v-if="!loader && items.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 py-5 client-portal-grid-view__grid"
    >
      <article
        v-for="(row, rowIdx) in items"
        :key="row.id"
        class="group flex flex-col rounded-lg border border-[#E5E7EB] p-4 pb-0 bg-white overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer client-portal-grid-view__card"
        @click="goDetail(row.id)"
      >
        <!-- Optional: replace entire card header from parent (same pattern as table slots) -->
        <slot name="grid-card-header" :data="cardHeaderSlotData(row, rowIdx)">
          <div class="pb-3 client-portal-grid-view__card-header">
            <p
              class="text-[11px] font-medium text-[#9CA3AF] tracking-wide leading-none client-portal-grid-view__card-id"
            >
              {{ primaryId(row) }}
            </p>
            <h3
              class="text-[13px] font-bold text-[#1F2937] mt-1.5 line-clamp-2 leading-snug client-portal-grid-view__card-title"
            >
              {{ row.title || row.invoice_title || '—' }}
            </h3>
            <p
              class="text-[12px] text-[#6B7280] mt-1.5 truncate leading-tight client-portal-grid-view__card-subtitle"
            >
              {{ subtitle(row) }}
            </p>
          </div>
        </slot>

        <!-- Optional: replace status strip (payload matches pill helpers) -->
        <slot name="grid-status" :data="cardStatusSlotData(row, rowIdx)">
          <div class="pb-3 client-portal-grid-view__card-status-section">
            <div
              class="w-full rounded-md py-2.5 text-center text-[11px] font-semibold leading-none client-portal-grid-view__card-status-pill"
              :class="statusPillClass(row)"
            >
              {{ statusLabel(row) }}
            </div>
          </div>
        </slot>

        <!-- Info block — rows mirror List view columns; `is_custom` payload matches newTable.vue -->
        <div
          class="bg-[var(--primary-color-select-hover-bg)] px-4 pt-3 pb-3.5 flex-1 client-portal-grid-view__card-info"
        >
          <slot name="grid-section-title" :data="sectionTitleSlotData(row, rowIdx)">
            <p
              class="text-[11px] text-[#9CA3AF] mb-2.5 leading-none client-portal-grid-view__card-section-label"
            >
              {{ gridSectionTitle }}
            </p>
          </slot>
          <dl class="space-y-[9px] client-portal-grid-view__card-details">
            <div
              v-for="(header, hIdx) in gridDetailHeaders"
              :key="gridHeaderKey(header, hIdx)"
              class="flex items-baseline justify-between gap-2 client-portal-grid-view__card-detail-row border-b border-[#F3F4F6] last:border-b-0 pb-2"
            >
              <dt
                class="text-[12px] text-[#6B7280] shrink-0 client-portal-grid-view__card-detail-label"
              >
                {{ header.display }}
              </dt>
              <dd
                class="text-[12px] font-semibold text-[#1F2937] text-right break-words min-w-0 client-portal-grid-view__card-detail-value"
              >
                <span
                  v-if="header.is_custom"
                  class="flex w-full justify-end client-portal-grid-view__card-detail-custom"
                >
                  <slot name="is_custom" :data="gridCellSlotData(header, row, rowIdx)" />
                </span>
                <span v-else class="client-portal-grid-view__plain-cell block w-full">
                  <slot name="grid-plain-cell" :data="gridCellSlotData(header, row, rowIdx)">
                    {{ formatPlainCell(row, header) }}
                  </slot>
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <!-- Optional: replace footer CTA row -->
        <slot name="grid-card-footer" :data="cardFooterSlotData(row, rowIdx)">
          <div class="flex items-center justify-center py-3 client-portal-grid-view__card-footer">
            <button
              type="button"
              aria-label="View"
              class="flex items-center gap-2 justify-center text-[#9CA3AF] hover:text-[var(--primary-color,#CD5729)] transition-colors duration-150 client-portal-grid-view__view-btn"
              @click.stop="goDetail(row.id)"
            >
              <span class="material-symbols-outlined" style="font-size: 18px; line-height: 1">
                edit_square
              </span>
              <span class="client-portal-grid-view__view-btn-label text-sm">{{ footerCta }}</span>
            </button>
          </div>
        </slot>
      </article>
    </div>

    <div
      v-else-if="!loader && items.length === 0"
      class="text-center py-14 text-gray-500 client-portal-grid-view__empty"
    >
      <EmptyTable :subtitle="module" />
    </div>
    <loading v-else class="mt-16" />

    <!-- Legacy internal pagination (shown only when useGridPagination=false) -->
    <div
      v-if="!hideFooter && showfooter"
      style="border-bottom: 1px solid #2f2f2f40; border-top: 1px solid #2f2f2f40"
      class="flex col-3 sm:gap-3 gap-5 sm:flex-row flex-col justify-between items-center py-5 footer client-portal-grid-view__footer"
    >
      <div class="sm:text-base text-sm font-medium client-portal-grid-view__footer-page-info">
        Showing Page
        {{ getpagenate.current_page ? getpagenate.current_page : 0 }}
        of
        {{ getpagenate.last_page ? getpagenate.last_page : 0 }}
        <span class="capitalize">Pages</span>
      </div>
      <div
        class="flex items-center sm:gap-3 gap-2.5 table-paging client-portal-grid-view__pagination-controls"
      >
        <div class="sm:text-base text-sm font-medium client-portal-grid-view__page-label">
          The page you're on
        </div>
        <div class="select-drop client-portal-grid-view__per-page-select" style="width: 95px">
          <Dropdown
            :options="parpage"
            v-model="paginateby"
            aria-label="Rows per page"
          />
        </div>
        <div class="flex items-center gap-1 client-portal-grid-view__page-nav">
          <button
            v-wave="{ color: current == 1 ? 'transparent' : 'currentColor' }"
            class="btn-primary previous flex items-center client-portal-grid-view__prev-btn"
            :disabled="current == 1"
            @click="back()"
            :class="{ checkprev: current == 1 }"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            v-wave="{ color: current >= maxdata ? 'transparent' : 'currentColor' }"
            class="btn-primary next flex items-center client-portal-grid-view__next-btn"
            :disabled="current >= maxdata"
            :class="{ checknext: current >= maxdata }"
            @click="next()"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import EmptyTable from '@/common/empty_table.vue'
import Dropdown from '@/cmp/erp/element/dropdown.vue'

export default {
  name: 'ClientPortalGridView',

  components: { EmptyTable, Dropdown },

  props: {
    headers: {
      type: Array,
      default: () => []
    },
    loader: {
      type: Boolean,
      default: false
    },
    data_items: {
      type: Array,
      default: () => []
    },
    layout: {
      type: [Object, Array],
      default: () => ({})
    },
    /** Used when `layout` is not yet a view object (same as List table). */
    default_layout: {
      type: Object,
      default: () => ({})
    },
    getpagenate: {
      type: Object,
      default: () => ({})
    },
    module: {
      type: String,
      default: ''
    },
    view_page_url: {
      type: [String, Array],
      default: '#'
    },
    footerCta: {
      type: String,
      default: 'View'
    },
    hideFooter: {
      type: Boolean,
      default: false
    }
  },

  data: () => ({
    showfooter: true,
    paginateby: 10,
    is_dynamic: true,
    current: 1,
    items: [],
    parpage: [10, 15, 20, 50, 100]
  }),

  computed: {
    maxdata() {
      const lp = this.getpagenate?.last_page
      if (this.is_dynamic && lp != null && lp > 0) return lp
      if (this.is_dynamic && this.getpagenate?.total != null) {
        return Math.max(1, Math.ceil(this.getpagenate.total / (this.paginateby || 10)))
      }
      return Math.max(1, Math.ceil(this.items.length / (this.paginateby || 10)))
    },

    layoutForGrid() {
      const L = this.layout
      if (L && typeof L === 'object' && !Array.isArray(L) && Array.isArray(L.property_visibility)) {
        return L
      }
      const D = this.default_layout
      if (D && typeof D === 'object' && Array.isArray(D.property_visibility)) {
        return D
      }
      return {}
    },

    /** Same column order semantics as `newTable.vue` `updateHeaders` (supports duplicate `value`). */
    orderedVisibleHeaders() {
      const all = Array.isArray(this.headers) ? this.headers : []
      const pv = this.layoutForGrid.property_visibility
      if (!pv || !pv.length) {
        return [...all]
      }
      const ordered = []
      for (const value of pv) {
        for (let i = 0; i < all.length; i++) {
          if (all[i].value === value) {
            ordered.push(all[i])
          }
        }
      }
      return ordered
    },

    gridDetailHeaders() {
      return this.orderedVisibleHeaders.filter((h) => !this.isCardChromeField(h.value))
    },

    gridSectionTitle() {
      if (this.module === 'jobs') {
        return 'Job information'
      }
      if (this.module === 'invoices') {
        return 'Invoice information'
      }
      if (this.module === 'estimates') {
        return 'Estimate information'
      }
      return 'Details'
    },

    /** Same key shape as `newTable.vue` → `main_title` (ModuleName normalized). */
    gridTableName() {
      return String(this.module || 'table')
        .trim()
        .replace(/\s+/g, '-')
        .toLowerCase()
    }
  },

  watch: {
    data_items: {
      immediate: true,
      handler(val) {
        this.items = Array.isArray(val) ? [...val] : []
      }
    },
    getpagenate: {
      deep: true,
      immediate: true,
      handler(val) {
        if (val?.per_page != null) this.paginateby = val.per_page
        if (val?.current_page != null) this.current = val.current_page
      }
    },
    paginateby(val) {
      if (this.is_dynamic) this.$emit('passlistperpage', val)
    }
  },

  methods: {
    /**
     * Aligns with `newTable.vue` `is_custom` slot: `{ header, row, tableName, row_num }` plus `view`.
     */
    gridCellSlotData(header, row, rowIdx) {
      return {
        header,
        row,
        tableName: this.gridTableName,
        row_num: rowIdx,
        view: 'grid'
      }
    },

    cardHeaderSlotData(row, rowIdx) {
      return {
        row,
        row_num: rowIdx,
        tableName: this.gridTableName,
        view: 'grid',
        primaryId: this.primaryId(row),
        title: row.title || row.invoice_title || '—',
        subtitle: this.subtitle(row)
      }
    },

    cardStatusSlotData(row, rowIdx) {
      return {
        row,
        row_num: rowIdx,
        tableName: this.gridTableName,
        view: 'grid',
        statusLabel: this.statusLabel(row),
        statusPillClass: this.statusPillClass(row)
      }
    },

    cardFooterSlotData(row, rowIdx) {
      return {
        row,
        row_num: rowIdx,
        tableName: this.gridTableName,
        view: 'grid',
        footerCta: this.footerCta,
        goDetail: () => this.goDetail(row.id)
      }
    },

    sectionTitleSlotData(row, rowIdx) {
      return {
        row,
        row_num: rowIdx,
        tableName: this.gridTableName,
        view: 'grid',
        sectionTitle: this.gridSectionTitle
      }
    },

    gridHeaderKey(header, idx) {
      return `${header.value}-${header.display}-${idx}`
    },

    /** Fields already shown in the card chrome (id, title, subtitle, status). */
    isCardChromeField(value) {
      if (
        value === 'formatted_estimate_id' ||
        value === 'formatted_job_id' ||
        value === 'formatted_id'
      ) {
        return true
      }
      if (value === 'title' || value === 'invoice_title') {
        return true
      }
      if (value === 'status') {
        return true
      }
      if (this.module === 'invoices' && value === 'client_sales_person') {
        return true
      }
      if (value === 'client_name') {
        return true
      }
      return false
    },

    formatPlainCell(row, header) {
      const key = header.value
      let v = row[key]

      if (
        (v === null || v === undefined || v === '') &&
        key === 'sales_person' &&
        this.module === 'jobs'
      ) {
        v = row.estimator ?? row.sales_person
      }

      if ((v === null || v === undefined || v === '') && key === 'estimator') {
        v = row.estimator ?? row.sales_person
      }

      if (v === null || v === undefined || v === '') {
        return '—'
      }
      if (typeof v === 'object') {
        return '—'
      }
      return String(v)
    },

    viewPath(id) {
      if (this.view_page_url === '#') {
        return `/app/${this.module}/view-${this.module}/` + id
      }
      if (Array.isArray(this.view_page_url)) {
        return this.view_page_url[0] + id + (this.view_page_url[1] || '')
      }
      return this.view_page_url + id
    },

    goDetail(id) {
      this.$router.push(this.viewPath(id))
    },

    primaryId(row) {
      if (this.module === 'invoices') return row.formatted_id || `INV-${row.id}`
      if (this.module === 'jobs') return row.formatted_job_id || `#JOB-${row.id}`
      return row.formatted_estimate_id || `#EST-${row.id}`
    },

    subtitle(row) {
      if (this.module === 'invoices') {
        return row.sales_person || row.client?.client_name || '—'
      }
      return row.supplier_name || row.client?.client_name || 'No Supplier'
    },

    statusLabel(row) {
      if (this.module === 'jobs' && row.status === 'Open') return 'In-Progress'
      return row.status || '—'
    },

    statusPillClass(row) {
      const s = row.status || ''
      if (this.module === 'estimates') {
        const map = {
          'New Estimate': 'text-[#B413ED] bg-[#B413ED14]',
          Approved: 'text-[#0F8925] bg-[#0F892514]',
          Rejected: 'text-[#D9534F] bg-[#D9534F14]',
          'Changes Requested': 'text-[#FF8800] bg-[#FF880014]',
          'On hold': 'text-[#f4b400] bg-[#f4b40014]',
          'Lost or Did not Proceed': 'text-[#D9534F] bg-[#D9534F14]',
          Won: 'text-[#4285f4] bg-[#4285f414]'
        }
        return map[s] || 'text-[#2F2F2F] bg-[#2F2F2F0D]'
      }
      if (this.module === 'jobs') {
        const map = {
          Open: 'text-[#1565C0] bg-[#1565C014]',
          'In-Progress': 'text-[#FF8800] bg-[#FF880014]',
          Completed: 'text-[#0F8925] bg-[#0F892514]'
        }
        return map[s] || 'text-[#2F2F2F] bg-[#2F2F2F0D]'
      }
      if (this.module === 'invoices') {
        const map = {
          Draft: 'text-[#636363] bg-[#63636314]',
          'Payment Due': 'text-[#E05C00] bg-[#E05C0014]',
          Paid: 'text-[#0F8925] bg-[#0F892514]',
          'Partial Payment': 'text-[#9C27B0] bg-[#9C27B014]',
          Overdue: 'text-[#D00000] bg-[#D0000014]',
          Sent: 'text-[#1565C0] bg-[#1565C014]'
        }
        return map[s] || 'text-[#2F2F2F] bg-[#2F2F2F0D]'
      }
      return 'text-[#2F2F2F] bg-[#2F2F2F0D]'
    },

    next() {
      if (this.current < this.maxdata) {
        this.current++
        this.$emit('passcurrent', this.current)
      }
    },

    back() {
      if (this.current > 1) {
        this.current--
        this.$emit('passcurrent', this.current)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.next,
.previous {
  border: 1px solid rgba(60, 60, 60, 0.26);
  height: 2.1rem;
  border-radius: 5px;
  background: #ffffff !important;

  span {
    color: #43434380;
  }
}
</style>
