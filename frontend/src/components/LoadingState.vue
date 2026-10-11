<script>
export default {
  name: 'LoadingState',
  props: { message: { type: String, default: 'Loading workspace…' } },
  data() { return { ready: false, player: null, controller: null } },
  async mounted() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    this.controller = new AbortController()
    try {
      const [module, response] = await Promise.all([
        import('lottie-web/build/player/lottie_light.js'),
        fetch('/loading.json', { signal: this.controller.signal }),
      ])
      if (!response.ok || !this.$refs.animation) return
      this.player = module.default.loadAnimation({ container: this.$refs.animation, renderer: 'svg', loop: true, autoplay: true, animationData: await response.json() })
      this.ready = true
    } catch { /* keep the accessible CSS fallback */ }
  },
  beforeUnmount() { this.controller?.abort(); this.player?.destroy() },
}
</script>
<template>
  <div class="grid place-items-center py-10 text-center" role="status" aria-live="polite">
    <div class="relative size-[110px]">
      <div ref="animation" class="size-[110px]" :class="{ 'opacity-0': !ready }" aria-hidden="true"></div>
      <span v-if="!ready" class="loader-ring" aria-hidden="true"></span>
    </div>
    <p class="mt-2 text-sm font-medium text-[#52777a]">{{ message }}</p>
  </div>
</template>
<style scoped lang="scss">.loader-ring { position: absolute; top: 34px; left: 34px; width: 42px; height: 42px; border: 3px solid #d7e9e3; border-top-color: #26776d; border-radius: 50%; animation: spin .8s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } } @media (prefers-reduced-motion: reduce) { .loader-ring { animation: none; } }</style>
