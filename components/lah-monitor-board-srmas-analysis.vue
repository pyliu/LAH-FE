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
      const tmp = this.messagesAfterThreadhold.filter((item, idx, arr) => item.subject?.includes('回復', '復原', '恢復') || item.message?.includes('acknowledged'))
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
      // this.$utils.warn('warnings', this.warnings)
      // this.$utils.warn('restores', this.restores)
      // 輔助函式：從郵件內文中解析出主機名稱
      const getHost = (message) => {
        const lines = message?.split('\r\n')?.map(line => line?.trim())
        // 主機資訊通常在第二行，格式為 "主機：220.1.34.206" 或 "主機: 192.168.17.20"
        const hostLine = lines?.[1]
        if (!hostLine) {
          return null
        }
        return hostLine.replace(/^主機[：|:]\s*/i, '')?.trim()
      }

      // 步驟 1: 為了高效查找，將警告按主機名稱分組
      const warningsByHost = new Map()
      this.warnings.forEach((warning) => {
        const host = getHost(warning.message)
        if (host) {
          if (!warningsByHost.has(host)) {
            warningsByHost.set(host, [])
          }
          warningsByHost.get(host).push(warning)
        }
      })

      // 步驟 2: 將回復訊息按時間戳排序 (由舊到新)，以便按時間順序處理事件
      const sortedRestores = [...this.restores].sort((a, b) => a.timestamp - b.timestamp)

      const fixedPairs = []

      // 步驟 3: 遍歷每一筆回復事件。一筆回復應清除所有在此之前的告警。
      for (const restore of sortedRestores) {
        const restoreHost = getHost(restore.message)
        const restoreTimestamp = restore.timestamp

        // 如果回復訊息中沒有主機資訊，或者該主機沒有任何警告，則跳過
        if (!restoreHost || !warningsByHost.has(restoreHost)) {
          continue
        }

        const hostWarnings = warningsByHost.get(restoreHost)
        const matchedWarnings = []
        const remainingWarnings = []

        // 將此主機的告警分為「已修復」和「未修復」兩組
        for (const warning of hostWarnings) {
          if (warning.timestamp <= restoreTimestamp) {
            matchedWarnings.push(warning)
          } else {
            remainingWarnings.push(warning)
          }
        }

        // 如果有找到被此回復事件修復的告警
        if (matchedWarnings.length > 0) {
          // 將所有被修復的告警與此回復事件配對
          for (const matchedWarning of matchedWarnings) {
            fixedPairs.push({
              bad: matchedWarning,
              good: restore
            })
          }
          // 更新Map，只留下發生在此回復事件之後的告警
          if (remainingWarnings.length > 0) {
            warningsByHost.set(restoreHost, remainingWarnings)
          } else {
            // 若該主機所有告警皆已修復，則從Map中移除
            warningsByHost.delete(restoreHost)
          }
        }
      }

      // 步驟 4: Map 中剩餘的所有警告都是未解決的問題
      const problemItems = []
      for (const warnings of warningsByHost.values()) {
        problemItems.push(...warnings)
      }

      // 步驟 5: 設定最終的組件資料
      // 將 problems 根據時間戳排序以便顯示 (最新優先)
      this.problems = this.$utils.orderBy(problemItems, 'timestamp', 'desc')
      // 將 fixedPairs 根據原始警告的時間戳排序以便顯示 (最新優先)
      this.fixed = this.$utils.orderBy(fixedPairs, item => item.bad.timestamp, 'desc')

      // 步驟 6: 發送 'updated' 事件並附上結果
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
