<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto.flex-wrap.align-items-center
        .d-flex.mr-auto.align-items-center
          div 登記每月案件統計資訊
          lah-button(
            icon="question",
            variant="outline-success",
            size="lg",
            no-border,
            no-icon-gutter,
            v-b-modal.help-modal,
            title="說明"
          )

        .d-flex.align-items-center.flex-wrap.header-right-group
          b-button-group.mr-2(size="lg")
            b-button(
              variant="outline-secondary",
              title="切換至前一個月",
              :disabled="globalQuery || isBusy",
              @click="stepMonth(-1)"
            )
              lah-fa-icon(icon="chevron-left") 上月
            b-button(
              variant="outline-secondary",
              title="重設為上個月整月",
              :disabled="globalQuery || isBusy",
              @click="setLastMonth"
            ) 上個月
            b-button(
              variant="outline-secondary",
              title="切換為本月 1 日迄今",
              :disabled="globalQuery || isBusy",
              @click="setThisMonth"
            ) 本月迄今
            b-button(
              variant="outline-secondary",
              title="切換至下一個月",
              :disabled="globalQuery || isBusy",
              @click="stepMonth(1)"
            )
              lah-fa-icon(icon="chevron-right", append) 下月
          lah-datepicker(
            ref="datepicker",
            v-model="dateRange",
            :begin="initBegin",
            :end="initEnd",
            size="lg",
            @input="handleDate"
          )
          lah-button.ml-1(
            icon="magnifying-glass",
            size="lg",
            title="重新搜尋全部統計項目",
            :disabled="globalQuery || isBusy",
            :spin="globalQuery",
            no-icon-gutter,
            @click="triggerGlobalQuery"
          )
    lah-help-modal(:modal-id="'help-modal'", size="lg")
      h5 {{ siteName }}（{{ site }}）登記每月案件統計資訊說明
      ul
        li 進入頁面時預設自動載入#[strong 上個月整月]之統計資料。
        li 可使用上方「#[strong 上月 ／ 上個月 ／ 本月迄今 ／ 下月]」快速切換區間（切換後會自動重新查詢），或自訂起迄日期後按放大鏡「重新搜尋」。
      h6.mt-3 月統計總覽核對表與匯出
      ol
        li 頂部「#[strong 月統計總覽]」會隨各卡片查詢完成即時彙整「正號件數、子號件數、合計件數、起始號～終止號、缺號數」。
        li 點擊「#[strong 匯出總表 CSV]」可將全所當月統計彙總表下載為 CSV（UTF-8 BOM 格式，Excel 可直接開啟），免除人工逐卡抄寫加總。
        li 若需檢視或匯出單一項目的#[strong 個案明細]，可點擊各卡片右上角之視窗按鈕檢視列表，或點綠色 Excel 圖示匯出 #[code .xlsx] 明細檔。
      h6.mt-3 各統計項目計算邏輯
      ul
        li #[strong 簡訊統計]：統計區間內發送之「地籍異動即時通」、「案件辦理情形」及「其他類型（住址隱匿／代收代寄）」簡訊筆數，點擊分類名稱可檢視簡訊紀錄。
        li #[strong 謄本核發案件統計]：依櫃檯核發紀錄（#[code MOICAS.CUSMM]）統計總件數，可點「設定工作站人員」選擇工作站收件人員（設定會自動記憶於瀏覽器），即時拆算「本所」與「工作站」核發件數。
        li #[strong 第一次登記（原因代碼 #[code 02]）]：依收件日期區間分別統計正號（收件號尾數為 #[code 0]）與子號（尾數非 #[code 0]）件數。因收件號與一般登記案件共用流水號，跳號屬正常現象。
        li #[strong 本所各收件字別統計]：
          span(v-if="codes.length > 0") 本所設定字別為 {{ codes.map(c => `${c.code} (${c.name})`).join('、') }}，分別統計各字別正號與子號件數，並自動檢查正號起始號至終止號間是否有缺號（每號遞增 10）。

  //- 頂部進度與月統計總覽區塊
  .px-3.mb-3
    .p-2.border.rounded.bg-light
      .d-flex.flex-wrap.justify-content-between.align-items-center
        .d-flex.flex-wrap.align-items-center
          span.mr-3
            strong 統計區間：
            | {{ period }}
          b-badge.mr-2.p-1(
            :variant="globalQuery ? 'warning' : (readyCount >= totalBoards && totalBoards > 0 ? 'success' : 'secondary')"
          ) {{ globalQuery ? `查詢中 (${readyCount} / ${totalBoards})` : `已完成 (${readyCount} / ${totalBoards})` }}
          span.small.mr-3
            | 簡訊：#[strong.text-primary {{ summaryTotals.sms }}] 則
          span.small.mr-3
            | 謄本：#[strong.text-info {{ summaryTotals.cert }}] 件
          span.small.mr-3
            | 第一次登記：#[strong.text-success {{ summaryTotals.regFirst }}] 件
          span.small.mr-3
            | 各字別合計：#[strong.text-dark {{ summaryTotals.rm02Total }}] 件
        .d-flex.align-items-center
          b-button.mr-1(
            size="sm",
            variant="outline-secondary",
            @click="showSummaryTable = !showSummaryTable"
          )
            lah-fa-icon.mr-1(:icon="showSummaryTable ? 'angles-up' : 'table'")
            | {{ showSummaryTable ? '收合總覽表' : '展開總覽表' }}
          b-button(
            size="sm",
            variant="outline-success",
            :disabled="summaryRows.length === 0",
            @click="exportSummaryCsv"
          )
            lah-fa-icon.mr-1(icon="file-csv")
            | 匯出總表 CSV

      b-progress.mt-2(
        v-if="globalQuery",
        :value="readyCount",
        :max="totalBoards || 1",
        variant="info",
        height="6px",
        striped,
        animated
      )

      b-collapse(v-model="showSummaryTable")
        b-table.mt-2.mb-0.text-center.bg-white(
          :items="summaryRows",
          :fields="summaryFields",
          head-variant="dark",
          responsive="sm",
          bordered,
          striped,
          hover,
          small
        )
          template(#cell(MAIN_COUNT)="{ item }")
            strong.text-primary {{ item.MAIN_COUNT }}
          template(#cell(SUB_COUNT)="{ item }")
            span {{ item.SUB_COUNT }}
          template(#cell(TOTAL)="{ item }")
            strong.text-success {{ item.TOTAL }}
          template(#cell(NOTE)="{ item }")
            span.small(:class="{ 'text-danger': item.MISSING_COUNT > 0 }") {{ item.NOTE }}

  lah-flex-item-group
    .col-md-4(key="smsCount"): lah-stats-sms-count(
      ref="smsCount",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="certCount"): lah-stats-reg-cert-count(
      ref="certCount",
      :begin="dateRange.begin",
      :end="dateRange.end",
      @ready="handleReady"
    )
    .col-md-4(key="regFirst"): b-card.border-0.w-100(no-body)
      lah-stats-reg-first(
        ref="regFirst",
        :begin="dateRange.begin",
        :end="dateRange.end",
        @ready="handleReady"
      )
      lah-stats-reg-first-sub.mt-2(
        ref="regFirstSub",
        :begin="dateRange.begin",
        :end="dateRange.end",
        @ready="handleReady"
      )
    .col-md-4(
      v-for="(item, idx) in codes",
      :key="`code_${idx}`"
    ): b-card.border-0.w-100(no-body)
      lah-stats-reg-rm02(
        :ref="`regRM02_${idx}`",
        :rm02="item.code",
        :rm02-name="item.name",
        :begin="dateRange.begin",
        :end="dateRange.end",
        @ready="handleReady"
      )
      lah-stats-reg-rm02-sub.mt-2(
        :ref="`regRM02Sub_${idx}`",
        :rm02="item.code",
        :rm02-name="item.name",
        :begin="dateRange.begin",
        :end="dateRange.end",
        @ready="handleReady"
      )
</template>

<script>
export default {
  fetchOnServer: false,
  async asyncData ({ $content }) {
    const siteCodeMap = await $content('statsSiteCode').fetch()
    const today = new Date()
    return {
      initBegin: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      initEnd: new Date(today.getFullYear(), today.getMonth(), 0),
      siteCodeMap
    }
  },
  data: () => {
    const today = new Date()
    return {
      initBegin: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      initEnd: new Date(today.getFullYear(), today.getMonth(), 0),
      dateRange: {
        begin: '',
        end: '',
        days: 0
      },
      readyCount: 0,
      globalQuery: false,
      showSummaryTable: true,
      summaryTick: 0,
      summaryFields: [
        { key: 'NAME', label: '統計項目' },
        { key: 'CODE', label: '代碼 / 字別' },
        { key: 'MAIN_COUNT', label: '正號 / 主項' },
        { key: 'SUB_COUNT', label: '子號 / 次項' },
        { key: 'TOTAL', label: '合計' },
        { key: 'RANGE', label: '起始號 ~ 終止號' },
        { key: 'NOTE', label: '分項明細 / 缺號' }
      ]
    }
  },
  head: {
    title: '登記案件月統計資訊-桃園市地政局'
  },
  computed: {
    period () {
      return `${this.$utils.addDateDivider(this.dateRange.begin)} ~ ${this.$utils.addDateDivider(this.dateRange.end)}`
    },
    codes () {
      return (this.siteCodeMap && (this.siteCodeMap[this.site] || this.siteCodeMap.HA)) || []
    },
    totalBoards () {
      return 4 + this.codes.length * 2
    },
    summaryRows () {
      // 依賴 readyCount 與 summaryTick 觸發重新計算
      // eslint-disable-next-line no-unused-expressions
      this.readyCount
      // eslint-disable-next-line no-unused-expressions
      this.summaryTick
      const rows = []
      const smsComp = this.getComp('smsCount')
      if (smsComp) {
        const notify = (smsComp.notifyLogs && smsComp.notifyLogs.length) || 0
        const cases = (smsComp.caseLogs && smsComp.caseLogs.length) || 0
        const other = (smsComp.otherLogs && smsComp.otherLogs.length) || 0
        rows.push({
          NAME: '簡訊統計',
          CODE: 'SMS',
          MAIN_COUNT: notify + cases,
          SUB_COUNT: other,
          TOTAL: smsComp.count || 0,
          RANGE: '-',
          MISSING_COUNT: 0,
          NOTE: `地籍異動即時通 ${notify} ／ 案件辦理 ${cases} ／ 其他 ${other}`
        })
      }

      const certComp = this.getComp('certCount')
      if (certComp) {
        const inC = certComp.inCount || 0
        const outC = certComp.outCount || 0
        rows.push({
          NAME: '謄本核發案件',
          CODE: 'CUSMM',
          MAIN_COUNT: inC,
          SUB_COUNT: outC,
          TOTAL: certComp.count || 0,
          RANGE: '-',
          MISSING_COUNT: 0,
          NOTE: `本所 ${inC} 件 ／ 工作站 ${outC} 件 (工作站設定 ${certComp.operatorsCount || 0} 人)`
        })
      }

      const firstComp = this.getComp('regFirst')
      const firstSubComp = this.getComp('regFirstSub')
      if (firstComp || firstSubComp) {
        const mainC = (firstComp && firstComp.count) || 0
        const subC = (firstSubComp && firstSubComp.count) || 0
        const st = (firstComp && firstComp.firstCase && firstComp.firstCase.RM03) || '-'
        const ed = (firstComp && firstComp.lastCase && firstComp.lastCase.RM03) || '-'
        rows.push({
          NAME: '第一次登記',
          CODE: '原因 02',
          MAIN_COUNT: mainC,
          SUB_COUNT: subC,
          TOTAL: mainC + subC,
          RANGE: mainC > 0 ? `${st} ~ ${ed}` : '-',
          MISSING_COUNT: 0,
          NOTE: `正號 ${mainC} 件 ／ 子號 ${subC} 件`
        })
      }

      this.codes.forEach((item, idx) => {
        const rmComp = this.getComp(`regRM02_${idx}`)
        const rmSubComp = this.getComp(`regRM02Sub_${idx}`)
        const mainC = (rmComp && rmComp.count) || 0
        const subC = (rmSubComp && rmSubComp.count) || 0
        const st = (rmComp && rmComp.firstCase && rmComp.firstCase.RM03) || '-'
        const ed = (rmComp && rmComp.lastCase && rmComp.lastCase.RM03) || '-'
        const missLen = (rmComp && rmComp.missCaseNumber && rmComp.missCaseNumber.length) || 0
        rows.push({
          NAME: `${item.name} 登記案件`,
          CODE: item.code,
          MAIN_COUNT: mainC,
          SUB_COUNT: subC,
          TOTAL: mainC + subC,
          RANGE: mainC > 0 ? `${st} ~ ${ed}` : '-',
          MISSING_COUNT: missLen,
          NOTE: missLen > 0 ? `缺號 ${missLen} 筆` : '無缺號'
        })
      })

      return rows
    },
    summaryTotals () {
      // eslint-disable-next-line no-unused-expressions
      this.readyCount
      // eslint-disable-next-line no-unused-expressions
      this.summaryTick
      const smsComp = this.getComp('smsCount')
      const certComp = this.getComp('certCount')
      const firstComp = this.getComp('regFirst')
      const firstSubComp = this.getComp('regFirstSub')
      const sms = (smsComp && smsComp.count) || 0
      const cert = (certComp && certComp.count) || 0
      const regFirst = ((firstComp && firstComp.count) || 0) + ((firstSubComp && firstSubComp.count) || 0)
      let rm02Total = 0
      this.codes.forEach((item, idx) => {
        const rmComp = this.getComp(`regRM02_${idx}`)
        const rmSubComp = this.getComp(`regRM02Sub_${idx}`)
        rm02Total += ((rmComp && rmComp.count) || 0) + ((rmSubComp && rmSubComp.count) || 0)
      })
      return { sms, cert, regFirst, rm02Total }
    }
  },
  watch: {
    globalQuery (flag) {
      if (flag) {
        this.readyCount = 0
        this.debounceReset()
        const boards = this.getBoardComponents()
        boards.forEach((comp) => {
          comp.query()
        })
      }
    }
  },
  created () {
    this.debounceReset = this.$utils.debounce(() => {
      this.globalQuery = false
    }, 15000)
  },
  mounted () {
    this.summaryTick++
    setTimeout(() => {
      this.triggerGlobalQuery()
    }, 400)
  },
  methods: {
    handleDate () {},
    getComp (refName) {
      const ref = this.$refs && this.$refs[refName]
      return Array.isArray(ref) ? ref[0] : ref
    },
    getBoardComponents () {
      const list = [
        this.getComp('smsCount'),
        this.getComp('certCount'),
        this.getComp('regFirst'),
        this.getComp('regFirstSub')
      ]
      this.codes.forEach((item, idx) => {
        list.push(this.getComp(`regRM02_${idx}`))
        list.push(this.getComp(`regRM02Sub_${idx}`))
      })
      return list.filter(comp => comp && typeof comp.query === 'function')
    },
    triggerGlobalQuery () {
      if (this.globalQuery) { return }
      this.globalQuery = true
    },
    handleReady () {
      this.readyCount++
      this.summaryTick++
      if (this.readyCount >= this.totalBoards) {
        this.globalQuery = false
      }
    },
    parseCurrentBeginDate () {
      const str = String(this.dateRange.begin || '')
      if (str.length === 7) {
        const y = parseInt(str.slice(0, 3), 10) + 1911
        const m = parseInt(str.slice(3, 5), 10) - 1
        return new Date(y, m, 1)
      }
      const today = new Date()
      return new Date(today.getFullYear(), today.getMonth() - 1, 1)
    },
    applyMonthRange (firstDay, lastDay) {
      this.initBegin = firstDay
      this.initEnd = lastDay
      const dp = this.$refs.datepicker
      if (dp) {
        dp.startDateObj = firstDay
        dp.endDateObj = lastDay
      }
      this.$nextTick(() => {
        setTimeout(() => {
          this.triggerGlobalQuery()
        }, 150)
      })
    },
    stepMonth (delta) {
      const base = this.parseCurrentBeginDate()
      const firstDay = new Date(base.getFullYear(), base.getMonth() + delta, 1)
      const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0)
      this.applyMonthRange(firstDay, lastDay)
    },
    setLastMonth () {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
      this.applyMonthRange(firstDay, lastDay)
    },
    setThisMonth () {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      this.applyMonthRange(firstDay, today)
    },
    exportSummaryCsv () {
      if (typeof window === 'undefined' || this.summaryRows.length === 0) { return }
      const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
      const headers = ['統計區間', '統計項目', '代碼/字別', '正號/主項件數', '子號/次項件數', '合計件數', '起始號~終止號', '分項明細/缺號']
      const lines = [headers.map(esc).join(',')]
      this.summaryRows.forEach((r) => {
        lines.push([
          this.period,
          r.NAME,
          r.CODE,
          r.MAIN_COUNT,
          r.SUB_COUNT,
          r.TOTAL,
          r.RANGE,
          r.NOTE
        ].map(esc).join(','))
      })
      const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `登記案件月統計總表_${this.site}_${this.dateRange.begin}_${this.dateRange.end}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }
  }
}
</script>

<style lang="scss" scoped>
.header-right-group {
  display: flex;
  align-items: center;

  ::v-deep .btn:not(.dropdown-item),
  ::v-deep .form-control {
    height: 48px;
    box-sizing: border-box;
  }

  ::v-deep .btn:not(.dropdown-item) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1.5;
  }
}

.col-md-4 {
  margin-bottom: 1.25rem;
  > .card {
    height: 100%;
  }
}
</style>
