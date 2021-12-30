<template lang="pug">
b-card
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(
      size="sm"
    )
      lah-button(
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="reload",
        title="重新讀取"
      )
      lah-button(
        icon="external-link-alt",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        @click="popupMessages('subject', 'hacmp', 7)",
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
        li 顯示資料庫 HACMP 狀態，每天早上8點檢查
        li 目前檢查郵件一天只有一封，故設定重新整理計時器為一天
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示狀態未更新
      div 🔴 表示狀態錯誤
  slot
  .center(v-if="$utils.empty(headMessage)") ⚠ 無資料
  div(v-else)
    .d-flex.justify-content-between.font-weight-bold
      a.truncate-short(
        href="#",
        @click="popupLogContent(headMessage)",
        title="顯示詳細記錄"
      ) {{ headMessage.subject }}
      lah-fa-icon.small.my-auto.text-nowrap(icon="clock", regular, :title="$utils.tsToAdDateStr(headMessage.timestamp, true)") {{ displayDatetime(headMessage.timestamp) }}
    .truncate.text-muted.small(v-html="extractedMessage")
  template(#footer, v-if="footer"): client-only: .d-flex.justify-content-between.small.text-muted
    lah-countdown-button.border-0(
      ref="countdown"
      size="sm"
      icon="sync-alt"
      action="ld-cycle"
      auto-start
      title="立即重新讀取"
      variant="outline-secondary"
      badge-variant="secondary"
      :milliseconds="reloadMs"
      :disabled="isBusy"
      :busy="isBusy"
      @end="reload"
      @click="reload"
    )
    lah-fa-icon.my-auto.text-nowrap(icon="clock", title="更新時間") {{ updatedTimestamp }}
</template>

<script>
import lahMonitorBoardBase from '~/components/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫 HACMP',
    modalId: 'tmp-id',
    messages: [],
    updatedTimestamp: '',
    reloadMs: 24 * 60 * 60 * 1000,
    found: []
  }),
  computed: {
    headMessage () {
      return this.messages[0]
    },
    extractedMessage () {
      const regex = /\/.+\s+datavg\s+reg_ctl\s+ORAH[A-H]HA1,ORAH[A-H]HA2/gm
      const message = this.headMessage.message || ''
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.found = [...message.matchAll(regex)]
      return this.found.join('<br/>')
    },
    light () {
      if (this.$utils.empty(this.headMessage)) {
        return 'warning'
      }
      return this.found.length === 7 ? 'success' : 'danger'
    }
  },
  created () {
    this.modalId = this.$utils.uuid()
    this.reload()
  },
  methods: {
    reload () {
      this.isBusy = true
      // to update untaken data in sqlite db
      this.$axios
        .post(this.$consts.API.JSON.MONITOR, {
          type: 'subject',
          keyword: 'hacmp'
        })
        .then(({ data }) => {
          if (this.$utils.statusCheck(data.status)) {
            this.messages = [...data.raw]
          } else {
            this.warning(data.message)
          }
        })
        .catch((err) => {
          this.alert(err.message)
          this.$utils.error(err)
        })
        .finally(() => {
          this.isBusy = false
          this.updatedTimestamp = this.$utils.now().replace(this.today, '')
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(this.reloadMs)
            this.$refs.countdown.startCountdown()
          } else {
            this.timeout(() => this.reload(), this.reloadMs)
          }
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
