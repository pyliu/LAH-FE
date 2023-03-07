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
        lah-button(
          icon="magnifying-glass",
          variant="outline-primary",
          size="sm",
          @click="fetch",
          v-b-tooltip="`查詢所有 ${year} 年通知書暫存資料`",
          pill
        ) 查詢
  .truncate.d-flex.align-items-center(v-if="!emptyMessasge") {{ queryMessage }}
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
</template>

<script>
export default {
  emit: ['load'],
  props: {
    embed: { type: Boolean, default: false },
    items: { type: Array, default: () => ([]) },
    message: { type: String, default: '' }
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
        this.queryMessage = this.message
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
    this.queryMessage = this.message
  },
  methods: {
    fetch () {
      this.queryMessage = '讀取中 ...'
      this.$axios
        .post(this.$consts.API.JSON.MOICAS, {
          type: 'cmcrd_tmp_check',
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
