<template lang="pug">
div(v-cloak)
  lah-header
    lah-transition(appear)
      .d-flex.justify-content-between.w-100.my-auto.align-items-center
        .d-flex.align-items-center
          .h3.mb-0.font-weight-bold.text-nowrap 地政系統簡訊記錄綜合查詢
          b-badge.ml-2.h4.mb-0(v-if="stats.total > 0" variant="secondary" pill) {{ stats.total }} 筆
          lah-button.h3.mb-0.ml-1(
            icon="question"
            variant="outline-success"
            no-border
            no-icon-gutter
            v-b-modal.help-modal
            title="說明"
            size="lg"
          )
        .d-flex.align-items-center
          //- 快捷日期浮動選單
          b-dropdown.h3.mb-0.mr-2(
            variant="outline-secondary"
            size="lg"
            right
            no-caret
            title="快速選擇查詢日期"
          )
            template(#button-content)
              lah-fa-icon(icon="calendar-days", append) 快捷日期
            b-dropdown-item(@click="applyQuickDate('today')")
              lah-fa-icon.text-primary.mr-1(icon="calendar-day") 今天 ({{ todayTW }})
            b-dropdown-item(@click="applyQuickDate('yesterday')")
              lah-fa-icon.text-info.mr-1(icon="calendar-minus") 昨天
            b-dropdown-item(@click="applyQuickDate('3days')")
              lah-fa-icon.text-warning.mr-1(icon="calendar-week") 近 3 天
            b-dropdown-item(@click="applyQuickDate('7days')")
              lah-fa-icon.text-success.mr-1(icon="calendar-days") 近 7 天
            b-dropdown-item(@click="applyQuickDate('thisMonth')")
              lah-fa-icon.text-dark.mr-1(icon="calendar") 本月迄今
            b-dropdown-divider
            b-dropdown-item(@click="showDateModal = true")
              lah-fa-icon.text-secondary.mr-1(icon="calendar-plus") 自訂日期區間...

          //- 強化型智慧單一關鍵字搜尋框
          b-input-group.header-search-group.h3.mb-0(size="lg")
            b-form-input(
              v-model="keyword",
              placeholder="輸入日期(如1130312/區間)/手機/EMAIL...",
              title="輸入民國年月日、日期區間(如 1130101 ~ 1130229)、手機或EMAIL",
              @keyup.enter="handleSearch"
            )
            template(#append)
              b-button(
                v-if="keyword",
                variant="outline-secondary",
                size="lg",
                title="清空輸入",
                @click="keyword = ''"
              )
                lah-fa-icon(icon="xmark")
              lah-button(
                icon="magnifying-glass",
                variant="primary",
                size="lg",
                title="依條件查詢簡訊紀錄",
                no-icon-gutter,
                :disabled="!isValidKeyword || isBusy",
                @click="handleSearch"
              )

          //- 匯出 XLSX 按鈕
          lah-button-xlsx.h3.mb-0.ml-2(
            :jsons="xlsxData"
            :header="`地政簡訊記錄_${keyword || todayTW}`"
            size="lg"
          )

          //- 重新整理按鈕
          lah-button.h3.mb-0.ml-1(
            icon="rotate",
            variant="outline-secondary",
            size="lg",
            title="重新查詢",
            no-icon-gutter,
            :disabled="isBusy",
            @click="handleSearch"
          )

    lah-help-modal(:modal-id="'help-modal'")
      .h5 請參照下列資訊輸入關鍵字查詢
      ul
        li 今天日期(預設)，範例「{{ todayTW }}」
        li 電子郵件 (EMAIL)
        li 手機號碼 (例如「0912345678」)
        li 日期區間，範例「1130101 ~ 1130229」
      hr
      .h6 功能提示
      ul
        li 點擊上方「快捷日期」可一鍵代入常用日期區間並查詢。
        li 點選下方 KPI 狀態卡片可快速過濾「全部」、「成功」、「傳送失敗」、「異動即時通」或「案件辦理」。
        li 簡訊記錄支援 Excel (XLSX) 匯出，可點擊上方 Excel 圖示下載。
        li 門號與簡訊內容皆附有「一鍵複製」按鈕，長簡訊支援展開與收合。

  //- 自訂日期區間選取彈跳視窗
  b-modal(
    v-model="showDateModal"
    title="選取自訂日期區間"
    ok-title="確定查詢"
    cancel-title="取消"
    @ok="applyCustomDateRange"
    centered
  )
    .p-2
      label.font-weight-bold.text-muted.mb-2 請選取開始與結束日期：
      lah-datepicker(v-model="customDateRange")

  //- 頂部互動式 KPI 統計指標卡列
  lah-transition: .kpi-wrapper.my-2(v-if="stats.total > 0")
    .d-flex.flex-wrap.align-items-center.justify-content-between
      .d-flex.flex-wrap.align-items-center.kpi-cards
        //- 1. 全部
        .kpi-card(
          :class="{ active: currentKpiFilter === 'all' }"
          @click="selectKpiFilter('all')"
          title="顯示所有簡訊紀錄"
        )
          .kpi-icon: lah-fa-icon(icon="list-check")
          .kpi-body
            .kpi-title 全部發送
            .kpi-value {{ stats.total }}

        //- 2. 成功
        .kpi-card.kpi-card-success(
          :class="{ active: currentKpiFilter === 'success' }"
          @click="selectKpiFilter('success')"
          title="僅顯示傳送成功"
        )
          .kpi-icon: lah-fa-icon(icon="circle-check")
          .kpi-body
            .kpi-title 發送成功 ({{ stats.successRate }}%)
            .kpi-value {{ stats.success }}

        //- 3. 失敗
        .kpi-card.kpi-card-danger(
          :class="{ active: currentKpiFilter === 'fail' }"
          @click="selectKpiFilter('fail')"
          title="僅顯示傳送失敗"
        )
          .kpi-icon: lah-fa-icon(icon="triangle-exclamation")
          .kpi-body
            .kpi-title 傳送失敗
            .kpi-value {{ stats.fail }}

        .kpi-divider.mx-1

        //- 4. 動態顯示當前資料之所有簡訊種類卡片 (如：異動即時通、案件辦理、代收代寄、住址隱匿、手動等)
        .kpi-card(
          v-for="t in typeList"
          :key="t.name"
          :class="[`kpi-card-${t.variant}`, { active: currentKpiFilter === t.name }]"
          @click="selectKpiFilter(t.name)"
          :title="`僅顯示 ${t.name} (${t.count} 筆)`"
        )
          .kpi-icon: lah-fa-icon(:icon="t.icon")
          .kpi-body
            .kpi-title {{ t.name }}
            .kpi-value {{ t.count }}

      //- 右側細部時段篩選與重設
      .d-flex.align-items-center.kpi-side-filters.my-1
        b-button.mr-2(
          v-if="currentKpiFilter !== 'all' || currentFilterTime !== '全部'",
          variant="outline-danger",
          size="sm",
          pill,
          @click="resetAllFilters"
          title="重設所有篩選條件"
        )
          lah-fa-icon(icon="filter-circle-xmark", append) 重設篩選
        lah-fa-icon(icon="clock", title="依時段篩選")
          b-select.filter-time-select(
            v-model="currentFilterTime",
            :options="filterTimeOpts",
            size="sm",
            @change="handleFilterTimeChange"
          )
        span.ml-1.small.text-muted(v-if="currentFilterTime !== '全部'") 點

  //- 表格主體
  lah-adm-smslog-table(
    ref="smsTable",
    :in-keyword="keyword",
    :hide-search-toolbar="true",
    @reload="onTableReload",
    @stats="onStatsUpdate"
  )
</template>

<script>
export default {
  data: () => ({
    keyword: '',
    showDateModal: false,
    customDateRange: { begin: '', end: '', days: 0 },
    stats: {
      total: 0,
      success: 0,
      fail: 0,
      alert: 0,
      caseProgress: 0,
      successRate: '0'
    },
    logs: [],
    currentKpiFilter: 'all',
    currentFilterTime: '全部',
    filterTimeOpts: ['全部', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17']
  }),
  head: {
    title: '地政系統簡訊記錄綜合查詢-桃園市地政局'
  },
  computed: {
    todayTW () {
      return this.$utils?.today ? this.$utils.today('TW') : ''
    },
    isValidKeyword () {
      return !this.$utils.empty(this.keyword) && this.$utils.length(this.keyword) > 2
    },
    isBusy () {
      return this.$refs?.smsTable?.isBusy || false
    },
    typeList () {
      if (!this.logs || this.logs.length === 0) { return [] }
      const counts = {}
      this.logs.forEach((item) => {
        let t = item.SMS_TYPE?.trim() || '其他'
        if (t === 'O' || t === '跨所代收' || t === '跨所代收代寄') {
          t = '跨域代收代寄'
        } else if (t === 'M') {
          t = '地籍異動即時通'
        } else if (t === 'W') {
          t = '指定送達處所'
        } else if (t === 'Z') {
          t = '智慧控管系統'
        }
        counts[t] = (counts[t] || 0) + 1
      })
      const order = ['地籍異動即時通', '案件辦理情形', '跨域代收代寄', '住址隱匿', '指定送達處所', '手動', '智慧控管系統']
      const sortedTypes = Object.keys(counts).sort((a, b) => {
        const idxA = order.indexOf(a)
        const idxB = order.indexOf(b)
        if (idxA !== -1 && idxB !== -1) { return idxA - idxB }
        if (idxA !== -1) { return -1 }
        if (idxB !== -1) { return 1 }
        return counts[b] - counts[a]
      })
      return sortedTypes.map(type => ({
        name: type,
        count: counts[type],
        variant: this.getTypeVariant(type),
        icon: this.getTypeIcon(type)
      }))
    },
    xlsxData () {
      if (!this.logs || this.logs.length === 0) { return [] }
      return this.logs.map((item) => {
        let t = item.SMS_TYPE || ''
        if (t === 'O' || t === '跨所代收' || t === '跨所代收代寄') {
          t = '跨域代收代寄'
        }
        return {
          收件案號: `${item.SMS_YEAR || ''}-${item.SMS_CODE || ''}-${item.SMS_NUMBER || ''}`,
          簡訊種類: t,
          發送日期: item.SMS_DATE || '',
          發送時間: item.SMS_TIME || '',
          手機號碼: item.SMS_CELL || '',
          '其他/EMAIL': item.SMS_MAIL || '',
          發送結果: item.SMS_RESULT === 'S' || item.SMS_RESULT?.startsWith('OK') ? '成功' : `失敗 (${item.SMS_RESULT || ''})`,
          簡訊內容: item.SMS_CONTENT || ''
        }
      })
    }
  },
  created () {
    this.keyword = this.todayTW
  },
  methods: {
    getTypeVariant (type) {
      if (!type) { return 'secondary' }
      if (type.includes('異動即時通')) { return 'primary' }
      if (type.includes('案件辦理情形')) { return 'success' }
      if (type.includes('跨域代收代寄') || type.includes('代收代寄') || type === 'O') { return 'info' }
      if (type.includes('住址隱匿')) { return 'warning' }
      if (type.includes('指定送達處所')) { return 'secondary' }
      if (type.includes('手動')) { return 'dark' }
      if (type.includes('智慧控管')) { return 'dark' }
      return 'secondary'
    },
    getTypeIcon (type) {
      if (!type) { return 'comment-dots' }
      if (type.includes('異動即時通')) { return 'bell' }
      if (type.includes('案件辦理情形')) { return 'file-lines' }
      if (type.includes('跨域代收代寄') || type.includes('代收代寄') || type === 'O') { return 'truck-fast' }
      if (type.includes('住址隱匿')) { return 'user-shield' }
      if (type.includes('指定送達處所')) { return 'map-location-dot' }
      if (type.includes('智慧控管')) { return 'gauge-high' }
      if (type.includes('手動')) { return 'keyboard' }
      return 'comment-dots'
    },
    applyQuickDate (type) {
      const today = new Date()
      let kw = ''
      if (type === 'today') {
        kw = this.todayTW
      } else if (type === 'yesterday') {
        const d = new Date()
        d.setDate(d.getDate() - 1)
        kw = this.$utils.twDateStr(d)
      } else if (type === '3days') {
        const d = new Date()
        d.setDate(d.getDate() - 2)
        kw = `${this.$utils.twDateStr(d)} ~ ${this.todayTW}`
      } else if (type === '7days') {
        const d = new Date()
        d.setDate(d.getDate() - 6)
        kw = `${this.$utils.twDateStr(d)} ~ ${this.todayTW}`
      } else if (type === 'thisMonth') {
        const d = new Date(today.getFullYear(), today.getMonth(), 1)
        kw = `${this.$utils.twDateStr(d)} ~ ${this.todayTW}`
      }
      if (kw) {
        this.keyword = kw
        this.handleSearch()
      }
    },
    applyCustomDateRange () {
      if (this.customDateRange?.begin && this.customDateRange?.end) {
        this.keyword = `${this.customDateRange.begin} ~ ${this.customDateRange.end}`
        this.handleSearch()
      }
    },
    handleSearch () {
      if (this.isValidKeyword && this.$refs.smsTable) {
        this.$refs.smsTable.setKeyword(this.keyword)
      }
    },
    onTableReload (payload) {
      if (payload) {
        this.keyword = payload.keyword || this.keyword
        this.logs = payload.logs || []
        if (payload.stats) {
          this.stats = { ...payload.stats }
        }
      }
    },
    onStatsUpdate (stats) {
      if (stats) {
        this.stats = { ...stats }
      }
    },
    selectKpiFilter (type) {
      this.currentKpiFilter = type
      if (!this.$refs.smsTable) { return }
      if (type === 'all') {
        this.$refs.smsTable.setFilterType('全部')
        this.$refs.smsTable.setWatchFails(false)
        this.$refs.smsTable.setWatchSuccess(false)
      } else if (type === 'success') {
        this.$refs.smsTable.setFilterType('全部')
        this.$refs.smsTable.setWatchSuccess(true)
      } else if (type === 'fail') {
        this.$refs.smsTable.setFilterType('全部')
        this.$refs.smsTable.setWatchFails(true)
      } else {
        this.$refs.smsTable.setWatchFails(false)
        this.$refs.smsTable.setWatchSuccess(false)
        this.$refs.smsTable.setFilterType(type)
      }
    },
    handleFilterTimeChange (val) {
      this.$refs.smsTable?.setFilterTime(val)
    },
    resetAllFilters () {
      this.currentKpiFilter = 'all'
      this.currentFilterTime = '全部'
      if (this.$refs.smsTable) {
        this.$refs.smsTable.reset()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.header-search-group {
  max-width: 440px;
}
.filter-time-select {
  width: 90px;
}
.kpi-wrapper {
  background-color: rgba(245, 247, 250, 0.7);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 12px;
}
.kpi-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.kpi-card {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 14px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
  }

  &.active {
    border-color: #4a5568;
    box-shadow: 0 0 0 2px rgba(74, 85, 104, 0.2);
    font-weight: bold;
  }

  .kpi-icon {
    font-size: 1.25rem;
    margin-right: 8px;
    color: #718096;
  }

  .kpi-body {
    display: flex;
    flex-direction: column;

    .kpi-title {
      font-size: 0.75rem;
      color: #718096;
      line-height: 1.2;
    }

    .kpi-value {
      font-size: 1.15rem;
      font-weight: bold;
      color: #2d3748;
      line-height: 1.2;
    }
  }

  &.kpi-card-success {
    border-left: 4px solid #38a169;
    .kpi-icon { color: #38a169; }
    .kpi-value { color: #276749; }
    &.active {
      background-color: #f0fff4;
      border-color: #38a169;
      box-shadow: 0 0 0 2px rgba(56, 161, 105, 0.25);
    }
  }

  &.kpi-card-danger {
    border-left: 4px solid #e53e3e;
    .kpi-icon { color: #e53e3e; }
    .kpi-value { color: #9b2c2c; }
    &.active {
      background-color: #fff5f5;
      border-color: #e53e3e;
      box-shadow: 0 0 0 2px rgba(229, 62, 62, 0.25);
    }
  }

  &.kpi-card-primary {
    border-left: 4px solid #3182ce;
    .kpi-icon { color: #3182ce; }
    .kpi-value { color: #2b6cb0; }
    &.active {
      background-color: #ebf8ff;
      border-color: #3182ce;
      box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.25);
    }
  }

  &.kpi-card-info {
    border-left: 4px solid #00a389;
    .kpi-icon { color: #00a389; }
    .kpi-value { color: #007a66; }
    &.active {
      background-color: #e6fffa;
      border-color: #00a389;
      box-shadow: 0 0 0 2px rgba(0, 163, 137, 0.25);
    }
  }

  &.kpi-card-warning {
    border-left: 4px solid #dd6b20;
    .kpi-icon { color: #dd6b20; }
    .kpi-value { color: #c05621; }
    &.active {
      background-color: #fffaf0;
      border-color: #dd6b20;
      box-shadow: 0 0 0 2px rgba(221, 107, 32, 0.25);
    }
  }

  &.kpi-card-secondary {
    border-left: 4px solid #718096;
    .kpi-icon { color: #718096; }
    .kpi-value { color: #4a5568; }
    &.active {
      background-color: #f7fafc;
      border-color: #718096;
      box-shadow: 0 0 0 2px rgba(113, 128, 150, 0.25);
    }
  }

  &.kpi-card-dark {
    border-left: 4px solid #4a5568;
    .kpi-icon { color: #4a5568; }
    .kpi-value { color: #1a202c; }
    &.active {
      background-color: #edf2f7;
      border-color: #2d3748;
      box-shadow: 0 0 0 2px rgba(45, 55, 72, 0.25);
    }
  }
}
.kpi-divider {
  width: 1px;
  height: 38px;
  background-color: #cbd5e0;
  align-self: center;
}
</style>
