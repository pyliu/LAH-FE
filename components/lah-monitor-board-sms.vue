<template lang="pug">
b-card(:border-variant="border")
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
        :title="`上次更新時間 ${updated}`"
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
        li 顯示今日簡訊狀態
        li 儀錶板每15分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示找不到任何簡訊訊息
      div 🔴 表示最新簡訊發送日期非今日[{{ $utils.toADDate(new Date(), 'yyyy-LL-dd') }}]
  slot
  .center(v-if="headMessages.length === 0") ⚠  {{ fetchDay }}日內無資料
  div(v-else, v-for="(item, idx) in headMessages")
    .d-flex.justify-content-between.font-weight-bold
      .mr-1 {{ subjectLight(item) }}
      a.truncate(
        href="#",
        @click="popupLogContent(item)",
        :class="subjectCss(item)",
        title="顯示詳細記錄"
      ) {{ item.subject }}
      lah-badge-human-datetime(
        :variant="isToday(item.timestamp) ? 'success' : 'muted'",
        :seconds="item.timestamp"
      )
    .truncate.text-muted.small {{ item.message }}
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
import lahAdmSmslogTableVue from '~/components/lah-adm-smslog-table.vue'
export default {
  name: 'LahMonitorBoardSms',
  components: { lahAdmSmslogTableVue },
  props: {
    footer: { type: Boolean, default: false }
  },
  data: () => ({
    header: '地政系統簡訊狀態監控',
    today: '',
    logs: []
  }),
  fetch () {
    this.today = this.$utils.today('TW')
    this.loadSMS()
  },
  computed: {
    todayNoAdSyncMessage () {
      return `${this.today} 無 AD 同步資訊`
    },
    headMessages () {
      const filtered = this.messages.filter((item, idx, arr) => idx < 3)
      const ts = +new Date() / 1000
      if (filtered[0] && ts - filtered[0].timestamp > 24 * 60 * 60) {
        // insert dummy item to indicate danger
        filtered.unshift({
          subject: this.todayNoAdSyncMessage,
          message: '...',
          timestamp: filtered[0].timestamp + 24 * 60 * 60
        })
      }
      return filtered
    },
    headMessage () {
      return this.headMessages[0]
    },
    light () {
      const now = +new Date()
      if (!this.headMessage) {
        return 'warning'
      }
      if (this.headMessage.subject === this.todayNoAdSyncMessage) {
        return 'danger'
      }
      const messageDate = this.$utils.toADDate(this.headMessage.timestamp * 1000, 'yyyy-LL-dd')
      const todayDate = this.$utils.toADDate(now, 'yyyy-LL-dd')
      if (messageDate !== todayDate) {
        return 'danger'
      }
      return 'success'
    }
  },
  methods: {
    subjectLight (item) {
      // const list = this.subjectCss(item)
      // return list.includes('text-danger') ? '🔴' : '🟢'
      return '🟢'
    },
    subjectCss (item) {
      // parsing message for the successful text
      // if (item.subject === this.todayNoAdSyncMessage) {
      //   return ['text-danger']
      // }
      return []
    },
    loadSMS () {
      this.isBusy = true
      this.logs = []
      this.$axios
        .post(this.$consts.API.JSON.MOISMS, {
          type: 'moisms_log_query',
          keyword: this.today
        }).then(({ data }) => {
          const status = this.$utils.statusCheck(data.status) ? '🟢' : '⚠'
          this.message = `${status} ${data.message}`
          this.logs = [...data.raw]
          this.$emit('reload', {
            keyword: this.keyword,
            type: this.searchType,
            logs: this.logs
          })
        }).catch((err) => {
          this.error = err
        }).finally(() => {
          this.isBusy = false
          this.pagination.currentPage = 1
        })
    },
    querySMS () {
      this.modal(this.$createElement(lahAdmSmslogTableVue, {
        props: {
          inKeyword: this.smsKeyword
        }
      }), {
        title: '地政系統簡訊綜合記錄檔查詢',
        size: 'xl',
        noCloseOnBackdrop: true,
        centered: false,
        scrollable: false
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
