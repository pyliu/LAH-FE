<template lang="pug">
b-card
  template(#header)
    .d-flex
      h6.mb-0.mr-auto 搜尋登記案件 #[b.text-primary {{ $utils.caseId(caseId) }}]
      b-button-group(size="sm")
        b-checkbox(v-model="vertical", v-b-tooltip="'切換案件選擇介面橫豎顯示'", switch)
        lah-button(
          icon="question",
          action="breath",
          variant="outline-success",
          no-border,
          no-icon-gutter,
          @click="$refs.help.show()",
          title="搜尋登記案件說明"
        )
    lah-help-modal(ref="help", modal-title="搜尋登記案件說明")
      ul
        li: .d-flex.align-items-center
          span 選擇案件號後點選
          lah-button.mx-1(icon="search", variant="outline-primary", pill) 搜尋
          span 即可顯示案件狀態。
        li: .d-flex.align-items-center
          span 點選
          lah-button.mx-1(icon="window-restore", variant="outline-success") 詳情
          span 顯示詳細資料彈出視窗。
        li.mt-1: .d-flex.align-items-center
          span 點選
          lah-button.mx-1(icon="trash", variant="outline-secondary", pill) 詳情
          span 清除搜尋資料。

  .d-flex-column.my-1(v-if="dataReady")
    b-row
      b-col 登記原因：{{ crsmsData['登記原因'] }}
      b-col 作業人員：{{ crsmsData['作業人員'] }}
    b-row
      b-col 辦理情形：{{ crsmsData['辦理情形'] }}
      b-col 結案與否：{{ crsmsData['結案狀態'] }} ({{ crsmsData['結案與否'] }})
  lah-reg-case-input-group(
    v-model="caseId",
    :vertical="vertical"
  )

  template(#footer)
    .d-flex.justify-content-between
      lah-button(v-if="dataReady", icon="window-restore", variant="outline-success", @click="detail") 詳情
      lah-button(v-else, icon="search", @click="search", pill, :disabled="!validCaseId") 查詢
      lah-button(icon="trash", variant="outline-secondary", @click="clearSearchData", pill) 清除

</template>

<script>
import lahRegCaseDetailVue from './lah-reg-case-detail.vue'

export default {
  components: { lahRegCaseDetailVue },
  data: () => ({
    caseId: '',
    vertical: false
  }),
  computed: {
    dataReady () {
      return !this.$utils.empty(this.crsmsData)
    },
    crsmsData () {
      return this.$store.getters['inf/crsmsData']
    },
    validCaseId () {
      if (this.$utils.empty(this.caseId)) {
        return false
      }
      if (this.caseId.length !== 13) {
        return false
      }
      const number = this.caseId.substring(7)
      if (parseInt(number) < 1) {
        return false
      }
      return true
    }
  },
  watch: {
    caseId (val) {
      this.clearSearchData()
    },
    vertical (val) {
      this.setCache('lah-mgmt-board-search-reg-case-vertical', val)
    }
    // ,crsmsData (val) {
    //   console.warn(val)
    // }
  },
  async created () {
    this.vertical = await this.getCache('lah-mgmt-board-search-reg-case-vertical') || false
  },
  methods: {
    search () {
      this.clearSearchData()
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.QUERY, {
        type: 'reg_case',
        id: this.caseId
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.$store.commit('inf/crsmsData', data.baked)
        } else {
          this.alert(data.message, {
            title: '搜尋登記案件',
            type: 'warning'
          })
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isBusy = false
      })
    },
    clearSearchData () {
      this.$store.commit('inf/crsmsData', undefined)
    },
    detail () {
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: {
          caseId: this.caseId,
          parentData: this.crsmsData
        },
        on: {
          // ready: (e) => {
          //   this.modalLoading = !e.detail
          // },
          // dataReady: (e) => {
          //   this.$store.commit('inf/crsmsData', e.detail)
          //   // console.warn(this.crsmsData)
          // }
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
