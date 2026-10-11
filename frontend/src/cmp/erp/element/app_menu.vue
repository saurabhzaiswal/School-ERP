<template>
  <div class="app-menu inline-block">
    <!-- Trigger -->
    <div ref="trigger" @click.stop="toggle" class="inline-block cursor-pointer app-menu__trigger">
      <template v-if="no_slot">
        <button
          class="material-symbols-outlined text-base border rounded-lg px-2 py-1 bg-white app-menu__default-trigger-btn"
          v-wave="{ color: 'currentColor' }"
          v-if="!button_loading"
        >
          more_horiz
        </button>
        <button
          v-else
          class="material-symbols-outlined text-base border rounded-lg px-2 py-1 bg-white app-menu__default-trigger-btn"
          v-wave="{ color: 'currentColor' }"
          :class="{
            ' cursor-auto': button_loading
          }"
        >
          <span
            class="material-symbols-outlined !text-lg text-[#646464]"
            :class="{
              'task_loader cursor-auto': button_loading
            }"
          >
          </span>
        </button>
      </template>
      <slot v-else name="trigger" :toggle="toggle" :open="isOpen" />
    </div>

    <!-- Menu (appended to body for reliability) -->
    <Teleport to="body">
      <div
        v-if="appendToBody && isOpen"
        ref="menu"
        class="app-menu__menu absolute z-[9999]"
        role="menu"
        aria-orientation="vertical"
        @click.stop
        :style="menuStyle"
      >
        <ul
          class="min-w-[160px] max-h-[280px] overflow-auto bg-white border border-gray-200 rounded-md shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] p-1"
          @keydown="onKeydown"
        >
          <li
            v-for="(it, index) in items"
            :key="it.key || index"
            role="menuitem"
            :tabindex="it.disabled ? -1 : 0"
            :aria-disabled="!!it.disabled"
            class="px-3 py-2 flex items-center gap-2 rounded cursor-pointer select-none outline-none"
            :class="[
              it.disabled
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[var(--primary-color-tabs-bg)]',
              it.danger ? 'text-red-600' : '',
              it?.className
            ]"
            @click="() => onSelect(it)"
            @keydown.enter.prevent="() => onSelect(it)"
            @keydown.space.prevent="() => onSelect(it)"
            @mouseenter="hoveredIndex = index"
          >
            <span
              v-if="it.icon"
              class="material-symbols-outlined text-base"
              :class="it?.iconClassName"
              >{{ it.icon }}</span
            >
            <slot name="item" :item="it">{{ it.label }}</slot>
          </li>
          <slot name="footer" />
        </ul>
      </div>
    </Teleport>

    <!-- Non-teleported menu (rarely used) -->
    <div
      v-if="!appendToBody && isOpen"
      ref="menu"
      class="app-menu__menu absolute z-50"
      role="menu"
      aria-orientation="vertical"
      @click.stop
      :style="menuStyle"
    >
      <ul
        class="min-w-[160px] max-h-[280px] overflow-auto bg-white border border-gray-200 rounded-md shadow-lg p-1"
        @keydown="onKeydown"
      >
        <li
          v-for="(it, index) in items"
          :key="it.key || index"
          role="menuitem"
          :tabindex="it.disabled ? -1 : 0"
          :aria-disabled="!!it.disabled"
          class="px-3 py-2 flex items-center gap-2 rounded cursor-pointer select-none outline-none"
          :class="[
            it.disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-[var(--primary-color-tabs-bg)]',
            it.danger ? 'text-red-600' : ''
          ]"
          @click="() => onSelect(it)"
          @keydown.enter.prevent="() => onSelect(it)"
          @keydown.space.prevent="() => onSelect(it)"
          @mouseenter="hoveredIndex = index"
        >
          <span v-if="it.icon" class="material-symbols-outlined text-base">{{ it.icon }}</span>
          <slot name="item" :item="it">{{ it.label }}</slot>
        </li>
        <slot name="footer" />
      </ul>
    </div>
  </div>
</template>

<script>
import { createPopper } from '@popperjs/core'

// Local manager to ensure only one AppMenu is open at a time
const appMenuManager = {
  active: null,
  open(instance) {
    if (this.active && this.active !== instance) {
      this.active.close()
    }
    this.active = instance
  },
  close(instance) {
    if (this.active === instance) this.active = null
  }
}

export default {
  name: 'AppMenu',
  props: {
    items: {
      type: Array,
      default: () => []
    },
    placement: {
      type: String,
      default: 'bottom-end'
    },
    appendToBody: {
      type: Boolean,
      default: true
    },
    strategy: {
      type: String,
      default: 'fixed'
    },
    offset: {
      type: Array,
      default: () => [0, 6]
    },
    maxHeight: {
      type: String,
      default: '280px'
    },
    widthStrategy: {
      // 'auto' | 'trigger'
      type: String,
      default: 'auto'
    },
    lockScroll: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    button_loading: {
      type: Boolean,
      default: false
    },
    no_slot: {
      type: Boolean,
      default: false
    }
  },
  emits: ['open', 'close', 'select'],
  data() {
    return {
      isOpen: false,
      popper: null,
      menuStyle: {},
      hoveredIndex: -1,
      previousFocusEl: null,
      scrollParents: [],
      updateScheduled: false,
      bodyScrollLocked: false,
      savedBodyOverflow: '',
      savedBodyPaddingRight: ''
    }
  },
  mounted() {
    document.addEventListener('click', this.onDocumentClick)
    document.addEventListener('keydown', this.onGlobalKeydown)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocumentClick)
    document.removeEventListener('keydown', this.onGlobalKeydown)
    this.destroyPopper()
  },
  methods: {
    toggle() {
      if (this.disabled) return
      if (this.isOpen) {
        this.close()
      } else {
        this.open()
      }
    },
    open() {
      if (this.isOpen) return
      this.previousFocusEl = document.activeElement
      this.isOpen = true
      this.$nextTick(() => {
        this.setupPopper()
        appMenuManager.open(this)
        this.$emit('open')
        // Focus first enabled item for accessibility
        this.focusFirstItem()
      })
    },
    close() {
      if (!this.isOpen) return
      this.isOpen = false
      this.$emit('close')
      appMenuManager.close(this)
      this.$nextTick(() => {
        this.destroyPopper()
        this.destroyScrollListeners()
        if (this.lockScroll) this.unlockBodyScroll()
        // Return focus to trigger
        if (this.$refs.trigger) {
          const el = this.$refs.trigger.querySelector(
            'button, [tabindex], .material-symbols-outlined'
          )
          ;(el || this.$refs.trigger).focus?.()
        } else if (this.previousFocusEl) {
          this.previousFocusEl.focus?.()
        }
      })
    },
    onSelect(item) {
      if (item?.disabled) return
      this.$emit('select', item)
      // Prefer item.onClick if provided
      if (typeof item?.onClick === 'function') {
        item.onClick()
      }
      this.close()
    },
    setupPopper() {
      if (!this.$refs.trigger || !this.$refs.menu) return

      // Width control
      if (this.widthStrategy === 'trigger') {
        const rect = this.$refs.trigger.getBoundingClientRect()
        this.menuStyle = {
          width: `${rect.width}px`,
          maxHeight: this.maxHeight
        }
      } else {
        this.menuStyle = { maxHeight: this.maxHeight }
      }

      this.popper = createPopper(this.$refs.trigger, this.$refs.menu, {
        placement: this.placement,
        strategy: this.strategy,
        modifiers: [
          { name: 'offset', options: { offset: this.offset } },
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['top-end', 'bottom-end', 'top-start', 'bottom-start'],
              padding: 20
            }
          },
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 20,
              altBoundary: true,
              rootBoundary: 'viewport',
              mainAxis: false,
              altAxis: false
            }
          }
        ]
      })

      // Ensure tight anchoring during scroll
      this.setupScrollListeners()
      if (this.lockScroll) this.lockBodyScroll()
    },
    destroyPopper() {
      if (this.popper) {
        this.popper.destroy()
        this.popper = null
      }
    },
    // Scroll parents handling to force immediate updates
    setupScrollListeners() {
      this.destroyScrollListeners()
      if (!this.$refs.trigger) return
      this.scrollParents = this.getScrollParents(this.$refs.trigger)
      this.scrollParents.forEach((el) => {
        el.addEventListener('scroll', this.onAnyScroll, {
          passive: true
        })
      })
      window.addEventListener('scroll', this.onAnyScroll, {
        passive: true
      })
    },
    destroyScrollListeners() {
      this.scrollParents.forEach((el) => {
        el.removeEventListener('scroll', this.onAnyScroll)
      })
      this.scrollParents = []
      window.removeEventListener('scroll', this.onAnyScroll)
    },
    onAnyScroll() {
      if (!this.isOpen || !this.popper) return
      this.scheduleUpdate()
    },
    scheduleUpdate() {
      if (this.updateScheduled) return
      this.updateScheduled = true
      requestAnimationFrame(() => {
        this.updateScheduled = false
        this.popper?.update?.()
      })
    },
    getScrollParents(element) {
      const parents = []
      if (!element) return parents
      let parent = element.parentNode
      const overflowScrollRegex = /(auto|scroll|overlay)/
      while (parent && parent !== document.body && parent !== document.documentElement) {
        if (parent instanceof Element) {
          const { overflow, overflowX, overflowY } = getComputedStyle(parent)
          if (
            overflowScrollRegex.test(overflow) ||
            overflowScrollRegex.test(overflowX) ||
            overflowScrollRegex.test(overflowY)
          ) {
            parents.push(parent)
          }
        }
        parent = parent.parentNode
      }
      // Always include window as a fallback
      return parents
    },
    // Body scroll lock with scrollbar compensation
    lockBodyScroll() {
      if (this.bodyScrollLocked) return
      const body = document.body
      this.savedBodyOverflow = body.style.overflow
      this.savedBodyPaddingRight = body.style.paddingRight
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`
      }
      body.style.overflow = 'hidden'
      this.bodyScrollLocked = true
    },
    unlockBodyScroll() {
      if (!this.bodyScrollLocked) return
      const body = document.body
      body.style.overflow = this.savedBodyOverflow || ''
      body.style.paddingRight = this.savedBodyPaddingRight || ''
      this.bodyScrollLocked = false
    },
    onDocumentClick(event) {
      if (!this.isOpen) return
      if (this.$el.contains(event.target)) return
      if (this.$refs.menu?.contains(event.target)) return
      this.close()
    },
    onGlobalKeydown(event) {
      if (!this.isOpen) return
      if (event.key === 'Escape') {
        event.stopPropagation()
        this.close()
      }
    },
    onKeydown(event) {
      const enabledItems = this.items.filter((i) => !i?.disabled)
      if (enabledItems.length === 0) return
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          this.moveHover(1)
          break
        case 'ArrowUp':
          event.preventDefault()
          this.moveHover(-1)
          break
        case 'Home':
          event.preventDefault()
          this.hoveredIndex = 0
          break
        case 'End':
          event.preventDefault()
          this.hoveredIndex = enabledItems.length - 1
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (this.hoveredIndex >= 0 && this.hoveredIndex < this.items.length) {
            const item = this.items[this.hoveredIndex]
            this.onSelect(item)
          }
          break
        case 'Tab':
          this.close()
          break
      }
    },
    moveHover(direction) {
      // Move between enabled items
      const indices = this.items
        .map((it, idx) => (!it?.disabled ? idx : -1))
        .filter((i) => i !== -1)
      if (indices.length === 0) return
      if (this.hoveredIndex === -1) {
        this.hoveredIndex = indices[0]
        this.focusItem(this.hoveredIndex)
        return
      }
      const currentPos = indices.indexOf(this.hoveredIndex)
      const nextPos = (currentPos + direction + indices.length) % indices.length
      this.hoveredIndex = indices[nextPos]
      this.focusItem(this.hoveredIndex)
    },
    focusItem(index) {
      this.$nextTick(() => {
        const menu = this.$refs.menu
        if (!menu) return
        const el = menu.querySelectorAll('[role="menuitem"]')[index]
        el?.focus?.()
      })
    },
    focusFirstItem() {
      const first = this.items.findIndex((i) => !i?.disabled)
      if (first >= 0) {
        this.hoveredIndex = first
        this.focusItem(first)
      }
    }
  }
}
</script>

<style scoped>
/* Keep styles minimal; most visuals use Tailwind classes */
.app-menu__menu:focus {
  outline: none;
}
</style>
