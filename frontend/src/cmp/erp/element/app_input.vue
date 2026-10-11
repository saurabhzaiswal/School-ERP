<template>
  <div class="app-input relative" v-bind="$attrs">
    <input
      :id="uniqueId"
      :type="inputType"
      :ref="uniqueId"
      :value="modelValue"
      @input="updateValue"
      @keydown="handleKeydown"
      @keypress="handleKeypress"
      class="app-input__input p-4! text-base!"
      :class="[inputClasses, inputClass]"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :autocomplete="autocomplete"
      :inputmode="inputmode"
      :name="name"
      :maxlength="maxlength || undefined"
      :minlength="minlength || undefined"
      :pattern="pattern || undefined"
      :title="pattern ? 'Please enter a valid format' : undefined"
      :aria-label="ariaLabel"
      :aria-describedby="ariaDescribedby"
      @invalid="handleInvalid"
      :data-validate="false"
      @blur="handleBlur"
      @focus="handleFocus"
      @keydown.enter.exact="handleEnter"
    />
    <div
      v-if="iconText !== ''"
      class="absolute right-4 top-0 bottom-0 flex items-center justify-center app-input__icon"
    >
      <slot name="icon">
        <div class="text-sm app-input__icon-text">{{ iconText }}</div>
      </slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppInput',

  emits: ['update:modelValue', 'blur', 'focus', 'input', 'enter', 'invalid'],
  data: () => ({
    uniqueId: `input-${Math.random().toString(36).substring(2, 9)}`,
    isTyping: false,
    typingTimeout: null
  }),
  props: {
    modelValue: {
      type: [String, Number, null],
      default: ''
    },
    inputType: {
      type: String,
      default: 'text',
      validator: (value) =>
        ['text', 'email', 'password', 'number', 'tel', 'url', 'search'].includes(value)
    },
    inputmode: {
      type: String,
      default: 'text',
      validator: (value) =>
        ['none', 'text', 'tel', 'url', 'email', 'numeric', 'decimal', 'search'].includes(value)
    },
    preventSpaces: {
      type: Boolean,
      default: false
    },
    numbersOnly: {
      type: Boolean,
      default: false
    },
    allowDecimals: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    },
    disabled: {
      type: Boolean,
      default: false
    },
    readonly: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },

    autocomplete: {
      type: String,
      default: 'off'
    },
    name: {
      type: String,
      default: ''
    },
    maxlength: {
      type: [String, Number],
      default: null
    },
    minlength: {
      type: [String, Number],
      default: null
    },
    pattern: {
      type: String,
      default: ''
    },
    ariaLabel: {
      type: String,
      default: ''
    },
    ariaDescribedby: {
      type: String,
      default: ''
    },
    inputClass: {
      type: String,
      default: ''
    },
    iconText: {
      type: String,
      default: ''
    }
  },
  computed: {
    inputClasses() {
      return {
        'is-disabled': this.disabled,
        'is-readonly': this.readonly,
        'has-icon': this.icon,
        'is-loading': this.loading,
        'pr-6!': this.iconText !== ''
      }
    }
  },
  methods: {
    updateValue(event) {
      if (this.disabled || this.readonly) {
        return
      }
      let value = event.target.value

      if (this.inputType === 'number') {
        value = value === '' ? null : Number(value)
        // console.log('value', value)
      }
      // console.log(this.inputType, value)

      this.$emit('update:modelValue', value)
      this.$emit('input', value)

      // this.$emit('update:modelValue', event.target.value)
      // this.$emit('input', event)

      // Reset typing state after a short delay
    },

    handleInvalid(event) {
      this.$emit('invalid', event)
    },
    handleKeydown(event) {
      // Prevent spaces if preventSpaces is true
      if (this.preventSpaces && event.key === ' ') {
        event.preventDefault()
      }
    },
    handleKeypress(event) {
      // Only allow numbers if numbersOnly is true
      if (this.numbersOnly) {
        const char = String.fromCharCode(event.which)
        let pattern = /[0-9]/

        // Allow decimal point if allowDecimals is true
        if (this.allowDecimals && char === '.') {
          // Check if decimal point already exists
          if (this.modelValue && this.modelValue.toString().includes('.')) {
            event.preventDefault()
            return
          }
          pattern = /[0-9.]/
        }

        if (!pattern.test(char)) {
          event.preventDefault()
        }
      }
    },
    handleBlur() {
      this.$emit('blur')
    },
    handleFocus() {
      this.$emit('focus')
    },
    handleEnter(event) {
      this.$emit('enter', event)
    },
    focusInput() {
      if (!this.disabled) {
        this.$nextTick(() => {
          // console.log('focusing', this.$refs[this.uniqueId])
          this.$refs[this.uniqueId]?.focus()
        })
      }
    }
  },
  watch: {
    modelValue(value) {
      if (this.inputType === 'email') {
        // console.log("modelValue", value);
        const lowerCaseValue = value.toLowerCase()
        this.$emit('update:modelValue', lowerCaseValue)
        this.$emit('input', lowerCaseValue)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.app-input {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  // min-height: 40px;

  &__input {
    width: 100%;
    height: 50px;
    padding: 18px 12px;
    border: 1px solid var(--fade-border-color, #cbd8d4);
    border-radius: 5px;
    background-color: #ffffff;
    font-size: 14px;
    line-height: 1.5;
    color: var(--primary-text-color, #17313b);
    transition: all 0.2s ease-in-out;
    outline: none;

    &::placeholder {
      color: #636363;
      font-size: 14px;
      // opacity: 0.7;
    }

    &:hover:not(:disabled):not(:read-only) {
      border-color: #9ca3af;
    }

    &:focus {
      border-color: #2b837d;
      box-shadow: 0 0 0 3px #d8eeea;
    }

    &:disabled {
      background-color: #f9fafb;
      border-color: #e5e7eb;
      color: var(--primary-text-color);
      cursor: not-allowed;
    }

    &:read-only {
      background-color: #f9fafb;
      cursor: default;
    }
  }

  // States - now applied directly to input
  &__input {
    &.is-focused {
      border-color: #bcbcbc;
      // box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    &.is-disabled {
      // background-color: #f9fafb;
      background-color: transparent;
      // border-color: #e5e7eb;
      color: #6b7280;
      // cursor: not-allowed;
      cursor: default;
      &:hover {
        border-color: #d1d5db !important;
      }
      user-select: none !important;
    }

    &.is-readonly {
      background-color: transparent;
      cursor: default;
      &:hover {
        border-color: #d1d5db !important;
      }
      user-select: none !important;
    }

    &.has-icon {
      padding-right: 40px;
    }

    &.is-loading {
      padding-right: 40px;
    }
  }
}
// Error field styling - matches app_dropdown pattern
.app-input.errorfield {
  .app-input__input {
    border-color: var(--primary-color, #dc2626) !important;
    transition: all 0.5s ease !important;
  }
}

// Direct error field styling for input
.app-input__input.errorfield {
  border-color: var(--primary-color, #dc2626) !important;
  transition: all 0.5s ease !important;
}
</style>
