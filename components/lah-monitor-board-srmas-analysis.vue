<template lang="pug">
div
  .center.h4(v-if="headMessages.length === 0") #[lah-fa-icon(icon="triangle-exclamation", variant="warning") 無任何通知郵件資料]
  div(v-else-if="problems.length > 0 || fixed.length > 0")
    lah-monitor-board-srmas-list(
      v-if="problems.length > 0",
      title-text="無告警回復項目",
      title-icon="exclamation-triangle",
      variant="danger",
      :items="problems"
    )
    hr(v-if="problems.length > 0")
    lah-monitor-board-srmas-fixed(
      v-if="fixed.length > 0",
      title-text="已正常回復項目",
      title-icon="check-double",
      variant="success",
      :items="fixed"
    )
  .center.h4(v-else) #[lah-fa-icon(icon="triangle-exclamation", variant="warning") {{ hours }}小時內未收到告警訊息]
</template>

<script>
import lahMonitorBoardSrmasFixed from '~/components/lah-monitor-board-srmas-fixed.vue'
import lahMonitorBoardSrmasList from '~/components/lah-monitor-board-srmas-list.vue'
export default {
  emit: ['updated'],
  name: 'LahMonitorBoardSrmasAnalysis',
  components: { lahMonitorBoardSrmasFixed, lahMonitorBoardSrmasList },
  props: {
    titleText: { type: String, default: 'SRMAS項目分析' },
    titleIcon: { type: String, default: 'chart-pie' },
    variant: { type: String, default: 'dark' },
    modalSize: { type: String, default: 'md' },
    items: {
      type: Array,
      require: true,
      default: () => ([])
    },
    hours: { type: Number, default: 12 }
  },
  data: () => ({
    debounceMs: 400,
    duration: 0,
    threadhold: 0,
    problems: [],
    fixed: []
  }),
  computed: {
    messagesAfterThreadhold () {
      const tmp = this.items.filter((item, idx, arr) => {
        return item.timestamp > this.threadhold
      })
      return this.$utils.uniqBy(this.$utils.orderBy(tmp, 'timestamp').reverse(), 'message')
    },
    headMessages () {
      return this.items.filter((item, idx, arr) => idx < 3)
    },
    warnings () {
      // return this.messagesAfterThreadhold.filter((item, idx, arr) => item.subject?.includes('異常', '告警', '警告')).reverse()
      const tmp = this.$utils.difference(this.messagesAfterThreadhold, this.restores)
      return this.$utils.orderBy(tmp, 'timestamp', 'desc')
    },
    restores () {
      console.warn(this.messagesAfterThreadhold)
      const tmp = this.messagesAfterThreadhold.filter((item, idx, arr) => item.subject?.includes('回復', '復原', '恢復') || item.message?.includes('got acknowledged'))
      return this.$utils.orderBy(tmp, 'timestamp', 'desc')
    }
  },
  watch: {
    hours (val) {
      this.calcTime()
    },
    messagesAfterThreadhold (dontcare) {
      // items updated will update messagesAfterThreadhold ...
      this.matchWarningRestores()
    }
  },
  created () {
    this.calcTime = this.$utils.debounce(() => {
      const hours = parseInt(this.hours) || 12
      this.duration = hours * 60 * 60 * 1000
      this.threadhold = (+new Date() - this.duration) / 1000
    }, this.debounceMs)
    this.matchWarningRestores = this.$utils.debounce(() => {
      const bad = [...this.warnings]
      this.fixed = []
      this.problems = []
      // foreach restore message finds one with the same key(host) and timestamp is less it in warning array
      this.restores.forEach((ritem, ridx, arr) => {
        // eslint-disable-next-line quotes
        const restoreLines = ritem.message.split("\r\n")?.map(line => line?.trim())
        // ex: 主機：220.1.34.206
        const restoreHostLine = restoreLines[1]
        // restoreHostLine === '主機：220.1.34.250' && console.warn('restore: ', restoreLines)
        // find the warning one for this restore message
        const founds = []
        bad.find((witem, widx) => {
          // eslint-disable-next-line quotes
          const warnLines = witem.message.split("\r\n")?.map(line => line?.trim())
          // ex: 主機：220.1.34.206
          const warnHostLine = warnLines[1]
          // restoreHostLine === '主機：220.1.34.250' && warnHostLine === '主機：220.1.34.250' && console.warn('warn: ', warnLines)
          // sometime the restore message will be sent before warning ... why? ask 👉 SRMAS by systex
          // 1130411 testing: add timestamp(seconds) comparing back
          if (restoreHostLine === warnHostLine && witem.timestamp <= ritem.timestamp) {
            // host matches and restore message timestamp behides warning
            founds.push(widx)
            return true
          }
          return false
        })
        // console.warn(`${restoreHostLine} FOUND`, founds.length)
        if (founds.length > 0) {
          founds.forEach((found) => {
            const bi = bad.splice(found, 1)[0]
            const gi = ritem
            // console.warn('match!', bi, gi)
            this.fixed.push({
              bad: bi,
              good: gi
            })
          })
        }
        // console.warn('after', bad.length)
      })
      // sorting by bad item timestamp desc
      this.fixed = [...this.$utils.sortBy(this.fixed, (item) => {
        return item.bad.timestamp
      })].reverse()
      this.problems = [...bad]
      this.trigger('updated', {
        fixed: this.fixed,
        problems: this.problems,
        warnings: this.warnings,
        restores: this.restores
      })
    }, this.debounceMs)
  },
  mounted () {
    this.calcTime()
    this.matchWarningRestores()
  },
  methods: {
    calcTime () { /** debounced */ },
    matchWarningRestores () { /** debounced */ },
    warnTitle (item) {
      /**
       * 0: "主機：220.1.34.250 異常告警"
       * 1: "主機：220.1.34.250"
       * 2: "發生時間: 2024-04-11 14:12:30"
       * 3: "警示規則: 硬碟容量使用率大於80%"
       */
      const warnLines = item.message.split('\r\n')
      const warnHost = warnLines[1]?.replace(/^主機[：|:]\s*/ig, '')?.trim()
      let warnRule = '無法辨識的告警，請查看網頁開發主控台資訊(F12)'
      if (warnLines[0]?.includes('異常告警')) {
        /**
         * 0: "主機：220.1.34.250 異常告警"
         * 1: "主機：220.1.34.250"
         * 2: "發生時間: 2024-04-11 14:12:30"
         * 3: "警示規則: 硬碟容量使用率大於80%"
         */
        warnRule = warnLines[3]?.replace('警示規則: ', '')?.trim()
      } else if (warnLines[0]?.includes('無回應')) {
        /**
         * 0: "警告-設備無回應"
         * 1: "主機: 192.168.17.20"
         * 2: "裝置: "
         * 3: "嚴重性: warning"
         * 4: "時間: 2024-04-11 06:42:27"
         */
        warnRule = '設備無回應'
      } else if (warnLines[0]?.includes('服務發生異常')) {
        /**
         * 0: "服務發生異常"
         * 1: "主機：220.1.34.161"
         * 2: "發生時間: 2024-04-11 15:10:29"
         * 3: "服務名稱: AP監控"
         */
        const service = warnLines[3]?.replace('服務名稱:', '')?.trim()
        warnRule = `${service}服務異常`
      } else if (warnLines[0]?.includes('回復')) {
        /**
         * 0: "通知-設備已回復"
         * 1: "主機: 192.168.17.21"
         * 2: "裝置: "
         * 3: "嚴重性: warning"
         * 4: " 耗時: 1m 57s 時間: 2024-04-11 06:40:24"
         */
        /**
         * 0: "服務回復正常"
         * 1: "主機：220.1.34.118"
         * 2: "發生時間: 2024-04-11 07:08:29"
         * 3: "服務名稱: AP 監控"
         */
        /**
         * 0: "主機：220.2.34.26 回復通知"
         * 1: "主機：220.2.34.26"
         * 2: "發生時間: 2024-04-11 09:16:38"
         * 3: "警示規則:  處理器平均使用率大於85%"
         */
        return warnLines[0]
      } else {
        console.warn(warnLines)
      }
      return `${warnRule} - ${warnHost}`
    },
    peekMessage (item) {
      const warnLines = item.message.split('\r\n')
      if (warnLines[0]?.includes('無回應')) {
        /**
         * 0: "警告-設備無回應"
         * 1: "主機: 192.168.17.20"
         * 2: "裝置: "
         * 3: "嚴重性: warning"
         * 4: "時間: 2024-04-11 06:42:27"
         */
        return `${warnLines[0]} ${warnLines[4]}`
      }
      if (warnLines[0]?.includes('回復')) {
        /**
         * 0: "通知-設備已回復"
         * 1: "主機: 192.168.17.21"
         * 2: "裝置: "
         * 3: "嚴重性: warning"
         * 4: " 耗時: 1m 57s 時間: 2024-04-11 06:40:24"
         */
        /**
         * 0: "服務回復正常"
         * 1: "主機：220.1.34.118"
         * 2: "發生時間: 2024-04-11 07:08:29"
         * 3: "服務名稱: AP 監控"
         */
        /**
         * 0: "主機：220.2.34.26 回復通知"
         * 1: "主機：220.2.34.26"
         * 2: "發生時間: 2024-04-11 09:16:38"
         * 3: "警示規則:  處理器平均使用率大於85%"
         */
        switch (warnLines[0]) {
          case '通知-設備已回復':
            return `${warnLines[1]}已回復回應`
          case '服務回復正常':
            return `${warnLines[3]} ${warnLines[1]} 已復原`
        }
        if (warnLines[0].includes('回復通知')) {
          return `${warnLines[3]} 已復原`
        }
        console.warn(warnLines)
        return '無法辨識的回覆通知訊息!'
      }
      return `異常${warnLines[2]}`
    },
    isToday (ts) {
      const fullDt = this.$utils.phpTsToAdDateStr(ts, true)
      return this.today === fullDt.split(' ')[0]
    },
    popupLogContent (item) {
      this.modal(this.$utils.convertMarkd(item.message), {
        title: `${this.titleText} - ${this.warnTitle(item)}`,
        size: this.modalSize,
        html: true
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
