<template lang="pug">
  b-card.hist-card(no-body)
    b-button-group.mb-1
      lah-button.mr-1(icon="caret-up" action="move-fade-btt" variant="outline-secondary" @click="trigger('copy')" title="複製本篇內容到新增欄位") 複製
      lah-button(icon="times" action="clock" variant="outline-danger" @click="trigger('remove')" title="刪除本篇內容") 移除
    lah-notification-message(:data-json="{ id: '#', ...memento }")
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
  text-align: center;
}
.hist-card:hover {
  border-color:gray;
  border-style: dashed;
  border-width: 5px;
}
</style>
