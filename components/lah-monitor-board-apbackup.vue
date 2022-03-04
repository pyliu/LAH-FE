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
        @click="reload",
        title="重新讀取",
        :disabled="fetchingMonitorMail"
      )
      lah-button(
        icon="external-link-alt",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="popupMessages('subject', 'AP Server', 7)",
        title="讀取7天內訊息"
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
        li 顯示 AP Server 備份狀態，每天晚上9點做備份
        li 每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示狀態未更新
      div 🔴 表示狀態錯誤
  slot
  .center(v-if="headMessages.length === 0") ⚠  {{ fetchDay }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 {{ itemLight(item) }}
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        title="顯示詳細記錄"
      ) {{ subject(item) }}
      lah-fa-icon.small.my-auto.text-nowrap(
        icon="clock",
        regular,
        :title="$utils.tsToAdDateStr(item.timestamp, true)",
        :variant="isToday(item.timestamp) ? 'success' : 'muted'"
      ) {{ $utils.formatDistanceToNow(item.timestamp * 1000) }}
    .truncate.text-muted.small {{ item.message }}
  template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
    :reload-ms="reloadMs",
    :busy="isBusy",
    :fetch="$fetch",
    :reload="reload",
    :fetch-state="fetchingState",
    :update-time="updated"
  )
</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  name: 'LahMonitorBoardApbackup',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'AP Server 備份',
    fetchType: 'subject',
    fetchKeyword: 'AP Server',
    fetchDay: 1,
    regex: /AP\s+Server\s+\((.+)\)\s+files\s+backup\s+(successful|.+)\./gm,
    // AP Server (apha14) files backup failure!!
    failRegex: /AP\s+Server\s+\((.+)\)\s+files\s+backup\s+(failure)!!/gm
  }),
  computed: {
    headMessages () {
      const now = +new Date() / 1000
      const oneDayHeads = this.messages.filter((item, idx, arr) => now - item.timestamp < 24 * 60 * 60)
      oneDayHeads.sort((a, b) => {
        // make failure one on the top
        if (a.message.includes('failure') && !b.message.includes('failure')) { return -1 }
        if (!a.message.includes('failure') && b.message.includes('failure')) { return 1 }
        return 0
      })
      const filtered = new Map()
      // remove duplication
      oneDayHeads.forEach((item, idx, arr) => {
        const key = this.subjectKey(item)
        const existed = filtered.has(key)
        if (existed) {
          // keep latest one
          if (filtered.get(key).timestamp < item.timestamp) {
            filtered.set(key, item)
          }
        } else {
          filtered.set(key, item)
        }
      })
      return [...filtered.values()]
    },
    light () {
      const now = +new Date()
      if (
        this.headMessages.length === 0 ||
        now - this.headMessages[0].timestamp * 1000 > 24 * 60 * 60 * 1000
      ) {
        return 'warning'
      }
      const ans = this.headMessages.every((item) => {
        return this.subject(item).includes('successful')
      })
      return ans ? 'success' : 'danger'
    }
  },
  methods: {
    itemLight (item) {
      const subject = this.subject(item)
      return subject.includes('failure') ? '🔴' : '🟢'
    },
    subject (item) {
      // successful
      let matched = [...item.message?.matchAll(this.regex)][0]
      if (!matched) {
        matched = [...item.message?.matchAll(this.failRegex)][0]
      }
      return matched ? `${matched[1]} ${matched[2]}` : '標題解析失敗'
    },
    subjectKey (item) {
      // successful
      let matched = [...item.message?.matchAll(this.regex)][0]
      if (!matched) {
        matched = [...item.message?.matchAll(this.failRegex)][0]
      }
      return matched ? `${matched[1]}` : 'AP主機解析失敗'
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
