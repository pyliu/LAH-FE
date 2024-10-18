<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
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
        @click="reload",
        :title="`上次更新時間 ${updated}`",
        :disabled="fetchingMonitorMail"
      )
      lah-button(
        icon="external-link-alt",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="popupMessages(fetchType, fetchKeyword, 31)",
        title="讀取31天內訊息"
      )
      lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="說明"
      )
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`")
      ul
        li 顯示測試資料庫匯入狀態
        li 每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示{{ fetchDay }}天內未獲得完整郵件清單，或是找不到上周五匯入的紀錄
      div 🔴 表示最新匯入紀錄找到「No dump file」字串
  slot
  .center(v-if="headMessages.length === 0") ⚠ {{ fetchDay }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages" :key="`head_${idx}`")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 {{ subjectLight(item) }}
      a.truncate(
        href="#",
        @click="popupExtractMessage(item)",
        title="顯示詳細記錄"
        :class="subjectCss(item)"
      ) {{ weekSubject(item) }}
      lah-badge-human-datetime(
        :variant="isToday(item.timestamp) ? 'success' : 'muted'",
        :seconds="item.timestamp"
      )
    .truncate.text-muted.small {{ itemMessage(item) }}
  template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
    ref="footer"
    :reload-ms="reloadMs",
    :busy="isBusy",
    :fetch="$fetch",
    :reload="reload",
    :fetch-state="fetchingState",
    :update-time="updated"
  )
</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base';
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue';

export default {
  name: 'LahMonitorBoardTestdb',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '測試資料庫匯入作業',
    fetchType: 'subject',
    fetchKeyword: 'test db import status',
    fetchDay: 31,
    dates: []
  }),
  computed: {
    recentNoDBImportMessage () {
      return '最近一周無測試DB匯入資訊'
    },
    headMessages () {
      return [
        this.lastFridayMessage,
        this.last2FridayMessage,
        this.last3FridayMessage
      ]
    },
    headMessage () {
      return this.headMessages[0]
        ? this.headMessages[0]
        : {
            subject: this.recentNoDBImportMessage,
            message: '...',
            timestamp: parseInt(+new Date() / 1000)
          }
    },
    light () {
      if (this.headMessages.length === 0) {
        this.$emit('warning', `${this.header}找不到紀錄郵件!`)
        return 'warning'
      }
      // if (this.headMessage.subject === this.recentNoDBImportMessage) {
      //   this.$emit('danger', `${this.header}找不到最近一周匯入紀錄！`)
      //   return 'danger'
      // }
      // the case that the message can not find yesterday "DATE=XXXXXX" string
      if (this.itemMessage(this.headMessage).startsWith('⚠')) {
        return 'warning'
      }
      const now = +new Date()
      // There is no message for over 7 days long, treats it RED
      const ts = 7 * 24 * 60 * 60 * 1000
      if ((now - this.headMessages[0].timestamp * 1000) > ts) {
        this.$emit('danger', this.headMessage)
        return 'danger'
      }
      if (this.detectNoDumpFileString(this.headMessage)) {
        this.$emit('danger', this.headMessage)
        return 'danger'
      }
      return 'success'
    },
    firstDuration () {
      return this.dates.slice(14)
    },
    lastFriday () {
      return this.firstDuration[0]
    },
    lastFridayTs () {
      return +new Date(`20${this.lastFriday?.substring(0, 2)}/${this.lastFriday?.substring(2, 4)}/${this.lastFriday?.substring(4)}`) / 1000
    },
    lastFridayMessage () {
      // the latest message in firstDuration
      const filtered = this.$utils.sortBy(
        this.messages.filter((item, idx, arr) => {
          // console.warn(item)
          return item.timestamp > this.lastFridayTs
        }),
        ['timestamp']
      ).reverse()
      return filtered.length > 0
        ? filtered[0]
        : {
            subject: `${this.lastFriday}後無匯入資訊`,
            message: `${this.lastFriday}後無匯入測試資料庫的資料`,
            timestamp: parseInt(this.lastFridayTs)
          }
    },
    secondDuration () {
      return this.dates.slice(7, 14)
    },
    last2Friday () {
      return this.secondDuration[0]
    },
    last2FridayTs () {
      return +new Date(`20${this.last2Friday?.substring(0, 2)}/${this.last2Friday?.substring(2, 4)}/${this.last2Friday?.substring(4)}`) / 1000
    },
    last2FridayMessage () {
      // the latest message in secondDuration
      const filtered = this.$utils.sortBy(
        this.messages.filter((item, idx, arr) => {
          // console.warn(item)
          return item.timestamp < this.lastFridayTs && item.timestamp >= this.last2FridayTs
        }),
        ['timestamp']
      ).reverse()
      return filtered.length > 0
        ? filtered[0]
        : {
            subject: `${this.last2Friday} ~ ${this.lastFriday}間無匯入資料`,
            message: `${this.last2Friday} ~ ${this.lastFriday}間無匯入測試資料庫的資料`,
            timestamp: parseInt(this.last2FridayTs)
          }
    },
    thirdDuration () {
      return this.dates.slice(0, 7)
    },
    last3Friday () {
      return this.thirdDuration[0]
    },
    last3FridayTs () {
      return +new Date(`20${this.last3Friday?.substring(0, 2)}/${this.last3Friday?.substring(2, 4)}/${this.last3Friday?.substring(4)}`) / 1000
    },
    last3FridayMessage () {
      // the latest message in thirdDuration
      const filtered = this.$utils.sortBy(
        this.messages.filter((item, idx, arr) => {
          // console.warn(item)
          return item.timestamp < this.last2FridayTs && item.timestamp >= this.last3FridayTs
        }),
        ['timestamp']
      ).reverse()
      return filtered.length > 0
        ? filtered[0]
        : {
            subject: `${this.last3Friday} ~ ${this.last2Friday}間無匯入資料`,
            message: `${this.last3Friday} ~ ${this.last2Friday}間無匯入測試資料庫的資料`,
            timestamp: parseInt(this.last3FridayTs)
          }
    }
  },
  watch: {
    // messages (arr) { console.warn(arr) },
    // lastFridayMessage (arr) { console.warn(arr) }
  },
  created () {
    // store date strings of 3 weeks ago by Friday
    this.dates = this.getDatesSincePreviousFriday(3)
    // console.warn(this.lastFridayMessage)
  },
  methods: {
    subjectLight (item) {
      const list = this.subjectCss(item)
      if (list.includes('text-danger')) {
        return '🔴'
      }
      if (list.includes('warning')) {
        return '🟡'
      }
      return '🟢'
    },
    subjectCss (item) {
      if (this.itemMessage(item).startsWith('⚠')) {
        return ['warning']
      }
      // parsing message for the successful text
      if (this.detectNoDumpFileString(item)) {
        return ['text-danger']
      }
      return []
    },
    weekSubject (item) {
      if (item) {
        if (item.timestamp >= this.lastFridayTs) {
          return `${this.lastFriday} 後匯入狀態`
        } else if (item.timestamp >= this.last2FridayTs) {
          return `${this.last2Friday} ~ ${this.lastFriday} 匯入狀態`
        } else if (item.timestamp >= this.last3FridayTs) {
          return `${this.last3Friday} ~ ${this.last2Friday} 匯入狀態`
        }
        return '三周前的匯入紀錄'
      }
      return '找不到 subject 欄位資料'
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
        const ts = +new Date() / 1000
        const offset = ts - item.timestamp
        // find last Friday dump date
        let search = `DATE=${this.lastFriday}`
        if (offset > 7 * 24 * 60 * 60) {
          search = `DATE=${this.last2Friday}`
        } else if (offset > 14 * 24 * 60 * 60) {
          search = `DATE=${this.last3Friday}`
        }
        const lastIdx = item.message.lastIndexOf(search)
        if (lastIdx !== -1) {
          return item.message.substring(lastIdx)
        } else {
          return `⚠ 找不到 ${search} 日期標示請查看下面紀錄👇\n\n${item.message}`
        }
      }
      return ''
    },
    formatDateYYMMDD (date) {
      const yy = String(date.getFullYear()).slice(-2)
      const mm = String(date.getMonth() + 1).padStart(2, '0') // Months are zero-based
      const dd = String(date.getDate()).padStart(2, '0')
      return `${yy}${mm}${dd}`
    },
    getDatesSincePreviousFriday (weekOffset = 1) {
      let parsedOffset = parseInt(weekOffset)
      // default sets to last Friday
      if (parsedOffset < 0 || isNaN(parsedOffset)) {
        parsedOffset = 1
      }

      const prevFriday = new Date()
      const dayStr = prevFriday.getDay()
      // Calculate the difference from last Friday
      const diff = (dayStr <= 5) ? (7 - (5 - dayStr)) : (dayStr - 5)
      // Adjust the date to the previous Friday by parsedOffset
      prevFriday.setDate(prevFriday.getDate() - diff - (parsedOffset - 1) * 7)

      const dates = []
      const today = new Date()
      const todayWithoutTime = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      // set start date for while loop
      const currentDateWithoutTime = new Date(prevFriday.getFullYear(), prevFriday.getMonth(), prevFriday.getDate())
      // eslint-disable-next-line no-unmodified-loop-condition
      while (todayWithoutTime > currentDateWithoutTime) {
        dates.push(this.formatDateYYMMDD(currentDateWithoutTime))
        currentDateWithoutTime.setDate(currentDateWithoutTime.getDate() + 1)
      }
      return dates
    },
    detectDateStrings (item, weekDuration = 1) {
      const expectStr = `DATE=${this.lastFriday}`
      const regex = new RegExp(expectStr, 'gm')
      const matched = [...this.itemMessage(item).matchAll(regex)].join('')
      return matched.length !== 0
    },
    detectNoDumpFileString (item) {
      // parsing message for the successful text
      const message = this.itemMessage(item)
      const expectStr = 'No dump file'
      const regex = new RegExp(expectStr, 'gm')
      const matched = [...message.matchAll(regex)].join('')
      return matched.length !== 0
    },
    formatDateString (str) {
      return `20${str?.substring(0, 2)}/${str?.substring(2, 4)}/${str?.substring(4)}`
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
