<template lang="pug">
div: client-only
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto.align-items-center.flex-nowrap
        .d-flex.mr-auto.align-items-center.flex-nowrap.text-nowrap
          .my-auto 謄本調閱紀錄檢索
          lah-button(
            icon="question",
            action="bounce",
            variant="outline-success",
            size="lg",
            no-border,
            no-icon-gutter,
            @click="showModalById('help-modal')",
            title="操作與欄位說明"
          )

        .d-flex.align-items-center.flex-nowrap.header-right-group
          lah-button.mr-1(
            :icon="hidePersonals ? 'user-shield' : 'eye'",
            :variant="hidePersonals ? 'outline-info' : 'warning'",
            size="lg",
            no-icon-gutter,
            :title="hidePersonals ? '目前：已遮蔽個資（畫面與匯出皆遮蔽，點此切換顯示完整個資）' : '目前：顯示完整個資（點此開啟個資遮蔽）'",
            @click="hidePersonals = !hidePersonals"
          )
          b-form-radio-group.text-nowrap.mr-1(
            v-model="searchType",
            :options="searchTypeOpts",
            buttons,
            button-variant="outline-primary",
            size="lg"
          )
          template(v-if="searchType === 'date'")
            b-button-group.mr-1.text-nowrap(size="lg")
              lah-button.px-2(
                :variant="quickDateMode === 'today' ? 'secondary' : 'outline-secondary'",
                size="lg",
                title="切換至今天",
                :disabled="isBusy",
                @click="setQuickDate('today')"
              ) 今天
              lah-button.px-2(
                :variant="quickDateMode === 'yesterday' ? 'secondary' : 'outline-secondary'",
                size="lg",
                title="切換至昨天",
                :disabled="isBusy",
                @click="setQuickDate('yesterday')"
              ) 昨天
              lah-button.px-2(
                :variant="quickDateMode === '7days' ? 'secondary' : 'outline-secondary'",
                size="lg",
                title="切換至近7天",
                :disabled="isBusy",
                @click="setQuickDate('7days')"
              ) 近7天
              lah-button.px-2(
                :variant="quickDateMode === 'month' ? 'secondary' : 'outline-secondary'",
                size="lg",
                title="切換至本月1日迄今",
                :disabled="isBusy",
                @click="setQuickDate('month')"
              ) 本月
            lah-datepicker.mr-1(
              ref="datepicker",
              v-model="dateRange",
              :begin="initBegin",
              :end="initEnd",
              size="lg",
              @input="handleDateChanged"
            )
          b-input.mr-1(
            v-else,
            ref="pid",
            v-model.trim="pid",
            size="lg",
            placeholder="輸入統編或姓名 (如 A123456789 或 王小明)",
            style="width: 280px;",
            @keyup.enter="reload",
            autofocus
          )
          lah-button.mr-1(
            icon="magnifying-glass",
            size="lg",
            variant="primary",
            title="執行搜尋",
            @click="reload",
            :disabled="isBusy || !queryOK",
            :busy="isBusy",
            no-icon-gutter
          )
          lah-button-xlsx(
            :jsons="xlsxData",
            size="lg",
            variant="success",
            :header="`謄本調閱紀錄(${hidePersonals ? '遮蔽個資' : '★不遮蔽個資★'})`"
          )

    lah-help-modal(:modal-id="'help-modal'", size="lg", modal-title="謄本調閱紀錄檢索操作與欄位說明")
      .small
        .d-flex.justify-content-between.align-items-center.bg-light.p-2.rounded.mb-3.border
          .font-weight-bold.text-dark
            lah-fa-icon.mr-1(icon="user-shield", variant="info") 個資保護設定（同步套用至畫面表格與 XLSX 匯出）
          b-checkbox(v-model="hidePersonals", switch) 遮蔽申請人及代理人統編／姓名

        h6.font-weight-bold.text-primary.mb-2
          lah-fa-icon.mr-1(icon="magnifying-glass") 一、雙模式檢索操作步驟
        ol.pl-3.mb-2
          li.mb-1
            b 日期區間模式（預設）：
            | 預設查詢「今天」之收件調閱紀錄。可使用頂部 #[code 今天]、#[code 昨天]、#[code 近7天]、#[code 本月] 快速按鈕或自訂起訖日期後，點選 #[lah-fa-icon(icon="magnifying-glass", variant="primary")] 搜尋。
          li.mb-1
            b 統編／姓名模式：
            | 切換至「統編 / 姓名」後，可輸入 #[b 申請人統編]、#[b 代理人統編]、#[b 申請人姓名] 或 #[b 代理人姓名]（中文姓名至少 2 字、英數統編至少 4 碼），按 #[kbd Enter] 或搜尋鈕即可跨日期模糊檢索。

        hr.my-2
        h6.font-weight-bold.text-success.mb-2
          lah-fa-icon.mr-1(icon="filter") 二、二次即時篩選與統計摘要
        ul.pl-3.mb-2
          li.mb-1 查詢結果載入後，可透過結果列上方的「關鍵字、申請方式、申請類別、地建別、區名」進行#[b 前端即時過濾]，無須重新查詢資料庫。
          li.mb-1 自動統計當前篩選結果之#[b 調閱總筆數]、#[b 不重複收件案數]、#[b 申請人歸戶數]及#[b 核發謄本總張數]。
          li.mb-1 點選表格任一列可彈出「#[b 謄本調閱紀錄明細視窗]」，檢視完整收件、標的與各類謄本張數資訊。

        hr.my-2
        h6.font-weight-bold.text-info.mb-2
          lah-fa-icon.mr-1(icon="table") 三、地政系統資料表與代碼對照（MOICAS.CUSMM / CUSMD2）
        b-table-simple(small, bordered, striped, responsive, class="mb-0")
          b-thead(head-variant="dark")
            b-tr
              b-th(style="width: 22%") 欄位名稱
              b-th(style="width: 22%") 來源欄位
              b-th 代碼與業務說明
          b-tbody
            b-tr
              b-td.font-weight-bold 申請方式
              b-td #[code CUSMM.MU04]
              b-td #[code 1] 現場申請、#[code 2] 隨案謄本、#[code 3] 內部使用、#[code 4] 傳真申請
            b-tr
              b-td.font-weight-bold 申請類別
              b-td #[code CUSMM.MU42] / #[code CUSMD2.MD04]
              b-td 主檔：#[code 00] 公務用、#[code 01] 第一類、#[code 02] 第二類、#[code 04] 第三類；明細檔：#[code A] 登記電子資料謄本、#[code C] 地價電子資料謄本、#[code D] 建物平面圖謄本、#[code E] 人工登記簿謄本、#[code F] 閱覽、#[code G] 列印電子資料、#[code H] 申請、#[code I] 其他、#[code J] 異動索引
            b-tr
              b-td.font-weight-bold 地建別 / 地建號
              b-td #[code CUSMD2.MD07] / #[code MD08]
              b-td #[code C] 土地、#[code F] 建物；地建號為實際調閱之地號或建號
            b-tr
              b-td.font-weight-bold 謄本張數統計
              b-td #[code CUSMM.MU28 ~ MU32]
              b-td 分別記錄：電子資料登記謄本張數（MU28）、登記簿謄本張數（MU29）、地價謄本張數（MU30）、地籍圖謄本張數（MU31）、建物平面圖謄本張數（MU32）

  //- 統計摘要與二次即時篩選工具列
  b-card.mb-2.shadow-sm(v-if="totalCount > 0", body-class="py-2 px-3")
    .d-flex.justify-content-between.align-items-center.flex-wrap.mb-2
      .d-flex.align-items-center.flex-wrap
        span.font-weight-bold.mr-2
          lah-fa-icon.text-primary.mr-1(icon="chart-simple") 檢索統計摘要：
        b-badge.mr-2.p-1(variant="primary") 顯示筆數：{{ filteredCount.toLocaleString() }} / {{ totalCount.toLocaleString() }} 筆
        b-badge.mr-2.p-1(variant="info") 不重複收件號：{{ uniqueCaseCount.toLocaleString() }} 件
        b-badge.mr-2.p-1(variant="success") 申請人歸戶：{{ uniqueApplicantCount.toLocaleString() }} 人
        b-badge.mr-2.p-1(variant="dark") 核發總張數：{{ totalCertPages.toLocaleString() }} 張
      .small.text-muted
        lah-fa-icon.mr-1(icon="hand-pointer") 點擊列表任一列可檢視單筆調閱完整明細

    .d-flex.align-items-center.flex-wrap
      b-input-group.mr-2.mb-1(size="sm", prepend="關鍵字", style="width: 230px;")
        b-input(
          v-model.trim="filterKeyword",
          placeholder="收件號/姓名/統編/地建號...",
          debounce="150"
        )
      b-input-group.mr-2.mb-1(size="sm", prepend="申請方式", style="width: 165px;")
        b-select(v-model="filterMethod", :options="methodOpts")
      b-input-group.mr-2.mb-1(size="sm", prepend="申請類別", style="width: 195px;")
        b-select(v-model="filterCategory", :options="categoryOpts")
      b-input-group.mr-2.mb-1(size="sm", prepend="地建別", style="width: 145px;")
        b-select(v-model="filterLandBuild", :options="landBuildOpts")
      b-input-group.mr-2.mb-1(size="sm", prepend="區名", style="width: 155px;")
        b-select(v-model="filterTown", :options="townOpts")
      lah-button.mb-1(
        v-if="hasActiveFilter",
        icon="filter-circle-xmark",
        size="sm",
        variant="outline-secondary",
        @click="clearFilters"
      ) 清除篩選

  lah-pagination(
    v-if="showPagination",
    v-model="pagination",
    :total-rows="filteredCount",
    :caption="`${tableCaption} - 顯示 ${filteredCount} 筆 (共 ${totalCount} 筆)`"
  )

  lah-transition
    b-table.text-center.s-90(
      v-if="filteredCount > 0",
      :busy="isBusy",
      :items="filteredRows",
      :fields="fields",
      :per-page="pagination.perPage",
      :current-page="pagination.currentPage",
      :caption-append="tableCaption",
      :head-variant="'dark'",
      :sticky-header="`${maxHeight}px`",
      small,
      hover,
      striped,
      bordered,
      responsive,
      no-border-collapse,
      selectable,
      select-mode="single",
      selected-variant="warning",
      @row-selected="handleRowSelected"
    )
      template(#cell(序號)="data")
        span {{ (pagination.perPage * (pagination.currentPage - 1)) + data.index + 1 }}
      template(#cell(收件日期)="{ item }")
        .text-nowrap {{ $utils.addDateDivider(item['收件日期']) }}
      template(#cell(收件時間)="{ item }")
        .text-nowrap {{ $utils.addTimeDivider(item['收件時間']) }}
      template(#cell(地建別)="{ item }")
        b-badge(:variant="item['地建別'] === '土地' ? 'success' : item['地建別'] === '建物' ? 'info' : 'secondary'") {{ item['地建別'] || '-' }}
      template(#cell(申請人統編)="{ item }")
        .text-nowrap.font-monospace {{ hidePersonalInfo(item['申請人統編']) }}
      template(#cell(申請人姓名)="{ item }")
        .text-nowrap {{ hidePersonalInfo(item['申請人姓名']) }}
      template(#cell(代理人統編)="{ item }")
        .text-nowrap.font-monospace {{ hidePersonalInfo(item['代理人統編']) }}
      template(#cell(代理人姓名)="{ item }")
        .text-nowrap {{ hidePersonalInfo(item['代理人姓名']) }}

    .center.h2.mt-3(v-else-if="isBusy"): .ld-txt 讀取中 ...
    .center.h3.mt-4.text-muted(v-else-if="totalCount > 0 && filteredCount === 0")
      lah-fa-icon.mr-2(icon="filter-circle-xmark", variant="warning") 沒有符合篩選條件的紀錄
      lah-button.ml-2(size="sm", variant="outline-primary", @click="clearFilters") 重設篩選條件
    .center.h2.mt-3(v-else) ⚠ 查無謄本調閱紀錄，請調整條件後重新查詢 ⚠

  //- 單筆調閱紀錄詳細視窗
  b-modal(
    ref="detailModal",
    title="謄本調閱紀錄詳細資訊",
    size="lg",
    hide-footer
  )
    div(v-if="selectedRow")
      .d-flex.justify-content-between.align-items-center.mb-2
        .font-weight-bold.text-primary
          lah-fa-icon.mr-1(icon="file-lines")
          | 收件字號：{{ selectedRow['收件年'] || '-' }} 年 {{ selectedRow['收件字'] || '-' }} 字第 {{ selectedRow['收件號'] || '-' }} 號
        b-checkbox.small(v-model="hidePersonals", switch) 遮蔽個資
      b-table-simple(small, bordered, responsive, class="mb-0")
        b-tbody
          b-tr
            b-th.bg-light(style="width: 18%") 收件日期 / 時間
            b-td(style="width: 32%") {{ $utils.addDateDivider(selectedRow['收件日期']) }} {{ $utils.addTimeDivider(selectedRow['收件時間']) }}
            b-th.bg-light(style="width: 18%") 申請方式 / 類別
            b-td(style="width: 32%") {{ selectedRow['申請方式'] || '-' }} ／ {{ selectedRow['申請類別'] || '-' }}
          b-tr
            b-th.bg-light 申請人姓名
            b-td {{ hidePersonalInfo(selectedRow['申請人姓名']) || '-' }}
            b-th.bg-light 申請人統編
            b-td.font-monospace {{ hidePersonalInfo(selectedRow['申請人統編']) || '-' }}
          b-tr
            b-th.bg-light 代理人姓名
            b-td {{ hidePersonalInfo(selectedRow['代理人姓名']) || '-' }}
            b-th.bg-light 代理人統編
            b-td.font-monospace {{ hidePersonalInfo(selectedRow['代理人統編']) || '-' }}
          b-tr
            b-th.bg-light 鄉鎮市區
            b-td {{ selectedRow['鄉鎮市區'] || '-' }} ({{ selectedRow['鄉鎮市區代碼'] || '-' }})
            b-th.bg-light 段小段
            b-td {{ selectedRow['段小段'] || '-' }} ({{ selectedRow['段代碼'] || '-' }})
          b-tr
            b-th.bg-light 地建別
            b-td {{ selectedRow['地建別'] || '-' }}
            b-th.bg-light 地建號
            b-td.font-weight-bold.text-primary {{ selectedRow['地建號'] || '-' }}
          b-tr
            b-th.bg-light 電子登記張數
            b-td {{ selectedRow['電子資料登記謄本張數'] || 0 }} 張
            b-th.bg-light 登記簿謄本張數
            b-td {{ selectedRow['登記簿謄本張數'] || 0 }} 張
          b-tr
            b-th.bg-light 地價謄本張數
            b-td {{ selectedRow['地價謄本張數'] || 0 }} 張
            b-th.bg-light 地籍圖謄本張數
            b-td {{ selectedRow['地籍圖謄本張數'] || 0 }} 張
          b-tr
            b-th.bg-light 建物平面圖張數
            b-td(colspan="3") {{ selectedRow['建物平面圖謄本張數'] || 0 }} 張
</template>

<script>
import dynamicHeight from '~/mixins/dynamic-height-mixin'

function buildTodayTwStr () {
  const today = new Date()
  const y = String(today.getFullYear() - 1911).padStart(3, '0')
  const m = ('0' + (today.getMonth() + 1)).slice(-2)
  const d = ('0' + today.getDate()).slice(-2)
  return `${y}${m}${d}`
}

export default {
  fetchOnServer: false,
  mixins: [dynamicHeight],
  asyncData (nuxt) {
    const todayStr = buildTodayTwStr()
    return {
      dateRange: {
        begin: todayStr,
        end: todayStr,
        days: 1
      }
    }
  },
  data () {
    const today = new Date()
    const todayStr = buildTodayTwStr()
    return {
      initBegin: today,
      initEnd: today,
      dateRange: {
        begin: todayStr,
        end: todayStr,
        days: 1
      },
      quickDateMode: 'today',
      hidePersonals: true,
      pid: '',
      rows: [],
      hasQueried: false,
      lastMessage: '',
      selectedRow: null,
      filterKeyword: '',
      filterMethod: '',
      filterCategory: '',
      filterLandBuild: '',
      filterTown: '',
      fields: [
        '序號',
        { key: '收件年', sortable: true },
        { key: '收件字', sortable: true },
        { key: '收件號', sortable: true },
        { key: '收件日期', sortable: true },
        { key: '收件時間', sortable: true },
        { key: '申請方式', sortable: true },
        { key: '申請類別', sortable: true },
        { key: '申請人統編', sortable: true },
        { key: '申請人姓名', sortable: true },
        { key: '代理人統編', sortable: true },
        { key: '代理人姓名', sortable: true },
        { key: '鄉鎮市區', label: '區名', sortable: true },
        { key: '段代碼', sortable: true },
        { key: '段小段', label: '段名', sortable: true },
        { key: '地建別', sortable: true },
        { key: '地建號', sortable: true },
        { key: '電子資料登記謄本張數', label: '電子登記張數', sortable: true },
        { key: '登記簿謄本張數', sortable: true },
        { key: '地價謄本張數', sortable: true },
        { key: '地籍圖謄本張數', sortable: true },
        { key: '建物平面圖謄本張數', sortable: true }
      ],
      pagination: {
        perPage: 20,
        currentPage: 1
      },
      searchType: 'date',
      searchTypeOpts: [
        { text: '日期', value: 'date' },
        { text: '統編/姓名', value: 'id' }
      ]
    }
  },
  fetch () {
    if (this.isBusy || !this.queryOK) {
      if (!this.queryOK) {
        this.warning('請輸入至少 2 個中文字元或 4 碼統編關鍵字')
      }
      return
    }
    this.isBusy = true
    const cleanPid = this.pid ? String(this.pid).trim().toUpperCase() : ''
    let axiosOpts = {
      type: 'cusmm_by_pid',
      pid: cleanPid
    }
    if (this.searchType === 'date') {
      const beginStr = (this.dateRange && this.dateRange.begin) ? this.dateRange.begin : buildTodayTwStr()
      const endStr = (this.dateRange && this.dateRange.end) ? this.dateRange.end : buildTodayTwStr()
      axiosOpts = {
        type: 'cusmm_by_date',
        begin: beginStr,
        end: endStr
      }
    }
    this.rows = []
    this.$axios.post(this.$consts.API.JSON.MOICAS, axiosOpts).then(({ data }) => {
      this.hasQueried = true
      this.lastMessage = (data && data.message) ? String(data.message) : ''
      // 防護開發環境或查無快取時 data.raw 為 false / null / undefined 導致展開運算子拋出 TypeError
      const rawList = Array.isArray(data && data.raw)
        ? data.raw
        : (Array.isArray(data && data.baked) ? data.baked : [])
      this.rows = rawList.map(row => ({
        ...row,
        電子資料登記謄本張數: Number(row['電子資料登記謄本張數']) || 0,
        登記簿謄本張數: Number(row['登記簿謄本張數']) || 0,
        地價謄本張數: Number(row['地價謄本張數']) || 0,
        地籍圖謄本張數: Number(row['地籍圖謄本張數']) || 0,
        建物平面圖謄本張數: Number(row['建物平面圖謄本張數']) || 0
      }))
    }).catch((err) => {
      this.alert(err.message)
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
      this.updatePagination(1, this.pagination.perPage)
    })
  },
  head: {
    title: '謄本調閱紀錄檢索-桃園市地政局'
  },
  computed: {
    tableCaption () {
      if (this.searchType === 'date') {
        const b = (this.dateRange && this.dateRange.begin) ? String(this.dateRange.begin) : ''
        const e = (this.dateRange && this.dateRange.end) ? String(this.dateRange.end) : ''
        return `${this.$utils.addDateDivider(b)} ~ ${this.$utils.addDateDivider(e)}`
      }
      return `關鍵字：${this.pid}`
    },
    totalCount () {
      return Array.isArray(this.rows) ? this.rows.length : 0
    },
    filteredRows () {
      if (!Array.isArray(this.rows) || this.rows.length === 0) {
        return []
      }
      const kw = this.filterKeyword ? this.filterKeyword.toLowerCase() : ''
      return this.rows.filter((row) => {
        if (this.filterMethod && row['申請方式'] !== this.filterMethod) {
          return false
        }
        if (this.filterCategory && row['申請類別'] !== this.filterCategory) {
          return false
        }
        if (this.filterLandBuild && row['地建別'] !== this.filterLandBuild) {
          return false
        }
        if (this.filterTown && row['鄉鎮市區'] !== this.filterTown) {
          return false
        }
        if (kw) {
          const haystack = [
            row['收件年'],
            row['收件字'],
            row['收件號'],
            row['申請人統編'],
            row['申請人姓名'],
            row['代理人統編'],
            row['代理人姓名'],
            row['段代碼'],
            row['段小段'],
            row['地建號'],
            row['鄉鎮市區']
          ].map(v => (v ? String(v).toLowerCase() : '')).join(' ')
          if (!haystack.includes(kw)) {
            return false
          }
        }
        return true
      })
    },
    filteredCount () {
      return this.filteredRows.length
    },
    dataCount () {
      return this.filteredCount
    },
    showPagination () {
      return this.filteredCount > this.pagination.perPage
    },
    hasActiveFilter () {
      return Boolean(
        this.filterKeyword ||
        this.filterMethod ||
        this.filterCategory ||
        this.filterLandBuild ||
        this.filterTown
      )
    },
    methodOpts () {
      const set = new Set()
      this.rows.forEach((r) => {
        if (r['申請方式']) {
          set.add(r['申請方式'])
        }
      })
      return [
        { value: '', text: '全部' },
        ...Array.from(set).map(v => ({ value: v, text: v }))
      ]
    },
    categoryOpts () {
      const set = new Set()
      this.rows.forEach((r) => {
        if (r['申請類別']) {
          set.add(r['申請類別'])
        }
      })
      return [
        { value: '', text: '全部' },
        ...Array.from(set).map(v => ({ value: v, text: v }))
      ]
    },
    landBuildOpts () {
      const set = new Set()
      this.rows.forEach((r) => {
        if (r['地建別']) {
          set.add(r['地建別'])
        }
      })
      return [
        { value: '', text: '全部' },
        ...Array.from(set).map(v => ({ value: v, text: v }))
      ]
    },
    townOpts () {
      const set = new Set()
      this.rows.forEach((r) => {
        if (r['鄉鎮市區']) {
          set.add(r['鄉鎮市區'])
        }
      })
      return [
        { value: '', text: '全部' },
        ...Array.from(set).map(v => ({ value: v, text: v }))
      ]
    },
    uniqueCaseCount () {
      const set = new Set()
      this.filteredRows.forEach((r) => {
        const key = `${r['收件年'] || ''}-${r['收件字'] || ''}-${r['收件號'] || ''}`
        if (key !== '--') {
          set.add(key)
        }
      })
      return set.size
    },
    uniqueApplicantCount () {
      const set = new Set()
      this.filteredRows.forEach((r) => {
        const id = r['申請人統編'] || r['申請人姓名']
        if (id) {
          set.add(id)
        }
      })
      return set.size
    },
    totalCertPages () {
      return this.filteredRows.reduce((sum, r) => {
        return sum +
          (Number(r['電子資料登記謄本張數']) || 0) +
          (Number(r['登記簿謄本張數']) || 0) +
          (Number(r['地價謄本張數']) || 0) +
          (Number(r['地籍圖謄本張數']) || 0) +
          (Number(r['建物平面圖謄本張數']) || 0)
      }, 0)
    },
    xlsxData () {
      return this.filteredRows.map((row) => {
        const copied = JSON.parse(JSON.stringify(row))
        copied['申請人統編'] = this.hidePersonalInfo(row['申請人統編'])
        copied['代理人統編'] = this.hidePersonalInfo(row['代理人統編'])
        copied['申請人姓名'] = this.hidePersonalInfo(row['申請人姓名'])
        copied['代理人姓名'] = this.hidePersonalInfo(row['代理人姓名'])
        return copied
      })
    },
    queryOK () {
      if (this.searchType !== 'date') {
        const str = this.pid ? String(this.pid).trim() : ''
        if (!str) {
          return false
        }
        // 含中文字元允許 2 字以上(姓名查詢)，純英數統編需 4 碼以上
        const hasChinese = /[\u4E00-\u9FA5]/.test(str)
        return hasChinese ? str.length >= 2 : str.length >= 4
      }
      return true
    }
  },
  watch: {
    searchType (val) {
      this.rows = []
      this.clearFilters()
    },
    hidePersonals (flag) {},
    filteredCount (dontcare) {
      this.updatePagination(1, this.pagination.perPage)
    },
    pagination (val) {
      this.setCache('cusmm-pagination', val)
    }
  },
  created () {
    this.maxHeightOffset = 225
  },
  async mounted () {
    const cached = await this.getCache('cusmm-pagination')
    this.updatePagination(1, (cached && cached.perPage) ? cached.perPage : 20)
  },
  methods: {
    setQuickDate (mode) {
      this.quickDateMode = mode
      const today = new Date()
      let beginDate = today
      const endDate = today
      if (mode === 'yesterday') {
        const yest = new Date()
        yest.setDate(today.getDate() - 1)
        beginDate = yest
      } else if (mode === '7days') {
        const d7 = new Date()
        d7.setDate(today.getDate() - 6)
        beginDate = d7
      } else if (mode === 'month') {
        beginDate = new Date(today.getFullYear(), today.getMonth(), 1)
      }
      const targetEnd = mode === 'yesterday' ? beginDate : endDate
      this.initBegin = beginDate
      this.initEnd = targetEnd
      const dp = this.$refs.datepicker
      if (dp) {
        dp.startDateObj = beginDate
        dp.endDateObj = targetEnd
      }
      this.dateRange = {
        begin: this.$utils.twDateStr(beginDate),
        end: this.$utils.twDateStr(targetEnd),
        days: 1
      }
      this.reload()
    },
    handleDateChanged (data) {},
    reload () {
      this.$fetch()
    },
    clearFilters () {
      this.filterKeyword = ''
      this.filterMethod = ''
      this.filterCategory = ''
      this.filterLandBuild = ''
      this.filterTown = ''
    },
    handleRowSelected (items) {
      if (Array.isArray(items) && items.length > 0) {
        this.selectedRow = items[0]
        if (this.$refs.detailModal) {
          this.$refs.detailModal.show()
        }
      }
    },
    updatePagination (current, pageCount) {
      this.pagination = {
        currentPage: current,
        perPage: pageCount
      }
    },
    hidePersonalInfo (text) {
      if (this.hidePersonals && text) {
        const str = String(text).trim()
        if (!str) {
          return text
        }
        // 10碼身分證/居留證號
        if (str.length === 10 && /^[A-Z0-9]/i.test(str)) {
          return str.slice(0, 4) + 'XXX' + str.slice(7)
        }
        // 8碼營利事業統編
        if (str.length === 8 && /^\d{8}$/.test(str)) {
          return str.slice(0, 3) + 'XXX' + str.slice(6)
        }
        // 2字中文姓名
        if (str.length === 2) {
          return str[0] + 'Ｏ'
        }
        // 3~4字中文姓名
        if (str.length <= 4) {
          return str[0] + 'Ｏ'.repeat(str.length - 2) + str[str.length - 1]
        }
        // 長名稱或法人名稱
        return str.slice(0, 2) + 'ＯＯ' + str.slice(-2)
      }
      return text
    }
  }
}
</script>

<style lang="scss" scoped>
.s-90 {
  font-size: 0.9rem;
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
