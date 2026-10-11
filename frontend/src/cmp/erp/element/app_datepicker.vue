<script>
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import moment from 'moment'

export default {
  name: 'AppDatePicker',
  components: { VueDatePicker },
  props: {
    modelValue: { type: [String, Date], default: '' },
    disabled: Boolean,
    required: Boolean,
    minDate: { type: [String, Date], default: null },
    maxDate: { type: [String, Date], default: null },
    placeholder: { type: String, default: 'Select date' },
  },
  emits: ['update:modelValue'],
  computed: {
    selectedDate() {
      if (!this.modelValue) return null
      const date = moment(this.modelValue, 'YYYY-MM-DD', true)
      return date.isValid() ? date.toDate() : null
    },
  },
  methods: {
    onDateChange(value) {
      this.$emit('update:modelValue', value ? moment(value).format('YYYY-MM-DD') : '')
    },
  },
}
</script>
<template>
  <VueDatePicker
    :model-value="selectedDate"
    :enable-time-picker="false"
    :auto-apply="true"
    :clearable="!required"
    :disabled="disabled"
    :min-date="minDate"
    :max-date="maxDate"
    :placeholder="placeholder"
    format="dd-MM-yyyy"
    input-class-name="erp-date-input"
    :aria-label="placeholder"
    @update:model-value="onDateChange"
  />
</template>
<style lang="scss">
.erp-date-input { min-height: 47px; border: 1px solid var(--fade-border-color); border-radius: 9px; background: #fff; color: #17313b; font-family: inherit; }
.erp-date-input:focus { border-color: #2b837d; box-shadow: 0 0 0 3px #d8eeea; }
.dp__theme_light { --dp-font-family: 'Segoe UI', Arial, sans-serif; --dp-primary-color: #176a68; --dp-border-color: #cbd8d4; }
</style>
