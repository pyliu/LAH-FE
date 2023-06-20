<template lang="pug">
b-card(
  :class="classNames"
)
  b-card-title: .d-flex.align-items-center
    lah-transition
      lah-fa-icon(v-if="ready", icon="circle-check", variant="success", size="lg")
      lah-fa-icon(v-else-if="isBusy", icon="road-barrier", variant="muted", size="lg")
      lah-fa-icon(v-else, icon="xmark", variant="muted", size="lg")
    .ml-1 {{ rm02Name || rm02 }}({{ rm02 }}) 案件
    lah-transition: b-badge.ml-1(:variant="badgeVar", pill, v-if="ready") {{ count }}
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
      @click="$refs.table.show()"
    )
    lah-button.ml-1(
      icon="arrow-rotate-right",
      action="spin",
      title="重新查詢",
      :variant="queryBtnVar",
      :disabled="isBusy",
      :spin="isBusy",
      pill,
      no-icon-gutter,
      @click="query"
    )
  b-card-sub-title(v-if="!$utils.empty(period)"): .d-flex.justify-content-between
    span {{ period }}
    lah-message.text-info(:message="message")
  h6.mt-2(v-if="firstCase") 起始號：{{ firstCase.RM03 }}
  h6.mt-2(v-if="lastCase") 終止號：{{ lastCase.RM03 }}
  h6.mt-2.text-danger(v-if="missCaseNumber.length > 0") 缺號： {{ missCaseNumber.join('、') }}
  b-modal(
    ref="table",
    size="lg",
    :title="`${rm02} 登記案件列表 ${period}`",
    hide-footer
  )
    lah-pagination(
      v-model="pagination",
      :total-rows="count"
      :caption="`找到 ${count} 筆資料`"
    )
    lah-reg-b-table(
      :baked-data="raw",
      :max-height-offset="135"
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      no-caption
    )
</template>

<script>
export default {
  emit: ['ready'],
  component: {},
  props: {
    rm02: { type: String, default: '' },
    rm02Name: { type: String, default: '' },
    begin: { type: String, default: '' },
    end: { type: String, default: '' },
    noBorder: { type: Boolean, default: false }
  },
  data: () => ({
    ready: false,
    queryOK: false,
    raw: [],
    message: '',
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    xlsxFields: [
      {
        key: 'RM01',
        label: '收件年',
        sortable: true
      },
      {
        key: 'RM02',
        label: '收件字',
        sortable: true
      },
      {
        key: 'RM03',
        label: '收件號',
        sortable: true
      },
      {
        key: 'RM09',
        label: '登記原因代碼',
        sortable: true
      },
      {
        key: 'RM09_CHT',
        label: '登記原因',
        sortable: true
      },
      {
        key: 'RM07_1',
        label: '收件日期',
        sortable: true
      }
    ]
  }),
  computed: {
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
    firstCase () {
      if (this.count > 0) {
        return this.raw[0]
      }
      return undefined
    },
    lastCase () {
      if (this.count > 0) {
        return this.raw[this.count - 1]
      }
      return undefined
    },
    period () {
      if (this.$utils.empty(this.begin) || this.$utils.empty(this.end)) {
        return ''
      }
      return `${this.$utils.addDateDivider(this.begin)} ~ ${this.$utils.addDateDivider(this.end)}`
    },
    badgeVar () {
      if (!this.queryOK) {
        return 'danger'
      }
      if (this.count === 0) {
        return 'secondary'
      }
      return 'info'
    },
    queryBtnVar () {
      return this.ready ? 'outline-success' : 'outline-primary'
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
    missCaseNumber () {
      const missing = []
      if (this.count > 0) {
        const numberList = this.raw.map((item, idx, arr) => {
          return item.RM03
        })
        const first = parseInt(numberList[0])
        const last = parseInt(numberList[numberList.length - 1])
        for (let i = first; i < last; i += 10) {
          const criteria = i.toString().padStart(6, '0')
          if (!numberList.includes(criteria)) {
            missing.push(criteria)
          }
        }
      }
      return missing
    }
  },
  watch: {
    begin (dontcare) {
      this.reset()
    },
    end (dontcare) {
      this.reset()
    },
    message (dontcare) {
      // this.debounceClearMessage()
    }
  },
  created () {
    this.debounceClearMessage = this.$utils.debounce(() => { this.message = '' }, 10000)
  },
  mounted () {},
  methods: {
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
        type: 'stats_reg_rm02_count',
        rm02: this.rm02,
        st: this.begin,
        ed: this.end
      }).then(({ data }) => {
        this.queryOK = this.$utils.statusCheck(data.status)
        this.raw = data.raw
        this.message = data.message
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
