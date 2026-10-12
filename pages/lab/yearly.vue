<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto.align-items-center.flex-wrap
        .d-flex.mr-auto.align-items-center.flex-wrap
          div 年度統計資訊
          lah-button(
            icon="question",
            variant="outline-success",
            size="lg",
            no-border,
            no-icon-gutter,
            v-b-modal.help-modal,
            title="說明"
          )
          b-badge.ml-2(
            v-if="dateRange.begin && dateRange.end",
            :variant="statusBadgeVariant",
            pill
          ) {{ statusBadgeText }}

        .d-flex.align-items-center.flex-wrap.header-right-group
          b-button-group.mr-2(size="lg")
            lah-button(
              icon="angle-left",
              variant="outline-secondary",
              size="lg",
              no-icon-gutter,
              title="切換至前一年全年度",
              :disabled="isQueryingAll",
              @click="shiftYear(-1)"
            )
            lah-button(
              :variant="isLastYear ? 'secondary' : 'outline-secondary'",
              size="lg",
              :title="`切換至去年 (${lastYearRoc}年) 全年度`",
              :disabled="isQueryingAll",
              @click="setQuickYear('last')"
            ) 去年 ({{ lastYearRoc }}年)
            lah-button(
              :variant="isThisYear ? 'secondary' : 'outline-secondary'",
              size="lg",
              :title="`切換至今年 (${thisYearRoc}年) 迄今`",
              :disabled="isQueryingAll",
              @click="setQuickYear('this')"
            ) 今年迄今
            lah-button(
              icon="angle-right",
              variant="outline-secondary",
              size="lg",
              no-icon-gutter,
              title="切換至後一年全年度",
              :disabled="isQueryingAll",
              @click="shiftYear(1)"
            )
          lah-datepicker.mr-2(
            ref="datepicker",
            v-model="dateRange",
            :begin="initBegin",
            :end="initEnd",
            size="lg",
            @input="handleDate"
          )
          lah-button(
            icon="magnifying-glass",
            size="lg",
            variant="primary",
            title="一鍵查詢全部年度統計儀表板",
            :disabled="isQueryingAll",
            :spin="isQueryingAll",
            no-icon-gutter,
            @click="queryAll"
          )

    lah-help-modal(:modal-id="'help-modal'", size="lg", modal-title="年度統計資訊操作與指標說明")
      .small
        h6.font-weight-bold.text-primary.mb-2
          lah-fa-icon.mr-1(icon="circle-info") 頁面功能總覽
        p.mb-2
          | 本頁面提供#[b {{ siteName }}]跨年度或自訂區間之五大業務統計儀表板（初審、複審、課長案件量、高齡百歲所有權人歸戶、系統即時通推播紀錄）。預設區間為#[b 去年全年度（1月1日 ~ 12月31日）]，您可點選右上角放大鏡「一鍵查詢全部」，或依需求僅針對單一儀表板卡片點選查詢以節省等待時間。

        hr.my-2
        h6.font-weight-bold.text-success.mb-2
          lah-fa-icon.mr-1(icon="calendar-check") 頂部快速年度切換與操作說明
        ul.pl-3.mb-2
          li.mb-1
            b 快速年度切換（#[code ◀] / #[code 去年] / #[code 今年迄今] / #[code ▶]）：
            | 可一鍵切換至去年全年度、今年1月1日迄今，或前後移動整個年度（自動設定為該年 #[code 01-01 ~ 12-31]）。
          li.mb-1
            b 一鍵查詢全部（頂部藍色放大鏡）：
            | 同步觸發頁面上 5 張統計卡片進行查詢，並於上方即時顯示完成進度與彙整「年度統計總覽核對表」。
          li.mb-1
            b 單卡獨立查詢（各卡片右上角放大鏡）：
            | 若僅需檢視特定統計（例如僅查詢百歲土地所有權人），可直接點選該卡片右上角的放大鏡獨立查詢。

        hr.my-2
        h6.font-weight-bold.text-info.mb-2
          lah-fa-icon.mr-1(icon="chart-pie") 五大統計儀表板指標與互動說明
        b-table-simple(small, bordered, striped, responsive, class="mb-2")
          b-thead(head-variant="dark")
            b-tr
              b-th.text-nowrap(style="width: 22%") 儀表板名稱
              b-th.text-nowrap(style="width: 28%") 統計內容與徽章指標
              b-th 互動明細與匯出功能
          b-tbody
            b-tr
              b-td.font-weight-bold 1. 初審案件統計
              b-td 統計區間內各初審人員審理之「簡易案件」、「一般案件」與「案件量合計」。標題徽章顯示#[b 初審人數]與#[b 總件數]。
              b-td 卡片列出案件量前 3 名；點選姓名或最大化按鈕中的任一列，可穿透開啟該人員之#[b 案件詳情列表]；支援匯出 Excel。
            b-tr
              b-td.font-weight-bold 2. 複審案件統計
              b-td 統計區間內各複審人員核定之案件量排行。標題徽章顯示#[b 複審人數]與#[b 總件數]。
              b-td 卡片列出前 3 名；點選姓名或詳細列表任一列，可穿透檢視該複審人員之#[b 案件詳情列表]；支援匯出 Excel。
            b-tr
              b-td.font-weight-bold 3. 課長案件統計
              b-td 統計區間內各課長決行之案件量排行。標題徽章顯示#[b 課長人數]與#[b 總件數]。
              b-td 卡片列出前 3 名；點選姓名或詳細列表任一列，可穿透檢視該課長之#[b 案件詳情列表]；支援匯出 Excel。
            b-tr
              b-td.font-weight-bold 4. 土地/建物所有權人統計
              b-td 依選擇之「類型（土地/建物）」與「民國出生年（預設滿百歲，提供 99~105 歲快速選單）」查詢高齡所有權人地籍資料，並自動依「統編 + 姓名」歸戶排序。標題徽章同時顯示#[b 地籍總筆數]與#[b 歸戶人數]。
              b-td 此卡依目前地籍資料庫最新狀態查詢（不受日期區間限制）。點選前 3 名可檢視該所有權人名下土地/建物明細；點選最大化可檢視全體清冊並匯出 Excel。
            b-tr
              b-td.font-weight-bold 5. 即時通紀錄統計
              b-td 統計區間內系統排程發送至各課室頻道（登記、測量、地價、行政、資訊、全所等）之推播通知紀錄。
              b-td 卡片列出推播量前 3 名頻道，點選頻道名稱可單獨篩選該頻道之歷史訊息，點選「更多」或最大化按鈕可瀏覽全部紀錄並匯出 Excel。

        hr.my-2
        h6.font-weight-bold.text-dark.mb-1
          lah-fa-icon.mr-1(icon="table") 年度統計總覽核對表與 EXCEL 匯出
        p.mb-0
          | 當任一卡片完成查詢後，頁面上方會自動顯示「#[b 年度統計總覽核對表]」，將五大統計之總人數、總件數/筆數及前三名摘要集中呈現，並支援一鍵匯出 #[b EXCEL (.xlsx) 總表]（支援自訂標題列、凍結視窗與欄寬最佳化），方便製作年度業務簡報與統計彙報。

  //- 查詢進度條
  b-progress.mb-2(
    v-if="isQueryingAll",
    :value="readyCount",
    :max="boardCount",
    variant="info",
    striped,
    animated,
    height="6px"
  )

  //- 年度統計總覽核對表
  b-card.mb-3.shadow-sm(
    v-if="readyCount > 0",
    no-body
  )
    b-card-header.py-2.px-3.d-flex.justify-content-between.align-items-center.bg-light
      .d-flex.align-items-center.flex-wrap
        lah-fa-icon.text-primary.mr-1(icon="clipboard-list", size="lg")
        span.font-weight-bold 年度統計總覽核對表
        b-badge.ml-2(variant="secondary", pill) {{ period }}
        b-badge.ml-1(variant="info", pill) 已完成 {{ readyCount }} / {{ boardCount }} 項
      .d-flex.align-items-center
        lah-button.mr-2(
          icon="file-excel",
          regular,
          size="sm",
          variant="outline-success",
          title="匯出年度統計總覽 EXCEL 報表",
          :disabled="readyCount === 0 || summaryRows.length === 0",
          @click="exportSummaryXlsx"
        ) 匯出總表
        lah-button(
          :icon="showSummary ? 'chevron-up' : 'chevron-down'",
          size="sm",
          variant="outline-secondary",
          no-icon-gutter,
          :title="showSummary ? '收合總覽表' : '展開總覽表'",
          @click="showSummary = !showSummary"
        )
    b-collapse(v-model="showSummary")
      b-table-simple.mb-0.s-90(striped, hover, bordered, responsive, small)
        b-thead(head-variant="dark")
          b-tr.text-center
            b-th(style="width: 60px") 序號
            b-th(style="width: 220px") 統計項目
            b-th(style="width: 140px") 人數 / 歸戶數
            b-th(style="width: 150px") 總件數 / 總筆數
            b-th 前三名排行摘要
            b-th(style="width: 100px") 狀態
        b-tbody
          b-tr(v-for="(row, idx) in summaryRows", :key="row.key")
            b-td.text-center.align-middle {{ idx + 1 }}
            b-td.font-weight-bold.align-middle {{ row.label }}
            b-td.text-right.align-middle.font-weight-bold {{ row.personText }}
            b-td.text-right.align-middle.font-weight-bold.text-primary {{ row.totalText }}
            b-td.align-middle.small {{ row.top3Text }}
            b-td.text-center.align-middle
              b-badge(:variant="row.ready ? 'success' : 'secondary'", pill) {{ row.ready ? '已查詢' : '未查詢' }}

  lah-flex-item-group
    .col-md-4(key="reg-initial"): lah-stats-reg-initial-review(
      ref="regInitial",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="reg-final"): lah-stats-reg-final-review(
      ref="regFinal",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="reg-chief"): lah-stats-reg-chief-review(
      ref="regChief",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="reg-hundred-years-owner"): lah-stats-reg-owner-by-year(
      ref="regHundredYearsOwner",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="adm-notification"): lah-stats-adm-notification(
      ref="admNotification",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
</template>

<script>
import lahXlsxDownload from '~/components/lah-xlsx-download.vue'

const BOARD_KEYS = [
  'regInitial',
  'regFinal',
  'regChief',
  'regHundredYearsOwner',
  'admNotification'
]

export default {
  components: { lahXlsxDownload },
  fetchOnServer: false,
  async asyncData ({ isDev, route, store, env, params, query, req, res, redirect, error, $content }) {
    const siteCodeMap = await $content('statsSiteCode').fetch()
    const today = new Date()
    return {
      initBegin: new Date(today.getFullYear() - 1, 0, 1),
      initEnd: new Date(today.getFullYear() - 1, 11, 31),
      siteCodeMap
    }
  },
  data () {
    const today = new Date()
    return {
      initBegin: new Date(today.getFullYear() - 1, 0, 1),
      initEnd: new Date(today.getFullYear() - 1, 11, 31),
      dateRange: {
        begin: '',
        end: '',
        days: 0
      },
      readyCount: 0,
      isQueryingAll: false,
      showSummary: true,
      summaryTick: 0,
      regFirstCount: NaN
    }
  },
  head: {
    title: '年度統計資訊-桃園市地政局'
  },
  computed: {
    period () {
      if (!this.dateRange.begin || !this.dateRange.end) {
        return ''
      }
      return `${this.$utils.addDateDivider(this.dateRange.begin)} ~ ${this.$utils.addDateDivider(this.dateRange.end)}`
    },
    codes () {
      return this.siteCodeMap ? this.siteCodeMap[this.site] : undefined
    },
    boardCount () {
      return BOARD_KEYS.length
    },
    lastYearAD () {
      return new Date().getFullYear() - 1
    },
    thisYearAD () {
      return new Date().getFullYear()
    },
    lastYearRoc () {
      return this.lastYearAD - 1911
    },
    thisYearRoc () {
      return this.thisYearAD - 1911
    },
    isLastYear () {
      const rocPrefix = String(this.lastYearRoc).padStart(3, '0')
      const adPrefix = String(this.lastYearAD)
      return (
        (this.dateRange.begin === `${rocPrefix}0101` && this.dateRange.end === `${rocPrefix}1231`) ||
        (this.dateRange.begin === `${adPrefix}0101` && this.dateRange.end === `${adPrefix}1231`)
      )
    },
    isThisYear () {
      const rocPrefix = String(this.thisYearRoc).padStart(3, '0')
      const adPrefix = String(this.thisYearAD)
      return (
        (this.dateRange.begin === `${rocPrefix}0101` && this.dateRange.end !== `${rocPrefix}1231`) ||
        (this.dateRange.begin === `${adPrefix}0101` && this.dateRange.end !== `${adPrefix}1231`)
      )
    },
    statusBadgeVariant () {
      if (this.isQueryingAll) {
        return 'info'
      }
      if (this.readyCount >= this.boardCount) {
        return 'success'
      }
      if (this.readyCount > 0) {
        return 'primary'
      }
      return 'secondary'
    },
    statusBadgeText () {
      if (this.isQueryingAll) {
        return `查詢中 (${this.readyCount}/${this.boardCount})`
      }
      if (this.readyCount >= this.boardCount) {
        return `全部完成 (${this.readyCount}/${this.boardCount})`
      }
      if (this.readyCount > 0) {
        return `已查詢 (${this.readyCount}/${this.boardCount})`
      }
      return '請點選查詢'
    },
    summaryRows () {
      // dependency trigger when child components finish querying
      const tick = this.summaryTick
      const ready = this.readyCount
      if (tick < 0 || ready < 0) {
        return []
      }

      const initialComp = this.$refs.regInitial
      const finalComp = this.$refs.regFinal
      const chiefComp = this.$refs.regChief
      const ownerComp = this.$refs.regHundredYearsOwner
      const notifyComp = this.$refs.admNotification

      const formatTop3Review = (comp, nameKey, countKey) => {
        if (!comp || !comp.ready) {
          return '-'
        }
        const raw = Array.isArray(comp.raw) ? comp.raw : []
        if (raw.length === 0) {
          return '查無資料'
        }
        return raw.slice(0, 3).map((item, idx) => `${idx + 1}. ${item[nameKey]}(${Number(item[countKey] || 0).toLocaleString()}件)`).join('、')
      }

      const ownerTypeLabel = ownerComp && ownerComp.ownerType === 'building' ? '建物' : '土地'
      const ownerBirthInfo = ownerComp && ownerComp.birthYear ? `民國${ownerComp.birthYear}年（${ownerComp.displayAge}歲）` : ''
      let ownerTop3 = '-'
      if (ownerComp && ownerComp.ready) {
        const top3 = Array.isArray(ownerComp.top3) ? ownerComp.top3 : []
        ownerTop3 = top3.length > 0
          ? top3.map((g, idx) => `${idx + 1}. ${g.key}(${g.items.length}筆)`).join('、')
          : '查無資料'
      }

      let notifyTop3 = '-'
      if (notifyComp && notifyComp.ready) {
        const top3 = Array.isArray(notifyComp.top3Channels) ? notifyComp.top3Channels : []
        notifyTop3 = top3.length > 0
          ? top3.map((c, idx) => `${idx + 1}. ${c.name} ${c.channel}(${c.count}則)`).join('、')
          : '查無資料'
      }

      return [
        {
          key: 'regInitial',
          label: '初審案件統計',
          ready: Boolean(initialComp && initialComp.ready),
          personText: initialComp && initialComp.ready ? `${initialComp.count} 人` : '-',
          totalText: initialComp && initialComp.ready ? `${Number(initialComp.totalCaseSum || 0).toLocaleString()} 件` : '-',
          top3Text: formatTop3Review(initialComp, 'initial_name', 'total_case_count')
        },
        {
          key: 'regFinal',
          label: '複審案件統計',
          ready: Boolean(finalComp && finalComp.ready),
          personText: finalComp && finalComp.ready ? `${finalComp.count} 人` : '-',
          totalText: finalComp && finalComp.ready ? `${Number(finalComp.totalCaseSum || 0).toLocaleString()} 件` : '-',
          top3Text: formatTop3Review(finalComp, 'final_name', 'case_count')
        },
        {
          key: 'regChief',
          label: '課長案件統計',
          ready: Boolean(chiefComp && chiefComp.ready),
          personText: chiefComp && chiefComp.ready ? `${chiefComp.count} 人` : '-',
          totalText: chiefComp && chiefComp.ready ? `${Number(chiefComp.totalCaseSum || 0).toLocaleString()} 件` : '-',
          top3Text: formatTop3Review(chiefComp, 'chief_name', 'case_count')
        },
        {
          key: 'regHundredYearsOwner',
          label: `${ownerTypeLabel}所有權人統計 ${ownerBirthInfo}`,
          ready: Boolean(ownerComp && ownerComp.ready),
          personText: ownerComp && ownerComp.ready ? `${ownerComp.ownerGroupCount} 人` : '-',
          totalText: ownerComp && ownerComp.ready ? `${Number(ownerComp.count || 0).toLocaleString()} 筆` : '-',
          top3Text: ownerTop3
        },
        {
          key: 'admNotification',
          label: '即時通紀錄統計',
          ready: Boolean(notifyComp && notifyComp.ready),
          personText: notifyComp && notifyComp.ready && Array.isArray(notifyComp.top3Channels) ? `${notifyComp.top3Channels.length} 頻道(前3)` : '-',
          totalText: notifyComp && notifyComp.ready ? `${Number(notifyComp.count || 0).toLocaleString()} 則` : '-',
          top3Text: notifyTop3
        }
      ]
    }
  },
  watch: {},
  created () {
    this.debounceReset = this.$utils.debounce(() => {
      this.isQueryingAll = false
    }, 10000)
  },
  mounted () {},
  methods: {
    applyDateObjects (beginDate, endDate) {
      this.initBegin = beginDate
      this.initEnd = endDate
      const dp = this.$refs.datepicker
      if (dp) {
        dp.startDateObj = beginDate
        dp.endDateObj = endDate
      }
      this.readyCount = 0
      this.isQueryingAll = false
      this.summaryTick++
    },
    setQuickYear (mode) {
      const today = new Date()
      if (mode === 'last') {
        const y = today.getFullYear() - 1
        this.applyDateObjects(new Date(y, 0, 1), new Date(y, 11, 31))
      } else if (mode === 'this') {
        const y = today.getFullYear()
        this.applyDateObjects(new Date(y, 0, 1), today)
      }
    },
    shiftYear (delta) {
      let baseYear = this.lastYearAD
      if (this.dateRange && this.dateRange.begin) {
        const str = String(this.dateRange.begin)
        if (str.length === 7) {
          const rocYear = parseInt(str.substring(0, 3), 10)
          if (!isNaN(rocYear)) {
            baseYear = rocYear + 1911
          }
        } else if (str.length >= 8) {
          const adYear = parseInt(str.substring(0, 4), 10)
          if (!isNaN(adYear)) {
            baseYear = adYear
          }
        }
      }
      const targetYear = baseYear + delta
      this.applyDateObjects(new Date(targetYear, 0, 1), new Date(targetYear, 11, 31))
    },
    queryAll () {
      if (!this.dateRange.begin || !this.dateRange.end) {
        this.warning('請先選擇完整的查詢日期區間')
        return
      }
      this.readyCount = 0
      this.isQueryingAll = true
      this.summaryTick++
      BOARD_KEYS.forEach((key) => {
        const comp = this.$refs[key]
        if (comp && typeof comp.query === 'function') {
          comp.query()
        }
      })
    },
    handleDate (e) {
      this.summaryTick++
    },
    handleReady (e) {
      let readySum = 0
      BOARD_KEYS.forEach((key) => {
        const comp = this.$refs[key]
        if (comp && (comp.ready || !comp.isBusy)) {
          if (comp.ready) {
            readySum++
          }
        }
      })
      // Ensure readyCount increments even when a single card is queried or finishes
      this.readyCount = Math.max(readySum, this.readyCount + 1)
      if (this.readyCount > this.boardCount) {
        this.readyCount = readySum
      }
      const anyBusy = BOARD_KEYS.some((key) => {
        const comp = this.$refs[key]
        return Boolean(comp && comp.isBusy)
      })
      if (!anyBusy || this.readyCount >= this.boardCount) {
        this.isQueryingAll = false
      }
      this.summaryTick++
    },
    exportSummaryXlsx () {
      const rows = this.summaryRows
      if (!rows || rows.length === 0) {
        return
      }
      const exportRows = rows.map((r, idx) => ({
        序號: idx + 1,
        查詢區間: this.period,
        統計項目: r.label,
        '人數/歸戶數': r.personText,
        '總件數/總筆數': r.totalText,
        前三名排行摘要: r.top3Text,
        狀態: r.ready ? '已查詢' : '未查詢'
      }))
      const begin = this.dateRange?.begin || ''
      const end = this.dateRange?.end || ''
      const filename = `年度統計總覽_${begin}_${end}`
      const header = `年度統計總覽 (${this.period})`

      this.modal(this.$createElement(lahXlsxDownload, {
        props: {
          header,
          filename,
          jsonArray: exportRows
        }
      }), {
        title: '匯出 XLSX 檔案 - 年度統計總覽'
      })
    },
    exportSummaryCsv () {
      this.exportSummaryXlsx()
    }
  }
}
</script>

<style lang="scss" scoped>
.col-md-4 {
  margin-bottom: 1.25rem;
  > .card {
    height: 100%;
  }
}
.header-right-group {
  ::v-deep .btn,
  ::v-deep .btn-lg,
  ::v-deep .form-control,
  ::v-deep .b-form-btn-label-control.form-control {
    height: 48px !important;
    min-height: 48px !important;
    max-height: 48px !important;
    display: inline-flex;
    align-items: center;
  }
  ::v-deep .lah-datepicker {
    height: 48px !important;
    display: inline-flex;
    align-items: center;
  }
}
</style>
