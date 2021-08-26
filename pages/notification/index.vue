<template lang="pug">
  div
    lah-header: lah-transition(appear): .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 公告訊息發布管理
        lah-button(icon="question" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'"): ul
          li 支援 Markdown 語法，請參考 https://bit.ly/mdcheat 教學
      .d-flex

    b-card-group(deck)

      b-card(ref="addCard")
        b-card-title.d-flex.justify-content-between
          div 新增公告
          lah-button(icon="question" variant="outline-success" v-b-toggle.md-desc :pressed="helpSidebarFlag" pill) 內容語法說明
        b-form-group.mb-1
          template(#label): div
            h5 發布對象 #[lah-fa-icon.ml-1(:icon="validSendto ? 'check' : 'exclamation-circle'" :variant="validSendto ? 'success' : 'danger'" :action="validSendto ? '' : 'breath'")]
          b-form-checkbox-group(
            v-model="announcementSendto"
            :options="announcementSendtoOpts"
          )
        hr
        b-input-group.mb-1(size="sm" prepend="　　標題")
          b-input(v-model="announcementDataJson.title" :state="validTitle" placeholder="必要欄位")
        b-input-group.mb-1(size="sm" prepend="緊急程度")
          b-select(v-model="announcementDataJson.priority" :options="announcementPriorityOpts")
        b-input-group.mb-1(size="sm" prepend="　　內容")
          b-textarea(
            v-model="announcementDataJson.content"
            rows="5"
            max-rows="15"
            placeholder="... 支援 Markdown 語法 ... "
            :state="validContent"
          )
        .center: lah-button(icon="paper-plane" variant="outline-primary" :disabled="sendButtonDisabled" @click="add") 送出

      b-card
        b-card-title 即時預覽
        h6(style="margin-left: 15px;") 發布對象：#[b-badge.mx-1(v-for="(to, idx) in sendto" :variant="sendtoVariant(to)" pill :key="`b-badge-${idx}`") #[strong.s-105 {{ to }}]]
        lah-notification-announcement-card(
          :data-json="announcementDataJson"
        )

    b-card-title.my-3 歷史資料
    hr
    b-card-group(columns)
      b-card.border-0(no-body v-for="(snapshot, idx) in reverseMemento" :key="`hist_${idx}`")
        lah-button(icon="copy" variant="outline-secondary" @click="copy(snapshot)" title="複製本篇內容到新增欄位") 複製
        lah-notification-announcement-card(
          :data-json="{ id: idx+1, ...snapshot }"
        )

    b-sidebar(
      id="md-desc"
      v-model="helpSidebarFlag"
      title="簡易排版語法說明"
      right
      shadow
    )
      b-card
        | #[b 標題]#[br]
        | 語法(共支援五層標題)：#[br]
        | #[b.text-primary # 第一標題]#[br]
        | #[b.text-primary ## 第二標題]
        | #[hr]
        | #[b 引言]#[br]
        | 語法：#[i #[b.text-primary > 「我思，故我在。」]]
        | #[hr]
        | #[b 分隔線]#[br]
        | 語法： #[b.text-primary ---]
        | #[hr]
        | #[b 超連結]#[br]
        | 語法：#[br]
        | <b class="text-primary">[知識網](http://220.1.34.18:8888/)</b>
        | #[hr]
        | #[b 編號項目符號]#[br]
        | 語法：#[br]
        | #[b.text-primary -] 康德#[br]
        | #[b.text-primary 1.] 笛卡爾#[br]
        | #[b.text-primary 2.] 蘇格拉底#[br]
        | 可使用「 * 」 取代這裡的「 - 」，或是使用數字加上「 . 」
        | #[hr]
        | #[b 斜體與粗體]#[br]
        | 粗體語法： #[b.text-primary **我是粗體**]#[br]
        | 斜體語法： #[b.text-primary *我是斜體*]#[br]
        | #[hr]
        | 其他詳細 Markdown 語法，請參考 https://bit.ly/mdcheat 教學
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
      content: `##### **\`我是主題\`**
一般說明打在這邊....

- 項目一
- 項目二

... 可打上其他說明於此 ...`,
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
    announcementSendto: [],
    announcementSendtoOpts: [
      { value: 'all', text: '全所' },
      { value: 'supervisor', text: '主任秘書室' },
      { value: 'hr', text: '人事室' },
      { value: 'acc', text: '會計室' },
      { value: 'adm', text: '行政課' },
      { value: 'reg', text: '登記課' },
      { value: 'sur', text: '測量課' },
      { value: 'val', text: '地價課' },
      { value: 'inf', text: '資訊課' }
    ],
    helpSidebarFlag: false,
    cacheKey: 'postMementoCache',
    memento: [],
    mementoCount: 6
  }),
  head: {
    title: '公告訊息發布管理'
  },
  computed: {
    validTitle () {
      return !this.$utils.empty(this.announcementDataJson.title) && this.announcementDataJson.title.length < 21
    },
    validContent () {
      return !this.$utils.empty(this.announcementDataJson.content)
    },
    validSendto () {
      return this.announcementSendto.length > 0
    },
    sendButtonDisabled () {
      return !this.validContent || !this.validTitle || !this.validSendto
    },
    sendto () {
      const sendto = []
      this.announcementSendto.forEach((selected) => {
        const found = this.announcementSendtoOpts.find((item) => {
          return item.value === selected
        })
        found && sendto.push(found.text)
      })
      return sendto
    },
    reverseMemento () {
      return this.memento.slice().reverse()
    }
  },
  watch: {
  },
  created () {
  },
  async mounted () {
    this.announcementDataJson.create_datetime = this.currentDatetime()
    const cached = await this.getCache(this.cacheKey)
    cached && (this.memento = [...cached])
    if (this.memento.length > this.mementoCount) {
      this.memento.splice(0, this.memento.length - this.mementoCount)
    }
  },
  methods: {
    addMemento (snapshot) {
      this.memento.push(snapshot)
      if (this.memento.length > this.mementoCount) {
        this.memento.splice(0, 1)
      }
      this.setCache(this.cacheKey, this.memento)
    },
    currentDatetime () {
      const m = new Date()
      return m.getFullYear() + '-' + (m.getMonth() + 1).toString().padStart(2, '0') + '-' + m.getDate().toString().padStart(2, '0') + ' ' + m.getHours().toString().padStart(2, '0') + ':' + m.getMinutes().toString().padStart(2, '0') + ':' + m.getSeconds().toString().padStart(2, '0')
    },
    copy (snapshot) {
      this.announcementDataJson = { ...this.announcementDataJson, ...snapshot }
      this.announcementSendto = [...snapshot.channels]
      this.$refs.addCard.scrollIntoView()
      setTimeout(() => this.attention(this.$refs.addCard), 400)
    },
    add () {
      this.confirm('確定要新增公告?').then((flag) => {
        if (flag) {
          this.isBusy = true
          const snapshot = {
            channels: this.announcementSendto,
            from_ip: this.ip,
            title: this.announcementDataJson.title,
            content: this.announcementDataJson.content,
            priority: this.announcementDataJson.priority,
            sender: this.user.id || this.ip,
            create_datetime: this.currentDatetime()
          }
          this.$axios.post(this.$consts.API.JSON.NOTIFICATION, {
            type: 'add_notification',
            ...snapshot
          }).then(({ data }) => {
            this.notify(data.message, { type: data.status > 0 ? 'success' : 'warning' })
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.addMemento(snapshot)
            this.reset()
          })
        }
      })
    },
    reset () {
      this.announcementDataJson = {
        ...{
          title: '',
          content: '',
          priority: 3,
          sender: '',
          id: '?',
          create_datetime: this.currentDatetime()
        }
      }
      this.announcementSendto = [...[]]
    },
    sendtoVariant (to) {
      switch (to) {
        case '全所':
          return 'danger'
        default:
          return 'success'
      }
    }
  }
}
</script>

<style scoped lang="scss">
.block {
  max-width: calc(32.5%);
}
</style>
