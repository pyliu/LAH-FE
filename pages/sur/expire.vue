<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex.align-items-center
        .my-auto.mr-1 測量案件
        b-badge.mr-2.my-auto(pill, :variant="queryVariant") {{ queryCount }} 件
        b-form-radio-group.my-auto(
          v-model="fetchMode",
          size="lg",
          :options="fetchModeOpts"
        )
        lah-button.my-auto(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 案件搜尋說明
          ul
            li 全部未結案的案件：只顯示未結案案件(MOICAS.CMSMS的MM23「結案已否」為空值表示尚未結案)【排除收件字ST的案件】。
            li 即將逾期案件：逾期日期 #[b.text-danger 3日] 內的案件 (MOICAS.CMSMS的MM21_1逾期日期)。
            li 已逾期案件：未結案案件且應結日期已逾今天。
            li 切換為#[nuxt-link(to="/expire") 登記案件]

      .d-flex.small
        lah-button.mr-1(
          icon="search-plus",
          size="lg",
          title="開啟進階搜尋視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady"
        ) 進階搜尋
        //- lah-button-xlsx.mr-1(
        //-   :jsons="xlsxData"
        //-   :header="`測量${queryText}案件查詢`"
        //- )
        lah-button-xlsx-sur-tracking.mr-1(
          :jsons="xlsxDataTracking"
          :header="`測量${queryText}案件追蹤表`"
        )
        lah-countdown-button(
          ref="countdown",
          title="立即重新讀取",
          variant="outline-secondary",
          badge-variant="secondary",
          icon="sync-alt",
          action="ld-cycle",
          size="lg",
          :milliseconds="cachedMs",
          :disabled="isBusy",
          :busy="isBusy",
          @end="reload",
          @click="reload",
          auto-start,
          end-attention
        )

  lah-transition: b-tags.border-0.mt-n4(
    v-if="advTags.length > 0",
    v-model="advTags",
    placeholder="",
    tag-variant="info",
    tag-pills,
    no-outer-focus,
    no-add-on-enter,
    no-tag-remove,
    add-button-variant="white"
    add-button-text=""
  )

  lah-pagination(
    v-if="queryCount > 0"
    v-model="pagination"
    :total-rows="queryCount"
    :caption="foundText"
  )

  lah-transition
    b-table.text-center(
      v-if="queryCount > 0"
      id="land-ref-table"
      ref="table"
      caption-top
      selectable
      select-mode="single"
      selected-variant="success"
      :sticky-header="`${maxHeight}px`"
      :busy="isBusy"
      :items="filteredData"
      :responsive="'lg'"
      :striped="true"
      :hover="true"
      :bordered="true"
      :borderless="false"
      :outlined="false"
      :small="true"
      :dark="false"
      :fixed="false"
      :foot-clone="false"
      :no-border-collapse="true"
      :head-variant="'dark'"
      :fields="fields"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"
    )
      template(#table-busy): span.ld-txt 讀取中...
      template(v-slot:cell(#)="{ item, index, rowSelected }")
        template(v-if="rowSelected")
          span(aria-hidden="true") &check;
          span.sr-only 勾選
        template(v-else)
          span(aria-hidden="true") &nbsp;
          span.sr-only 無勾選
        span {{ index + 1 + (pagination.currentPage - 1) * pagination.perPage }}
      template(#cell(MM01)="{ item: { MM01, MM02, MM02_CHT, MM03 } }")
        b-link.text-nowrap(
          :href="caseQueryUrl(MM01, MM02, MM03)",
          rel="noreferrer noopener",
          target="_blank",
          title="開啟新視窗查詢地政系統資料"
        ) {{ MM01 }}-{{ MM02 }}({{ MM02_CHT }})-{{ MM03 }} #[lah-fa-icon(icon="external-link-alt")]
      template(#cell(MM06)="{ item: { MM06, MM06_CHT } }"): .text-nowrap {{ MM06 }} : {{ MM06_CHT }}
      template(#cell(MM22)="{ item: { MM22, MM22_CHT, MD12, MD12_CHT } }")
        .text-nowrap(:title="MD12_CHT") {{ MM22 }} : {{ MM22_CHT }} #[lah-fa-icon(v-if="becauseOfRain(MD12)", icon="cloud-rain", variant="primary")]
      template(#cell(MD04)="{ item: { MD04, MD04_CHT } }")
        b-link(v-if="!$utils.empty(MD04)", @click="userinfo(MD04_CHT, MD04)"): b-button(variant="outline-secondary", size="sm", pill): lah-avatar(:id="MD04" :name="MD04_CHT") #[.text-nowrap {{ MD04_CHT }}]
        b.text-nowrap.text-danger(v-else) 無設定
      template(#cell(MM04_1)="{ item: { MM04_1, MM04_2 } }"): span {{ humanDate(MM04_1) }} {{ humanTime(MM04_2) }}
      template(#cell(MD05_1)="{ item: { MD05_1, MD05_2, MD13_1, MD13_2, MD12, MD12_CHT } }")
        div.p-1.m-1(
          v-if="!$utils.empty(MD13_1) && MD13_1 > MD05_1",
          style="border: 2px dashed red",
          :title="`延期複丈原因：${MD12_CHT}，原設定：${humanDate(MD05_1)} ${humanTime(MD05_2)}`"
        ) {{ humanDate(MD13_1) }} {{ humanTime(MD13_2) }}
        span(v-else) {{ humanDate(MD05_1) }} {{ humanTime(MD05_2) }}
      template(#cell(MD06_1)="{ item: { MD06_1, MD06_2 } }"): span {{ humanDate(MD06_1) }} {{ humanTime(MD06_2) }}
      template(#cell(MM21_1)="{ item: { MM21_1, MM21_2 } }"): span {{ humanDate(MM21_1) }} {{ humanTime(MM21_2) }}
      template(#cell(note)="{ item: { MD09, MD10 } }")
        .flex-column
          div(v-if="!$utils.empty(MD09)") 通知補正：{{ humanDate(MD09) }}
          div(v-if="!$utils.empty(MD10)") 補正期滿：{{ humanDate(MD10) }}

    .center(v-else): h3 {{ `無${queryText}案件資料👍` }}

  b-modal(
    ref="caseDetail"
    size="xl"
    hide-footer
    centered
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ $utils.caseId(clickedId) }}
    h4.text-center.text-info.my-5(v-if="modalLoading")
      b-spinner.my-auto(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(:case-id="clickedId" @ready="modalLoading = !$event.detail")

  b-modal(
    ref="searchPlus",
    title="進階搜尋",
    hide-footer
  )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="　收件字"): b-select(
        v-model="advOpts.code",
        :options="advOpts.codeOpts",
        title="收件字"
      )
      b-input-group(prepend="複丈原因"): b-select(
        v-model="advOpts.reason",
        :options="advOpts.reasonOpts",
        title="複丈原因"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="辦理情形"): b-select(
        v-model="advOpts.state",
        :options="advOpts.stateOpts",
        title="辦理情形"
      )
      b-input-group(prepend="測量人員"): b-select(
        v-model="advOpts.operator",
        :options="advOpts.operatorOpts",
        title="測量人員"
      )
    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvOpts",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ filterDataCount }} 筆
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'
export default {
  components: { lahUserCard },
  data: () => ({
    cachedMs: 15 * 60 * 1000,
    modalLoading: true,
    clickedId: undefined,
    rows: [],
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    forceReload: false,
    committed: false,
    fields: [
      '#',
      {
        key: 'MM01',
        label: '收件字號',
        sortable: true
      },
      {
        key: 'MM06',
        label: '複丈原因',
        sortable: true
      },
      {
        key: 'MM22',
        label: '辦理情形',
        sortable: true
      },
      {
        key: 'MD04',
        label: '測量員',
        sortable: true
      },
      {
        key: 'MM04_1',
        label: '收件時間',
        sortable: true
      },
      {
        key: 'MD05_1',
        label: '複丈時間',
        sortable: true
      },
      {
        key: 'MD06_1',
        label: '結案時間',
        sortable: true
      },
      {
        key: 'MM21_1',
        label: '逾期時間',
        sortable: true
      },
      {
        key: 'note',
        label: '備註',
        sortable: false
      }
    ],
    maxHeight: 600,
    fetchMode: 'overdue',
    fetchModeOpts: [
      { text: '逾期', value: 'overdue' },
      { text: '即將逾期', value: 'near' },
      { text: '未結案', value: 'notyet' }
    ],
    advOpts: {
      code: '',
      codeOpts: [],
      reason: '',
      reasonOpts: [],
      state: '',
      stateOpts: [],
      operator: '',
      operatorOpts: []
    }
  }),
  // only worked at page level component
  // async asyncData (nuxt) {},
  fetchOnServer: false,
  fetch () {
    if (this.isBusy) {
      this.warning('讀取中請稍後 ... ')
    } else {
      this.getCache(this.cacheKey).then((json) => {
        this.reset()
        if (this.forceReload !== true && json) {
          this.rows = json.raw
          this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
            this.resetCountdown(remaining)
            this.notify(`查詢成功，找到 ${this.rows.length} 筆資料。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          })
          this.committed = true
        } else {
          this.isBusy = true
          this.committed = false
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: this.queryType,
            reload: this.forceReload
          }).then(({ data }) => {
            this.rows = data.raw || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
            const remainS = data.cache_remaining_time
            const remainMs = remainS * 1000
            if (remainMs && remainMs > 0) {
              this.setCache(this.cacheKey, data, remainMs)
              this.resetCountdown(remainMs)
            }
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
            this.committed = true
          })
        }
      })
    }
  },
  head: {
    title: '測量案件查詢-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    cacheKey () { return `query_sur_case_${this.fetchMode}` },
    queryCount () { return this.filterDataCount },
    queryText () { return this.fetchModeOpts.find(opt => opt.value === this.fetchMode)?.text },
    queryType () { return this.fetchMode === 'overdue' ? 'sur_overdue_case' : this.fetchMode === 'near' ? 'sur_near_case' : 'sur_not_close_case' },
    queryVariant () { return this.fetchMode === 'overdue' ? 'danger' : this.fetchMode === 'near' ? 'warning' : 'info' },
    foundText () { return `找到 ${this.queryCount} 筆「${this.queryText}」測量案件資料` },
    filteredData () {
      if (this.advTags.length > 0) {
        let pipelineItems = this.rows
        if (!this.$utils.empty(this.advOpts.code)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.MM02 === this.advOpts.code
          })
        }
        if (!this.$utils.empty(this.advOpts.reason)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.MM06 === this.advOpts.reason
          })
        }
        if (!this.$utils.empty(this.advOpts.state)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.MM22 === this.advOpts.state
          })
        }
        if (!this.$utils.empty(this.advOpts.operator)) {
          pipelineItems = pipelineItems.filter((item) => {
            return item.MD04 === this.advOpts.operator
          })
        }
        return pipelineItems
      }
      return this.rows
    },
    filterDataCount () {
      return this.filteredData.length
    },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.advOpts.code)) {
        tags.push(`收件字：${this.advOpts.code}`)
      }
      if (!this.$utils.empty(this.advOpts.reason)) {
        tags.push(`複丈原因：${this.advOpts.reason}`)
      }
      if (!this.$utils.empty(this.advOpts.state)) {
        tags.push(`辦理情形：${this.advOpts.state}`)
      }
      if (!this.$utils.empty(this.advOpts.operator)) {
        tags.push(`測量員：${this.advOpts.operator}`)
      }
      return tags
    },
    xlsxData () {
      const jsons = this.filteredData.map((data, idx, array) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          obj[this.getLabel(key)] = value
        }
        return obj
      })
      return jsons
    },
    xlsxDataTracking () {
      const jsons = this.filteredData.map((data, idx, array) => {
        const obj = {
          收件字號: `${data.MM01}-${data.MM02}-${data.MM03}`,
          收件時間: `${this.$utils.addDateDivider(data.MM04_1)} ${this.$utils.addTimeDivider(data.MM04_2)}`,
          // 複丈原因代碼: data.MM06,
          複丈原因: data.MM06_CHT,
          // 辦理情形代碼: data.MM22,
          辦理情形: data.MM22_CHT,
          // 測量員代碼: data.MD04,
          測量員: data.MD04_CHT,
          // 延期複丈原因代碼: data.MD12,
          延期複丈原因: data.MD12_CHT,
          複丈時間: `${this.$utils.addDateDivider(data.MD05_1)} ${this.$utils.addTimeDivider(data.MD05_2)}`,
          // 結案時間: `${this.$utils.addDateDivider(data.MD06_1)} ${this.$utils.addTimeDivider(data.MD06_2)}`,
          逾期時間: `${this.$utils.addDateDivider(data.MM21_1)} ${this.$utils.addTimeDivider(data.MM21_2)}`,
          承辦人簽章: ''
        }
        return obj
      })
      return jsons
    }
  },
  watch: {
    fetchMode (dontcare) {
      this.$fetch()
    },
    rows (val) {
      this.refreshAdvOptsSelect(val)
    }
  },
  mounted () {
    this.maxHeight = parseInt(window.innerHeight - 145)
  },
  methods: {
    becauseOfRain (MD12) {
      return MD12 === '1'
    },
    caseQueryUrl (MM01, MM02, MM03) {
      return `http://${this.webapIp}:9080/Land${this.site}/CAS/CMC01/CMC0102.jsp?reciveYear=${MM01}&reciveId=${MM02}&reciveNumber=${MM03}`
    },
    resetCountdown (ms) {
      this.$refs.countdown?.setCountdown(ms)
      this.$refs.countdown?.startCountdown()
    },
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.rows = []
      this.currentPage = 1
    },
    popup (data) {
      this.modalLoading = true
      this.clickedId = `${data.RM01}${data.RM02}${data.RM03}`
      this.$refs.caseDetail.show()
    },
    humanDate (str) {
      if (!str) { return '' }
      return `${str.substring(0, 3)}-${str.substring(3, 5)}-${str.substring(5)}`
    },
    humanTime (str) {
      if (!str) { return '' }
      return `${str.substring(0, 2)}:${str.substring(2, 4)}:${str.substring(4)}`
    },
    getLabel (key) {
      switch (key) {
        case 'MM01': return '收件年'
        case 'MM02_CHT': return '收件字'
        case 'MM02': return '收件字代碼'
        case 'MM03': return '收件號'
        case 'MM06': return '複丈原因代碼'
        case 'MM06_CHT': return '複丈原因'
        case 'MM22': return '辦理情形代碼'
        case 'MM22_CHT': return '辦理情形'
        case 'MD04': return '測量員代碼'
        case 'MD04_CHT': return '測量員'
        case 'MM04_1': return '收件日期'
        case 'MM04_2': return '收件時間'
        case 'MD05_1': return '複丈日期'
        case 'MD05_2': return '複丈時間'
        case 'MD12': return '延期複丈原因代碼'
        case 'MD12_CHT': return '延期複丈原因'
        case 'MD13_1': return '延期複丈日期'
        case 'MD13_2': return '延期複丈時間'
        case 'MD06_1': return '結案日期'
        case 'MD06_2': return '結案時間'
        case 'MM21_1': return '逾期日期'
        case 'MM21_2': return '逾期時間'
        case 'MM23': return '結案已否'
        case 'MD09': return '通知補正日期'
        case 'MD10': return '補正期滿日期'
        default:
          return key
      }
    },
    resetAdvOpts () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          code: '',
          reason: '',
          state: '',
          operator: ''
        }
      }
    },
    refreshAdvOptsSelect (val) {
      this.advOpts = {
        ...{
          code: '',
          codeOpts: [],
          reason: '',
          reasonOpts: [],
          state: '',
          stateOpts: [],
          operator: '',
          operatorOpts: []
        }
      }
      if (val) {
        this.advOpts.codeOpts = [
          ...this.$utils.orderBy(
          // ...new Set(val.map(item => item.MD04)),
            this.$utils.uniqBy(val.map((item) => {
              return { value: item.MM02, text: `${item.MM02}：${item.MM02_CHT}` }
            }), 'value'),
            'value'
          )
        ]
        this.advOpts.stateOpts = [
          ...this.$utils.orderBy(
          // ...new Set(val.map(item => item.MD04)),
            this.$utils.uniqBy(val.map((item) => {
              return { value: item.MM22, text: `${item.MM22}：${item.MM22_CHT}` }
            }), 'value'),
            'value'
          )
        ]
        this.advOpts.operatorOpts = [
          ...this.$utils.orderBy(
          // ...new Set(val.map(item => item.MD04)),
            this.$utils.uniqBy(val.map((item) => {
              return { value: item.MD04, text: `${item.MD04}：${item.MD04_CHT}` }
            }), 'value'),
            'value'
          )
        ]
        this.advOpts.reasonOpts = [
          ...this.$utils.orderBy(
            this.$utils.uniqBy(val.map((item) => {
              return { value: item.MM06, text: `${item.MM06}：${item.MM06_CHT}` }
            }), 'value'),
            'value'
          )
        ]
        this.advOpts.codeOpts.unshift('')
        this.advOpts.stateOpts.unshift('')
        this.advOpts.operatorOpts.unshift('')
        this.advOpts.reasonOpts.unshift('')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
