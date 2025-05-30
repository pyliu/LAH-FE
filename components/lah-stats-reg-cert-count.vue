<template lang="pug">
b-card(
  :class="classNames"
)
  b-card-title: .d-flex.align-items-center
    lah-transition
      lah-fa-icon(v-if="ready", icon="circle-check", variant="success", size="lg")
      lah-fa-icon(v-else-if="isBusy", icon="spinner", variant="muted", size="lg", action="spin")
      lah-fa-icon(v-else, icon="xmark", variant="muted", size="lg")
    .ml-1 {{ period  }} 謄本核發案件統計
    lah-transition: b-badge.ml-1(pill, v-if="ready", variant="info", title="本所+工作站") {{ count }}
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
      title="顯示案件列表",
      :disabled="isBusy",
      pill,
      no-icon-gutter,
      @click="displayCaseModal('all')"
    )
    lah-button.ml-1(
      icon="magnifying-glass",
      title="重新查詢",
      :disabled="isBusy",
      :spin="isBusy",
      pill,
      no-icon-gutter,
      @click="query"
    )
  .my-2(v-if="count > 0")
    .d-flex.justify-content-around
      b-link.h4(@click="displayCaseModal('in')", title="開啟本所核發案件列表") 本所 #[b-badge(pill, variant="success") {{ inCount }}]
      b-link.h4(@click="displayCaseModal('out')", title="開啟工作站核發案件列表") 工作站 #[b-badge(pill, variant="warning") {{ outCount }}]
    .d-flex.my-1.align-items-center
      lah-fa-icon.h6(icon="angles-right", action="move-fade-ltr") 選擇工作站人員(按住 Ctrl/Shift 多選)，目前已選擇 {{ operatorsCount }} 人
      //- lah-button(
      //-   :icon="openOperatorSelect ? 'angles-up' : 'angles-down'",
      //-   :icon-append="true",
      //-   @click="openOperatorSelect = !openOperatorSelect",
      //-   :title="`按住 Ctrl/Shift 多選(已選擇${operatorsCount})`"
      //- ) 選擇工作站人員({{ operatorsCount }})

    b-collapse(v-model="openOperatorSelect"): .d-flex
      b-select(
        v-model="operators",
        :options="operatorOpts",
        multiple
      )
      b-tags.ml-1(
        v-model="operators",
        tag-variant="primary",
        size="sm",
        placeholder="輸入工作站員工代碼",
        tag-pills,
        add-on-change,
        no-outer-focus
      )
    .text-right: lah-message.text-info(:message="message")
  .h4.center.my-2(v-else) ⚠ 請設定區間後查詢
  b-modal(
    ref="table",
    size="lg",
    :title="displayTitle",
    hide-footer
  )
    lah-pagination(
      v-model="pagination",
      :total-rows="displayCount"
      :caption="`找到 ${displayCount} 筆資料`"
    )
    b-table(
      :items="displayCase",
      :fields="xlsxFields",
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      head-variant="dark",
      bordered,
      hover,
      striped,
      small,
      no-caption
    )
      template(#cell(MU13)="row")
        span {{ $utils.addTimeDivider(row.item.MU13) }}
      template(#cell(MU11)="row")
        span {{ row.item.SR_NAME }} {{ row.item.MU11 }}
</template>

<script>
export default {
  emit: ['ready'],
  component: {},
  props: {
    noBorder: { type: Boolean, default: false },
    begin: { type: String, default: '' },
    end: { type: String, default: '' }
  },
  data: () => ({
    caseType: 'all',
    openOperatorSelect: true,
    operators: [],
    ready: false,
    queryOK: false,
    raw: [],
    message: '',
    xlsxFields: [
      {
        key: 'MU01',
        label: '收件年',
        sortable: true
      },
      {
        key: 'MU02',
        label: '收件字',
        sortable: true
      },
      {
        key: 'MU03',
        label: '收件號',
        sortable: true
      },
      {
        key: 'MU11',
        label: '收件人員',
        sortable: true
      },
      // {
      //   key: 'MU12',
      //   label: '收件日期',
      //   sortable: true
      // },
      {
        key: 'MU13',
        label: '收件時間',
        sortable: true
      }
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
    xlsxJsons () {
      const fieldKeys = this.xlsxFields.map((field, idx, array) => field.key)
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
    },
    operatorsCount () {
      return this.operators?.length || 0
    },
    operatorOpts () {
      if (this.count > 0) {
        const map = new Map()
        this.$utils.sortBy(this.raw, 'MU11').forEach((row) => {
          map.set(row.MU11, {
            text: `${row.SR_NAME} ${row.MU11}`,
            value: row.MU11
          })
        })
        return Array.from(map.values())
      }
      return []
    },
    outCase () {
      const filtered = this.raw?.filter((element, idx, arr) => {
        return this.operators.includes(element.MU11)
      })
      return filtered || []
    },
    outCount () {
      return this.outCase.length
    },
    inCase () {
      const filtered = this.raw?.filter((element, idx, arr) => {
        return !this.operators.includes(element.MU11)
      })
      return filtered || []
    },
    inCount () {
      return this.inCase.length
    },
    displayCase () {
      if (this.caseType === 'in') {
        return this.inCase
      }
      if (this.caseType === 'out') {
        return this.outCase
      }
      return this.raw
    },
    displayCount () {
      return this.displayCase.length
    },
    displayTitle () {
      const today = this.$utils.today('TW')
      if (this.caseType === 'in') {
        return `本所(${this.site})謄本案件列表 ${today}`
      }
      if (this.caseType === 'out') {
        return `工作站謄本案件列表 ${today}`
      }
      return `謄本案件列表 ${today}`
    }
  },
  watch: {
    async raw (dontcare) {
      const cached = await this.getCache('lah-stats-reg-cert-count-operators')
      if (Array.isArray(cached)) {
        this.operators = [...cached]
      }
    },
    message (dontcare) {
      // this.debounceClearMessage()
    },
    operators (val) {
      this.setCache('lah-stats-reg-cert-count-operators', val)
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
    displayCaseModal (type = 'all') {
      this.caseType = type
      this.$refs.table.show()
    },
    getLabel (key) {
      const found = this.xlsxFields.find((item, idx, array) => {
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
      this.$axios.post(this.$consts.API.JSON.STATS, {
        type: 'stats_reg_cert_case',
        st: this.begin,
        ed: this.end
      }).then(({ data }) => {
        this.queryOK = this.$utils.statusCheck(data.status)
        this.raw = [...data.raw]
        this.message = `${data.message} (更新時間 ${this.$utils.formatTime()})`
        this.$emit('ready', data)
        this.ready = true
      }).catch((err) => {
        this.$utils.error(err)
        this.message = err.toString()
      }).finally(() => {
        this.isBusy = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
