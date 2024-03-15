<template lang="pug">
b-card(
  :no-body="embed",
  :class="embed ? ['border-0'] : []"
)
  template(
    #header,
    v-if="!embed"
  )
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1 #[lah-fa-icon(icon="file-circle-exclamation", size="lg", variant="info") 測量複丈通知書暫存檔]
      b-button-group.ml-auto(size="sm")
        lah-button.mr-1(
          icon="broom",
          variant="outline-danger",
          size="sm",
          @click="removeDanglingRecords",
          v-b-tooltip="`清除所有 ${year} 年無連結檔之孤立通知書暫存資料`",
          pill
        ) 清除無連結之暫存資料
        lah-button(
          icon="magnifying-glass",
          variant="outline-primary",
          size="sm",
          @click="query",
          v-b-tooltip="`查詢所有 ${year} 年通知書暫存資料`",
          pill
        ) 查詢
  .text-right: lah-message(:message="queryMessage", auto-hide)
  div(v-if="queryData.length > 0")
    hr(v-if="!emptyMessasge")
    b-table(
      :fields="fields",
      :items="queryData",
      :busy="isBusy",
      head-variant="dark",
      striped,
      hover,
      small
    )
      template(#cell(MC03)="{ item }")
        div(v-if="isEmptyMC03(item) || !hasCase(item)")
          .d-flex.align-items-center
            lah-button(
              icon="trash",
              variant="outline-danger",
              title="刪除這筆資料",
              @click="remove(item)"
            ) 清除
            .small.text-primary.ml-1(v-if="hasCase(item)") 案件狀態將回復為「外業中」，需重新進行補正作業
          hr
        p(
          v-html="item.MC03"
        )
</template>

<script>
export default {
  emit: ['load'],
  props: {
    embed: { type: Boolean, default: false },
    items: { type: Array, default: () => ([]) },
    inMessage: { type: String, default: '' }
  },
  data: () => ({
    year: '112',
    queryMessage: '',
    queryData: [],
    fields: [
      {
        key: 'MC01',
        label: '年度',
        sortable: true
      },
      {
        key: 'CL02',
        label: '收件字',
        sortable: true
      },
      {
        key: 'CL03',
        label: '收件號',
        sortable: true
      },
      {
        key: 'MC02',
        label: '序號',
        sortable: true
      },
      {
        key: 'MC03',
        label: '內容',
        sortable: true
      }
    ]
  }),
  computed: {
    count () {
      return this.queryData.length
    },
    emptyMessasge () {
      return this.$utils.empty(this.queryMessage)
    }
  },
  watch: {
    items (val) {
      if (Array.isArray(val)) {
        this.queryData = [...val]
        this.queryMessage = this.inMessage
      } else {
        this.queryData = []
        this.queryMessage = ''
      }
    },
    message (val) {
      this.queryMessage = val
    }
  },
  created () {
    const now = new Date()
    this.year = now.getFullYear() - 1911
    this.queryData = [...this.items]
    this.queryMessage = this.inMessage
  },
  mounted () {
    this.items.length === 0 && this.query()
  },
  methods: {
    query () {
      this.queryMessage = '讀取中 ...'
      this.isBusy = true
      this.$axios
        .post(this.$consts.API.JSON.MOICAS, {
          type: 'sur_notify_application_tmp_check',
          year: this.year
        }).then(({ data }) => {
          this.queryMessage = data.message
          this.queryData = [...data.raw]
          this.$emit('load', data)
        }).catch((err) => {
          this.error = err
        }).finally(() => {
          this.isBusy = false
        })
    },
    remove (item) {
      this.confirm(`請確認刪除 ${item.MC01}-${item.MC02} 暫存資料?`).then((YN) => {
        if (YN) {
          this.isBusy = true
          this.queryMessage = '刪除中 ...'
          this.$axios
            .post(this.$consts.API.JSON.MOICAS, {
              type: 'remove_sur_notify_application_tmp_record',
              MC01: item.MC01,
              MC02: item.MC02,
              YEAR: item.CL01,
              CODE: item.CL02 || '',
              NUM: item.CL03
            }).then(({ data }) => {
              this.queryMessage = data.message
              this.timeout(this.query, 1000)
            }).catch((err) => {
              this.error = err
            }).finally(() => {
              this.isBusy = false
            })
        }
      })
    },
    removeDanglingRecords () {
      this.isBusy = true
      this.$axios
        .post(this.$consts.API.JSON.MOICAS, {
          type: 'remove_dangling_sur_notify_application_tmp_record',
          year: this.year
        }).then(({ data }) => {
          this.success(data.message)
          this.queryMessage = data.message
          this.timeout(this.query, 1000)
        }).catch((err) => {
          this.error = err
        }).finally(() => {
          this.isBusy = false
        })
    },
    isEmptyMC03 (item) {
      return this.$utils.empty(item.MC03)
    },
    hasCase (item) {
      return !this.$utils.empty(item.CL02) && !this.$utils.empty(item.CL03)
    }
  }
}
</script>

<style lang="scss" scoped>
hr {
  margin-top: .5rem;
  margin-bottom: .5rem;
}
</style>
