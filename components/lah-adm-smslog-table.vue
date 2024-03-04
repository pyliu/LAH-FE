<template lang="pug">
div
  .d-flex.align-items-center.justify-content-between.mb-2(title="輸入日期、手機或EMAIL查詢")
    lah-message(:message="message")
    div
    .d-flex.align-items-center
      //- b-radio-group.text-nowrap(
      //-   v-model="searchType"
      //-   :options="searchOpts"
      //- )
      lah-fa-icon.text-nowrap.mx-1(
        icon="comment-sms",
        size="2x",
        append
      ) 關鍵字
      b-input.keyword-mw(
        v-model="keyword",
        placeholder="... 日期/手機/EMAIL ...",
        :state="validSMSKeyword",
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
        b-link(
          v-if="validCaseCode(item)",
          href="#",
          @click="popup(item)"
        ) {{ caseId(item) }}
        span(v-else) {{ caseId(item) }}
      template(#cell(SMS_DATE)="{ item }")
        b-link.text-nowrap(href="#", @click="keyword = item.SMS_DATE; reloadDebounced();") {{ $utils.addDateDivider(item.SMS_DATE) }}
      template(#cell(SMS_TIME)="{ item }")
        .text-nowrap {{ $utils.addTimeDivider(item.SMS_TIME) }}
      template(#cell(SMS_CELL)="{ item }")
        b-link(href="#", @click="keyword = item.SMS_CELL; reloadDebounced();") {{ item.SMS_CELL }}
      template(#cell(SMS_MAIL)="{ item }")
        b-link(
          href="#",
          @click="keyword = item.SMS_MAIL; reloadDebounced();",
          title="EMAIL/統編/操作人員ID ... 等"
        ) {{ item.SMS_MAIL }}
      template(#cell(SMS_CONTENT)="{ item }")
        .text-left {{ item.SMS_CONTENT }}
      template(#cell(SMS_RESULT)="{ item }")
        span {{ item.SMS_RESULT === 'S' ? '成功' : '失敗' }}
      template(#cell(SMS_TYPE)="{ item }")
        .text-primary(v-if="item.SMS_TYPE.includes('異動即時通')") {{ item.SMS_TYPE }}
        .text-success(v-else-if="item.SMS_TYPE.includes('案件辦理情形')") {{ item.SMS_TYPE }}
        .font-weight-bold(v-else) {{ item.SMS_TYPE }}
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
      { text: '郵件', value: 'email' },
      { text: '內容', value: 'note' }
    ],
    logs: [],
    fields: [
      // { key: 'SMS_YEAR', label: '收件年', sortable: true },
      { key: 'SMS_CODE', label: '收件字', sortable: true },
      // { key: 'SMS_NUMBER', label: '收件號', sortable: true },
      { key: 'SMS_TYPE', label: '種類', sortable: true },
      { key: 'SMS_DATE', label: '日期', sortable: true },
      { key: 'SMS_TIME', label: '時間', sortable: true },
      { key: 'SMS_CELL', label: '手機號碼', sortable: true },
      { key: 'SMS_MAIL', label: '其他', sortable: true },
      { key: 'SMS_RESULT', label: '結果', sortable: true },
      { key: 'SMS_CONTENT', label: '內容', sortable: true }
    ],
    maxHeight: 600,
    maxHeightOffset: 230
  }),
  computed: {
    count () { return this.logs?.length || 0 },
    validSMSKeyword () {
      return this.$utils.length(this.keyword) > 2
    },
    searchTypeText () {
      switch (this.searchType) {
        case 'cell':
          return '手機號碼'
        case 'date':
          return '發送日期'
        case 'email':
          return '電子郵件'
        case 'note':
          return '簡訊內容'
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
    caseId (item) {
      return `${item.SMS_YEAR}-${item.SMS_CODE}-${item.SMS_NUMBER}`
    },
    validCaseCode (item) {
      const site = this.systemConfigs.site
      const siteNum = `${site[1]}1`
      return (item.SMS_CODE.includes(site) && !item.SMS_CODE.startsWith('SM')) ||
             item.SMS_CODE.endsWith(siteNum) ||
             [1, 2, 3, 4, 5, 6, 7, 8].find((val, idx, arr) => {
               return item.SMS_CODE.startsWith(`H${val}`)
             })
    },
    handlePaginationInput (payload) {
      // remember user changed number
      this.setCache('sms-log-table-perPage', payload.perPage)
    },
    popup (item) {
      const id = this.caseId(item)
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
      if (this.validSMSKeyword) {
        this.isBusy = true
        this.logs = []
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
            this.pagination.currentPage = 1
          })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.keyword-mw {
  max-width: 250px;
}
</style>
