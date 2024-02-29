<template lang="pug">
div
  .d-flex.align-items-center.justify-content-between.mb-2(title="輸入手機或EMAIL查詢")
    lah-message(:message="message")
    div
    .d-flex.align-items-center
      b-radio-group.text-nowrap(
        v-model="searchType"
        :options="searchOpts"
      )
      lah-fa-icon.text-nowrap.mx-1(
        icon="comment-sms",
        size="2x",
        append
      ) 關鍵字
      b-input.keyword-mw(
        v-model="keyword",
        placeholder="... 日期/手機/EMAIL ..."
      )
      lah-button.ml-1(
        title="依條件查詢SMS紀錄",
        size="md",
        @click="reload",
        :disabled="!validSMSKeyword"
      ) 更新
  lah-transition: lah-pagination(
    v-if="count > pagination.perPage"
    v-model="pagination",
    :total-rows="count"
    :caption="`找到 ${count} 筆資料`"
  )
  lah-transition
    .h5.center(v-if="isBusy"): lah-fa-icon(
      icon="spinner",
      action="spin"
    ) 讀取中
    b-table.text-center.s-90(
      v-else-if="count > 0",
      ref="tbl",
      striped,
      hover,
      responsive,
      bordered,
      caption-top,
      no-border-collapse,
      small,
      head-variant="dark"
      :items="logs",
      :fields="fields",
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      :busy="isBusy || busy",
      :sticky-header="`${maxHeight}px`"
    )
      template(#table-busy)
      template(#cell(MS04_2)="{ item }")
        span(v-if="item.MS04_1.startsWith('SM')") {{ `${item.MS03}-${item.MS04_1}-${item.MS04_2}` }}
        b-link(
          v-else,
          href="#",
          @click="popup(item)"
        ) {{ `${item.MS03}-${item.MS04_1}-${item.MS04_2}` }}
      template(#cell(MS07_1)="{ item }")
        b-link(href="#", @click="keyword = item.MS07_1; searchType = 'date'") {{ item.MS07_1 }}
      template(#cell(MS14)="{ item }")
        b-link(href="#", @click="keyword = item.MS14; searchType = 'cell'") {{ item.MS14 }}
      template(#cell(MS_MAIL)="{ item }")
        b-link(href="#", @click="keyword = item.MS_MAIL; searchType = 'email'") {{ item.MS_MAIL }}
      template(#cell(MS_NOTE)="{ item }")
        .text-left {{ item.MS_NOTE }}
      template(#cell(MS31)="{ item }")
        span {{ item.MS31 === 'S' ? '成功' : '失敗' }}
      //- template(#cell(MS_NOTE)="{ item }")
      //-   b-link(href="#", @click="keyword = item.MS_NOTE; searchType = 'note'") {{ item.MS_NOTE }}
    .h5.center(v-else): lah-fa-icon(
      icon="triangle-exclamation",
      variant="warning"
    ) {{ `${keyword} 找不到資料` }}
</template>

<script>
import lahRegCaseDetailVue from './lah-reg-case-detail.vue'
export default {
  emit: ['reload'],
  name: 'LahAdmSmslogTable',
  components: { lahRegCaseDetailVue },
  props: {
    inKeyword: { type: String, default: '' },
    busy: { type: Boolean, default: false }
  },
  data: () => ({
    pagination: {
      perPage: 12,
      currentPage: 1
    },
    message: '',
    keyword: '',
    searchType: '',
    searchOpts: [
      { text: '全部', value: '' },
      { text: '日期', value: 'date' },
      { text: '手機', value: 'cell' },
      { text: '郵件', value: 'email' }
      // { text: '內容', value: 'note' }
    ],
    logs: [],
    fields: [
      // { key: 'MS03', label: '收件年', sortable: true },
      // { key: 'MS04_1', label: '收件字', sortable: true },
      { key: 'MS04_2', label: '收件字號', sortable: true },
      { key: 'MS_TYPE', label: '案件種類', sortable: true },
      { key: 'MS07_1', label: '傳送日期', sortable: true },
      { key: 'MS07_2', label: '傳送時間', sortable: true },
      { key: 'MS14', label: '手機號碼', sortable: true },
      { key: 'MS_MAIL', label: '電子郵件', sortable: true },
      { key: 'MS30', label: '傳送狀態', sortable: true },
      { key: 'MS31', label: '傳送結果', sortable: true },
      // { key: 'MS33', label: '傳送紀錄', sortable: true },
      { key: 'MS_NOTE', label: '傳送內容', sortable: true }
    ],
    maxHeight: 600,
    maxHeightOffset: 230
  }),
  computed: {
    count () { return this.logs?.length || 0 },
    validSMSKeyword () {
      return this.keyword?.length > 1
    }
  },
  watch: {
    searchType (val) {
      this.validSMSKeyword && this.reloadDebounced()
    },
    keyword (val) {
      this.validSMSKeyword && this.reloadDebounced()
    }
  },
  created () {
    this.keyword = this.inKeyword
    this.reloadDebounced = this.$utils.debounce(this.reload, 800)
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - this.maxHeightOffset)
  },
  methods: {
    popup (item) {
      const id = `${item.MS03}-${item.MS04_1}-${item.MS04_2}`
      this.modal(this.$createElement(lahRegCaseDetailVue, {
        props: {
          caseId: id
        },
        on: {
          'not-found': () => {
            this.hideModal()
            this.timeout(() => this.warning(`⚠ 無法找到 ${this.$utils.caseId(id)} 登記案件資料。`), 400)
          }
        }
      }), {
        title: `案件詳情 ${this.$utils.caseId(id)}`,
        size: 'xl'
      })
    },
    reload () {
      this.isBusy = true
      this.pagination.currentPage = 1
      this.$axios
        .post(this.$consts.API.JSON.MOIADM, {
          type: 'moiadm_smslog',
          keyword: this.keyword?.replaceAll(/[-/]+/g, ''),
          searchType: this.searchType
        }).then(({ data }) => {
          const status = this.$utils.statusCheck(data.status) ? '🟢' : '⚠'
          this.message = `${status} ${data.message}`
          this.logs = [...data.raw]
          this.$emit('reload', {
            keyword: this.keyword,
            type: this.searchType,
            logs: this.logs
          })
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
.keyword-mw {
  max-width: 250px;
}
</style>
