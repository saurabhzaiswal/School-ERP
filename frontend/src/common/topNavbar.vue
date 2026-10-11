<script>
export default { name: 'TopNavbar', props: { user: { type: Object, required: true }, title: { type: String, default: 'Workspace' } }, emits: ['profile'] }
</script>
<template>
  <div class="hidden lg:flex items-center justify-between border-b border-[#e1eae6] pb-4 mb-6 text-xs text-[#71888c]"><span>School ERP / {{ title }}</span><button type="button" class="font-semibold text-[#315d60] hover:text-[#176a68]" @click="$emit('profile')">{{ user.name }} · {{ user.role === 'ADMIN' ? 'Administrator' : 'Teacher' }}</button></div>
</template>
