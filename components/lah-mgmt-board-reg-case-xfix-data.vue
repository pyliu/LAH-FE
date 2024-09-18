<template lang="pug">
b-card(
  border-variant="secondary",
  :no-body="embed",
  :class="embed ? ['border-0'] : []"
)
  template(
    #header,
    v-if="!embed"
  )
    .d-flex.align-items-center
      h6.mb-0.mt-1.mr-1
        lah-fa-icon(
          icon="memory",
          size="lg",
          :action="dataReady ? 'breath' : ''"
        ) 登記案件補正資料
      a.text-primary.font-weight-bold(href="#", @click="detail", title="顯示案件詳情") {{ $utils.caseId(caseId) }}
      b-button-group.ml-auto(size="sm"): lah-button(
        icon="question",
        action="breath",
        variant="outline-success",
        no-border,
        no-icon-gutter,
        @click="$refs.help.show()",
        title="登記案件補正資料同步說明"
      )
    lah-help-modal(ref="help", modal-title="登記案件補正資料同步說明")
      ul.h5
        li: .d-flex.align-items-center
          div 本項功能協助顯示案件補正資料狀態。
        li: .d-flex.align-items-center
          div 如欲同步跨所補正資料請按更新進行。

  lah-transition
    h5.center(v-if="!dataReady"): lah-fa-icon(icon="triangle-exclamation", variant="warning") 請先搜尋案件！
    div(v-else)
      div(v-if="found")
        hr
        .text-center
          b-button.ml-1(@click="sync", size="sm") 同步
      .center-container-wh-100
        lah-fa-icon(v-if="notFound" icon="exclamation-circle" variant="success" size="lg") 無補正資料。
        lah-fa-icon(v-if="loading" action="spin" icon="spinner" size="lg") 讀取中
</template>

<script>
import lahRegCaseDetailVue from './lah-reg-case-detail.vue';
export default {
  components: { lahRegCaseDetailVue },
  props: {
    embed: { type: Boolean, default: false }
  },
  data: () => ({
  }),
  computed: {
    caseId () {
      if (this.dataReady) {
        return this.crsmsData?.ID
      }
      return ''
    },
    dataReady () {
      return !this.$utils.empty(this.crsmsData)
    },
    crsmsData () {
      return this.$store.getters['inf/crsmsData']
    },
    year () {
      return this.crsmsData?.RM01 || ''
    },
    code () {
      return this.crsmsData?.RM02 || ''
    },
    number () {
      return this.crsmsData?.RM03 || ''
    },
    found () {
      return !this.$utils.empty(this.filtered)
    },
    notFound () {
      return !this.found
    },
    loading () {
      return this.isBusy
    },
    prefix () {
      return `${this.year}-${this.code}-${this.number}`
    }
  },
  watch: {
    crsmsData (dontcare) {
      this.filtered = null
      this.query()
    }
  },
  created () {
    this.busyIconSize = '1x'
    this.query = this.$utils.debounce(() => {
      if (
        !this.$utils.empty(this.year) &&
        !this.$utils.empty(this.code) &&
        !this.$utils.empty(this.number)
      ) {
        this.isBusy = true
        this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'query_temp_data',
          year: this.year,
          code: this.code,
          number: this.number
        }).then((res) => {
          console.assert(res.data.status === this.$consts.XHR_STATUS_CODE.SUCCESS_NORMAL, `查詢暫存資料回傳狀態碼有問題【${res.data.status}】`)

          this.filtered = []
          // res.data.raw structure: 0 - Table, 1 - all raw data, 2 - SQL
          this.filtered = res.data.raw?.filter((item, index, array) => {
            return item[1]?.length > 0
          })
          // initialize backup flag array for backup detection
          this.backupFlags = Array(this.filtered?.length).fill(false)
        }).catch((err) => {
          this.$utils.error(err)
        }).finally(() => {
          this.isBusy = false
        })
      }
    }, 1000)
    this.query()
  },
  mounted () {},
  methods: {
    detail () {
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: {
          caseId: this.caseId,
          parentData: this.crsmsData
        }
      }), {
        title: `登記案件詳情 ${this.$utils.caseId(this.caseId)}`,
        size: 'xl'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
