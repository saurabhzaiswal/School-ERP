<template>
  <div class="flex flex-col items-center gap-1 empty-table">
    <div class="img_wrapper empty-table__image-wrap">
      <!-- <img src="/img/no-table-data.svg" alt="" class="empty-table__illustration" /> -->
      <img src="../assets/img/table/emptybox.svg" class="w-[180px] empty-table__image" alt="" />
    </div>
    <div class="font-bold text-center text-xl mt-4 empty-table__message">
      Opps, nothing to show right now.
    </div>
    <!-- <div class="font-medium text-center text-base mt-1" v-if="subtitle != ''">
      Look like there is no data right now. Start creating {{ subtitle }} to see here.
    </div> -->
  </div>
</template>
<script>
export default {
  props: {
    subtitle: {
      type: String,
      default: ''
    }
  }
}
</script>
<style scoped lang="scss">
.img_wrapper {
  margin-top: 7rem;
}
</style>
