<template lang="pug">
  b-card.hist-card.mb-2(no-body)
    .d-flex.mb-1.mx-auto
      lah-button.mr-1(icon="caret-up" action="move-fade-btt" variant="outline-primary" @click="trigger('copy')" v-b-tooltip.left="'複製本內容到編輯區塊'") 複製
      lah-button(icon="times" action="clock" variant="outline-danger" @click="trigger('remove')" v-b-tooltip.right="'從全部頻道中本內容'") 移除

    .badge-container.mx-auto: lah-button.float-left.mb-1.mr-1.border-dashed(
      v-for="added in memento.added_to"
      :key="`${added.channel}-${added.addedId}`"
      v-b-tooltip="`自 ${addedText(added.channel)} 頻道移除`"
      icon="times"
      variant="outline-danger"
      size="sm"
      @click="trigger('badge', added)"
    ) {{ addedText(added.channel) }}

    lah-notification-announcement-card.mx-auto(
      :data-json="{ id: '#', ...memento }"
    )
</template>

<script>
export default {
  props: {
    memento: { type: Object, required: true }
  },
  methods: {
    addedText (val) {
      switch (val) {
        case 'reg': return '登記課'
        case 'sur': return '測量課'
        case 'adm': return '行政課'
        case 'val': return '地價課'
        case 'inf': return '資訊課'
        case 'all': return '全所'
        case 'supervisor': return '主任祕書室'
        case 'hr': return '人事室'
        case 'acc': return '會計室'
        default: return '我自己'
      }
    }
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
.hist-card .card, .badge-container {
  width: 400px;
}
.border-dashed {
  border-style: dashed;
}
</style>
