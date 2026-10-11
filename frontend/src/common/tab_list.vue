<template>
  <div class="overflow-x-auto no-scrollbar w-full tab-list" v-bind="$attrs">
    <div
      class="flex gap-6 sm:gap-7 relative pb-0.5 min-w-fit w-full border-b border-gray-300 tab-list__container"
      ref="tabsContainer"
    >
      <!-- Tab hover background -->
      <div
        v-if="hoverStyle.width > 0"
        class="absolute top-0 h-full rounded transition-all duration-300 pointer-events-none tab-list__hover-bg"
        :style="{ left: hoverStyle.left + 'px', width: hoverStyle.width + 'px' }"
      ></div>

      <!-- Tabs -->
      <div
        v-for="(tab, index) in tabs"
        :key="tab.value"
        :ref="(el) => setTabRef(el, index)"
        class="relative tab-list__tab-wrap"
      >
        <button
          @click="selectTab(tab, index)"
          @mouseenter="hoverTab(tab, index)"
          @mouseleave="resetHover()"
          class="relative cursor-pointer select-none pb-3 -mb-[2px] font-semibold whitespace-nowrap flex items-center gap-2 text-gray-600 transition-colors tab-list__tab-btn"
          :class="{ 'text-[var(--primary-color)]': selectedValue === tab.value }"
        >
          <img
            v-if="tab.icon"
            :src="tab.icon"
            alt="icon"
            class="w-4 h-4 object-contain aspect-square tab-list__tab-icon"
          />
          <span
            v-if="tab.material_icon"
            class="material-symbols-outlined text-[16px] tab-list__tab-material-icon"
          >
            {{ tab.material_icon }}
          </span>
          <span
            class="text-[14px] tab-list__tab-label"
            :class="{ 'text-[var(--primary-color)]': selectedValue === tab.value }"
          >
            {{ tab.label }}
            <span v-if="tab.count && tab.count > 0" class="tab-list__tab-count"
              >({{ tab.count }})</span
            >
          </span>
        </button>
      </div>

      <!-- Sliding underline -->
      <div
        v-if="underlineStyle.width > 0"
        class="absolute bottom-0 h-[2px] -mb-[1px] bg-[var(--primary-color)] rounded transition-all duration-300 tab-list__underline"
        :style="{ left: underlineStyle.left + 'px', width: underlineStyle.width + 'px' }"
      ></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TabList',
  props: {
    tabs: { type: Array, required: true },
    modelValue: { type: String, default: '' }
  },
  data() {
    return {
      tabRefs: [],
      tabsContainer: null,
      selectedValue: this.modelValue,
      underlineStyle: { left: 0, width: 0 },
      hoverStyle: { left: 0, width: 0 },
      _tabResizeObservers: [],
      _underlineRaf: null
    }
  },
  watch: {
    modelValue(newVal) {
      this.selectedValue = newVal
      this.scheduleUpdateUnderline()
    },
    tabs: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          this.rebindTabResizeObservers()
          this.scheduleUpdateUnderline()
        })
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.tabsContainer = this.$refs.tabsContainer
      this.updateUnderline()
      this.rebindTabResizeObservers()
      window.addEventListener('resize', this.scheduleUpdateUnderline)
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        document.fonts.ready.then(() => this.scheduleUpdateUnderline())
      }
    })
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.scheduleUpdateUnderline)
    this.disconnectTabResizeObservers()
    if (this._underlineRaf) {
      cancelAnimationFrame(this._underlineRaf)
      this._underlineRaf = null
    }
  },
  methods: {
    setTabRef(el, index) {
      if (el) {
        this.tabRefs[index] = el
      } else {
        delete this.tabRefs[index]
      }
    },

    scheduleUpdateUnderline() {
      if (this._underlineRaf) {
        cancelAnimationFrame(this._underlineRaf)
      }
      this._underlineRaf = requestAnimationFrame(() => {
        this._underlineRaf = null
        if (!this.tabsContainer) {
          this.tabsContainer = this.$refs.tabsContainer
        }
        this.updateUnderline()
      })
    },

    disconnectTabResizeObservers() {
      this._tabResizeObservers.forEach((ro) => ro.disconnect())
      this._tabResizeObservers = []
    },

    rebindTabResizeObservers() {
      this.disconnectTabResizeObservers()
      if (typeof ResizeObserver === 'undefined') {
        return
      }
      this.$nextTick(() => {
        for (let i = 0; i < this.tabs.length; i++) {
          const el = this.tabRefs[i]
          if (!el) continue
          const ro = new ResizeObserver(() => this.scheduleUpdateUnderline())
          ro.observe(el)
          this._tabResizeObservers.push(ro)
        }
      })
    },

    updateUnderline() {
      const index = this.tabs.findIndex((tab) => tab.value === this.selectedValue)
      const el = this.tabRefs[index]
      if (el && this.tabsContainer) {
        const containerLeft = this.tabsContainer.getBoundingClientRect().left
        const rect = el.getBoundingClientRect()
        this.underlineStyle = {
          left: rect.left - containerLeft,
          width: rect.width
        }
      }
    },

    selectTab(tab, index) {
      this.selectedValue = tab.value
      this.$emit('update:modelValue', tab.value)
      this.$emit('tab-change', tab, index)
      this.scheduleUpdateUnderline()

      if (window.innerWidth <= 768 && this.tabRefs[index]) {
        this.tabRefs[index].scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        })
      }
    },

    hoverTab(tab, index) {
      const el = this.tabRefs[index]
      if (el && this.tabsContainer) {
        const containerLeft = this.tabsContainer.getBoundingClientRect().left
        const rect = el.getBoundingClientRect()
        this.hoverStyle = {
          left: rect.left - containerLeft,
          width: rect.width
        }
      }
    },

    resetHover() {
      this.hoverStyle = { left: 0, width: 0 }
    }
  }
}
</script>

<style scoped>
/* optional: hide scrollbar */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
