<template lang="pug">
  b-card.hist-card.mb-2(no-body)
    .d-flex.mb-1.mx-auto
      lah-button.mr-1(icon="copy" variant="outline-secondary" @click="trigger('copy')" title="複製本篇內容到新增欄位") 複製
      lah-button(icon="times" variant="outline-danger" @click="trigger('remove')" title="刪除本篇內容") 移除
    lah-notification-message.mx-auto(
      :data-json="{ id: '#', ...memento }"
    )
  //- b-card.hist-card.mb-2(no-body)
  //-   .d-flex.mb-1.mx-auto
  //-     lah-button.mr-1(icon="caret-up" action="move-fade-btt" variant="outline-primary" @click="trigger('copy')" v-b-tooltip.left="'複製本內容到編輯區塊'") 複製
  //-     lah-button(icon="times" action="clock" variant="outline-danger" @click="trigger('remove')" v-b-tooltip.right="'從全部頻道中本內容'") 移除

  //-   .badge-container.mx-auto: lah-button.float-left.mb-1.mr-1.border-dashed(
  //-     v-for="added in memento.added_to"
  //-     :key="`${added.channel}-${added.addedId}`"
  //-     v-b-tooltip="`自 ${addedText(added.channel)} 頻道移除`"
  //-     icon="times"
  //-     variant="outline-danger"
  //-     size="sm"
  //-     @click="trigger('badge', added)"
  //-   ) {{ addedText(added.channel) }}

  //-   lah-notification-announcement-card.mx-auto(
  //-     :data-json="{ id: '#', ...memento }"
  //-   )
</template>

<script>
export default {
  props: {
    memento: { type: Object, required: true }
  }
}
</script>

<style lang="scss" scoped>
.hist-card {
  margin-bottom: 1rem;
  border: 0;
  padding: 5px;
}
.hist-card:hover {
  border-color:gray;
  border-style: dotted;
  border-width: 5px;
}
</style>
