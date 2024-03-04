<template lang="pug">
div
  .d-flex.align-items-center.justify-content-between.mb-2(title="輸入日期、手機或EMAIL查詢")
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
        placeholder="... 日期/手機/EMAIL ...",
        @keyup.enter="reload"
      )
      lah-button.ml-1(
        icon="magnifying-glass",
        title="依條件查詢SMS紀錄",
        size="md",
        @click="reload",
        :disabled="!validSMSKeyword"
      ) 搜尋
  lah-transition: lah-pagination(
    v-if="count > pagination.perPage"
    v-model="pagination",
    :total-rows="count"
    :caption="`找到 ${count} 筆資料`",
    @input="handlePaginationInput"
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
      template(#cell(SMS_CODE)="{ item }")
        span(v-if="item.SMS_CODE.startsWith('SM')") {{ `${item.SMS_YEAR}-${item.SMS_CODE}-${item.SMS_NUMBER}` }}
        b-link(
          v-else,
          href="#",
          @click="popup(item)"
        ) {{ `${item.SMS_YEAR}-${item.SMS_CODE}-${item.SMS_NUMBER}` }}
      template(#cell(SMS_DATE)="{ item }")
        b-link.text-nowrap(href="#", @click="keyword = item.SMS_DATE; searchType = 'date'") {{ item.SMS_DATE }}
      template(#cell(SMS_TIME)="{ item }")
        .text-nowrap {{ item.MS07_2 }}
      template(#cell(SMS_CELL)="{ item }")
        b-link(href="#", @click="keyword = item.SMS_CELL; searchType = 'cell'") {{ item.SMS_CELL }}
      template(#cell(SMS_MAIL)="{ item }")
        b-link(href="#", @click="keyword = item.SMS_MAIL; searchType = 'email'") {{ item.SMS_MAIL }}
      template(#cell(SMS_CONTENT)="{ item }")
        .text-left {{ item.SMS_CONTENT }}
      template(#cell(SMS_RESULT)="{ item }")
        span {{ item.SMS_RESULT === 'S' ? '成功' : '失敗' }}
      //- template(#cell(MS_NOTE)="{ item }")
      //-   b-link(href="#", @click="keyword = item.MS_NOTE; searchType = 'note'") {{ item.MS_NOTE }}
    .h5.center(v-else): lah-fa-icon(
      icon="triangle-exclamation",
      variant="warning"
    ) {{ `${keyword} ${$utils.empty(searchTypeText) ? '' : `根據${searchTypeText}欄位搜尋`}找不到資料` }}
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
      // { key: 'SMS_YEAR', label: '收件年', sortable: true },
      { key: 'SMS_CODE', label: '收件字', sortable: true },
      // { key: 'SMS_NUMBER', label: '收件號', sortable: true },
      { key: 'SMS_TYPE', label: '案件種類', sortable: true },
      { key: 'SMS_DATE', label: '傳送日期', sortable: true },
      { key: 'SMS_TIME', label: '傳送時間', sortable: true },
      { key: 'SMS_CELL', label: '手機號碼', sortable: true },
      { key: 'SMS_MAIL', label: '電子郵件', sortable: true },
      { key: 'SMS_RESULT', label: '傳送結果', sortable: true },
      { key: 'SMS_CONTENT', label: '傳送內容', sortable: true }
    ],
    maxHeight: 600,
    maxHeightOffset: 230
  }),
  computed: {
    count () { return this.logs?.length || 0 },
    validSMSKeyword () {
      return this.keyword?.length > 1
    },
    searchTypeText () {
      switch (this.searchType) {
        case 'cell':
          return '手機號碼'
        case 'date':
          return '發送日期'
        case 'email':
          return '電子郵件'
      }
      return ''
    }
  },
  watch: {
    searchType (val) {
      this.validSMSKeyword && this.reloadDebounced()
    },
    keyword (val) {
      // this.validSMSKeyword && this.reloadDebounced()
    }
  },
  async created () {
    if (!this.$utils.empty(this.inKeyword)) {
      this.keyword = this.inKeyword
      this.reload()
    }
    this.reloadDebounced = this.$utils.debounce(this.reload, 800)
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('sms-log-table-perPage') || 12)
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - this.maxHeightOffset)
  },
  methods: {
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('sms-log-table-perPage', payload.perPage)
    },
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
        .post(this.$consts.API.JSON.MOISMS, {
          type: 'moisms_log_query',
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
