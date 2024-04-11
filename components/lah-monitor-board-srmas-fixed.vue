<template lang="pug">
b-card.border-0(no-body)
  .d-flex.align-items-center.h6
    lah-fa-icon(:icon="titleIcon", :variant="variant") {{ titleText }}
    b-badge.ml-1.my-auto(:variant="variant", pill) {{ items.length }}
  div(v-for="(item, idx) in items")
    .d-flex.justify-content-between.font-weight-bold.small
      lah-fa-icon(icon="check", variant="success")
      b-link.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ warnTitle(item) }}
      lah-badge-human-datetime(
        :variant="isToday(item.bad.timestamp) ? 'success' : 'muted'",
        :seconds="item.bad.timestamp"
      )
    .truncate.text-muted.small(@click="popupLogContent(item)") {{ recoverMessage(item) }}
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
    today () { return this.$utils.toADDate(new Date(), 'yyyy-LL-dd') }
  },
  methods: {
    warnTitle (item) {
      /**
       * 0: "主機：220.1.34.250 異常告警"
       * 1: "主機：220.1.34.250"
       * 2: "發生時間: 2024-04-11 14:12:30"
       * 3: "警示規則: 硬碟容量使用率大於80%"
       */
      const warnLines = item.bad.message.split('\r\n')
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
      } else {
        console.warn(warnLines)
      }
      return `${warnRule}(${warnHost})`
    },
    packedMessage (item) {
      const joins = [`🔴 ${item.bad.message}`, `🟢 ${item.good.message}`]
      return this.$utils.convertMarkd(joins.join('\n***\n'))
    },
    recoverMessage (item) {
      const offset = item.good.timestamp - item.bad.timestamp
      // const goodLines = item.good.message.split('\r\n')
      // return goodLines[goodLines.length - 1]
      return `耗時 ${this.convertTimeOffset(offset)} 復原`
    },
    convertTimeOffset (seconds) {
      const secNum = parseInt(seconds, 10)
      let hours = Math.floor(secNum / 3600)
      let minutes = Math.floor((secNum - (hours * 3600)) / 60)
      let secs = secNum - (hours * 3600) - (minutes * 60)
      if (hours < 10) { hours = '0' + hours }
      if (minutes < 10) { minutes = '0' + minutes }
      if (secs < 10) { secs = '0' + secs }
      return hours + ':' + minutes + ':' + secs
    },
    isToday (ts) {
      const fullDt = this.$utils.phpTsToAdDateStr(ts, true)
      return this.today === fullDt.split(' ')[0]
    },
    popupLogContent (item) {
      this.modal(this.packedMessage(item), {
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
