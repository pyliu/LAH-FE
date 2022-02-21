<template lang="pug">
b-card
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="!footer"
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="$fetch",
        title="重新讀取"
      )
      lah-button(
        icon="external-link-alt",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="popupMessages('subject', 'test system imp state', 7)",
        title="讀取7天內訊息"
      )
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="showModalById(modalId)",
        title="說明"
      )
    lah-help-modal(:modal-id="modalId", :modal-title="`${header} 監控說明`")
      ul
        li 顯示測試資料庫匯入狀態
        li 每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示{{ queryDays }}天內未獲得完整郵件清單
      div 🔴 表示最新郵件找到「No dump file」字串
  slot
  .center(v-if="headMessages.length === 0") ⚠ {{ queryDays }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages" :key="`head_${idx}`")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 {{ subjectLight(item) }}
      a.truncate(
        href="#",
        @click="popupExtractMessage(item)",
        title="顯示詳細記錄"
        :class="subjectCss(item)"
      ) {{ item.subject }}
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.tsToAdDateStr(item.timestamp, true)",
        :variant="isToday(item.timestamp) ? 'success' : 'muted'"
      ) {{ $utils.formatDistanceToNow(item.timestamp * 1000) }}
    .truncate.text-muted.small {{ itemMessage(item) }}
  template(#footer, v-if="footer"): client-only: .d-flex.justify-content-between.small.text-muted
    lah-countdown-button.border-0(
      size="sm",
      ref="countdown",
      icon="sync-alt",
      action="ld-cycle",
      auto-start,
      title="立即重新讀取",
      variant="outline-secondary",
      badge-variant="secondary",
      :milliseconds="reloadMs",
      :disabled="isBusy",
      :busy="isBusy",
      @end="$fetch",
      @click="$fetch"
    )
    lah-fa-icon.my-auto.text-nowrap(icon="clock", title="更新時間") {{ updated }}
</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  name: 'LahMonitorBoardTestdb',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '測試資料庫匯入作業',
    modalId: 'tmp-id'
  }),
  fetch () {
    this.load('subject', 'test system imp state', this.queryDays).then((data) => {
      // successful loaded
    }).catch((err) => {
      this.$utils.warn(err)
    }).finally(() => {
      // set auto reloading timeout
      if (this.$refs.countdown) {
        this.$refs.countdown.setCountdown(this.reloadMs)
        this.$refs.countdown.startCountdown()
      } else {
        this.timeout(() => this.$fetch(), this.reloadMs)
      }
    })
  },
  computed: {
    queryDays () {
      // testdb import will not execute on weenend
      return this.isMonday ? 4 : 3
    },
    todayNoDBImportMessage () {
      return `${this.today} 無測試 DB 匯入資訊`
    },
    headMessages () {
      const filtered = this.messages.filter((item, idx, arr) => idx < 3)
      const ts = +new Date() / 1000
      if (filtered[0] && ts - filtered[0].timestamp > 24 * 60 * 60) {
        // insert dummy item to indicate danger
        filtered.unshift({
          subject: this.todayNoDBImportMessage,
          message: '...',
          timestamp: filtered[0].timestamp + 24 * 60 * 60
        })
      }
      return filtered
    },
    headMessage () {
      return this.headMessages[0]
    },
    light () {
      if (this.headMessages.length === 0) {
        this.$emit('warning', `${this.header}找不到紀錄郵件!`)
        return 'warning'
      }
      if (this.headMessage.subject === this.todayNoDBImportMessage) {
        if (this.isMonday) {
          this.$emit('warning', `${this.header}，週日無備份檔，所以無還原。`)
          return 'warning'
        }
        this.$emit('danger', `${this.header}找不到今日匯入紀錄的郵件!`)
        return 'danger'
      }
      const now = +new Date()
      const ts = this.isMonday ? 4 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
      if ((now - this.headMessages[0].timestamp * 1000) > ts) {
        this.$emit('danger', this.headMessages[0])
        return 'danger'
      }
      const expectStr = 'No dump file'
      const regex = new RegExp(expectStr, 'gm')
      const matched = [...this.itemMessage(this.headMessages[0]).matchAll(regex)].join('')
      if (matched.length > 0) {
        this.$emit('danger', this.headMessages[0])
        return 'danger'
      }
      return 'success'
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
  },
  methods: {
    subjectLight (item) {
      const list = this.subjectCss(item)
      if (list.includes('text-danger')) {
        return '🔴'
      }
      if (list.includes('text-warning')) {
        return '🟡'
      }
      return '🟢'
    },
    subjectCss (item) {
      if (item.subject === this.todayNoDBImportMessage) {
        if (this.isMonday) {
          return ['text-warning']
        }
        return ['text-danger']
      }
      // parsing message for the successful text
      const message = this.itemMessage(item)
      const expectStr = 'No dump file'
      const regex = new RegExp(expectStr, 'gm')
      const matched = [...message.matchAll(regex)].join('')
      if (matched.length > 0) {
        return ['text-danger']
      }
      return []
    },
    popupExtractMessage (item) {
      this.modal(this.itemMessage(item).replaceAll('\n', '<br/>'), {
        title: `${this.header} - ${item.subject}`,
        size: 'md',
        html: true
      })
    },
    itemMessage (item) {
      if (item) {
        // const dateParts = new Date(item.timestamp * 1000).toString().split(' ')
        // e.g. "Wed Jan 12"
        // const search = `${dateParts[0]} ${dateParts[1]} ${dateParts[2] - 0}`
        // find yesterday dump date
        const search = `DATE=${this.$utils.toADDate(item.timestamp * 1000 - 24 * 60 * 60 * 1000, 'yyLLdd')}`
        const lastIdx = item.message.lastIndexOf(search)
        if (lastIdx !== -1) {
          return item.message.substring(lastIdx)
        } else {
          return `找不到 ${search} 日期標示`
        }
      }
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
