<script>
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/vue-tel-input.css'
export default {
  name: 'AppPhoneNumber',
  components: { VueTelInput },
  props: { modelValue: { type: String, default: '' }, disabled: Boolean, placeholder: { type: String, default: 'Enter phone number' }, preferredCountries: { type: Array, default: () => ['IN'] } },
  emits: ['update:modelValue'],
}
</script>
<template>
  <VueTelInput :model-value="modelValue" mode="international" default-country="IN" :disabled="disabled" :placeholder="placeholder" :preferred-countries="preferredCountries" @update:model-value="$emit('update:modelValue', $event)" />
</template>
