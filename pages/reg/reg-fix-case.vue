<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 補正期滿案件查詢
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'")
          h5 補正管考與法規說明
          ul
            li 搜尋「補正」、「補正初核」案件資料，預設依「管考緊急度」智慧排序（已可駁回 ➔ 3日內到期 ➔ 補正中 ➔ 待填送達日）
            li 頂部設有「4大戰情卡片」，點擊卡片可一鍵快篩該狀態案件
            li 補正期限為送達日後 15 個日曆天
            li 依《行政程序法》第 48 條第 4 項規定，期間末日若適逢週休二日或國定放假日，系統將自動順延至次一上班日，並標註順延提示
            li 支援「雙掛號送達回執快捷登錄」：單筆可直接點選「今/昨」按鈕，亦可勾選多筆案件後於上方浮動工具列「一鍵批次套用儲存」
            li 設定送達日期後自動連動同步「補正期滿日期」，資料庫與法規試算完全一致
          hr
          h5 請參照下列步驟搜尋
          ol
            li 點擊 #[lah-fa-icon(icon="search" variant="primary") 搜尋]
            li 點擊 #[lah-fa-icon(icon="sync" variant="muted") 重新搜尋]

      .d-flex.small
        a.small.text-muted.mr-2.align-self-center(
          href="#",
          @click.prevent="resetAdvSearch",
          title="重新設定為預設篩選選項",
          style="font-size: 0.85rem;"
        ) 重設
        lah-button(
          icon="search-plus",
          size="lg",
          title="開啟進階篩選視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady"
        ) 進階篩選
        lah-button-xlsx.mx-1(
          :jsons="xlsxData"
          header="補正案件"
        )
        lah-countdown-button(
          ref="countdown"
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          :milliseconds="cachedMs"
          :disabled="isBusy"
          :busy="isBusy"
          @end="reload"
          @click="reload"
          auto-start
          end-attention
          no-badge
        )

  lah-transition: .row.no-gutters.my-2(v-if="dataReady")
    .col-12.col-sm-6.col-md.p-1
      .card.h-100.border-danger.shadow-sm.kpi-card(
        :class="{ 'active-card-danger': statusFilter === 'REJECTABLE' }",
        @click="toggleStatusFilter('REJECTABLE')",
        style="cursor: pointer;"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-danger.mr-2(icon="exclamation-circle" size="2x")
            div
              .text-muted.small.font-weight-bold 已可駁回
              .small.text-danger 逾期未補正
          .h3.font-weight-bold.text-danger.mb-0 {{ caseStats.rejectable }}
    .col-12.col-sm-6.col-md.p-1
      .card.h-100.border-warning.shadow-sm.kpi-card(
        :class="{ 'active-card-warning': statusFilter === 'DUE_SOON' }",
        @click="toggleStatusFilter('DUE_SOON')",
        style="cursor: pointer;"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-warning.mr-2(icon="clock" size="2x")
            div
              .text-muted.small.font-weight-bold 3日內到期
              .small.text-warning 需重點催辦
          .h3.font-weight-bold.text-warning.mb-0 {{ caseStats.dueSoon }}
    .col-12.col-sm-6.col-md.p-1
      .card.h-100.border-success.shadow-sm.kpi-card(
        :class="{ 'active-card-success': statusFilter === 'IN_PROGRESS' }",
        @click="toggleStatusFilter('IN_PROGRESS')",
        style="cursor: pointer;"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-success.mr-2(icon="check-circle" size="2x")
            div
              .text-muted.small.font-weight-bold 補正進行中
              .small.text-success 15日內合法期
          .h3.font-weight-bold.text-success.mb-0 {{ caseStats.inProgress }}
    .col-12.col-sm-6.col-md.p-1
      .card.h-100.border-info.shadow-sm.kpi-card(
        :class="{ 'active-card-info': statusFilter === 'ROLLED_OVER' }",
        @click="toggleStatusFilter('ROLLED_OVER')",
        style="cursor: pointer;"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-info.mr-2(icon="balance-scale" size="2x")
            div
              .text-muted.small.font-weight-bold 依法順延
              .small.text-info 行政程序法§48
          .h3.font-weight-bold.text-info.mb-0 {{ caseStats.rolledOver }}
    .col-12.col-sm-6.col-md.p-1
      .card.h-100.border-secondary.shadow-sm.kpi-card(
        :class="{ 'active-card-secondary': statusFilter === 'PENDING_DELIVERY' }",
        @click="toggleStatusFilter('PENDING_DELIVERY')",
        style="cursor: pointer;"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-secondary.mr-2(icon="envelope-open-text" size="2x")
            div
              .text-muted.small.font-weight-bold 待填送達日
              .small.text-secondary 追蹤回執聯
          .h3.font-weight-bold.text-secondary.mb-0 {{ caseStats.pending }}

  lah-transition: .d-flex.align-items-center.bg-light.px-2.py-1.rounded.my-1.border(
    v-if="statusFilter !== 'ALL' || advTags.length > 0",
    style="min-height: 42px;"
  )
    .d-flex.align-items-center.flex-nowrap.w-100.overflow-hidden
      .d-flex.align-items-center.text-nowrap.flex-shrink-0.mr-2(v-if="statusFilter !== 'ALL'")
        lah-fa-icon(icon="filter" variant="primary" class="mr-1")
        span 目前正依戰情卡片篩選：
        b-badge.mx-1.p-2(pill :variant="statusFilterBadgeVariant") {{ statusFilterText }}
        span.text-muted.small.mr-2 （共 {{ queryCount }} 筆）

      .d-flex.align-items-center.flex-nowrap.tags-nowrap-container.flex-grow-1(
        v-if="advTags.length > 0"
      )
        b-tag.mr-1.text-nowrap.flex-shrink-0(
          v-for="tag in advTags",
          :key="tag",
          :variant="getTagVariant(tag)",
          :title="tag",
          @remove="removeAdvTag(tag)"
        ) {{ tag }}

      .d-flex.align-items-center.text-nowrap.flex-shrink-0.ml-auto(v-if="statusFilter !== 'ALL'")
        b-link.small.text-danger.text-nowrap(@click="clearStatusFilter")
          lah-fa-icon(icon="times-circle" class="mr-1")
          | 清除狀態篩選

  lah-transition: b-alert.d-flex.flex-wrap.align-items-center.justify-content-between.shadow-sm.mb-2.p-2(
    v-if="selectedRows.length > 0"
    show
    variant="primary"
  )
    .d-flex.align-items-center.my-1
      b-badge.mr-2.p-2(variant="light" pill) 已勾選 {{ selectedRows.length }} 件
      span.mr-2.font-weight-bold.text-white 統一登錄送達日：
      b-datepicker(
        size="sm"
        v-model="batchDeliveredDate"
        placeholder="選擇送達日期"
        hide-header
        dropleft
        today-button
        reset-button
        close-button
        label-today-button="今天"
        label-reset-button="重設"
        label-close-button="關閉"
        :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
      )
      b-button-group.ml-1(size="sm")
        b-button(variant="light" size="sm" @click="setBatchToday") 今天
        b-button(variant="light" size="sm" @click="setBatchYesterday") 昨天
    .d-flex.align-items-center.my-1
      lah-button(
        icon="check-double"
        variant="success"
        size="sm"
        :disabled="!batchDeliveredDate || batchSaving"
        :busy="batchSaving"
        @click="applyBatchUpdate"
      ) 一鍵批次套用儲存
      lah-button.ml-2(
        icon="times"
        variant="outline-light"
        size="sm"
        @click="clearSelectedRows"
      ) 取消勾選

  lah-pagination(
    v-model="pagination"
    :total-rows="queryCount"
    :caption="foundText"
  )

  lah-transition
    b-table.text-center.align-middle(
      v-if="committed"
      id="land-ref-table"
      ref="table"
      caption-top
      :sticky-header="`${maxHeight}px`"
      :busy="isBusy"
      :items="filterRows"
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
      :tbody-tr-class="rowClassCallback"
    )
      template(#table-busy): span.ld-txt 讀取中...
      template(#head(select))
        b-form-checkbox(
          :checked="isAllSelected"
          :indeterminate="isIndeterminate"
          @change="toggleSelectAll"
          title="全選/取消全選"
        )
      template(#cell(select)="{ item }")
        b-form-checkbox(
          :checked="isItemSelected(item)"
          @change="toggleItemSelect(item)"
        )
      template(#cell(status_badge)="{ item }")
        b-badge(
          pill
          :variant="getItemLegalCalc(item).statusVariant"
          class="p-2 text-nowrap"
        ) {{ getItemLegalCalc(item).statusText }}
      template(v-slot:cell(#)="{ item, index }")
        span {{ index + 1 + (pagination.currentPage - 1) * pagination.perPage }}
      template(#cell(lah-reg-case-fix-date)="{ item }")
        lah-reg-case-fix-date(
          :case-id="`${item.RM01}${item.RM02}${item.RM03}`",
          :parent-data="item"
        )
      template(#cell(收件字號)="{ item }"): .align-middle: b-link(@click="popup(item)").
        {{ item.收件字號 }} #[lah-fa-icon(icon="window-restore" regular variant="primary")]
      template(#cell(RM09)="{ item }"): .text-nowrap {{ item.RM09 }}:{{ item.登記原因 }}
      template(#cell(辦理情形)="{ item }"): .text-nowrap {{ item.RM30 }}:{{ item.辦理情形 }}
  b-modal(
    ref="caseDetail"
    size="xl"
    hide-footer
    centered
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ $utils.caseId(clickedData.ID) }}
    h4.text-center.text-info.my-5(v-if="modalLoading")
      b-spinner.my-auto(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(@ready="modalLoading = !$event.detail" :parent-data="clickedData")

  b-modal(
    ref="searchPlus",
    hide-footer
  )
    template(#modal-title)
      .d-flex.align-items-center
        span 進階篩選
        small.text-muted.ml-2 按住 Ctrl 鍵進行選擇/取消
    .center.d-flex
      b-input-group.mr-1(prepend="收件字")
        b-form-select(
          v-model="advOpts.caseWord",
          :options="advOpts.caseWordOpts",
          title="收件字",
          multiple,
          :select-size="4"
        )
      b-input-group.input-group-height-hack(prepend="收件號")
        b-input(v-model="advOpts.caseNum", placeholder="... 收件號 ...", trim)
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="登記原因"): b-form-select(
        v-model="advOpts.caseReason",
        :options="advOpts.caseReasonOpts",
        title="登記原因",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="辦理情形"): b-form-select(
        v-model="advOpts.caseState",
        :options="advOpts.caseStateOpts",
        title="辦理情形",
        multiple,
        :select-size="4"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="通知補正"): b-form-select(
        v-model="advOpts.caseFixDate",
        :options="advOpts.caseFixDateOpts",
        title="通知補正日期",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="初審人員"): b-form-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員",
        multiple,
        :select-size="4"
      )
    hr
    .center.d-flex.my-1
      lah-button(
        icon="recycle",
        @click="resetAdvSearch",
        variant="outline-success"
      ) 重設
      small.text-muted.ml-2 找到 {{ queryCount }} 筆
</template>

<script>
import dynamicHeight from '~/mixins/dynamic-height-mixin'
import { calculateLegalFixDeadline, formatDateISO } from '~/mixins/lah-fix-case-holiday.js'

export default {
  mixins: [dynamicHeight],
  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
    modalLoading: true,
    clickedData: undefined,
    rows: [],
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    forceReload: false,
    committed: false,
    statusFilter: 'ALL',
    selectedRows: [],
    batchDeliveredDate: '',
    batchSaving: false,
    fields: [
      {
        key: 'select',
        label: '選取',
        sortable: false,
        thStyle: { width: '45px' },
        class: 'align-middle'
      },
      '#',
      {
        key: 'status_badge',
        label: '管考狀態',
        sortable: false,
        thStyle: { width: '100px' },
        class: 'align-middle text-nowrap'
      },
      {
        key: 'lah-reg-case-fix-date',
        label: '送達通知設定',
        sortable: false,
        thStyle: { width: '350px' }
      },
      {
        key: '收件字號',
        sortable: true
      },
      {
        key: 'RM09',
        label: '登記原因',
        sortable: true
      },
      {
        key: '初審人員',
        sortable: true
      },
      {
        key: '辦理情形',
        sortable: true
      },
      {
        key: '通知補正日期',
        label: '通知補正',
        sortable: true
      }
    ],
    tagColorMap: {
      年: 'secondary',
      字: 'primary',
      號: 'info',
      登記原因: 'success',
      辦理情形: 'warning',
      初審人員: 'danger',
      通知補正: 'dark'
    },
    advOpts: {
      caseYear: '',
      caseYearOpts: [],
      caseWord: [],
      caseWordOpts: [],
      caseNum: '',
      caseReason: [],
      caseReasonOpts: [],
      caseState: [],
      caseStateOpts: [],
      casePreliminator: [],
      casePreliminatorOpts: [],
      caseFixDate: [],
      caseFixDateOpts: [],
      caseFixDeadline: [],
      caseFixDeadlineOpts: []
    }
  }),
  fetchOnServer: false,
  fetch () {
    if (this.isBusy) {
      this.warning('讀取中 ... 請稍後')
    } else {
      this.isBusy = true
      this.committed = false
      this.$axios.post(this.$consts.API.JSON.PREFETCH, {
        type: 'reg_fix_case',
        reload: this.forceReload
      }).then(({ data }) => {
        this.rows = data.raw || []
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
        const remainS = data.cache_remaining_time
        const remainMs = remainS * 1000
        if (remainMs && remainMs > 0) {
          this.setCache(this.cacheKey, data, remainMs)
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(remainMs)
            this.$refs.countdown.startCountdown()
          }
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
  },
  head: {
    title: '補正期滿案件查詢-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows?.length > 0 },
    queryCount () { return this.filterRows?.length || 0 },
    cacheKey () { return 'query_reg_fix_case' },
    foundText () { return `找到 ${this.queryCount} 筆「補正」、「補正初核」案件資料` },
    caseStats () {
      const stats = {
        total: this.rows?.length || 0,
        rejectable: 0,
        dueSoon: 0,
        inProgress: 0,
        pending: 0,
        rolledOver: 0
      }
      if (this.rows) {
        this.rows.forEach((item) => {
          const calc = this.getItemLegalCalc(item)
          if (calc.isRolledOver) {
            stats.rolledOver++
          }
          switch (calc.status) {
            case 'REJECTABLE':
              stats.rejectable++
              break
            case 'DUE_SOON':
              stats.dueSoon++
              break
            case 'IN_PROGRESS':
              stats.inProgress++
              break
            case 'PENDING_DELIVERY':
            default:
              stats.pending++
              break
          }
        })
      }
      return stats
    },
    statusFilterBadgeVariant () {
      switch (this.statusFilter) {
        case 'REJECTABLE': return 'danger'
        case 'DUE_SOON': return 'warning'
        case 'IN_PROGRESS': return 'success'
        case 'ROLLED_OVER': return 'info'
        case 'PENDING_DELIVERY': return 'secondary'
        default: return 'primary'
      }
    },
    statusFilterText () {
      switch (this.statusFilter) {
        case 'REJECTABLE': return '已可駁回案件'
        case 'DUE_SOON': return '3日內到期案件'
        case 'IN_PROGRESS': return '補正進行中案件'
        case 'ROLLED_OVER': return '依法順延案件'
        case 'PENDING_DELIVERY': return '待填送達日案件'
        default: return '全部案件'
      }
    },
    isAllSelected () {
      if (!this.filterRows || this.filterRows.length === 0) { return false }
      return this.selectedRows.length >= this.filterRows.length
    },
    isIndeterminate () {
      return this.selectedRows.length > 0 && this.selectedRows.length < this.filterRows.length
    },
    filterRows () {
      let pipelineItems = [...this.rows]

      // 戰情卡片狀態快篩
      if (this.statusFilter === 'ROLLED_OVER') {
        pipelineItems = pipelineItems.filter((item) => {
          const calc = this.getItemLegalCalc(item)
          return calc.isRolledOver
        })
      } else if (this.statusFilter !== 'ALL') {
        pipelineItems = pipelineItems.filter((item) => {
          const calc = this.getItemLegalCalc(item)
          return calc.status === this.statusFilter
        })
      }

      // 進階篩選
      const checkNum = !this.$utils.empty(this.advOpts.caseNum)
      if (checkNum) {
        pipelineItems = pipelineItems.filter(item => item.收件字號.includes(this.advOpts.caseNum))
      }
      const checkWord = this.advOpts.caseWord.length > 0
      if (checkWord) {
        pipelineItems = pipelineItems.filter((item) => {
          return this.advOpts.caseWord.includes(item.RM02)
        })
      }
      const checkYear = !this.$utils.empty(this.advOpts.caseYear)
      if (checkYear) {
        pipelineItems = pipelineItems.filter(item => item.收件字號.startsWith(`${this.advOpts.caseYear}年`))
      }
      const checkReason = this.advOpts.caseReason.length > 0
      if (checkReason) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseReason.includes(item.登記原因))
      }
      const checkState = this.advOpts.caseState.length > 0
      if (checkState) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseState.includes(item.辦理情形))
      }
      const checkPreliminator = this.advOpts.casePreliminator.length > 0
      if (checkPreliminator) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.casePreliminator.includes(item.初審人員))
      }
      const checkFixDate = this.advOpts.caseFixDate.length > 0
      if (checkFixDate) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseFixDate.includes(item.通知補正日期))
      }
      const checkFixDeadline = this.advOpts.caseFixDeadline.length > 0
      if (checkFixDeadline) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseFixDeadline.includes(item.補正期滿日期))
      }

      // 依「管考緊急度」智慧排序 (已可駁回 ➔ 3日內到期 ➔ 補正中 ➔ 待填送達日)
      const priorityMap = {
        REJECTABLE: 1,
        DUE_SOON: 2,
        IN_PROGRESS: 3,
        PENDING_DELIVERY: 4
      }

      pipelineItems.sort((a, b) => {
        const calcA = this.getItemLegalCalc(a)
        const calcB = this.getItemLegalCalc(b)
        const prioA = priorityMap[calcA.status] || 5
        const prioB = priorityMap[calcB.status] || 5
        if (prioA !== prioB) {
          return prioA - prioB
        }
        if (calcA.daysDiff !== null && calcB.daysDiff !== null) {
          return calcA.daysDiff - calcB.daysDiff
        }
        return (a.收件字號 || '').localeCompare(b.收件字號 || '')
      })

      return pipelineItems
    },
    advTags () {
      const tags = []
      const generateTags = (prefix, values) => {
        if (Array.isArray(values) && values.length > 0) {
          values.forEach(val => tags.push(`${prefix}：${val}`))
        } else if (!Array.isArray(values) && !this.$utils.empty(values)) {
          tags.push(`${prefix}：${values}`)
        }
      }
      generateTags('年', this.advOpts.caseYear)
      generateTags('字', this.advOpts.caseWord)
      generateTags('號', this.advOpts.caseNum)
      generateTags('登記原因', this.advOpts.caseReason)
      generateTags('辦理情形', this.advOpts.caseState)
      generateTags('初審人員', this.advOpts.casePreliminator)
      generateTags('通知補正', this.advOpts.caseFixDate)
      generateTags('補正期滿', this.advOpts.caseFixDeadline)
      return tags
    },
    xlsxData () {
      // prepare json objects for xlsx exporting
      const jsons = this.filterRows.map((data, idx, array) => {
        const calc = this.getItemLegalCalc(data)
        const obj = {
          管考狀態: calc.statusText || '待填送達日',
          收件年: data.RM01,
          收件字: data.收件字,
          收件號: data.RM03,
          收件日期: data.收件日期,
          登記原因: data.登記原因,
          辦理情形: data.辦理情形,
          初審人員: data.初審人員,
          補正字號: data.REG_FIX_CASE_RECORD?.note,
          通知補正日期: data.通知補正日期,
          原補正期滿日期: data.補正期滿日期,
          通知送達日期: this.toMinguoDate(data.REG_FIX_CASE_RECORD?.notify_delivered_date),
          調整期滿日期: calc.dueDateMinguo || this.toMinguoDate(data.REG_FIX_CASE_RECORD?.fix_deadline_date),
          可駁回日期: calc.rejectDateMinguo || '',
          是否依法順延: calc.isRolledOver ? `是 (順延${calc.rolloverDays}天)` : '否',
          順延說明: calc.tooltipText || ''
        }
        return obj
      })
      return jsons
    }
  },
  watch: {
    rows (val) {
      this.advOpts = {
        ...{
          caseYear: '',
          caseYearOpts: [],
          caseWord: [],
          caseWordOpts: [],
          caseNum: '',
          caseReason: [],
          caseReasonOpts: [],
          caseState: [],
          caseStateOpts: [],
          casePreliminator: [],
          casePreliminatorOpts: [],
          caseFixDate: [],
          caseFixDateOpts: [],
          caseFixDeadline: [],
          caseFixDeadlineOpts: []
        }
      }
      if (val) {
        this.advOpts.caseReasonOpts = [...new Set(val.map(item => item.登記原因))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.caseStateOpts = [...new Set(val.map(item => item.辦理情形))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.casePreliminatorOpts = [...new Set(val.map(item => item.初審人員))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.caseYearOpts = [...new Set(val.map(item => item.RM01))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.caseWordOpts = [...new Set(val.map(item => item.RM02))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.caseFixDateOpts = [...new Set(val.map(item => item.通知補正日期))].filter(item => !this.$utils.empty(item)).sort()
        this.advOpts.caseFixDeadlineOpts = [...new Set(val.map(item => item.補正期滿日期))].filter(item => !this.$utils.empty(item)).sort()
        this.setDefaultCaseWords()
      }
    },
    committed () {
      this.debouncedUpdateHeight?.()
    },
    statusFilter () {
      this.debouncedUpdateHeight?.()
    },
    'selectedRows.length' () {
      this.debouncedUpdateHeight?.()
    },
    advTags () {
      this.debouncedUpdateHeight?.()
    },
    filterRows () {
      this.debouncedUpdateHeight?.()
    }
  },
  created () {
    this.maxHeightOffset = 175
  },
  mounted () {
    this.updateMaxHeight = this.calculateMaxHeight
    this.debouncedUpdateHeight = this.$utils.debounce(this.updateMaxHeight, 80)
    window.addEventListener('resize', this.debouncedUpdateHeight)
    if (this.zoomDetectorFrame?.contentWindow) {
      this.zoomDetectorFrame.contentWindow.addEventListener('resize', this.debouncedUpdateHeight)
    }
    if (window.ResizeObserver && this.$el) {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
      }
      this.resizeObserver = new ResizeObserver(this.debouncedUpdateHeight)
      this.resizeObserver.observe(this.$el)
    }
    this.calculateMaxHeight()
  },
  beforeDestroy () {
    if (this.debouncedUpdateHeight) {
      window.removeEventListener('resize', this.debouncedUpdateHeight)
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
      this.resizeObserver = null
    }
  },
  methods: {
    getTagVariant (tag) {
      const [prefix] = tag.split('：')
      return this.tagColorMap[prefix.trim()] || 'secondary'
    },
    handleTagsChange (tags) {
      if (tags.length < this.advTags.length) {
        const removedTag = this.advTags.find(t => !tags.includes(t))
        if (removedTag) {
          this.removeAdvTag(removedTag)
        }
      }
    },
    removeAdvTag (tag) {
      const [prefix, value] = tag.split('：')
      const trimmedValue = value?.trim()
      if (!prefix || !trimmedValue) {
        return
      }
      switch (prefix.trim()) {
        case '年':
          this.advOpts.caseYear = ''
          break
        case '字':
          this.advOpts.caseWord = this.advOpts.caseWord.filter(v => v !== trimmedValue)
          break
        case '號':
          this.advOpts.caseNum = ''
          break
        case '登記原因':
          this.advOpts.caseReason = this.advOpts.caseReason.filter(v => v !== trimmedValue)
          break
        case '辦理情形':
          this.advOpts.caseState = this.advOpts.caseState.filter(v => v !== trimmedValue)
          break
        case '初審人員':
          this.advOpts.casePreliminator = this.advOpts.casePreliminator.filter(v => v !== trimmedValue)
          break
        case '通知補正':
          this.advOpts.caseFixDate = this.advOpts.caseFixDate.filter(v => v !== trimmedValue)
          break
        case '補正期滿':
          this.advOpts.caseFixDeadline = this.advOpts.caseFixDeadline.filter(v => v !== trimmedValue)
          break
      }
    },
    setDefaultCaseWords () {
      if (!this.dataReady) {
        this.advOpts.caseWord = []
        return
      }
      const defaultCaseWords = new Set()
      const allItems = this.rows || []
      allItems.forEach((item) => {
        const extractedWord = item.RM02
        if (extractedWord) {
          const alphabet = this.site[1]
          const number = alphabet.charCodeAt(0) - 64
          const localCaseRegex = new RegExp(`${this.site}[0-9]{1,2}`, 'gim')
          if (localCaseRegex.test(extractedWord) || extractedWord.endsWith(`${alphabet}1`) || extractedWord.startsWith(`H${number}`)) {
            defaultCaseWords.add(extractedWord)
          }
        }
      })
      this.advOpts.caseWord = [...defaultCaseWords]
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
      this.clickedData = data
      this.$refs.caseDetail.show()
    },
    humanTWDate (str) {
      return `${str.substring(0, 3)}-${str.substring(3, 5)}-${str.substring(5)}`
    },
    toMinguoDate (dateString) {
      if (!dateString) { return '' }
      const [year, month, day] = dateString.split('-')
      const parsedYear = parseInt(year)
      if (parsedYear < 1911) { return dateString }
      const minguoYear = parsedYear - 1911
      return `${minguoYear}-${month}-${day}`
    },
    resetAdvSearch () {
      this.advOpts = {
        ...this.advOpts,
        caseYear: '',
        caseWord: [],
        caseNum: '',
        caseReason: [],
        caseState: [],
        casePreliminator: [],
        caseFixDate: [],
        caseFixDeadline: []
      }
      this.setDefaultCaseWords()
    },
    getItemLegalCalc (item) {
      if (!item) {
        return {
          status: 'PENDING_DELIVERY',
          statusText: '待填送達日',
          statusVariant: 'secondary',
          isRolledOver: false,
          rolloverDays: 0,
          tooltipText: '',
          daysDiff: null
        }
      }
      const delivered = item.REG_FIX_CASE_RECORD?.notify_delivered_date
      const factor = item.RM52_TYPE === '1' ? 30 : 1
      const days = factor * (parseInt(item.RM52_DAY, 10) || 15)
      return calculateLegalFixDeadline(delivered, days)
    },
    toggleStatusFilter (statusKey) {
      if (this.statusFilter === statusKey) {
        this.statusFilter = 'ALL'
      } else {
        this.statusFilter = statusKey
      }
      this.pagination.currentPage = 1
    },
    clearStatusFilter () {
      this.statusFilter = 'ALL'
      this.pagination.currentPage = 1
    },
    isItemSelected (item) {
      if (!item) { return false }
      const id = `${item.RM01}${item.RM02}${item.RM03}`
      return this.selectedRows.some(row => `${row.RM01}${row.RM02}${row.RM03}` === id)
    },
    toggleItemSelect (item) {
      const id = `${item.RM01}${item.RM02}${item.RM03}`
      const index = this.selectedRows.findIndex(row => `${row.RM01}${row.RM02}${row.RM03}` === id)
      if (index >= 0) {
        this.selectedRows.splice(index, 1)
      } else {
        this.selectedRows.push(item)
      }
    },
    toggleSelectAll (checked) {
      if (checked) {
        this.selectedRows = [...this.filterRows]
      } else {
        this.selectedRows = []
      }
    },
    clearSelectedRows () {
      this.selectedRows = []
    },
    setBatchToday () {
      this.batchDeliveredDate = formatDateISO(new Date())
    },
    setBatchYesterday () {
      const y = new Date()
      y.setDate(y.getDate() - 1)
      this.batchDeliveredDate = formatDateISO(y)
    },
    rowClassCallback (item, type) {
      if (!item || type !== 'row') { return '' }
      const calc = this.getItemLegalCalc(item)
      switch (calc.status) {
        case 'REJECTABLE': return 'tr-rejectable'
        case 'DUE_SOON': return 'tr-due-soon'
        case 'IN_PROGRESS': return 'tr-in-progress'
        case 'PENDING_DELIVERY': return 'tr-pending'
        default: return ''
      }
    },
    async applyBatchUpdate () {
      if (!this.batchDeliveredDate || this.selectedRows.length === 0) {
        return
      }
      this.batchSaving = true
      let successCount = 0
      let failCount = 0

      for (const item of this.selectedRows) {
        const id = `${item.RM01}${item.RM02}${item.RM03}`
        const factor = item.RM52_TYPE === '1' ? 30 : 1
        const days = factor * (parseInt(item.RM52_DAY, 10) || 15)
        const calc = calculateLegalFixDeadline(this.batchDeliveredDate, days)
        const deadline = calc.dueDate || ''
        const note = item.REG_FIX_CASE_RECORD?.note || ''

        try {
          const res = await this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'upd_reg_fix_case_data',
            id,
            delivered: this.batchDeliveredDate,
            deadline,
            note
          })
          if (this.$utils.statusCheck(res.data.status)) {
            successCount++
            if (!item.REG_FIX_CASE_RECORD) {
              item.REG_FIX_CASE_RECORD = {}
            }
            item.REG_FIX_CASE_RECORD.notify_delivered_date = this.batchDeliveredDate
            item.REG_FIX_CASE_RECORD.fix_deadline_date = deadline
          } else {
            failCount++
          }
        } catch (err) {
          failCount++
        }
      }

      this.batchSaving = false
      if (successCount > 0) {
        this.success(`已成功批次更新 ${successCount} 筆案件送達日期為 ${this.batchDeliveredDate}！${failCount > 0 ? `（${failCount} 筆失敗）` : ''}`, {
          title: '批次登錄完成'
        })
        this.clearSelectedRows()
      } else {
        this.danger(`批次更新失敗，共 ${failCount} 筆未完成。`, {
          title: '批次登錄錯誤'
        })
      }
    },
    calculateMaxHeight () {
      this.$nextTick(() => {
        if (typeof window === 'undefined') { return }
        const tableRef = this.$refs.table
        let tableTop = 0
        const tableEl = tableRef?.$el || document.getElementById('land-ref-table')
        if (tableEl && typeof tableEl.getBoundingClientRect === 'function') {
          tableTop = tableEl.getBoundingClientRect().top
        } else if (this.$el && typeof this.$el.getBoundingClientRect === 'function') {
          tableTop = this.$el.getBoundingClientRect().top + 200
        }

        if (tableTop > 0) {
          const versionEl = document.querySelector('.version')
          let targetBottom = window.innerHeight - 15
          if (versionEl && typeof versionEl.getBoundingClientRect === 'function') {
            targetBottom = versionEl.getBoundingClientRect().bottom
          }
          const availableHeight = Math.max(200, Math.floor(targetBottom - tableTop))
          if (Math.abs(this.maxHeight - availableHeight) > 2) {
            this.maxHeight = availableHeight
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.input-group-height-hack {
  align-self: stretch;
}
.input-group-height-hack::v-deep .form-control {
  height: 100%;
}
::v-deep .b-form-tag {
  font-size: 85%;
}

::v-deep .b-table-sticky-header {
  margin-bottom: 0 !important;
}

.kpi-card {
  transition: all 0.2s ease-in-out;
  border-width: 1.5px;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12) !important;
  }
}
.active-card-danger {
  background-color: #fff5f5 !important;
  border-width: 2.5px !important;
  box-shadow: 0 0 10px rgba(220, 53, 69, 0.35) !important;
}
.active-card-warning {
  background-color: #fffdf0 !important;
  border-width: 2.5px !important;
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.35) !important;
}
.active-card-success {
  background-color: #f0fff4 !important;
  border-width: 2.5px !important;
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.35) !important;
}
.active-card-secondary {
  background-color: #f8f9fa !important;
  border-width: 2.5px !important;
  box-shadow: 0 0 10px rgba(108, 117, 125, 0.35) !important;
}
.active-card-info {
  background-color: #f0faff !important;
  border-width: 2.5px !important;
  box-shadow: 0 0 10px rgba(23, 162, 184, 0.35) !important;
}

.tags-nowrap-container {
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: thin;
  &::-webkit-scrollbar {
    height: 3px;
  }
}

::v-deep tr.tr-rejectable td {
  background-color: rgba(220, 53, 69, 0.08) !important;
}
::v-deep tr.tr-due-soon td {
  background-color: rgba(255, 193, 7, 0.1) !important;
}
::v-deep tr.tr-in-progress td {
  background-color: rgba(40, 167, 69, 0.04) !important;
}
::v-deep tr.tr-pending td {
  background-color: rgba(108, 117, 125, 0.04) !important;
}
</style>
