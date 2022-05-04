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
        pill
      )
        span.mr-1 告警
        b-badge(variant="light", pill) {{ warnings.length }}
      lah-button.mx-1(
        v-if="restores.length > 0",
        icon="check-circle",
        variant="success",
        @click="showMails({ title: '回覆通知', icon: 'check-circle', variant: 'success', items: restores })",
        pill
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
        li 儀錶板每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示找不到任何郵件訊息
      div 🔴 表示有「告警通知」但無「回復通知」之項目
  slot
  .center(v-if="headMessages.length === 0") ⚠  {{ fetchDay }}日內無資料
  div(v-else)
    lah-monitor-board-srmas-item(
      title-text="無回復通知項目",
      title-icon="exclamation-triangle",
      variant="danger",
      :items="problems"
    )
    lah-monitor-board-srmas-item(
      title-text="最新異常告警",
      title-icon="exclamation-circle",
      variant="warning",
      :items="headWarnings"
    )
    lah-monitor-board-srmas-item(
      title-text="最新回復通知",
      title-icon="check-circle",
      variant="success",
      :items="headRestores"
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
    header: 'SRMAS通知分析',
    fetchType: 'sender',
    fetchKeyword: 'SRMAS',
    fetchDay: 1
  }),
  computed: {
    todayNoAdSyncMessage () {
      return `${this.today} 無SRMAS相關資訊`
    },
    headMessages () {
      const filtered = this.messages.filter((item, idx, arr) => idx < 3)
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
    headWarnings () {
      const filtered = this.warnings.filter((item, idx, arr) => idx < 1)
      return filtered
    },
    warnings () {
      return this.messages.filter((item, idx, arr) => item.subject?.startsWith('異常告警'))
    },
    headRestores () {
      const filtered = this.restores.filter((item, idx, arr) => idx < 1)
      return filtered
    },
    restores () {
      return this.messages.filter((item, idx, arr) => item.subject?.startsWith('回復通知'))
    },
    problems () {
      const bad = [...this.warnings]
      // find warning without restore message
      const goodLen = this.restores.length
      for (let i = goodLen - 1; i >= 0; i--) {
        const trimGoodHead = this.restores[i]?.subject?.replace('回復通知-', '')
        let found = -1
        bad.find((item, idx) => {
          if (item.subject?.includes(trimGoodHead)) {
            found = idx
            return true
          }
          return false
        })
        if (found !== -1) {
          bad.splice(found, 1)
        }
      }
      return bad
    }
  },
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
ul {
  padding-left: 21.25px;
}
</style>
