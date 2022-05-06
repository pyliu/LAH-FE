<template lang="pug">
b-card
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(size="sm")
      lah-button(
        v-if="warnings.length > 0",
        icon="exclamation-circle",
        variant="warning",
        @click="showMails({ title: '異常告警', icon: 'exclamation-circle', variant: 'warning', items: warnings })",
        pill,
        v-b-tooltip="'8小時內'"
      )
        span.mr-1 告警
        b-badge(variant="light", pill) {{ warnings.length }}
      lah-button.mx-1(
        v-if="restores.length > 0",
        icon="check-circle",
        variant="success",
        @click="showMails({ title: '回覆通知', icon: 'check-circle', variant: 'success', items: restores })",
        pill,
        v-b-tooltip="'8小時內'"
      )
        span.mr-1 回復
        b-badge(variant="light", pill) {{ restores.length }}
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
        @click="popupMessages('sender', 'SRMAS', 3)",
        title="讀取3天內訊息"
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
        li 顯示 SRMAS 系統回報訊息分析統計
        li 僅顯示最近8小時內的資訊
        li 儀錶板每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示找不到任何郵件訊息
      div 🔴 表示有「告警通知」但無「回復通知」之項目
  slot
  .center(v-if="headMessages.length === 0") ⚠  {{ fetchDay }}日內無資料
  .center(v-else-if="problems.length === 0 && fixed.length === 0") 👍  沒有發生告警
  div(v-else)
    lah-monitor-board-srmas-item(
      v-if="problems.length > 0"
      title-text="無告警回復項目",
      title-icon="exclamation-triangle",
      variant="danger",
      :items="problems"
    )
    lah-monitor-board-srmas-fixed(
      v-if="fixed.length > 0"
      title-text="已正常回復項目",
      title-icon="check-double",
      variant="success",
      :items="fixed"
    )

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
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'
import lahMonitorBoardSrmasItem from '~/components/lah-monitor-board-srmas-item.vue'

export default {
  name: 'LahMonitorBoardSrmas',
  components: { lahMonitorBoardRaw, lahMonitorBoardSrmasItem },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: 'SRMAS分析',
    fetchType: 'sender',
    fetchKeyword: 'SRMAS',
    fetchDay: 1,
    twelveHrsAgo: (+new Date() - (8 * 60 * 60 * 1000)) / 1000
  }),
  computed: {
    messagesIn12hrs () {
      return this.messages.filter((item, idx, arr) => {
        return item.timestamp > this.twelveHrsAgo
      })
    },
    headMessages () {
      const filtered = this.messagesIn12hrs.filter((item, idx, arr) => idx < 3)
      return filtered
    },
    headMessage () {
      return this.headMessages[0]
    },
    light () {
      if (!this.headMessage) {
        return 'warning'
      }
      return this.problems.length > 0 ? 'danger' : 'success'
    },
    warnings () {
      return this.messagesIn12hrs.filter((item, idx, arr) => item.subject?.startsWith('異常告警'))
    },
    restores () {
      return this.messagesIn12hrs.filter((item, idx, arr) => item.subject?.startsWith('回復通知'))
    },
    fixed () {
      const bad = [...this.warnings]
      const fixed = []
      // find warning without restore message
      const goodLen = this.restores.length
      for (let i = goodLen - 1; i >= 0; i--) {
        const trimGoodHead = this.restores[i]?.subject?.replace('回復通知-', '')
        let found = -1
        bad.find((item, idx) => {
          // found the restore notification that timestamp is after the warning one
          if (
            item.subject?.includes(trimGoodHead) &&
            this.restores[i].timestamp > item.timestamp
          ) {
            found = idx
            return true
          }
          return false
        })
        if (found !== -1) {
          fixed.push({
            bad: bad.splice(found, 1)[0],
            good: this.restores[i]
          })
        }
      }
      fixed.reverse()
      return fixed
    },
    problems () {
      const bad = [...this.warnings]
      // find warning without restore message
      const goodLen = this.restores.length
      for (let i = goodLen - 1; i >= 0; i--) {
        const trimGoodHead = this.restores[i]?.subject?.replace('回復通知-', '')
        const clearIdx = []
        bad.forEach((item, idx) => {
          if (
            item.subject?.includes(trimGoodHead) &&
            this.restores[i].timestamp > item.timestamp
          ) {
            clearIdx.push(idx)
          }
        })
        // remove clear warning
        clearIdx.forEach(deletedIdx => bad.splice(deletedIdx, 1))
      }
      bad.reverse()
      return bad
    }
  },
  watch: {},
  methods: {
    showMails (payload) {
      // destruvting obj entries to vars
      const { title, icon, variant, items } = payload
      this.modal(this.$createElement(lahMonitorBoardSrmasItem, {
        props: {
          titleText: title,
          titleIcon: icon,
          variant,
          items
        }
      }), {
        title,
        size: 'lg'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
