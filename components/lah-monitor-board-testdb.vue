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
        @click="popupMessages('subject', 'test system imp state', 31)",
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
      ) {{ alteredSubject(item) }}
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
    fetchDay: 31
  }),
  computed: {
    todayNoDBImportMessage () {
      return `${this.today} 無測試 DB 匯入資訊`
    },
    lastFridayNoDBImportMessage () {
      return `${this.lastFriday} 無測試 DB 匯入資訊`
    },
    headMessages () {
      const filtered = this.messages.filter((item, idx, arr) => idx < 3)

      const expectStr = `DATE=${this.lastFriday}`
      const regex = new RegExp(expectStr, 'gm')
      const matched = [...this.itemMessage(filtered[0]).matchAll(regex)].join('')
      if (matched.length === 0) {
        // insert dummy item to indicate danger
        filtered.unshift({
          subject: this.lastFridayNoDBImportMessage,
          message: '...',
          timestamp: parseInt(+new Date() / 1000)
        })
      }
      // const ts = +new Date() / 1000
      // if (filtered[0] && ts - filtered[0].timestamp > 7 * 24 * 60 * 60) {
      //   // insert dummy item to indicate danger
      //   filtered.unshift({
      //     subject: this.todayNoDBImportMessage,
      //     message: '...',
      //     timestamp: filtered[0].timestamp + 24 * 60 * 60
      //   })
      // }
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
      if (this.headMessage.subject === this.lastFridayNoDBImportMessage) {
        // if (this.isMonday) {
        //   this.$emit('warning', `${this.header}，週日無備份檔，所以無還原。`)
        //   return 'warning'
        // }
        this.$emit('danger', `${this.header}找不到上週五匯入紀錄！`)
        return 'danger'
      }
      // the case that the message can not find yesterday "DATE=XXXXXX" string
      if (this.itemMessage(this.headMessage).startsWith('⚠')) {
        return 'warning'
      }
      const now = +new Date()
      // There is no message for over 7 days long, treats it RED
      const ts = 7 * 24 * 60 * 60 * 1000
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
    },
    lastFriday () {
      const lastFriday = new Date()
      const dayStr = lastFriday.getDay()
      const diff = (dayStr <= 5) ? (7 - (5 - dayStr)) : (dayStr - 5)
      // Adjust the date to the previous Friday
      lastFriday.setDate(lastFriday.getDate() - diff)

      const year = lastFriday.getFullYear().toString().slice(-2)
      const month = (lastFriday.getMonth() + 1).toString().padStart(2, '0')
      const day = lastFriday.getDate().toString().padStart(2, '0')
      // Format the date as "YYMMDD", e.g. "241011"
      return `${year}${month}${day}`
    },
    last2Friday () {
      const lastFriday = new Date()
      const dayStr = lastFriday.getDay()
      const diff = (dayStr <= 5) ? (7 - (5 - dayStr)) : (dayStr - 5)
      // Adjust the date to the previous Friday
      lastFriday.setDate(lastFriday.getDate() - diff - 7)

      const year = lastFriday.getFullYear().toString().slice(-2)
      const month = (lastFriday.getMonth() + 1).toString().padStart(2, '0')
      const day = lastFriday.getDate().toString().padStart(2, '0')
      // Format the date as "YYMMDD", e.g. "241011"
      return `${year}${month}${day}`
    },
    last3Friday () {
      const lastFriday = new Date()
      const dayStr = lastFriday.getDay()
      const diff = (dayStr <= 5) ? (7 - (5 - dayStr)) : (dayStr - 5)
      // Adjust the date to the previous Friday
      lastFriday.setDate(lastFriday.getDate() - diff - 14)

      const year = lastFriday.getFullYear().toString().slice(-2)
      const month = (lastFriday.getMonth() + 1).toString().padStart(2, '0')
      const day = lastFriday.getDate().toString().padStart(2, '0')
      // Format the date as "YYMMDD", e.g. "241011"
      return `${year}${month}${day}`
    }
  },
  created () {
    // testdb import will not execute on weenend
    // this.fetchDay = this.isMonday ? 4 : 3
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
      // if (item.subject === this.todayNoDBImportMessage) {
      //   if (this.isMonday) {
      //     return ['text-warning']
      //   }
      //   return ['text-danger']
      // }
      if (this.itemMessage(item).startsWith('⚠')) {
        return ['text-warning']
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
    alteredSubject (item) {
      if (item) {
        const ts = +new Date() / 1000
        const offset = ts - item.timestamp
        // find last Friday dump date
        let subject = `上週五(${this.lastFriday})匯入狀態`
        if (offset > 7 * 24 * 60 * 60) {
          subject = `兩周前(${this.last2Friday})匯入狀態`
        } else if (offset > 14 * 24 * 60 * 60) {
          subject = `三周前(${this.last3Friday})匯入狀態`
        }
        return subject
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
          return `⚠ 找不到 ${search} 日期標示\n\n${item.message}`
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
