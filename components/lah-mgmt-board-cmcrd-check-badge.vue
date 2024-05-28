<template lang="pug">
b-card.border-0(no-body)
  .d-flex.align-items-center(v-b-tooltip="`上次檢測時間：${lastUpdated}`")
    lah-fa-icon.h6(
      :icon="foundDanglingData ? 'file-circle-exclamation' : 'circle-check'",
      :variant="foundDanglingData ? 'danger' : 'success'"
      size="lg",
    ) 複丈通知書暫存檔檢測
    .ml-auto {{ queryMessage }}
    b-button-group.ml-auto(size="sm")
      //- lah-button.mr-1(
      //-   v-if="foundDanglingData",
      //-   icon="broom",
      //-   variant="outline-danger",
      //-   size="sm",
      //-   @click="removeDanglingRecords",
      //-   v-b-tooltip="`清除所有 ${year} 年無連結檔之孤立通知書暫存資料`",
      //-   pill
      //- ) 清除無案件之暫存資料
      lah-button(
        :icon="foundDanglingData ? 'circle-exclamation' : 'window-maximize'",
        :variant="foundDanglingData ? 'danger' : 'outline-primary'",
        size="sm",
        @click="popup",
        v-b-tooltip="'開啟詳細結果視窗'",
        pill
      ) 顯示
</template>

<script>
import lahMgmtBoardCmcrdCheckVue from '~/components/lah-mgmt-board-cmcrd-check.vue'
export default {
  emit: [],
  components: { lahMgmtBoardCmcrdCheckVue },
  props: {},
  data: () => ({
    year: '113',
    queryMessage: '',
    queryData: [],
    timer: null,
    lastUpdated: ''
  }),
  computed: {
    count () {
      return this.queryData.length
    },
    foundDanglingData () {
      if (this.count > 0) {
        return this.queryData.find((item) => {
          return this.$utils.empty(item.CL02) || this.$utils.empty(item.CL03)
        })
      }
      return false
    }
  },
  watch: {
    foundDanglingData (val) {
      this.queryMessage = ''
      if (val) {
        this.queryMessage = '請注意!'
      }
    }
  },
  created () {
    const now = new Date()
    this.year = now.getFullYear() - 1911
  },
  mounted () {
    this.query()
    this.timer = setInterval(this.query, 5 * 60 * 1000)
  },
  beforeDestroy () {
    clearInterval(this.timer)
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
          this.queryMessage = ''
          this.queryData = [...data.raw]
          this.$emit('load', data)
        }).catch((err) => {
          this.error = err
        }).finally(() => {
          this.isBusy = false
          this.lastUpdated = this.$utils.time()
        })
    },
    popup () {
      this.modal(this.$createElement(lahMgmtBoardCmcrdCheckVue, {
        props: {
          embedMode: false,
          items: this.queryData
        }
      }), {
        title: '複丈通知書暫存檔列表',
        size: 'lg'
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
