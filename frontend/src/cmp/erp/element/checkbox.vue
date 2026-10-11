<template>
  <div
    class="pt-2 pb-2 flex flex-col justify-start items-start gap-2 checkbox-container app-checkbox"
  >
    <label
      class="ios-checkbox items-center! justify-center! mr-auto app-checkbox__label"
      :class="[labelClass]"
      :for="id || uniqueId"
    >
      <input
        type="checkbox"
        :id="id || uniqueId"
        :checked="modelValue"
        :disabled="disabled"
        @change="handleChange"
        :class="[customClass]"
      />
      <div
        class="checkbox-wrapper"
        :style="{ backgroundColor: disabled ? '#F8FBFF' : '' }"
        :class="[customClass, disabled ? 'opacity-70 !cursor-not-allowed' : '']"
      >
        <div class="checkbox-bg" :style="{ borderColor: disabled ? '#F8FBFF' : '' }"></div>
        <svg fill="none" viewBox="0 0 24 24" class="checkbox-icon">
          <path
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke-width="3"
            stroke="#ffffff"
            d="M4 12L10 18L20 6"
            class="check-path"
          ></path>
        </svg>
      </div>
      <slot name="label"></slot>
    </label>
  </div>
</template>

<script>
export default {
  name: 'Checkbox',
  props: {
    id: {
      type: String,
      default: ''
    },
    form: {
      type: Object,
      default: {}
    },
    modelValue: {
      type: Boolean,
      default: false
    },
    validate: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    customClass: {
      type: String,
      default: ''
    },
    labelClass: {
      type: String,
      default: 'w-full!'
    }
  },
  emits: ['update:modelValue', 'input', 'change'],
  data() {
    return {
      uniqueId: `checkbox-${Math.random().toString(36).substr(2, 9)}`
    }
  },
  mounted() {},
  methods: {
    handleChange(event) {
      if (this.disabled) {
        return
      }
      this.$emit('update:modelValue', event.target.checked)
      this.$emit('change', event.target.checked)
    }
  }
}
</script>

<style scoped lang="scss">
.checkbox-container {
  display: flex;
  gap: 20px;
}

.ios-checkbox {
  --checkbox-size: 20px;

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.ios-checkbox input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}

.checkbox-wrapper {
  position: relative;
  min-width: var(--checkbox-size);
  min-height: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: 4px;
  transition: transform 0.2s ease;
  background: #ffffff;
}

.checkbox-bg {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  border: 1px solid var(--fade-border-color) !important;
  background: transparent;
  transition: all 0.2s ease;
}

.checkbox-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 80%;
  height: 80%;
  color: white;
  transform: scale(0);
  transition: all 0.2s ease;
}

.check-path {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  transition: stroke-dashoffset 0.3s ease 0.1s;
}

/* Checked State */
.ios-checkbox input:checked + .checkbox-wrapper .checkbox-bg {
  background: var(--primary-color);
  border-color: var(--primary-color) !important;
  transform: translate(0px, 0px);
}

.ios-checkbox input:checked + .checkbox-wrapper .checkbox-icon {
  transform: scale(0.85);
}

.ios-checkbox input:checked + .checkbox-wrapper .check-path {
  stroke-dashoffset: 0;
}

/* Hover Effects */
.ios-checkbox:hover .checkbox-wrapper {
  // transform: scale(1.05);
}

/* Active Animation */
.ios-checkbox:active .checkbox-wrapper {
  // transform: scale(0.95);
}

/* Focus Styles */
.ios-checkbox input:focus + .checkbox-wrapper .checkbox-bg {
  box-shadow: 0 0 0 4px #dbeafe;
}

/* Color Themes */

/* Animation */
@keyframes bounce {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

.ios-checkbox input:checked + .checkbox-wrapper {
  // animation: bounce 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
