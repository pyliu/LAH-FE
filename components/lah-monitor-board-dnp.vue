<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    strong {{ header }}
    b-button-group.ml-auto(size="sm")
      //- lah-button(
      //-   icon="chart-simple",
      //-   :href="grafanaUrl",
      //-   target="_blank",
      //-   no-border,
      //-   title="開啟新視窗顯示詳細DB儀表板"
      //- ) 詳細資訊
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
        @click="popupMessages('subject', 'smitty dnp check', 7)",
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
    lah-help-modal(ref="help", :modal-title="`${header} 監控說明`", size="lg")
      ul
        li 顯示主資料庫兩個NODE之間連線狀態
          ul
            li 請於 crontab 安裝「#[b-link.text-danger.font-weight-bold(:href="checkDnpSh" target="_blank" title="下載腳本") check-dnp.sh]」以利完成後送出通知電子郵件。(⭐請依各所實際環境修正腳本內路徑及收件者資訊⭐)
            li e.g. 在 root 的 crontab 新增「0 8-17 * * 1-6 /scripts/check-dnp.sh > /dev/null」於辦公時間每小時執行一次(請自行依擺放腳本位置修正路徑)。
        li 分析電子郵件以顯示資料庫兩個NODE的 DNP 連線狀態。
        li 依 crontab 設定時間檢查後並送出電子郵件通知(桃園所 👉 每天 08:00 ~ 17:00 每小時檢查一次)。
        li 儀表板約每60分鐘更新檢查監控郵件一次。
      b-img.w-100.shadow(src="~/assets/img/mb_dnp.jpg", fluid, thumbnail)
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示狀態未更新
      div 🔴 表示狀態錯誤
  slot
  .center(v-if="$utils.empty(headMessage)") ⚠ {{ fetchDay }}日內無資料
  div(v-else)
    .d-flex.justify-content-between.font-weight-bold
      b-badge.my-auto.mr-1(:variant="light", pill) {{ badgeText }}
      a.truncate(
        href="#",
        @click="popupLogContent(headMessage)",
        title="顯示詳細記錄"
      ) {{ extractNodes }}
      lah-badge-human-datetime(
        :variant="isToday(headMessage.timestamp) ? 'success' : 'muted'",
        :seconds="headMessage.timestamp"
      )
    .text-muted.small.dnp-content(v-html="extractDNPValues")
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
import lahMonitorBoardBase from '~/mixins/lah-monitor-board-base'
import lahMonitorBoardRaw from '~/components/lah-monitor-board-raw.vue'

export default {
  name: 'LahMonitorBoardDnp',
  components: { lahMonitorBoardRaw },
  mixins: [lahMonitorBoardBase],
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '資料庫 PowerHA',
    fetchType: 'subject',
    fetchKeyword: 'smitty dnp check',
    fetchDay: 1,
    nodeRegex: /ORAH[A-H]HA[1-2]/igm,
    foundNodes: [],
    // dnpRegex: /DNP.+ORAH[A-H]HA[1-2]\n\s+PgSpFree.+\n/igm,
    dnpRegex: /DNP.+ORAH[A-H]HA[1-2]\r\n\s+PgSpFree.+\r\n/igm,
    foundDNPValues: []
  }),
  computed: {
    checkDnpSh () {
      return '/assets/sh/check-dnp.sh'
    },
    headMessage () {
      return this.messages[0]
    },
    headContent () {
      return this.headMessage.message || ''
    },
    extractNodes () {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.foundNodes = [...this.headContent.matchAll(this.nodeRegex)]
      const tmp = this.foundNodes.join(' ↔ ')
      if (this.$utils.empty(tmp)) {
        return '找不到 /ORAH[A-H]HA[1-2]/igm 配對資訊'
      }
      return tmp
    },
    extractDNPValues () {
      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.foundDNPValues = [...this.headContent.matchAll(this.dnpRegex)]
      if (this.foundDNPValues.length > 1) {
        return this.$utils.convertMarkd('- ' + this.foundDNPValues[0] + '- ' + this.foundDNPValues[1])
      }
      return this.$utils.convertMarkd(this.foundDNPValues.join('\n'))
    },
    light () {
      const now = +new Date()
      if (
        this.$utils.empty(this.headMessage) ||
        now - this.headMessage.timestamp * 1000 > 6 * 60 * 60 * 1000
      ) {
        return 'warning'
      }
      return this.foundNodes.length === 2 ? 'success' : 'danger'
    },
    emojiLight () {
      switch (this.light) {
        case 'danger': return '🔴'
        case 'success': return '🟢'
        default: return '🟡'
      }
    },
    badgeText () {
      switch (this.light) {
        case 'danger': return 'BROKEN'
        case 'success': return 'ACTIVE'
        default: return 'OUTDATED'
      }
    }
  },
  mounted () {
    // update the reload timer to 1hrs
    this.reloadMs = (1 * 60 * 60 + this.$utils.rand(60)) * 1000
  }
}
</script>

<style lang="scss" scoped>
.dnp-content {
  ul, ol {
    padding-left: 10.25px;
  }
}
</style>
