<template>
  <div class="pt-2 pb-2 flex flex-col justify-start items-start gap-2 radio-container app-radio">
    <label
      class="ios-radio items-center! justify-center! mr-auto w-full! app-radio__label"
      :for="id || uniqueId"
    >
      <input
        type="radio"
        :id="id || uniqueId"
        :checked="modelValue"
        :disabled="disabled"
        @change="handleChange"
        :class="customClass"
      />
      <div
        class="radio-wrapper"
        :style="{ backgroundColor: disabled ? '#F8FBFF' : '' }"
        :class="customClass"
      >
        <div class="radio-bg" :style="{ borderColor: disabled ? '#F8FBFF' : '' }"></div>
        <svg fill="none" viewBox="0 0 24 24" class="radio-icon">
          <path
            stroke-linejoin="round"
            stroke-linecap="round"
            stroke-width="3"
            stroke="#ffffff"
            d="M4 12L10 18L20 6"
            class="radio-path"
          ></path>
        </svg>
      </div>
      <slot name="label"></slot>
    </label>
  </div>
</template>

<script>
export default {
  name: 'AppRadio',
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
    }
  },
  emits: ['update:modelValue', 'input', 'change'],
  data() {
    return {
      uniqueId: `radio-${Math.random().toString(36).substr(2, 9)}`
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
.radio-container {
  display: flex;
  gap: 20px;
}

.ios-radio {
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

.ios-radio input {
  display: none;
}

.radio-wrapper {
  position: relative;
  min-width: var(--checkbox-size);
  min-height: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: 4px;
  transition: transform 0.2s ease;
  background: #ffffff;
}

.radio-bg {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  border: 1px solid var(--fade-border-color);
  background: transparent;
  transition: all 0.2s ease;
}

.radio-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 80%;
  height: 80%;
  color: white;
  transform: scale(0);
  transition: all 0.2s ease;
}

.radio-path {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  transition: stroke-dashoffset 0.3s ease 0.1s;
}

/* Checked State */
.ios-radio input:checked + .radio-wrapper .radio-bg {
  background: var(--primary-color);
  border-color: var(--primary-color);
  transform: translate(0px, 0px);
}

.ios-radio input:checked + .radio-wrapper .radio-icon {
  transform: scale(0.85);
}

.ios-radio input:checked + .radio-wrapper .radio-path {
  stroke-dashoffset: 0;
}

/* Hover Effects */
.ios-radio:hover .radio-wrapper {
  // transform: scale(1.05);
}

/* Active Animation */
.ios-radio:active .radio-wrapper {
  // transform: scale(0.95);
}

/* Focus Styles */
.ios-radio input:focus + .radio-wrapper .radio-bg {
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

.ios-radio input:checked + .radio-wrapper {
  // animation: bounce 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
