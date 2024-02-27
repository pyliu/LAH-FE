<template lang="pug">
b-card(border-variant="secondary")
  template(#header)
    .d-flex.align-items-center
      h6.mb-0.mt-1
        lah-fa-icon(
          :icon="dataReady ? 'circle-check' : 'magnifying-glass'",
          :variant="dataReady ? 'success' : 'danger'",
          :action="dataReady ? 'breath' : 'swim'",
          size="lg"
        ) 搜尋登記案件
      a.text-primary.font-weight-bold(v-if="dataReady", href="#", @click="detail", title="顯示案件詳情") {{ $utils.caseId(caseId) }}
      b-button-group.ml-auto(size="sm")
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
          lah-button.mx-1(icon="window-restore", variant="outline-success", pill) 詳情
          span 顯示詳細資料彈出視窗。
        li.mt-1: .d-flex.align-items-center
          span 點選
          lah-button.mx-1(icon="arrow-rotate-left", variant="outline-secondary", action="cycle-alt", pill) 清除
          span 清除搜尋資料。

  lah-reg-case-input-group(
    v-model="caseId",
    :vertical="vertical",
    @enter="search"
  )
  lah-transition: .my-1(v-if="dataReady")
    b-row
      b-col 登記原因：{{ crsmsData['登記原因'] }}
      b-col 作業人員：{{ crsmsData['作業人員'] }}
    b-row
      b-col 辦理情形：{{ crsmsData['辦理情形'] }}
      b-col
        span 結案與否：
        b(:class="crsmsData['結案與否'] === 'Y' ? ['text-success'] : ['text-danger']") {{ crsmsData['結案狀態'] }} ({{ crsmsData['結案與否'] }})
    b-row
      b-col 收件日期：{{ crsmsData['收件日期'] }}
      b-col 結案日期：{{ crsmsData['結案日期'].split(' ')[0] }} {{ crsmsData['結案狀態'] }} ({{ crsmsData['結案與否'] }})
    b-row(:class="cellPhoneWarningCss")
      b-col(title="案件辦理情形簡訊接收號碼")
        lah-fa-icon(
          icon="mobile-screen",
          append,
          :variant="cellPhoneEmpty ? 'danger' : 'success'"
        ) 手機號碼：{{ cellPhoneEmpty ? '[未輸入]' : crsmsData['手機號碼'] }}
      b-col
        lah-fa-icon(
          v-if="cellPhoneEmpty",
          icon="triangle-exclamation",
          variant="warning"
        ) 本案無傳送辦理情形簡訊

  lah-transition: div(v-if="dataReady")
    hr
    .my-1: lah-fa-icon(icon="angles-right", action="move-fade-ltr", variant="danger") 案件狀態更新
    lah-mgmt-board-reg-case-state(embed)
    hr
    .my-1: lah-fa-icon(icon="angles-right", action="move-fade-ltr", variant="primary") 暫存檔
    lah-mgmt-board-reg-case-tmp(embed)

  template(#footer)
    .d-flex.justify-content-center
      lah-button(v-if="dataReady", icon="window-restore", variant="outline-success", @click="detail", pill) 詳情
      lah-button(v-else, icon="search", @click="search", :disabled="!validCaseId", pill) 查詢
      lah-button.ml-1(v-if="dataReady && stateButton", icon="floppy-disk", variant="outline-primary", @click="popupState", pill) 調整狀態
      lah-button.ml-1(v-if="dataReady && tempButton", icon="memory", variant="outline-dark", @click="popupTemp", pill) 暫存檔
      lah-button.h-100.ml-1(icon="arrow-rotate-left", variant="outline-secondary", action="cycle-alt", @click="clearSearchData", pill) 清除

</template>

<script>
import lahMgmtBoardRegCaseStateVue from './lah-mgmt-board-reg-case-state.vue'
import lahMgmtBoardRegCaseTmpVue from './lah-mgmt-board-reg-case-tmp.vue'
import lahRegCaseDetailVue from './lah-reg-case-detail.vue'

export default {
  components: { lahRegCaseDetailVue, lahMgmtBoardRegCaseStateVue, lahMgmtBoardRegCaseTmpVue },
  props: {
    stateButton: { type: Boolean, default: false },
    tempButton: { type: Boolean, default: false }
  },
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
    },
    cellPhoneEmpty () {
      return this.$utils.empty(this.crsmsData['手機號碼'])
    },
    cellPhoneWarningCss () {
      const css = []
      if (this.cellPhoneEmpty) {
        css.push('danger-border')
      }
      return css
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
    this.clearSearchData()
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
    },
    popupState () {
      this.modal(this.$createElement(lahMgmtBoardRegCaseStateVue), {
        title: `登記案件狀態管理 ${this.$utils.caseId(this.caseId)}`,
        size: 'md'
      })
    },
    popupTemp () {
      this.modal(this.$createElement(lahMgmtBoardRegCaseTmpVue), {
        title: `登記案件暫存檔管理 ${this.$utils.caseId(this.caseId)}`,
        size: 'md'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.danger-border {
  border: 2px dashed red;
  padding: 5px 0;
  margin: 0 2px;
}
</style>
