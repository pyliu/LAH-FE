<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 訊息發佈管理
        lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ul
          li 支援 Markdown 語法，請參考 https://ppt.cc/fVm4Gx 教學
      .d-flex
    b-card-group(deck)
      b-card
        b-card-title 輸入欄位
        b-input-group.mb-1(size="sm" prepend="　　標題")
          b-input(v-model="announcementDataJson.title")
        b-input-group.mb-1(size="sm" prepend="緊急程度")
          b-select(v-model="announcementDataJson.priority" :options="announcementPriorityOpts")
        b-input-group.mb-1(size="sm" prepend="　　內文")
          b-textarea(v-model="announcementDataJson.content" rows="5" placeholder="... 支援 Markdown 語法 ... ")
        lah-button(variant="outline-primary") 儲存
      b-card
        b-card-title 預覽
        lah-notification-announcement-card(
          :data-json="announcementDataJson"
        )
      b-card
        div
          div # 標題 1
          div ## 標題 2
          div ...
          div ###### 標題 6
</template>

<script>
export default {
  asyncData ({ store, redirect, error }) {
    const now = new Date()
    const time = ('0' + now.getHours()).slice(-2) + ':' +
                 ('0' + now.getMinutes()).slice(-2) + ':' +
                 ('0' + now.getSeconds()).slice(-2)
    return {
      list: [
        { type: 'remote', text: '... 準備中 ...', time }
      ]
    }
  },
  data: () => ({
    announcementDataJson: {
      title: '',
      content: '',
      priority: 3,
      sender: '',
      id: '#',
      create_datetime: '2021-08-24 20:23:00'
    },
    announcementPriorityOpts: [
      { text: '最高', value: 0 },
      { text: '高', value: 1 },
      { text: '中', value: 2 },
      { text: '低', value: 3 }
    ]
  }),
  head: {
    title: '訊息發佈管理'
  },
  watch: {
  },
  created () {
  },
  methods: {
  }
}
</script>

<style scoped lang="scss"></style>
