<template lang="pug">
b-card(:border-variant="border")
  template(#header): .d-flex.justify-content-between
    lah-fa-icon(icon="circle", :variant="light")
    lah-fa-icon.font-weight-bold(icon="comment-sms", append) {{ header }}
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
        icon="arrow-up-right-from-square",
        variant="outline-primary",
        no-border,
        no-icon-gutter,
        title="打開查詢視窗",
        @click="popupSMS"
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
        lah-fa-icon.font-weight-bold(icon="circle", :variant="firstNotifyLight") 地籍異動即時通
        b-link(@click="popupSingleSMS(firstNotifyLog)") {{ firstNotifyLog.SMS_CELL || '尚無發送簡訊' }}
        lah-badge-human-datetime(:seconds="convertSeconds(firstNotifyLog)")
      .truncate.small.text-muted: b-link(@click="popupSingleSMS(firstNotifyLog)") {{ isSuccess(firstNotifyLog) ? firstNotifyLog.SMS_CONTENT : firstNotifyLog.SMS_RESULT }}
      hr
      .d-flex.justify-content-between.align-items-center
        lah-fa-icon.font-weight-bold(icon="circle", :variant="firstCaseLight") 案件辦理情形&emsp;
        b-link(@click="popupSingleSMS(firstCaseLog)") {{ firstCaseLog.SMS_CELL || '尚無發送簡訊' }}
        lah-badge-human-datetime(:seconds="convertSeconds(firstCaseLog)")
      .truncate.small.text-muted: b-link(@click="popupSingleSMS(firstCaseLog)") {{ isSuccess(firstCaseLog) ? firstCaseLog.SMS_CONTENT : firstCaseLog.SMS_RESULT }}
      hr
      .d-flex.justify-content-between.align-items-center
        lah-fa-icon.font-weight-bold(icon="circle", :variant="firstOtherLight") 其他簡訊&emsp;&emsp;&emsp;
        b-link(@click="popupSingleSMS(firstOtherLog)") {{ firstOtherLog.SMS_CELL || '尚無發送簡訊' }}
        lah-badge-human-datetime(:seconds="convertSeconds(firstOtherLog)")
      .truncate.small.text-muted: b-link(@click="popupSingleSMS(firstOtherLog)") {{ isSuccess(firstOtherLog) ? firstOtherLog.SMS_CONTENT : firstOtherLog.SMS_RESULT }}

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
    footer: { type: Boolean, default: false }
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
    popupSMS () {
      this.modal(this.$createElement(lahAdmSmslogTableVue, {
        props: {
          inKeyword: this.today,
          inLogs: this.logs
        }
      }), {
        title: '地政系統簡訊綜合記錄檔查詢',
        size: 'xl',
        noCloseOnBackdrop: true,
        centered: false,
        scrollable: false
      })
    },
    popupSingleSMS (item) {
      if (!this.$utils.empty(item)) {
        this.modal(this.$createElement(lahAdmSmslogTableVue, {
          props: {
            inKeyword: this.today,
            inLogs: [item]
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
}
</script>

<style lang="scss" scoped>
ul {
  padding-left: 21.25px;
}
</style>
