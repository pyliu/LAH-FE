<template lang="pug">
b-card(:class="classNames")
  b-card-title: .d-flex.align-items-center
    lah-transition
      lah-fa-icon(v-if="ready", icon="circle-check", variant="success", size="lg")
      lah-fa-icon(v-else-if="isBusy", icon="spinner", variant="muted", size="lg", action="spin")
      lah-fa-icon(v-else, icon="question", variant="muted", size="lg")
    .ml-1 複審案件統計
    lah-transition: b-badge.ml-1(pill, v-if="ready", variant="info", title="複審人數") {{ count }} 人
    lah-transition: b-badge.ml-1(pill, v-if="ready && totalCaseSum > 0", variant="primary", title="複審案件量總計") {{ totalCaseSum.toLocaleString() }} 件
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
      title="顯示詳細列表",
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
  b-card-sub-title.font-weight-bold.text-right 查詢區間：{{ period  }}
  section.my-2(v-if="ready")
    .h4.center.my-2(v-if="count === 0") 查無資料
    div(v-else)
      b-link.d-flex.justify-content-between.align-items-center.h5(
        v-for="(item, idx) in raw",
        :key="`final_${idx}`",
        v-if="idx < 3",
        @click="popup(item)"
      )
        .font-weight-bold {{ idx + 1 }}. {{ item.final_name }}
        b-badge(pill, :variant="idx === 0 ? 'primary' : idx === 1 ? 'info' : 'secondary'") {{ item.case_count }}
      .d-flex.justify-content-end: b-link.small.font-weight-bold(
        v-if="count > 3",
        @click="$refs.table.show()",
        title="查看所有資料"
      )
        lah-fa-icon(icon="ellipsis", action="wander-h") 更多
  .h4.center.my-2(v-else) ⚠ 請設定區間後查詢

  b-modal(
    ref="table",
    size="lg",
    title="複審案件統計",
    hide-footer
  )
    lah-transition: lah-pagination(
      v-if="count > pagination.perPage"
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
      head-variant="dark",
      :items="raw",
      :fields="fields",
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      :busy="isBusy",
      selectable,
      select-mode="single",
      selected-variant="primary",
      @row-selected="handleRowSelected"
    )
      template(#table-busy)
      template(#cell(序號)="data")
        template(v-if="data.rowSelected")
          span(aria-hidden="true") &check;
          span(class="sr-only") Selected
        template(v-else)
          span(aria-hidden="true") &nbsp;
          span(class="sr-only") Not selected
        span {{ (pagination.perPage * (pagination.currentPage - 1)) + data.index + 1 }}
</template>

<script>
import LahRegFinalReviewTable from './lah-reg-final-review-table.vue'

export default {
  emit: ['ready'],
  components: { LahRegFinalReviewTable },
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
      '序號',
      { key: 'office_name', label: '所別', sortable: false },
      { key: 'final_id', label: '複審代碼', sortable: true },
      { key: 'final_name', label: '複審姓名', sortable: true },
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
      return Array.isArray(this.raw) ? this.raw.length : 0
    },
    totalCaseSum () {
      if (!Array.isArray(this.raw)) {
        return 0
      }
      return this.raw.reduce((sum, item) => sum + (Number(item.case_count) || 0), 0)
    },
    xlsxJsons () {
      const fieldKeys = this.fields.map((field, idx, array) => field.key)
      const jsons = Array.isArray(this.raw)
        ? this.raw.map((data, idx, array) => {
          const obj = {}
          for (const [key, value] of Object.entries(data)) {
            if (fieldKeys.includes(key)) {
              obj[this.getLabel(key)] = value
            }
          }
          return obj
        })
        : []
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
  async created () {
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('reg-final-review-table-perPage') || 20)
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
          type: 'stats_reg_final_review_count',
          st: this.begin,
          ed: this.end
        }).then(({ data }) => {
          const status = this.$utils.statusCheck(data.status) ? '🟢' : '⚠'
          this.message = `${status} ${data.message}`
          const rows = Array.isArray(data.raw) ? data.raw : []
          this.raw = rows.map(item => ({
            ...item,
            case_count: Number(item.case_count) || 0
          }))
          this.$emit('ready', data)
          this.ready = true
        }).catch((err) => {
          this.error = err
          this.$emit('ready', null)
        }).finally(() => {
          this.isBusy = false
        })
    },
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('reg-final-review-table-perPage', payload.perPage)
    },
    popup (item) {
      this.modal(this.$createElement(LahRegFinalReviewTable, {
        props: {
          userId: item.final_id,
          begin: this.begin,
          end: this.end,
          tableSize: 'md'
        },
        on: {
          'not-found': () => {
            this.hideModal()
          }
        }
      }), {
        title: `複審 ${item.final_id} ${item.final_name} 案件詳情 ${this.begin} ~ ${this.end}`,
        size: 'xl'
      })
    },
    handleRowSelected (payload) {
      if (Array.isArray(payload) && payload.length > 0) {
        // this.$utils.warn('row selected', payload)
        this.popup(payload[0])
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
