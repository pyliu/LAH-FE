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
      h6.mb-0.mt-1.mr-1 #[lah-fa-icon(icon="file-circle-exclamation", size="lg") 測量通知書暫存檔檢測]
      b-button-group.ml-auto(size="sm")
        b-button.text-nowrap(
          variant="outline-primary",
          size="sm",
          @click="$fetch",
          v-b-tooltip="`查詢所有 ${year} 年度暫存通知書資料`",
          pill
        ) {{ year }}年 #[b-badge(variant="secondary", pill) {{ count }}]
  .truncate.d-flex.align-items-center {{ queryMessage }}
  div(v-if="queryData.length > 0")
    hr
    b-table(:items="queryData")
</template>

<script>
export default {
  props: {
    embed: { type: Boolean, default: false }
  },
  data: () => ({
    year: '112',
    queryMessage: '',
    queryData: []
  }),
  fetch () {
    this.queryMessage = '讀取中 ...'
    this.$axios
      .post(this.$consts.API.JSON.MOICAS, {
        type: 'cmcrd_tmp_check',
        year: this.year
      }).then(({ data }) => {
        this.queryMessage = data.message
        this.queryData = [...data.raw]
      }).catch((err) => {
        this.error = err
      }).finally(() => {
        this.isBusy = false
      })
  },
  computed: {
    count () {
      return this.queryData.length
    }
  },
  watch: { },
  created () {
    const now = new Date()
    this.year = now.getFullYear() - 1911
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
hr {
  margin-top: .5rem;
  margin-bottom: .5rem;
}
</style>
