<template lang="pug">
b-card(
  :class="classNames"
)
  b-card-title: .d-flex.align-items-center
    lah-transition
      lah-fa-icon(v-if="ready", icon="circle-check", variant="success", size="lg")
      lah-fa-icon(v-else-if="isBusy", icon="road-barrier", variant="muted", size="lg")
      lah-fa-icon(v-else, icon="xmark", variant="muted", size="lg")
    .ml-1 {{ period  }} 簡訊統計
    lah-transition: b-badge.ml-1(pill, v-if="ready", variant="info", title="所有類型小計") {{ count }}
    lah-transition: lah-button-xlsx.ml-1(
      v-if="count > 0",
      regular,
      icon="file-excel",
      size="sm",
      :variant="'success'",
      :jsons="xlsxJsons",
      pill
    )
    lah-transition: lah-button.ml-1(
      v-if="ready && count > 0"
      icon="window-maximize",
      title="顯示簡訊列表",
      :disabled="isBusy",
      pill,
      no-icon-gutter,
      @click="$refs.table.show()"
    )
    lah-button.ml-1(
      icon="magnifying-glass",
      title="重新查詢",
      :disabled="isBusy",
      :spin="isBusy",
      @click="query",
      pill,
      no-icon-gutter
    )

  section(v-if="ready")
    b-link.d-flex.justify-content-between.align-items-center.h5(@click="popupSMSLogs(notifyLogs)")
      lah-fa-icon.font-weight-bold(icon="landmark", variant="primary") 地籍異動即時通
      b-badge(pill, variant="primary") {{ notifyLogs.length }}
    b-link.d-flex.justify-content-between.align-items-center.h5.my-3(@click="popupSMSLogs(caseLogs)")
      lah-fa-icon.font-weight-bold(icon="scroll", variant="success") 案件辦理情形
      b-badge(pill, variant="success") {{ caseLogs.length }}
    b-link.d-flex.justify-content-between.align-items-center.h5(@click="popupSMSLogs(otherLogs)")
      lah-fa-icon.font-weight-bold(icon="envelope") 其他類型(住址隱匿/代收代寄)
      b-badge(pill, variant="dark") {{ otherLogs.length }}
  .h4.center(v-else) ⚠ 請設定區間後查詢

  b-modal(
    ref="table",
    size="xl",
    title="簡訊統計",
    hide-footer
  )
    lah-adm-smslog-table(:in-logs="raw", :in-keyword="`${begin} ~ ${end}`")
</template>

<script>
import lahAdmSmslogTableVue from '~/components/lah-adm-smslog-table.vue'
export default {
  emit: ['ready'],
  component: { lahAdmSmslogTableVue },
  props: {
    noBorder: { type: Boolean, default: false },
    begin: { type: String, default: '' },
    end: { type: String, default: '' }
  },
  data: () => ({
    ready: false,
    queryOK: false,
    raw: [],
    message: '',
    fields: [
      { key: 'SMS_YEAR', label: '收件年', sortable: true },
      { key: 'SMS_CODE', label: '收件字', sortable: true },
      { key: 'SMS_NUMBER', label: '收件號', sortable: true },
      { key: 'SMS_TYPE', label: '種類', sortable: true },
      { key: 'SMS_DATE', label: '日期', sortable: true },
      { key: 'SMS_TIME', label: '時間', sortable: true },
      { key: 'SMS_CELL', label: '手機號碼', sortable: true },
      { key: 'SMS_MAIL', label: '其他', sortable: true },
      { key: 'SMS_RESULT', label: '結果', sortable: true },
      { key: 'SMS_CONTENT', label: '內容', sortable: true }
      // { key: 'SMS_APIMSG', label: 'API回應訊息', sortable: true }
    ],
    pagination: {
      perPage: 20,
      currentPage: 1
    }
  }),
  computed: {
    period () {
      if (this.$utils.empty(this.begin) || this.$utils.empty(this.end)) {
        return ''
      }
      return `${this.$utils.addDateDivider(this.begin)} ~ ${this.$utils.addDateDivider(this.end)}`
    },
    classNames () {
      const list = []
      if (this.noBorder) {
        list.push('border-0')
      }
      return list
    },
    count () {
      return this.raw?.length || 0
    },
    notifyLogs () {
      return this.raw.filter((log) => {
        return ['地籍異動即時通'].includes(log.SMS_TYPE)
      })
    },
    caseLogs () {
      return this.raw.filter((log) => {
        return ['案件辦理情形'].includes(log.SMS_TYPE)
      })
    },
    otherLogs () {
      return this.raw.filter((log) => {
        return !['案件辦理情形', '地籍異動即時通'].includes(log.SMS_TYPE)
      })
    },
    xlsxJsons () {
      const fieldKeys = this.fields.map((field, idx, array) => field.key)
      const jsons = this.raw?.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            obj[this.getLabel(key)] = value
          }
        }
        return obj
      }) || []
      return jsons
    }
  },
  watch: {
    message (dontcare) {
      // this.debounceClearMessage()
    },
    begin (dontcare) {
      this.reset()
    },
    end (dontcare) {
      this.reset()
    }
  },
  created () {
    // this.debounceClearMessage = this.$utils.debounce(() => { this.message = '' }, 5000)
  },
  mounted () {},
  methods: {
    getLabel (key) {
      const found = this.fields.find((item, idx, array) => {
        return this.$utils.equal(item.key, key)
      })
      if (found && found.label) {
        return found.label
      }
      return key
    },
    reset () {
      this.ready = false
      this.queryOK = false
      this.message = ''
      this.raw = []
    },
    query () {
      this.isBusy = true
      this.reset()
      this.$axios
        .post(this.$consts.API.JSON.MOISMS, {
          type: 'moisms_log_query_by_date',
          st: this.begin,
          ed: this.end
        }).then(({ data }) => {
          const status = this.$utils.statusCheck(data.status) ? '🟢' : '⚠'
          this.message = `${status} ${data.message}`
          this.raw = Array.isArray(data.raw) ? [...data.raw] : []
          this.$emit('ready', data)
          this.ready = true
        }).catch((err) => {
          this.error = err
          this.$emit('ready', null)
        }).finally(() => {
          this.isBusy = false
        })
    },
    popupSMSLogs (logs) {
      this.modal(this.$createElement(lahAdmSmslogTableVue, {
        props: {
          inLogs: logs,
          inKeyword: this.period,
          displayMode: true
        }
      }), {
        title: '簡訊記錄檔查詢',
        size: 'xl',
        noCloseOnBackdrop: false,
        centered: false,
        scrollable: false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
