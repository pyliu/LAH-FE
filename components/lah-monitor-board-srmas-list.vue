<template lang="pug">
b-card.border-0(no-body)
  .d-flex.align-items-center.font-weight-bold
    lah-fa-icon(:icon="titleIcon", :variant="variant") {{ titleText }}
    b-badge.ml-1.my-auto(:variant="variant", pill) {{ items.length }}
  transition-group(name="list"): div(v-for="(item, idx) in items", :key="`srmas_${idx}`")
    .d-flex.justify-content-between.font-weight-bold.small
      lah-fa-icon(
        :icon="isRestoreList ? 'circle-check' : 'triangle-exclamation'",
        :variant="isRestoreList ? 'success' : 'warning'"
      )
      b-link.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ warnTitle(item) }}
      lah-badge-human-datetime(
        :variant="isToday(item.timestamp) ? 'success' : 'muted'",
        :seconds="item.timestamp"
      )
    .truncate.text-muted.small(@click="popupLogContent(item)") {{ peekMessage(item) }}
</template>

<script>
export default {
  name: 'LahMonitorBoardSrmasItem',
  props: {
    titleText: { type: String, default: 'SRMAS項目標題' },
    titleIcon: { type: String, default: 'exclamation-triangle' },
    variant: { type: String, default: 'dark' },
    modalSize: { type: String, default: 'md' },
    items: {
      type: Array,
      require: true,
      default: () => ([])
    }
  },
  computed: {
    today () { return this.$utils.toADDate(new Date(), 'yyyy-LL-dd') },
    isRestoreList () {
      return this.variant === 'success'
    }
  },
  methods: {
    warnTitle (item) {
      /**
       * 0: "主機：220.1.34.250 異常告警"
       * 1: "主機：220.1.34.250"
       * 2: "發生時間: 2024-04-11 14:12:30"
       * 3: "警示規則: 硬碟容量使用率大於80%"
       */
      const warnLines = item.message.split('\r\n')
      const warnHost = warnLines[1]?.replace(/^主機[：|:]\s*/ig, '')?.trim()
      let warnRule = '無法辨識的告警，請查看主控台'
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
