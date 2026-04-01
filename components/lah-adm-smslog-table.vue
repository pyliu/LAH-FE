<template lang="pug">
div
  .d-flex.align-items-center.justify-content-between.mb-2(v-if="!displayMode")
    .d-flex.align-items-center
      lah-fa-icon(icon="filter", title="依據簡訊類別篩選")
        b-select.filter-mw(v-model="filterType", :options="filterTypeOpts")
      strong.mx-3 |
      lah-fa-icon(icon="clock", title="依據時間篩選")
        b-select.filter-mw(v-model="filterTime", :options="filterTimeOpts")
      .ml-1(v-if="filterTime !== '全部'") 點
      strong.mx-3 |
      b-checkbox.ml-1(v-model="watchFails", switch) 僅顯示傳送失敗
    lah-message(:message="message", auto-hide, :variant="messageVariant")
    .d-flex.align-items-center
      lah-fa-icon.text-nowrap.mx-1(
        icon="comment-sms",
        size="2x",
        append
      ) 關鍵字
      b-input.keyword-mw(
        v-model="keyword",
        placeholder="... 日期/手機/EMAIL ...",
        title="輸入日期、手機或EMAIL查詢",
        :state="validSMSKeyword",
        @keyup.enter="reload"
      )
      lah-button.ml-1(
        icon="magnifying-glass",
        title="依條件查詢SMS紀錄",
        size="md",
        @click="reload",
        :disabled="!validSMSKeyword",
        no-icon-gutter
      )
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
      :items="filteredLogs",
      :fields="fields",
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      :busy="isBusy || busy",
      :sticky-header="`${maxHeight}px`",
      selectable
      select-mode="single"
      selected-variant="primary"
    )
      template(#table-busy)
      template(#cell(SMS_CODE)="{ item }")
        b-link(
          v-if="validCaseCode(item)",
          href="#",
          @click="popup(item)",
          :title="`開啟 ${caseId(item)} 案件詳情`"
        )
          lah-fa-icon(icon="window-restore", variant="primary", append) {{ caseId(item) }}
        span(v-else) {{ caseId(item) }}
      template(#cell(SMS_DATE)="{ item }")
        b-link.text-nowrap(
          v-if="(notDateKeyword(item) || !validSMSKeyword) && !displayMode",
          href="#",
          :title="`依日期 ${item.SMS_DATE} 搜尋`",
          @click="setKeyword(item.SMS_DATE)"
        )
          lah-fa-icon(icon="magnifying-glass", append) {{ $utils.addDateDivider(item.SMS_DATE) }}
        .highlight-gold(v-else) {{ $utils.addDateDivider(item.SMS_DATE) }}
      template(#cell(SMS_TIME)="{ item }")
        .text-nowrap {{ $utils.addTimeDivider(item.SMS_TIME) }}
      template(#cell(SMS_CELL)="{ item }")
        b-link(
          v-if="(notCellKeyword(item) || !validSMSKeyword) && !displayMode",
          href="#",
          @click="setKeyword(item.SMS_CELL)",
          :title="`依手機號碼 ${item.SMS_CELL} 搜尋`"
        )
          .d-flex
            lah-fa-icon.mr-1(v-if="!$utils.isMobileValid(item.SMS_CELL)", icon="ban", variant="danger", title="非有效之手機號碼")
            lah-fa-icon(icon="magnifying-glass", append) {{ item.SMS_CELL }}
        span(v-else, :class="$utils.empty(item.SMS_CELL?.trim()) || displayMode ? [] : ['highlight-gold']") {{ item.SMS_CELL }}
      template(#cell(SMS_MAIL)="{ item }")
        b-link(
          v-if="(!$utils.empty(item.SMS_MAIL?.trim()) && item.SMS_MAIL?.trim() !== keyword) && !displayMode",
          href="#",
          @click="setKeyword(item.SMS_MAIL)",
          title="依 EMAIL/統編/操作人員ID ... 等搜尋"
        )
          lah-fa-icon(icon="magnifying-glass", append) {{ item.SMS_MAIL }}
        span(v-else, :class="$utils.empty(item.SMS_MAIL?.trim()) || displayMode ? [] : ['highlight-gold']") {{ item.SMS_MAIL }}
      template(#cell(SMS_CONTENT)="{ item }")
        .text-left(v-html="parseContent(item)")
      template(#cell(SMS_RESULT)="{ item }")
        lah-fa-icon(
          v-if="item.SMS_RESULT === 'S' || item.SMS_RESULT?.startsWith('OK')",
          icon="check",
          variant="success",
          append
        ) 成功
        .d-flex.align-items-center.text-left.justify-content-center(v-else)
          lah-fa-icon.mr-1(
            icon="triangle-exclamation",
            variant="danger",
            size="lg"
          )
          div
            span.mr-1 失敗
            span(v-if="item.SMS_RESULT.includes('adblock')") (已設定阻擋廣告簡訊)
            span(v-else-if="item.SMS_RESULT.includes('Msisdn')") (手機號碼錯誤)
            span(v-else-if="item.SMS_RESULT.includes('ConnectException') || item.SMS_RESULT.includes('Read timed out')") (連線簡訊閘道失敗)
            span(v-else-if="item.SMS_RESULT.includes('HTTP Status 500')") (無法登入簡訊閘道 #[span.text-danger HTTP Status 500])
            span(v-else) ({{  item.SMS_RESULT }})
          lah-button.ml-2(
            icon="paper-plane",
            variant="outline-primary",
            size="sm",
            title="重新發送此簡訊",
            no-icon-gutter,
            :disabled="item._resend_success",
            @click="confirmResend(item)"
          ) {{ item._resend_success ? '已排程' : '重送' }}
      template(#cell(SMS_TYPE)="{ item }")
        .text-primary(v-if="item.SMS_TYPE.includes('異動即時通')") {{ item.SMS_TYPE }}
        .text-success(v-else-if="item.SMS_TYPE.includes('案件辦理情形')") {{ item.SMS_TYPE }}
        .font-weight-bold(v-else) {{ item.SMS_TYPE }}
    .h5.center(v-else): lah-fa-icon(
      icon="triangle-exclamation",
      variant="warning"
    ) {{ `「${sanitizedKeyword}」搜尋不到資料` }}

  //- 新增：互動式重送與修改對話框
  b-modal#resend-modal(
    title="重送簡訊確認與修改",
    ok-title="確定重送",
    cancel-title="取消",
    ok-variant="danger",
    :ok-disabled="!isValidResendCell || isBusy",
    @ok="doResend",
    centered
  )
    p.mb-3 確定要重新發送此簡訊嗎？您可以修改下方的手機號碼或內容再送出。
    b-form-group(label="手機號碼 (必填)：", label-class="font-weight-bold text-primary")
      b-form-input(v-model="resendData.cell", :state="isValidResendCell", placeholder="請輸入有效的手機號碼")
      template(#invalid-feedback) 手機號碼格式不正確 (例如: 0912345678)
    b-form-group(label="簡訊內容：", label-class="font-weight-bold text-primary")
      b-form-textarea(v-model="resendData.content", rows="5", placeholder="請輸入簡訊內容")
    p.text-danger.font-weight-bold.mb-0 ⚠ 提醒：重送作業為排程執行，需等待數分鐘。送出後請稍候再重新查詢，請勿重複點擊以免造成重複送出！
</template>

<script>
import dynamicHeight from '~/mixins/dynamic-height-mixin';
import lahRegCaseDetailVue from './lah-reg-case-detail.vue';

export default {
  emit: ['reload'],
  name: 'LahAdmSmslogTable',
  components: { lahRegCaseDetailVue },
  mixins: [dynamicHeight],
  props: {
    inKeyword: { type: String, default: '' },
    inLogs: { type: Array, default: () => ([]) },
    busy: { type: Boolean, default: false },
    displayMode: { type: Boolean, default: false }
  },
  data: () => ({
    pagination: {
      perPage: 12,
      currentPage: 1
    },
    watchFails: false,
    message: '',
    messageVariant: 'info',
    keyword: '',
    filterType: '全部',
    filterTypeOpts: [
      '全部',
      '地籍異動即時通',
      '案件辦理情形',
      '跨域代收代寄',
      '住址隱匿',
      '指定送達處所',
      { text: '手動建檔', value: '手動' }
    ],
    filterTime: '全部',
    filterTimeOpts: ['全部', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17'],
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
      // 獨立的操作欄位已移除
    ],
    // 新增：暫存編輯中的重送資料
    resendData: {
      item: null,
      cell: '',
      content: ''
    }
  }),
  computed: {
    // 新增：即時驗證目前輸入的手機號碼是否合法
    isValidResendCell () {
      return this.$utils.isMobileValid(this.resendData.cell)
    },
    count () { return this.filteredLogs?.length || 0 },
    sanitizedKeyword () {
      return this.sanitizedDate(this.keyword)
    },
    validSMSKeyword () {
      return !this.$utils.empty(this.keyword) && this.$utils.length(this.keyword) > 2
    },
    filteredLogs () {
      let pipelineItems = [...this.logs]
      if (this.watchFails) {
        pipelineItems = pipelineItems.filter((item) => {
          return item.SMS_RESULT !== 'S' && !item.SMS_RESULT?.startsWith('OK')
        })
      }
      if (this.filterType !== '全部') {
        pipelineItems = pipelineItems.filter((item) => {
          return item.SMS_TYPE === this.filterType
        })
      }
      if (this.filterTime !== '全部') {
        pipelineItems = pipelineItems.filter((item) => {
          return item.SMS_TIME.startsWith(this.filterTime)
        })
      }
      return pipelineItems
    }
  },
  watch: {
    filterTime (dontcare) {
      this.resetPagination()
    },
    filterType (dontcare) {
      this.resetPagination()
    },
    watchFails (falg) {
      this.resetPagination()
    }
  },
  async created () {
    if (Array.isArray(this.inLogs)) {
      this.logs = this.restoreResendStatus([...this.inLogs])
    }
    if (!this.$utils.empty(this.inKeyword)) {
      this.keyword = this.inKeyword
      this.count === 0 && this.reload()
    }
    this.reloadDebounced = this.$utils.debounce(this.reload, 400)
    // restore setting by user
    this.pagination.perPage = parseInt(await this.getCache('sms-log-table-perPage') || 12)
  },
  methods: {
    sanitizedDate (w) {
      w = w?.replace(/^[\s-/]+|[\s-/]+$/gm, '')
      if (w) {
        if (w.includes('-')) {
          // parse as TW date
          const parts = w.split('-')
          w = `${parts[0]?.padStart(3, '0')}-${parts[1]?.padStart(2, '0')}`
          parts.length === 3 && (w = `${w}-${parts[2]?.padStart(2, '0')}`)
        }
        if (w.includes('/')) {
          // parse as TW date
          const parts = w.split('/')
          w = `${parts[0]?.padStart(3, '0')}-${parts[1]?.padStart(2, '0')}`
          parts.length === 3 && (w = `${w}-${parts[2]?.padStart(2, '0')}`)
        }
        return w?.replaceAll(/[-/]+/g, '')
      }
      return w
    },
    parseContent (item) {
      return this.$utils.convertInlineMarkd(item.SMS_CONTENT)
    },
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
    notDateKeyword (item) {
      if (this.keyword) {
        return item.SMS_DATE?.trim().replaceAll('-', '') !== this.sanitizedKeyword
      }
      return false
    },
    notCellKeyword (item) {
      if (this.keyword) {
        return !this.$utils.empty(item.SMS_CELL) && item.SMS_CELL?.trim() !== this.sanitizedKeyword
      }
      return false
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
    resetPagination () {
      this.pagination = {
        ...{
          perPage: this.pagination.perPage,
          currentPage: 1
        }
      }
    },
    reset () {
      this.filterTime = '全部'
      this.filterType = '全部'
      this.watchFails = false
      this.resetPagination()
    },
    reload () {
      if (this.validSMSKeyword && !this.displayMode) {
        this.isBusy = true
        this.logs = []
        this.reset()
        if (this.sanitizedKeyword.includes('~')) {
          this.queryByDate()
        } else {
          this.queryByKeyword()
        }
      }
    },
    queryByKeyword () {
      this.$axios
        .post(this.$consts.API.JSON.MOISMS, {
          type: 'moisms_log_query',
          keyword: this.sanitizedDate(this.keyword)
        }).then(({ data }) => {
          const status = this.$utils.statusCheck(data.status) ? '🟢' : '⚠'
          this.messageVariant = this.$utils.statusCheck(data.status) ? 'info' : 'warning'
          this.message = `${status} ${data.message} (共 ${data.raw.length} 筆)`
          // 將從後端取得的資料透過 restoreResendStatus 重新掛載 _resend_success 屬性
          this.logs = this.restoreResendStatus([...data.raw])
          this.$emit('reload', {
            keyword: this.keyword,
            logs: this.logs
          })
        }).catch((err) => {
          this.error = err
        }).finally(() => {
          this.isBusy = false
        })
    },
    queryByDate () {
      const [begin, end] = this.sanitizedKeyword.split(/\s*~\s*/)
      this.$axios
        .post(this.$consts.API.JSON.MOISMS, {
          type: 'moisms_log_query_by_date',
          st: this.sanitizedDate(begin),
          ed: this.sanitizedDate(end)
        }).then(({ data }) => {
          const status = this.$utils.statusCheck(data.status) ? '🟢' : '⚠'
          this.messageVariant = this.$utils.statusCheck(data.status) ? 'info' : 'warning'
          this.message = `${status} ${data.message} (共 ${data.raw.length} 筆)`
          // 將從後端取得的資料透過 restoreResendStatus 重新掛載 _resend_success 屬性
          this.logs = this.restoreResendStatus([...data.raw])
          this.$emit('reload', {
            keyword: `${begin} ~ ${end}`,
            logs: this.logs
          })
        }).catch((err) => {
          this.error = err
        }).finally(() => {
          this.isBusy = false
        })
    },
    setKeyword (str) {
      if (!this.displayMode) {
        this.keyword = str
        this.reloadDebounced()
      }
    },
    // 新增：取得 localStorage 的快取紀錄
    getResendCache () {
      if (typeof window === 'undefined') { return {} }
      try {
        const cache = window.localStorage.getItem('sms_resend_records')
        return cache ? JSON.parse(cache) : {}
      } catch (e) {
        return {}
      }
    },
    // 新增：將已重送的紀錄寫入 localStorage
    setResendCache (item) {
      if (typeof window === 'undefined') { return }
      try {
        const cache = this.getResendCache()
        // 使用 日期_時間_手機號碼 作為唯一鍵值，避免誤判
        const key = `${item.SMS_DATE}_${item.SMS_TIME}_${item.SMS_CELL}`
        cache[key] = Date.now()
        window.localStorage.setItem('sms_resend_records', JSON.stringify(cache))
      } catch (e) {
        console.warn('無法寫入重送紀錄至 localStorage', e)
      }
    },
    // 新增：比對快取並還原 _resend_success 狀態
    restoreResendStatus (logs) {
      const cache = this.getResendCache()
      const now = Date.now()
      const oneDay = 24 * 60 * 60 * 1000 // 一天的毫秒數
      let cacheChanged = false

      const mappedLogs = logs.map((item) => {
        const key = `${item.SMS_DATE}_${item.SMS_TIME}_${item.SMS_CELL}`
        if (cache[key]) {
          // 檢查是否超過一天
          if (now - cache[key] < oneDay) {
            item._resend_success = true
          } else {
            // 超過一天，從快取中刪除
            delete cache[key]
            cacheChanged = true
          }
        }
        return item
      })

      // 如果有過期的項目被刪除，重新寫回 localStorage
      if (cacheChanged && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('sms_resend_records', JSON.stringify(cache))
        } catch (e) {}
      }

      return mappedLogs
    },
    confirmResend (item) {
      // 點擊後不直接呼叫 API，而是將資料帶入 resendData 並喚起 modal
      this.resendData.item = item
      this.resendData.cell = item.SMS_CELL || ''
      this.resendData.content = item.SMS_CONTENT || ''
      this.$bvModal.show('resend-modal')
    },
    doResend (e) {
      // 阻擋預設關閉行為，讓我們可以在非同步完成後再手動關閉
      if (e) { e.preventDefault() }

      if (!this.isValidResendCell) { return }

      this.isBusy = true
      const item = this.resendData.item

      this.$axios.post(this.$consts.API.JSON.MOISMS, {
        type: 'moicas_ma05_resend_sms',
        ma5_no: item.MA5_NO || '',
        cell: this.resendData.cell, // 採用使用者修改後的號碼
        message: this.resendData.content // 採用使用者修改後的內容
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.messageVariant = 'success'
          this.message = `🟢 簡訊重送請求已成功排程：${this.resendData.cell} (請稍候數分鐘再重新查詢)`

          // 在原本物件加上一個特殊的屬性來防止 UI 上重複點擊
          this.$set(item, '_resend_success', true)

          // 寫入 localStorage 記住 1 天 (還是用舊的紀錄當唯一 key，這樣才能正確 disable 原本的按鈕)
          this.setResendCache(item)

          // 成功後隱藏對話框
          this.$bvModal.hide('resend-modal')
        } else {
          this.messageVariant = 'warning'
          this.message = `⚠ 簡訊重送失敗：${data.message}`
        }
      }).catch((err) => {
        this.messageVariant = 'danger'
        this.message = '❌ 發生異常，無法重送簡訊'
        console.error(err)
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
.filter-mw {
  max-width: 160px;
}
</style>
