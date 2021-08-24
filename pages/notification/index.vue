<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 公告訊息發佈管理
        lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ul
          li 支援 Markdown 語法，請參考 https://bit.ly/mdcheat 教學
      .d-flex
    b-card-group(columns)
      b-card
        b-card-title 輸入欄位
        b-input-group.mb-1(size="sm" prepend="　　標題")
          b-input(v-model="announcementDataJson.title" :state="validTitle" placeholder="必要欄位")
        b-input-group.mb-1(size="sm" prepend="緊急程度")
          b-select(v-model="announcementDataJson.priority" :options="announcementPriorityOpts")
        b-input-group.mb-1(size="sm" prepend="　　內文")
          b-textarea(
            v-model="announcementDataJson.content"
            rows="5"
            max-rows="15"
            placeholder="... 支援 Markdown 語法 ... "
            :state="validContent"
          )
        .d-flex.justify-content-between
          lah-button(icon="paper-plane" variant="outline-primary" :disabled="!validContent || !validTitle") 送出
          lah-button(icon="question" variant="outline-success" v-b-toggle.md-desc :pressed="sidebarFlag" pill) 語法說明
      b-card
        b-card-title 預覽
        lah-notification-announcement-card(
          :data-json="announcementDataJson"
        )
    b-sidebar(
      id="md-desc"
      v-model="sidebarFlag"
      title="簡易排版語法說明"
      right
      shadow
    )
      b-card
        | #[b 標題]#[br]
        | 每一個 # 代表一層標題，總共支援五層標題：#[br]
        | # 第一標題#[br]
        | ## 第二標題
        | #[hr]
        | #[b 引言]#[br]
        | 語法：#[i #[b > 「我思，故我在。」]]
        | #[hr]
        | #[b 分隔線]#[br]
        | 語法： #[b ---]
        | #[hr]
        | #[b 超連結]#[br]
        | 語法：[知識網](http://220.1.34.18:8888/)
        | #[hr]
        | #[b 編號項目符號]#[br]
        | 語法：#[br]
        | - 康德#[br]
        | 1. 笛卡爾#[br]
        | 2. 蘇格拉底#[br]
        | 可使用「 * 」 取代這裡的「 - 」，或是使用數字加上「 . 」
        | #[hr]
        | #[b 斜體與粗體]#[br]
        | 粗體語法： **我是粗體**#[br]
        | 斜體語法： *我是斜體*#[br]
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
      id: '?',
      create_datetime: '2021-08-24 20:23:00'
    },
    announcementPriorityOpts: [
      { text: '最高', value: 0 },
      { text: '高', value: 1 },
      { text: '中', value: 2 },
      { text: '正常', value: 3 }
    ],
    sidebarFlag: true
  }),
  head: {
    title: '訊息發佈管理'
  },
  computed: {
    validTitle () {
      return !this.$utils.empty(this.announcementDataJson.title)
    },
    validContent () {
      return !this.$utils.empty(this.announcementDataJson.content)
    }
  },
  watch: {
  },
  created () {
  },
  mounted () {
    const m = new Date()
    const dateString = m.getUTCFullYear() + '/' + (m.getUTCMonth() + 1) + '/' + m.getUTCDate() + ' ' + m.getUTCHours() + ':' + m.getUTCMinutes() + ':' + m.getUTCSeconds()
    this.announcementDataJson.create_datetime = dateString
  },
  methods: {
  }
}
</script>

<style scoped lang="scss"></style>
