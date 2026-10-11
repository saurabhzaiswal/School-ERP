<template>
  <div
    class="mt-1 relative inline-block w-full app-dropdown"
    :class="{ 'opacity-60 cursor-not-allowed': disabled }"
  >
    <!-- Dropdown Trigger -->
    <div
      ref="trigger"
      class="app-dropdown__trigger relative flex items-center min-h-[55px] max-h-[58px] px-4 py-2 border border-gray-300 rounded-md bg-transparent cursor-pointer transition-all duration-200 ease-in-out outline-none hover:border-gray-400 focus:border-gray-400"
      :class="[
        triggerClasses,
        {
          'px-3 py-1.5 min-h-auto': multiple,
          'bg-gray-50 border-gray-200 cursor-default': disabled || loading,
          'border-gray-400': isOpen
        }
      ]"
      @click="toggleDropdown"
      @mousedown="handleMouseDown"
      @keydown="handleKeydown"
      @focus="handleFocus"
      :tabindex="disabled || loading ? -1 : 0"
      role="combobox"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      :aria-label="placeholder"
    >
      <!-- Selected Values Display -->
      <div class="flex-1 flex items-center min-h-[24px] overflow-hidden app-dropdown__selected">
        <template v-if="loading">
          <slot name="loading-option">
            <span
              class="app-dropdown__loading-option text-gray-400 font-normal truncate max-w-[85%] block text-start"
            >
              {{ currentLoadingMessage }}
            </span>
          </slot>
        </template>
        <template v-else>
          <template v-if="multiple && selectedValues.length > 0">
            <!-- Multiple Selection Tags -->
            <div
              class="app-dropdown__tags-container flex-1 overflow-x-auto overflow-y-hidden scrollbar-none mr-[45px]"
            >
              <div class="app-dropdown__tags flex flex-nowrap gap-1 min-w-max rounded">
                <TransitionGroup
                  name="tag"
                  tag="div"
                  class="app-dropdown__tags-transition flex flex-nowrap gap-1 min-w-max"
                >
                  <div
                    v-for="(item, index) in selectedValues"
                    :key="getItemKey(item, index)"
                    class="app-dropdown__tag inline-flex items-center text-gray-600 rounded-full text-xs font-medium max-w-[200px] flex-shrink-0 whitespace-nowrap border border-gray-600 px-2 py-1"
                  >
                    <slot
                      name="selected-option"
                      :option="item"
                      :label="getItemLabel(item)"
                      :value="getItemValue(item)"
                      :index="index"
                    >
                      <span
                        class="app-dropdown__tag-text overflow-hidden text-ellipsis whitespace-nowrap"
                      >
                        {{ getItemLabel(item) }}
                      </span>
                    </slot>
                    <button
                      v-if="!disabled"
                      type="button"
                      class="app-dropdown__tag-remove ml-1 bg-none border-none text-gray-600/50 cursor-pointer text-sm leading-none p-0 w-4 h-4 flex items-center justify-center rounded-sm transition-colors duration-200 hover:bg-white/20"
                      @click.stop="removeSelection(item)"
                      :aria-label="`Remove ${getItemLabel(item)}`"
                    >
                      ×
                    </button>
                  </div>
                </TransitionGroup>
              </div>
            </div>
          </template>
          <template
            v-else-if="
              !multiple &&
              selectedValue !== null &&
              selectedValue !== undefined &&
              selectedValue !== ''
            "
          >
            <!-- Single Selection Display -->
            <div class="app-dropdown__single-container flex-1 overflow-hidden min-w-0">
              <slot
                name="selected-option"
                :option="selectedOption"
                :label="selectedOption ? getItemLabel(selectedOption) : ''"
                :value="selectedValue"
              >
                <span
                  class="flex items-center gap-2 app-dropdown__single-value text-gray-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[75%] block text-start"
                  :title="JSON.stringify(getFormatedLabel(selectedValue))"
                >
                  <span class="material-symbols-outlined text-[20px]" v-if="selectedOption?.icon">
                    {{ selectedOption?.icon }}
                  </span>

                  {{
                    selectedOption && selectedOption != null
                      ? getItemLabel(selectedOption, 'display')
                      : getFormatedLabel(selectedValue)
                  }}
                </span>
              </slot>
            </div>
          </template>
          <template v-else>
            <!-- Placeholder -->
            <span class="app-dropdown__placeholder text-gray-400 font-normal">{{
              placeholder
            }}</span>
          </template>
        </template>
      </div>

      <div class="app-dropdown__actions flex items-center">
        <!-- Clear Button -->
        <button
          v-if="clearable && hasSelection && !disabled && !loading && !isOpen"
          type="button"
          class="app-dropdown__clear absolute right-3 top-1/2 -translate-y-1/2 bg-none border-none text-gray-500 cursor-pointer text-lg leading-none p-0 w-10 h-10 flex items-center justify-center rounded-sm transition-all duration-200 hover:bg-gray-100 hover:text-gray-700 hover:rounded-full"
          @click.stop="clearSelection"
          :aria-label="'Clear selection'"
        >
          <span class="material-symbols-outlined text-[19px]">close</span>
        </button>

        <!-- Loading Spinner -->
        <div
          v-if="loading"
          class="app-dropdown__loading-spinner absolute right-4 top-1/2 -translate-y-1/2 text-[var(--primary-color,#d15b2c)]"
        >
          <div
            class="app-dropdown__spinner-small w-5 h-5 border-[0.9em] border-gray-200 border-t-[var(--primary-color,#d15b2c)] rounded-full animate-spin text-xs indent-[-9999em] overflow-hidden box-border transition-opacity duration-100"
          ></div>
        </div>

        <!-- Lilly Animation -->
        <div
          v-if="(error != '' || isOpen) && showLillyAnimation"
          class="app-dropdown__animation absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 z-[10] rounded-full overflow-hidden !bg-[var(--primary-color-sidebars-bg)]"
          v-tooltip="{
            content: error != '' ? error : '',
            distance: 0,
            skidding: -32,
            popperClass: 'lilly-tooltip-width'
          }"
        >
          <LillyAnimation :show_error="error != ''" />
        </div>

        <!-- Dropdown Arrow -->
        <div
          v-if="!loading && !isOpen && !hasSelection"
          class="app-dropdown__arrow flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-transform duration-200 ease-in-out w-10 h-10"
          :class="{ 'rotate-180': isOpen }"
        >
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- Dropdown Menu -->
    <component :is="appendToBody ? 'Teleport' : 'div'" :to="appendToBody ? 'body' : undefined">
      <div
        v-if="isOpen"
        ref="dropdown"
        class="app-dropdown__menu"
        :class="[
          appendToBody ? 'absolute z-[9999]' : 'z-10',
          'app-dropdown__menu-border border border-gray-400 rounded-md bg-white overflow-hidden flex flex-col w-full',
          appendToBody
            ? 'shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)]'
            : '',
          menuClasses
        ]"
        :style="dropdownStyle"
        @click.stop
        role="listbox"
        :aria-label="'Options'"
      >
        <!-- Search Input -->
        <div
          v-if="searchable"
          class="app-dropdown__search w-full"
          :class="[
            currentPlacement?.includes('bottom')
              ? 'order-1 bottom border-b border-gray-400'
              : 'order-2 top border-t border-gray-400'
          ]"
        >
          <div class="app-dropdown__search-input-wrapper relative flex items-center">
            <svg
              class="app-dropdown__search-icon absolute left-2 text-gray-600 pointer-events-none"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              class="app-dropdown__search-input w-full px-2 py-2 pl-8 h-10 text-sm outline-none transition-all duration-200 bg-gray-50 border-0 placeholder:text-gray-400 focus:bg-white"
              :placeholder="searchPlaceholder"
              :autocomplete="autocomplete"
              :id="`search-${uniqueId}`"
              name="dropdown-search"
              @keydown="handleSearchKeydown"
              @input="onSearch"
            />
          </div>
        </div>

        <!-- Options List -->
        <div
          class="app-dropdown__options max-h-[200px] overflow-y-auto py-1 px-1 w-full scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400"
          ref="optionsContainer"
          @scroll="handleScroll"
          :class="[currentPlacement?.includes('bottom') ? 'order-2' : 'order-1']"
        >
          <template v-if="filteredOptions.length > 0">
            <transition name="option-list" appear>
              <div class="option-list" v-if="filteredOptions.length > 0">
                <div
                  v-for="(option, index) in filteredOptions"
                  :key="getItemKey(option, index)"
                  class="app-dropdown__option px-3 py-2 cursor-pointer rounded transition-all duration-100 hover:scale-[0.995]"
                  :class="getOptionClasses(option, index)"
                  @mouseenter="hoveredIndex = index"
                  role="option"
                  :aria-selected="isSelected(option)"
                  @click="selectOption(option)"
                >
                  <div
                    class="app-dropdown__option-content flex items-center justify-between gap-2 w-full h-full"
                  >
                    <!-- Custom option template -->
                    <div class="app-dropdown__option-slot flex-1 cursor-pointer">
                      <slot
                        name="option"
                        :option="option"
                        :label="getItemLabel(option)"
                        :value="getItemValue(option)"
                        :index="index"
                        :selected="isSelected(option)"
                      >
                        <span
                          class="app-dropdown__option-label flex-1 text-sm font-medium flex items-center gap-2"
                        >
                          <span class="material-symbols-outlined text-[16px]" v-if="option.icon">
                            {{ option.icon }} </span
                          >{{ getItemLabel(option) }}
                        </span>
                      </slot>
                    </div>

                    <!-- Action Icons - Only for multiple selection -->
                    <div
                      v-if="multiple"
                      class="app-dropdown__option-actions flex items-center gap-1 flex-shrink-0"
                    >
                      <!-- Checkmark for selected items -->
                      <button
                        v-if="isSelected(option)"
                        type="button"
                        class="app-dropdown__option-selected bg-none border-none text-[var(--primary-color,#d15b2c)] cursor-pointer p-0.5 rounded-sm transition-all duration-200 flex items-center justify-center w-5 h-5 hover:bg-[rgba(209,91,44,0.1)]"
                        @click.stop="selectOption(option)"
                        :aria-label="`Remove ${getItemLabel(option)}`"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M13.5 4.5L6 12L2.5 8.5"
                            stroke="var(--primary-color)"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </button>

                      <!-- Plus icon for unselected items -->
                      <button
                        v-else
                        type="button"
                        class="app-dropdown__option-add bg-none border-none text-gray-400 cursor-pointer p-0.5 rounded-sm transition-all duration-200 flex items-center justify-center w-5 h-5 hover:bg-gray-100 hover:text-[var(--primary-color,#d15b2c)]"
                        @click.stop="selectOption(option)"
                        :aria-label="`Add ${getItemLabel(option)}`"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M8 3.5V12.5M3.5 8H12.5"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                          />
                        </svg>
                      </button>

                      <!-- Additional taggable button if needed -->
                      <button
                        v-if="taggable && !isSelected(option) && !isExistingOption(option)"
                        type="button"
                        class="app-dropdown__option-tag bg-none border-none text-[var(--primary-color,#d15b2c)] cursor-pointer p-0.5 rounded-sm transition-all duration-200 flex items-center justify-center w-[18px] h-[18px] ml-1 hover:bg-[rgba(209,91,44,0.1)]"
                        @click.stop="addTag(option)"
                        :aria-label="`Add ${getItemLabel(option)} as tag`"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M7 3.5V10.5M3.5 7H10.5"
                            stroke="currentColor"
                            stroke-width="1.5"
                            stroke-linecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </template>

          <!-- No Results -->
          <div
            v-else-if="searchQuery && filteredOptions.length === 0"
            class="app-dropdown__no-results py-5 px-3 text-center text-gray-500"
          >
            <div class="app-dropdown__no-results-content flex flex-col gap-2 items-center">
              <span>No results found for "{{ searchQuery }}"</span>
              <button
                v-if="taggable"
                type="button"
                class="app-dropdown__add-tag bg-[var(--primary-color,#d15b2c)] text-white border-none px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors duration-200 hover:opacity-80"
                @click="addTag(searchQuery)"
              >
                Add "{{ searchQuery }}" as new option
              </button>
              <button
                v-if="isDynamicCreate"
                type="button"
                class="app-dropdown__add-tag bg-[var(--primary-color,#d15b2c)] text-white border-none px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors duration-200 hover:opacity-80"
                @click="$emit('openDynamicCreate')"
              >
                Add "{{ searchQuery }}" as new option
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-else-if="!searchQuery && filteredOptions.length === 0"
            class="app-dropdown__empty-state py-5 px-3 text-center text-gray-500 italic"
          >
            <div class="app-dropdown__empty-state-content flex flex-col gap-2 items-center">
              <button
                v-if="isDynamicCreate"
                type="button"
                class="app-dropdown__add-tag bg-[var(--primary-color,#d15b2c)] text-white border-none px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors duration-200 hover:bg-[var(--primary-color-dark,#b8451f)]"
                @click="$emit('openDynamicCreate')"
              >
                Add new option
              </button>
              <span>Sorry, no matching options.</span>
            </div>
          </div>

          <!-- Loading State -->
          <div
            v-if="listLoading"
            class="app-dropdown__loading flex items-center justify-center gap-2 py-5 px-3 text-gray-500 text-sm"
          >
            <div
              class="app-dropdown__spinner w-4 h-4 border-2 border-gray-200 border-t-[var(--primary-color,#d15b2c)] rounded-full animate-spin"
            ></div>
            <span>Loading...</span>
          </div>

          <!-- Load More Button -->
          <div
            v-if="isPagination && hasMore && !listLoading"
            class="app-dropdown__load-more py-2 px-3 border-t border-gray-200 bg-gray-50"
          >
            <button
              type="button"
              class="app-dropdown__load-more-btn w-full px-3 py-2 bg-white border border-gray-300 rounded text-gray-700 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400"
              @click="loadMore"
            >
              Load More
            </button>
          </div>
        </div>
      </div>
    </component>
  </div>
</template>
<script>
import { createPopper } from '@popperjs/core'

// Global dropdown manager
const dropdownManager = {
  activeDropdown: null,
  listeners: new Set(),

  register(dropdown) {
    this.listeners.add(dropdown)
  },

  unregister(dropdown) {
    this.listeners.delete(dropdown)
    if (this.activeDropdown === dropdown) {
      this.activeDropdown = null
    }
  },

  open(dropdown) {
    // Close any currently active dropdown
    if (this.activeDropdown && this.activeDropdown !== dropdown) {
      this.activeDropdown.closeDropdown()
    }

    // Set this dropdown as active
    this.activeDropdown = dropdown
  },

  close(dropdown) {
    if (this.activeDropdown === dropdown) {
      this.activeDropdown = null
    }
  }
}

export default {
  name: 'AppDropdown',
  props: {
    isDynamicCreate: {
      type: Boolean,
      default: false
    },
    autoFocus: {
      type: Boolean,
      default: false
    },
    showLillyAnimation: {
      type: Boolean,
      default: true
    },
    tailingIcon: {
      type: String,
      default: null
    },
    validate: {
      type: Boolean,
      default: false
    },
    form: {
      type: Object,
      default: () => {}
    },
    modelValue: {
      type: [String, Number, Object, Array],
      default: null
    },
    options: {
      type: Array,
      default: () => []
    },
    multiple: {
      type: Boolean,
      default: false
    },
    searchable: {
      type: Boolean,
      default: true
    },
    taggable: {
      type: Boolean,
      default: false
    },
    pushTags: {
      type: Boolean,
      default: false
    },
    clearable: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: 'Select...'
    },
    searchPlaceholder: {
      type: String,
      default: 'Search...'
    },
    reduce: {
      type: Function,
      default: (option) => option
    },
    label: {
      type: String,
      default: null
    },
    // value: {
    //     type: String,
    //     default: null
    // },
    getOptionLabel: {
      type: Function,
      default: (option) =>
        typeof option === 'object' ? option.label || option.name || option.value : option
    },
    getOptionValue: {
      type: Function,
      default: (option) =>
        option && typeof option === 'object' ? option.value || option.id || option : option || null
    },
    placement: {
      type: String,
      default: 'bottom-start'
    },
    maxHeight: {
      type: String,
      default: '300px'
    },
    loading: {
      type: Boolean,
      default: false
    },
    listLoading: {
      type: Boolean,
      default: false
    },
    hasMore: {
      type: Boolean,
      default: false
    },
    isPagination: {
      type: Boolean,
      default: false
    },
    filterBy: {
      type: Function,
      default: null
    },
    // Additional Features
    appendToBody: {
      type: Boolean,
      default: true
    },
    autocomplete: {
      type: String,
      default: 'off'
    },
    autoscroll: {
      type: Boolean,
      default: true
    },
    customClass: {
      type: String,
      default: ''
    },
    customError: {
      type: String,
      default: ''
    }
  },

  emits: [
    'update:modelValue',
    'search',
    'load-more',
    'add-tag',
    'remove-tag',
    'clear',
    'open',
    'close',
    'error'
  ],

  data() {
    return {
      error: '',
      isOpen: false,
      searchQuery: '',
      hoveredIndex: -1,
      popperInstance: null,
      dropdownStyle: {},
      allOptions: [...this.options],
      currentPage: 1,
      itemsPerPage: 50,
      uniqueId: `dropdown-${Math.random().toString(36).substr(2, 9)}`,
      isToggling: false,
      isClicking: false,
      mazPhoneObserver: null,
      // for placement tracking
      currentPlacement: null,
      currentLoadingMessage: '',
      loadingMessages: [
        'Rewinding VHS…',
        'Loading the Matrix…',
        'Warming flux capacitor…',
        'Assembling Avengers…',
        'Summoning Gandalf…',
        'Charging proton packs…',
        'Calibrating Stargate…',
        'Polishing Infinity Stones…',
        'Connecting to AOL…',
        'Booting from floppy…',
        'Dial-up noises…',
        'Installing Clippy…',
        'Mounting ISO…',
        'Defragging reality…',
        'Decrypting mainframe…',
        'Respawning assets…',
        'Press START…',
        'Leveling up…',
        'Saving progress…',
        'Applying cheat codes…',
        'Collecting rings…',
        'Finding Nemo…',
        'Paging Dr. Brown…',
        'Rebuilding Gotham…',
        'Summoning R2-D2…',
        'Charging lightsabers…',
        'Syncing timelines…',
        'Waiting for TARDIS…',
        'Running diagnostics…',
        'Crossing the streams…',
        'Rendering pixels…',
        'Gathering data…',
        'Refilling coffee…',
        'Polishing UI…',
        'Optimizing vibes…',
        'Reticulating splines…',
        'Spawning heroes…',
        'Rebooting universe…',
        'Loading nostalgia…',
        'Upgrading coolness…',
        'Unlocking secrets…',
        'Preparing montage…',
        'Summoning luck…',
        'Powering dreams…',
        'Charging optimism…',
        'Aligning stars…',
        'Engaging warp drive…',
        'Running simulation…',
        'Generating plot…',
        'Debugging destiny…',
        'Rendering awesomeness…'
      ]
    }
  },

  computed: {
    selectedValue() {
      return this.multiple ? null : this.modelValue
    },

    selectedOption() {
      if (this.multiple || !this.modelValue) return null

      const mvKey =
        typeof this.modelValue === 'object' || Array.isArray(this.modelValue)
          ? this.getOptionValue(this.modelValue)
          : this.modelValue

      return this.allOptions.find((option) => this.getOptionValue(option) === mvKey) || null
      // if (this.multiple || !this.modelValue) return null;

      // return this.allOptions.find((option) => {
      //     const optionValue = this.getItemValue(option);
      //     const isObject =
      //         typeof this.modelValue === "object" ||
      //         Array.isArray(this.modelValue);
      //     return isObject
      //         ? JSON.stringify(optionValue) ===
      //               JSON.stringify(this.modelValue)
      //         : optionValue === this.modelValue;
      // });
    },

    selectedValues() {
      return this.multiple && Array.isArray(this.modelValue) ? this.modelValue : []
    },

    hasSelection() {
      return this.multiple
        ? this.selectedValues.length > 0
        : this.selectedValue !== null &&
            this.selectedValue !== undefined &&
            this.selectedValue !== '' &&
            this.clearable
    },

    filteredOptions() {
      const options = (this.isPagination ? this.paginatedOptions : this.allOptions).filter(
        (option) => option != null
      )

      if (!this.searchQuery) return options

      const filterFunction = this.filterBy || this.defaultFilterBy
      return options.filter((option) => filterFunction(option, this.searchQuery))
    },

    paginatedOptions() {
      const end = this.currentPage * this.itemsPerPage
      return this.allOptions.filter((option) => option != null).slice(0, end)
    },

    triggerClasses() {
      return {
        'is-focused': this.isOpen,
        'has-selection': this.hasSelection,
        'is-multiple': this.multiple,
        [this.customClass]: this.customClass,
        errorfield: this.error
      }
    },

    menuClasses() {
      return {
        'is-top': this.placement.includes('top'),
        'is-bottom': this.placement.includes('bottom')
      }
    }
  },

  watch: {
    modelValue(newVal, oldVal) {
      this.error = ''

      // Scroll to selected option when value changes and dropdown is open
      if (this.isOpen && this.autoscroll) {
        this.$nextTick(() => {
          this.scrollToFirstSelectedOption()
        })
      }
    },
    validate(newVal, oldVal) {
      if (newVal === true) {
        if (this.form.validate) {
          var error = this.$globalValidate(this.form.validate, this.form.label, this.modelValue)
          this.error = error
          if (error !== '') {
            this.isOpen = true
          }
          this.$emit('error', error)
        }
      }
    },
    customError(newVal, oldVal) {
      this.error = newVal
    },
    isOpen(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.setupPopper()
          this.hoveredIndex = this.filteredOptions.length > 0 ? -1 : this.hoveredIndex
          this.$emit('open')
          this.scrollToFirstSelectedOption()
        })
      } else {
        this.destroyPopper()
        this.searchQuery = ''
        this.hoveredIndex = -1
        this.$emit('close')
      }
    },

    options: {
      handler(newOptions) {
        this.allOptions = [...newOptions]
      },
      deep: true
    },
    loading(newVal, oldVal) {
      if (newVal === false && oldVal === true) {
        if (
          this.autoFocus &&
          (this.selectedValue == null ||
            this.selectedValue == undefined ||
            this.selectedValue == '')
        ) {
          this.toggleDropdown()
        }
      }
    }
  },

  mounted() {
    document.addEventListener('click', this.handleClickOutside)
    document.addEventListener('keydown', this.handleGlobalKeydown)
    this.setupMazPhoneWatcher()
    dropdownManager.register(this)

    // Add resize and orientation change listeners
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('orientationchange', this.handleOrientationChange)
    this.loadingMessage()
    //console.log("loading new dropdown");
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
    document.removeEventListener('keydown', this.handleGlobalKeydown)
    this.destroyMazPhoneWatcher()
    setTimeout(() => {
      this.destroyPopper()
    }, 50)
    // this.destroyPopper();
    dropdownManager.unregister(this)

    // Remove resize and orientation change listeners
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('orientationchange', this.handleOrientationChange)
  },

  methods: {
    loadingMessage() {
      this.currentLoadingMessage =
        this.loadingMessages[Math.floor(Math.random() * this.loadingMessages.length)]
    },
    getFormatedLabel(value) {
      //console.log("value", value);
      if (this.tailingIcon) {
        return value + ' ' + this.tailingIcon + ''
      }
      // console.log("value", value);
      // console.log("Selected Value", this.selectedOption);
      //console.log("this.tailingIcon", value);
      return value
    },
    toggleDropdown(event) {
      // console.log('options', this.options);
      if (this.disabled || this.loading) return

      // Prevent event bubbling to avoid immediate close
      if (event) {
        event.stopPropagation()
      }

      // Set clicking flag to prevent focus from interfering
      this.isClicking = true
      this.isToggling = true

      if (this.isOpen) {
        // If already open, close it
        this.isOpen = false
        dropdownManager.close(this)
      } else {
        // If closed, open it and notify the manager
        this.isOpen = true
        dropdownManager.open(this)
      }

      // Reset flags after a short delay
      this.$nextTick(() => {
        setTimeout(() => {
          this.isToggling = false
          this.isClicking = false
        }, 100)
      })
    },

    handleMouseDown() {
      // Set clicking flag on mousedown to prevent focus from interfering
      this.isClicking = true
    },

    handleFocus() {
      // Don't auto-open if we're in the middle of clicking
      if (this.isClicking) return

      // Auto-open dropdown when focused via tab navigation
      if (!this.disabled && !this.loading && !this.isOpen) {
        this.isOpen = true
        dropdownManager.open(this)
      }
    },

    closeDropdown() {
      this.isOpen = false
      this.searchQuery = ''
      this.hoveredIndex = -1
      dropdownManager.close(this)
    },

    setupPopper() {
      if (!this.$refs.trigger || !this.$refs.dropdown) return

      this.popperInstance = createPopper(this.$refs.trigger, this.$refs.dropdown, {
        placement: this.placement,

        modifiers: [
          {
            name: 'offset',
            options: { offset: [0, 4] }
          },
          // {
          //     name: "preventOverflow",
          //     options: {
          //         boundary: "viewport",
          //         padding: 20, // Ensures 20px space from viewport
          //     },
          // },
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 20, // Ensures 20px space from viewport
              altBoundary: true,
              rootBoundary: 'viewport',
              mainAxis: false,
              altAxis: false
            }
          },
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['top-start', 'bottom-start', 'top-end', 'bottom-end'],
              padding: 20 // Buffer before flipping
            }
          },
          {
            name: 'transition',
            options: {
              transition: 'dropdown-menu'
            }
          },
          // custom modifier to track placement
          {
            name: 'placementTracker',
            enabled: true,
            phase: 'main',
            fn: ({ state }) => {
              this.updatePlacementInfo(state)
            }
          }
        ]
      })

      // updating.. dropdown width to match trigger
      this.updateDropdownWidth()
    },

    destroyPopper() {
      if (this.popperInstance) {
        this.popperInstance.destroy()
        this.popperInstance = null
      }
    },

    // Dynamic triggerRect calculation
    updateDropdownWidth() {
      if (!this.$refs.trigger) return

      const triggerRect = this.$refs.trigger.getBoundingClientRect()
      //console.log("Updated triggerRect:", triggerRect);

      this.dropdownStyle = {
        width: `${triggerRect.width}px`,
        maxHeight: this.maxHeight
      }
    },

    // Handle window resize
    handleResize() {
      if (this.isOpen) {
        this.updateDropdownWidth()
        // Update popper position if it exists
        if (this.popperInstance) {
          this.popperInstance.update()
        }
      }
    },

    // Handle orientation change
    handleOrientationChange() {
      // Add a small delay to ensure the orientation change is complete
      setTimeout(() => {
        if (this.isOpen) {
          this.updateDropdownWidth()
          // Update popper position if it exists
          if (this.popperInstance) {
            this.popperInstance.update()
          }
        }
      }, 100)
    },

    updatePlacementInfo(state) {
      if (state?.placement) {
        this.currentPlacement = state.placement
      }
    },

    focusSearchInput() {
      if (this.searchable && this.$refs.searchInput) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.$refs.searchInput?.focus()
          }, 50)
        })
      }
    },

    getItemLabel(option, type = '') {
      if (!option) return ''

      if (this.label && typeof option === 'object') {
        return option[this.label] || ''
      }

      return this.getOptionLabel(option)
    },

    getItemValue(option) {
      if (!option) return null

      // Use reduce function if provided, otherwise use getOptionValue
      return this.reduce(option)
    },

    getItemKey(option, index) {
      const value = this.getItemValue(option)
      return typeof value === 'object' ? JSON.stringify(value) : value || index
    },

    isSelected(option) {
      if (!option) return false

      const optionKey = this.getOptionValue(option)
      //console.log("optionKey", optionKey);
      if (this.multiple) {
        return this.selectedValues.some((selected) => {
          const selectedKey =
            typeof selected === 'object' || Array.isArray(selected)
              ? this.getOptionValue(selected)
              : selected
          return selectedKey === optionKey
        })
      }

      const selKey =
        typeof this.selectedValue === 'object' || Array.isArray(this.selectedValue)
          ? this.getOptionValue(this.selectedValue)
          : this.selectedValue

      return selKey === optionKey

      //   if (!option) return false;
      //   const optionValue = this.getItemValue(option);

      //   if (this.multiple) {
      //     return this.selectedValues.some((selected) => {
      //       // selected is already a stored value from selectedValues
      //       const isObject =
      //         typeof selected === "object" || Array.isArray(selected);
      //       const isOptionObject =
      //         typeof optionValue === "object" || Array.isArray(optionValue);
      //       return isObject && isOptionObject
      //         ? JSON.stringify(selected) === JSON.stringify(optionValue)
      //         : selected === optionValue;
      //     });
      //   }

      //   const isObject =
      //     typeof this.selectedValue === "object" ||
      //     Array.isArray(this.selectedValue);
      //   return isObject
      //     ? JSON.stringify(this.selectedValue) === JSON.stringify(optionValue)
      //     : this.selectedValue === optionValue;
    },

    isExistingOption(option) {
      if (!option) return false
      return this.allOptions.some(
        (existing) => existing && this.getItemValue(existing) === this.getItemValue(option)
      )
    },

    selectOption(option) {
      if (this.disabled || this.loading || !option) return

      const optionValue = this.getItemValue(option)

      if (this.multiple) {
        const newValues = [...this.selectedValues]
        const existingIndex = newValues.findIndex((selected) => {
          const isObject = typeof selected === 'object' || Array.isArray(selected)
          const isOptionObject = typeof optionValue === 'object' || Array.isArray(optionValue)
          return isObject && isOptionObject
            ? JSON.stringify(selected) === JSON.stringify(optionValue)
            : selected === optionValue
        })

        if (existingIndex > -1) {
          newValues.splice(existingIndex, 1)
        } else {
          newValues.push(optionValue)
        }

        this.$emit('update:modelValue', newValues)
      } else {
        this.$emit('update:modelValue', optionValue)
        this.closeDropdown()
      }

      // Auto-scroll to selected option for both mouse clicks and keyboard navigation
      this.scrollToSelectedOption(option)
    },

    scrollToSelectedOption(option) {
      if (!this.$refs.optionsContainer || !this.autoscroll) return

      // Find the index of the selected option
      const optionIndex = this.filteredOptions.findIndex(
        (opt) => this.getItemValue(opt) === this.getItemValue(option)
      )

      if (optionIndex === -1) return

      const container = this.$refs.optionsContainer
      const optionElement = container.children[optionIndex]

      if (optionElement) {
        const containerRect = container.getBoundingClientRect()
        const elementRect = optionElement.getBoundingClientRect()

        // Check if element is fully visible
        const isFullyVisible =
          elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom

        if (!isFullyVisible) {
          optionElement.scrollIntoView({
            block: 'nearest'
            // behavior: 'smooth'
          })
        }
      }
    },

    scrollToFirstSelectedOption() {
      if (!this.$refs.optionsContainer || !this.autoscroll) return

      // Find the first selected option
      let firstSelectedIndex = -1

      if (this.multiple && this.selectedValues.length > 0) {
        // For multiple selection, find first selected option
        firstSelectedIndex = this.filteredOptions.findIndex((option) => this.isSelected(option))
      } else if (!this.multiple && this.selectedValue) {
        // For single selection, find the selected option
        firstSelectedIndex = this.filteredOptions.findIndex(
          (option) =>
            // this.getItemValue(option) ===
            // this.getItemValue(this.selectedValue)
            this.getItemValue(option) === this.selectedValue
        )
      }

      if (firstSelectedIndex === -1) return

      const container = this.$refs.optionsContainer
      const optionElement = container.children[firstSelectedIndex]

      if (optionElement) {
        // Small delay to ensure dropdown is fully rendered
        setTimeout(() => {
          optionElement.scrollIntoView({
            // block: "nearest",
            block: 'center'
            // behavior: 'smooth'
          })
        }, 50)
      }
    },

    removeSelection(option) {
      if (this.disabled || this.loading || !option) return

      if (this.multiple) {
        const newValues = this.selectedValues.filter((selected) => {
          // option is already the stored value from selectedValues, so compare directly
          const isObject = typeof selected === 'object' || Array.isArray(selected)
          const isOptionObject = typeof option === 'object' || Array.isArray(option)
          return isObject && isOptionObject
            ? JSON.stringify(selected) !== JSON.stringify(option)
            : selected !== option
        })
        this.$emit('update:modelValue', newValues)
        this.$emit('remove-tag', option)
      }
    },

    clearSelection() {
      if (this.disabled || this.loading) return

      if (this.multiple) {
        this.$emit('update:modelValue', [])
      } else {
        this.$emit('update:modelValue', null)
      }
      this.$emit('clear')
    },

    addTag(tagValue) {
      if (this.disabled || !this.taggable) return

      const tagLabel = typeof tagValue === 'string' ? tagValue : this.getItemLabel(tagValue)
      const newTag = {
        label: tagLabel,
        value: tagValue,
        isNew: true
      }

      if (this.multiple) {
        const newValues = [...this.selectedValues, newTag]
        this.$emit('update:modelValue', newValues)
      } else {
        this.$emit('update:modelValue', newTag)
        this.closeDropdown()
      }

      this.$emit('add-tag', newTag)

      if (this.pushTags) {
        this.allOptions.push(newTag)
      }

      // Clear search query after adding tag
      this.searchQuery = ''
    },

    onSearch() {
      // Reset hovered index when search query changes
      this.hoveredIndex = -1

      // Auto-select first filtered option if there are results
      if (this.filteredOptions.length > 0) {
        this.hoveredIndex = 0
      }

      this.$emit('search', this.searchQuery)
    },

    loadMore() {
      this.currentPage++
      this.$emit('load-more', {
        page: this.currentPage,
        query: this.searchQuery
      })
    },

    handleScroll(event) {
      // Only handle scroll for pagination if pagination is enabled
      if (!this.isPagination) return

      const { scrollTop, scrollHeight, clientHeight } = event.target
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 10

      if (isNearBottom && this.hasMore && !this.listLoading) {
        this.loadMore()
      }
    },

    getOptionClasses(option, index) {
      return {
        'is-selected': this.isSelected(option),
        'is-hovered': index === this.hoveredIndex,
        'is-new': option.isNew
      }
    },

    handleKeydown(event) {
      if (this.disabled || this.loading) return

      switch (event.key) {
        case 'Enter':
          event.preventDefault()
          if (this.isOpen) {
            // If dropdown is open, try to select the hovered option
            if (this.hoveredIndex >= 0 && this.filteredOptions[this.hoveredIndex]) {
              // console.log('Selecting option from trigger:', this.filteredOptions[this.hoveredIndex]);
              this.selectOption(this.filteredOptions[this.hoveredIndex])
            } else if (this.taggable && this.searchQuery && this.searchQuery.trim()) {
              // console.log('Adding tag from trigger:', this.searchQuery);
              this.addTag(this.searchQuery)
            } else if (this.filteredOptions.length > 0) {
              // If no hovered index but there are filtered options, select the first one
              // console.log('Selecting first option from trigger:', this.filteredOptions[0]);
              this.selectOption(this.filteredOptions[0])
            }
          } else {
            // If dropdown is closed, open it
            this.toggleDropdown()
          }
          break
        case ' ':
          event.preventDefault()
          this.toggleDropdown()
          break
        case 'Tab':
          // Close dropdown when Tab is pressed

          if (this.isOpen) {
            // event.preventDefault();
            this.closeDropdown()
          }
          break
        case 'Escape':
          this.closeDropdown()
          break
        case 'ArrowDown':
          event.preventDefault()
          if (!this.isOpen) {
            this.toggleDropdown()
          } else {
            this.focusNextOption()
          }
          break
        case 'ArrowUp':
          event.preventDefault()
          if (this.isOpen) {
            this.focusPreviousOption()
          }
          break
      }
    },

    handleSearchKeydown(event) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          this.focusNextOption()
          break
        case 'ArrowUp':
          event.preventDefault()
          this.focusPreviousOption()
          break
        case 'Tab':
          // Close dropdown when Tab is pressed
          this.closeDropdown()
          break
        case 'Enter':
          event.preventDefault()
          if (this.hoveredIndex >= 0 && this.filteredOptions[this.hoveredIndex]) {
            // console.log('Selecting option:', this.filteredOptions[this.hoveredIndex]);
            this.selectOption(this.filteredOptions[this.hoveredIndex])
          } else if (this.taggable && this.searchQuery && this.searchQuery.trim()) {
            // console.log('Adding tag:', this.searchQuery);
            this.addTag(this.searchQuery)
          } else if (this.filteredOptions.length > 0) {
            // If no hovered index but there are filtered options, select the first one
            // console.log('Selecting first option:', this.filteredOptions[0]);
            this.selectOption(this.filteredOptions[0])
          }
          break
        case 'Escape':
          this.closeDropdown()
          break
      }
    },

    focusNextOption() {
      if (this.filteredOptions.length === 0) return

      this.hoveredIndex =
        this.hoveredIndex === -1
          ? 0
          : Math.min(this.hoveredIndex + 1, this.filteredOptions.length - 1)
      this.scrollToHoveredOption()
    },

    focusPreviousOption() {
      if (this.filteredOptions.length === 0) return

      this.hoveredIndex = Math.max(this.hoveredIndex - 1, 0)
      this.scrollToHoveredOption()
    },

    scrollToHoveredOption() {
      if (!this.$refs.optionsContainer || !this.autoscroll) return

      const hoveredElement = this.$refs.optionsContainer.children[this.hoveredIndex]
      if (hoveredElement) {
        const container = this.$refs.optionsContainer
        const containerRect = container.getBoundingClientRect()
        const elementRect = hoveredElement.getBoundingClientRect()

        const isFullyVisible =
          elementRect.top >= containerRect.top && elementRect.bottom <= containerRect.bottom

        if (!isFullyVisible) {
          hoveredElement.scrollIntoView({ block: 'nearest' })
        }
      }
    },

    handleClickOutside(event) {
      if (this.isToggling || !this.isOpen || this.$el.contains(event.target)) return

      // Check if click is on maz-phone components
      const mazPhoneSelectors = [
        '.m-country-selector',
        '.m-country-selector__country-flag',
        '.m-select',
        '.maz-phone-number-input'
      ]

      const isMazPhoneClick = mazPhoneSelectors.some((selector) => event.target.closest(selector))

      if (!isMazPhoneClick) {
        this.closeDropdown()
      }
    },

    handleGlobalKeydown(event) {
      if (this.isOpen && event.key === 'Escape') {
        this.closeDropdown()
      }
    },

    setupMazPhoneWatcher() {
      // Watch for --is-open class changes on maz-phone elements
      this.mazPhoneObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName === 'class' &&
            mutation.target.classList?.contains('--is-open')
          ) {
            this.closeDropdown()
            break
          }
        }
      })

      this.mazPhoneObserver.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      })
    },

    destroyMazPhoneWatcher() {
      if (this.mazPhoneObserver) {
        this.mazPhoneObserver.disconnect()
        this.mazPhoneObserver = null
      }
    },

    defaultFilterBy(option, query) {
      const label = this.getItemLabel(option).toLowerCase()
      return label.includes(query.toLowerCase())
    }
  }
}
</script>
<style scoped lang="scss">
// Option list animations
.option-list-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: 100ms;
}

.option-list-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 1, 1);
}

.option-list-enter-from,
.option-list-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

// Tag transition animations
.tag-enter-active {
  transition: all 0.3s ease-out;
}

.tag-leave-active {
  transition: all 0.2s ease-in;
}

.tag-enter-from {
  opacity: 0;
  transform-origin: center;
  transform: scale(0.8);
}

.tag-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.tag-move {
  transition: transform 0.3s ease;
}

// Dropdown animations

.dropdown-menu-enter-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: top center;
}

.dropdown-menu-leave-active {
  transition: opacity 0.15s ease-out !important;
  transform: none !important;
}

.dropdown-menu-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.96);
}

.dropdown-menu-leave-to {
  opacity: 0;
  transform: none;
}

// Essential styles for dropdown functionality
.app-dropdown__option {
  &.is-hovered {
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    transform: scale(0.995);
    background-color: var(--primary-color-sidebars-bg);
  }

  &.is-selected {
    transform: scale(1);
    background-color: var(--primary-color-sidebars-bg);

    span {
      color: var(--primary-color);
    }
  }

  &.is-new {
    background-color: #fef3c7;
    border-left: 3px solid #f59e0b;

    &:hover {
      background-color: #fde68a;
    }
  }
}

// Loading spinner styles
.app-dropdown__spinner-small {
  width: 5em;
  height: 5em;
  border: 0.9em solid #e5e7eb;
  border-top: 0.9em solid var(--primary-color, #d15b2c);
  border-radius: 50%;
  animation: spin 1.1s linear infinite;
  font-size: 5px;
  text-indent: -9999em;
  overflow: hidden;
  box-sizing: border-box;
  transition: opacity 0.1s linear;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// Scrollbar styles for options and tags
.app-dropdown__options {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
}

.app-dropdown__tags-container {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &.no-scrollbar {
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

// Search input styles
.app-dropdown__search-input {
  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    background: #ffffff;
    transition: all 0.2s;
  }
}

// Menu border styles
.app-dropdown__menu-border {
  &.is-top {
    box-shadow:
      0 -10px 15px -3px rgba(0, 0, 0, 0.1),
      0 -4px 6px -2px rgba(0, 0, 0, 0.05);
  }
}

// Error field styles
.app-dropdown.errorfield {
  .app-dropdown__trigger {
    border-color: var(--primary-color) !important;
    transition: all 0.5s ease !important;

    &.is-disabled {
      background-color: #f9fafb;
      border-color: #e5e7eb !important;
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
}

// Focus styles for accessibility
.app-dropdown__option:focus-visible {
  outline: 2px solid #9ca3af;
  outline-offset: -2px;
}
</style>
