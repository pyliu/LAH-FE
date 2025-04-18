<template lang="pug">
b-card(:border-variant="border", :class="[attentionCss]")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    lah-fa-icon.font-weight-bold(icon="comment-sms", append) {{ header }}
    b-button-group.ml-auto(size="sm")
      lah-button-count-badge(
        v-if="okCount > 0",
        :count="okCount",
        variant="success",
        :title="`${okCount}則成功`",
        @click="popupSMS(ok, '(成功)')",
        :disabled="isBusy"
      )
      lah-button-count-badge(
        v-if="failCount > 0",
        :count="failCount",
        variant="danger",
        :title="`${failCount}則失敗`",
        @click="popupSMS(fails, '(失敗)')",
        :disabled="isBusy"
      )
      lah-button(
        icon="arrow-up-right-from-square",
        variant="outline-primary",
        no-border,
        title="打開查詢視窗",
        @click="popupSMS(logs, '(今日全部)', false)",
        :disabled="isBusy"
      )
        span(v-if="isBusy") 讀取中
        span(v-else) 今日共{{ count }}則
      lah-button(
        v-if="!footer"
        icon="sync-alt",
        action="ld-cycle",
        variant="outline-secondary",
        no-border,
        no-icon-gutter,
        @click="loadSMS",
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
        li 顯示今日({{ today }})地政系統簡訊發送狀態
        li 儀表板每{{ reloadMs / 1000 / 60 }}分鐘重新檢查一次
      hr
      div 👉🏻 點擊紀錄內容開啟詳細記錄視窗
      div 🟢 表示一切正常
      div 🟡 表示找不到任何簡訊發送的紀錄
      div 🔴 表示最新簡訊發送有失敗的狀況
  slot
  lah-transition
    .center(v-if="isBusy"): lah-fa-icon(
      icon="spinner",
      action="spin"
    ) 讀取中...
    section(v-else)
      .d-flex.justify-content-between.align-items-center
        .text-nowrap.mr-1: lah-fa-icon.font-weight-bold(icon="circle", :variant="firstNotifyLight") 地籍異動即時通
        .truncate.text-center: b-link(@click="popupSingleSMS(firstNotifyLog)", title="顯示簡訊內容視窗") {{ itemDisplayText(firstNotifyLog) }}
        lah-badge-human-datetime(:seconds="convertSeconds(firstNotifyLog)")
      .truncate.small.text-muted: b-link(@click="popupSingleSMS(firstNotifyLog)", title="顯示簡訊內容視窗") {{ isSuccess(firstNotifyLog) ? firstNotifyLog.SMS_CONTENT : firstNotifyLog.SMS_RESULT }}
      hr
      .d-flex.justify-content-between.align-items-center
        .text-nowrap.mr-1: lah-fa-icon.font-weight-bold(icon="circle", :variant="firstCaseLight") 案件辦理情形&emsp;
        .truncate.text-center: b-link(@click="popupSingleSMS(firstCaseLog)", title="顯示簡訊內容視窗") {{ itemDisplayText(firstCaseLog) }}
        lah-badge-human-datetime(:seconds="convertSeconds(firstCaseLog)")
      .truncate.small.text-muted: b-link(@click="popupSingleSMS(firstCaseLog)", title="顯示簡訊內容視窗") {{ isSuccess(firstCaseLog) ? firstCaseLog.SMS_CONTENT : firstCaseLog.SMS_RESULT }}
      //- hr
      //- .d-flex.justify-content-between.align-items-center
      //-   .text-nowrap.mr-1: lah-fa-icon.font-weight-bold(icon="circle", :variant="firstCaseLight") 指定送達處所
      //-   .truncate.text-center: b-link(@click="popupSingleSMS(firstAddressLog)", title="顯示簡訊內容視窗") {{ itemDisplayText(firstAddressLog) }}
      //-   lah-badge-human-datetime(:seconds="convertSeconds(firstAddressLog)")
      //- .truncate.small.text-muted: b-link(@click="popupSingleSMS(firstAddressLog)", title="顯示簡訊內容視窗") {{ isSuccess(firstAddressLog) ? firstAddressLog.SMS_CONTENT : firstAddressLog.SMS_RESULT }}
      hr
      .d-flex.justify-content-between.align-items-center
        .text-nowrap.mr-1: lah-fa-icon.font-weight-bold(icon="circle", :variant="firstOtherLight") 其他類型&emsp;&emsp;&emsp;
        .truncate.text-center: b-link(@click="popupSingleSMS(firstOtherLog)", title="顯示簡訊內容視窗") {{ itemDisplayText(firstOtherLog) }}
        lah-badge-human-datetime(:seconds="convertSeconds(firstOtherLog)")
      .truncate.small.text-muted: b-link(@click="popupSingleSMS(firstOtherLog)", title="顯示簡訊內容視窗") {{ isSuccess(firstOtherLog) ? firstOtherLog.SMS_CONTENT : firstOtherLog.SMS_RESULT }}

  template(#footer, v-if="footer"): client-only: lah-monitor-board-footer(
    ref="footer"
    :reload-ms="reloadMs",
    :busy="isBusy",
    :fetch="$fetch",
    :reload="loadSMS",
    :update-time="updated"
  )
</template>

<script>
import lahAdmSmslogTableVue from '~/components/lah-adm-smslog-table.vue'
export default {
  name: 'LahMonitorBoardSms',
  emit: ['light-update'],
  components: { lahAdmSmslogTableVue },
  props: {
    footer: { type: Boolean, default: false },
    enableAttention: { type: Boolean, default: false }
  },
  data: () => ({
    header: '地政系統簡訊狀態監控',
    today: '',
    updated: '',
    logs: [],
    message: '讀取中',
    reloadMs: 5 * 60 * 1000
  }),
  fetch () {
    this.today = this.$utils.today('TW')
    this.loadSMS()
  },
  computed: {
    count () {
      return this.logs?.length || 0
    },
    fails () {
      return this.logs.filter((item) => {
        return item.SMS_RESULT !== 'S' && !item.SMS_RESULT?.startsWith('OK')
      })
    },
    ok () {
      return this.logs.filter((item) => {
        return item.SMS_RESULT === 'S' || item.SMS_RESULT?.startsWith('OK')
      })
    },
    failCount () {
      return this.fails?.length || 0
    },
    okCount () {
      return this.ok?.length || 0
    },
    firstNotifyLight () {
      return this.itemLight(this.firstNotifyLog)
    },
    firstNotifyLog () {
      const log = this.notifyLogs[0]
      if (this.$utils.empty(log)) {
        return {}
      }
      return log
    },
    notifyLogs () {
      return this.logs.filter((item) => {
        return item.SMS_TYPE === '地籍異動即時通'
      })
    },
    firstCaseLight () {
      return this.itemLight(this.firstCaseLog)
    },
    firstCaseLog () {
      const log = this.caseLogs[0]
      if (this.$utils.empty(log)) {
        return {}
      }
      return log
    },
    caseLogs () {
      return this.logs.filter((item) => {
        return item.SMS_TYPE === '案件辦理情形'
      })
    },
    firstAddressLight () {
      return this.itemLight(this.firstAddressLog)
    },
    firstAddressLog () {
      const log = this.addressLogs[0]
      if (this.$utils.empty(log)) {
        return {}
      }
      return log
    },
    addressLogs () {
      return this.logs.filter((item) => {
        return item.SMS_TYPE === '指定送達處所'
      })
    },
    firstOtherLight () {
      return this.itemLight(this.firstOtherLog)
    },
    firstOtherLog () {
      const log = this.otherLogs[0]
      if (this.$utils.empty(log)) {
        return {}
      }
      return log
    },
    otherLogs () {
      return this.logs.filter((item) => {
        return !['案件辦理情形', '地籍異動即時通'].includes(item.SMS_TYPE)
      })
    },
    border () {
      if (this.light !== 'success') {
        return this.light
      }
      return ''
    },
    light () {
      if (this.logs?.length !== 0) {
        const lights = [this.firstOtherLight, this.firstCaseLight, this.firstNotifyLight]
        if (lights.find(light => light === 'danger')) {
          return 'danger'
        } else if (lights.find(light => light === 'warning')) {
          return 'warning'
        }
        return 'success'
      }
      return 'warning'
    },
    attentionCss () {
      if (this.enableAttention) {
        if (this.light === 'danger') {
          return 'scale-danger'
        }
        if (this.light === 'warning') {
          return 'scale-warning'
        }
      }
      return ''
    }
  },
  watch: {
    logs (val) {
      // console.warn(val)
    },
    otherLogs (val) {
      // console.warn(val)
    },
    light (nlight, olight) {
      this.emitLightUpdate(nlight, olight)
    }
  },
  created () {},
  mounted () {
    this.emitLightUpdate(this.light, '')
  },
  beforeDestroy () {
    this.emitLightUpdate('', this.light)
  },
  methods: {
    emitLightUpdate (n, o) {
      this.$emit('light-update', {
        name: 'LahMonitorBoardSms',
        new: n,
        old: o
      })
    },
    itemDisplayText (item) {
      if (!this.$utils.empty(item.SMS_CELL)) {
        return item.SMS_CELL
      }
      if (!this.$utils.empty(item.SMS_MAIL)) {
        return item.SMS_MAIL
      }
      return '本日尚無發送資料'
    },
    itemLight (item) {
      if (!this.$utils.empty(item)) {
        return this.isSuccess(item) ? 'success' : 'danger'
      }
      return 'secondary'
    },
    isSuccess (item) {
      return item.SMS_RESULT === 'S' || item.SMS_RESULT?.startsWith('OK')
    },
    convertSeconds (item) {
      if (!this.$utils.empty(item)) {
        const adDate = `${parseInt(item.SMS_DATE) + 19110000}`
        const time = item.SMS_TIME
        const obj = Date.parse(`${this.$utils.addDateDivider(adDate, true)}T${this.$utils.addTimeDivider(time)}`)
        return +obj / 1000
      }
      return -1
    },
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
      if (!this.isBusy) {
        this.isBusy = true
        this.logs = []
        this.$axios
          .post(this.$consts.API.JSON.MOISMS, {
            type: 'moisms_log_query',
            keyword: this.today.replaceAll('-', '')
          }).then(({ data }) => {
            const status = this.$utils.statusCheck(data.status) ? '🟢' : '⚠'
            this.message = `${status} ${data.message}`
            this.logs = [...data.raw]
            this.$emit('reload', {
              keyword: this.keyword,
              logs: this.logs
            })
          }).catch((err) => {
            this.error = err
          }).finally(() => {
            this.isBusy = false
            this.updated = this.$utils.now('TW').replace(this.today, '')
          })
      }
    },
    popupSMS (items, title = '', displayMode = true) {
      if (!this.isBusy) {
        this.modal(this.$createElement(lahAdmSmslogTableVue, {
          props: {
            inKeyword: this.today,
            inLogs: items || this.logs,
            displayMode
          }
        }), {
          title: `${this.today} 地政系統簡訊綜合記錄檔查詢 ${title}`,
          size: 'xl',
          noCloseOnBackdrop: true,
          centered: false,
          scrollable: false
        })
      }
    },
    popupSingleSMS (item, displayMode = true) {
      if (!this.$utils.empty(item)) {
        this.modal(this.$createElement(lahAdmSmslogTableVue, {
          props: {
            inKeyword: this.today,
            inLogs: [item],
            displayMode
          }
        }), {
          title: '地政系統簡訊綜合記錄檔查詢',
          size: 'xl',
          noCloseOnBackdrop: false,
          centered: false,
          scrollable: false
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
