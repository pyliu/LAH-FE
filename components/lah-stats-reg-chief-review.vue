<template lang="pug">
b-card(:class="classNames")
  b-card-title: .d-flex.align-items-center
    lah-transition
      lah-fa-icon(v-if="ready", icon="circle-check", variant="success", size="lg")
      lah-fa-icon(v-else-if="isBusy", icon="spinner", variant="muted", size="lg", action="spin")
      lah-fa-icon(v-else, icon="question", variant="muted", size="lg")
    .ml-1 課長案件統計
    lah-transition: b-badge.ml-1(pill, v-if="ready", variant="info", title="小計") {{ count }}
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
      v-if="ready && raw.length > 0"
      icon="window-maximize",
      title="顯示詳細列表",
      :disabled="isBusy",
      pill,
      no-icon-gutter,
      @click="$refs.table.show()"
    )
    lah-button.ml-1(
      icon="arrow-rotate-right",
      action="spin",
      title="重新查詢",
      :disabled="isBusy",
      :spin="isBusy",
      @click="query",
      pill,
      no-icon-gutter
    )
  b-card-sub-title.text-right {{ period  }}
  section.my-2(v-if="ready")
    .h4.center.my-2(v-if="raw.length === 0") 查無資料
    div(v-else)
      b-link.d-flex.justify-content-between.align-items-center.h5(
        v-for="(item, idx) in raw",
        :key="`chief_${idx}`",
        @click="popup(item)"
      )
        .font-weight-bold {{ idx + 1 }}. {{ item.chief_name }}
        b-badge(pill, :variant="idx === 0 ? 'primary' : idx === 1 ? 'info' : 'secondary'") {{ item.case_count }}
      b-link.small.font-weight-bold(
        v-if="raw.length > 3",
        @click="$refs.table.show()",
        title="查看所有資料"
      )
        lah-fa-icon(icon="ellipsis", action="wander-h") 更多
  .h4.center.my-2(v-else) ⚠ 請設定區間後查詢

  b-modal(
    ref="table",
    title="課長案件統計",
    hide-footer
  )
    lah-transition: lah-pagination(
      v-if="raw.length > pagination.perPage"
      v-model="pagination",
      :total-rows="count"
      :caption="`找到 ${count} 筆資料`",
      @input="handlePaginationInput"
    )
    b-table.text-center.s-90(
      ref="tbl",
      striped,
      hover,
      responsive,
      bordered,
      caption-top,
      no-border-collapse,
      small,
      head-variant="dark"
      :items="raw",
      :fields="fields",
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      :busy="isBusy",
      selectable
      select-mode="single"
      selected-variant="primary"
    )
        template(#table-busy)
</template>

<script>
export default {
  emit: ['ready'],
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
      { key: 'office_name', label: '所別', sortable: false },
      { key: 'chief_id', label: '課長代碼', sortable: true },
      { key: 'chief_name', label: '課長姓名', sortable: true },
      { key: 'case_count', label: '案件量', sortable: true }
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
    },
    raw (val) {
      this.$utils.warn(val)
    }
  },
  async created () {
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('reg-initial-review-table-perPage') || 20)
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
      this.pagination.currentPage = 1
    },
    query () {
      this.isBusy = true
      this.reset()
      this.$axios
        .post(this.$consts.API.JSON.STATS, {
          type: 'stats_reg_chief_review_count',
          st: this.begin,
          ed: this.end
        }).then(({ data }) => {
          const status = this.$utils.statusCheck(data.status) ? '🟢' : '⚠'
          this.message = `${status} ${data.message}`
          this.raw = [...data.raw]
          // this.$emit('reload', {
          //   keyword: `${this.begin} ~ ${this.end}`,
          //   logs: this.raw
          // })
          this.$emit('ready', data)
          this.ready = true
        }).catch((err) => {
          this.error = err
        }).finally(() => {
          this.isBusy = false
        })
    },
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('reg-chief-review-table-perPage', payload.perPage)
    },
    popup (item) {}
  }
}
</script>

<style lang="scss" scoped>
</style>
