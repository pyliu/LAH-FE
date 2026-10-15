<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.align-items-center.w-100
      .d-flex.align-items-center.header-left-group
        .my-auto.font-weight-bold.h3.mb-0 公告案件管考
        lah-button(
          icon="info"
          action="bounce"
          variant="outline-success"
          size="lg"
          no-border
          no-icon-gutter
          @click="showModalById('help-modal')"
          title="功能與法規說明"
          class="ml-1"
        )
        lah-help-modal(:modal-id="'help-modal'" size="lg")
          .h5.font-weight-bold 公告案件管考與法規說明：
          ul.pl-3.mb-3
            li
              strong.text-primary 專為初審人員設計：
              | 系統自動比對登入身分，預設以「我的初審案件」為焦點，方便初審同仁每日優先確認有無「期滿無異議需接續辦理准登/審查/登簿」之到期案件。
            li
              strong.text-danger 管考緊急度智慧排序：
              | 預設排序為 🔴 已到期（逾期越久越前） ➔ 🟡 今日到期 ➔ 🟠 3日內到期 ➔ 🟢 正常公告中 ➔ 🔵 公告初核中。
            li
              strong.text-success 各登記原因公告期限：
              | 例如【書狀補給】依法公告 30 日、【土地/建物第一次登記、增建】公告 15 日。表格清楚標示法定天數徽章與倒數進度。
            li
              strong.text-info 行政程序法第 48 條例假日順延：
              | 期間末日若適逢週六、週日或國定假日，系統自動標註「依法順延至次一工作日」，防止提早進行處置衍生法律爭議。
            li
              strong.text-dark 5 大戰情卡片與原因分流：
              | 頂部提供卡片與分流標籤，點擊即可一鍵過濾特定狀態或登記原因之案件。

      .d-flex.align-items-center.header-right-group
        b-button-group.mr-2(v-if="dataReady && myReviewerInfo.exists")
          b-button(
            :variant="reviewerViewMode === 'MY' ? 'primary' : 'outline-primary'"
            @click="setReviewerViewMode('MY')"
            title="僅顯示我承辦的初審公告案件"
          )
            lah-fa-icon.mr-1(icon="user")
            | 我的案件 ({{ myReviewerInfo.count }})
          b-button(
            :variant="reviewerViewMode === 'ALL' ? 'primary' : 'outline-primary'"
            @click="setReviewerViewMode('ALL')"
            title="顯示全所所有初審同仁之公告案件"
          )
            lah-fa-icon.mr-1(icon="users")
            | 全所案件 ({{ bakedData.length }})

        b-form-select.mr-2(
          v-if="dataReady"
          v-model="selectedReviewer"
          :options="reviewerDropdownOptions"
          style="width: 170px;"
          title="快速切換初審人員"
        )

        b-link.mr-2.text-muted.s-85.header-reset-link(
          v-if="hasActiveFilters"
          @click="resetAllFilters"
          title="清除所有過濾條件，恢復預設"
        ) 重設

        lah-button(
          icon="search-plus"
          size="lg"
          title="開啟進階篩選視窗"
          @click="$refs.searchPlus.show()"
          :disabled="!dataReady"
        ) 進階篩選

        lah-button-xlsx.mx-1(
          :jsons="xlsxData"
          header="公告案件管考清單"
        )

        lah-countdown-button(
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          title="立即重新讀取"
          variant="outline-secondary"
          badge-variant="secondary"
          :milliseconds="cachedMs"
          :disabled="isBusy"
          :busy="isBusy"
          @end="reload"
          @click="reload"
          auto-start
          no-badge
        )

  //- 頂部 5 大戰情統計卡片
  lah-transition(appear): .row.no-gutters.my-2(v-if="dataReady")
    //- 1. 已到期可續辦
    .col-12.col-sm-6.col-md.p-1
      .card.h-100.border-danger.shadow-sm.kpi-card(
        :class="{ 'active-card-danger': statusFilter === 'EXPIRED' }"
        @click="toggleStatusFilter('EXPIRED')"
        style="cursor: pointer;"
        title="公告已期滿，若無人異議請接續辦理准登/審查"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-danger.mr-2(icon="exclamation-circle" size="2x")
            div
              .text-muted.small.font-weight-bold 已到期可續辦
              .small.text-danger 期滿無異議接續
          .h3.font-weight-bold.text-danger.mb-0 {{ statusCounts.EXPIRED }}

    //- 2. 今日到期
    .col-12.col-sm-6.col-md.p-1
      .card.h-100.border-warning.shadow-sm.kpi-card(
        :class="{ 'active-card-warning': statusFilter === 'TODAY_DUE' }"
        @click="toggleStatusFilter('TODAY_DUE')"
        style="cursor: pointer;"
        title="本日午夜期滿案件"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-warning.mr-2(icon="bell" size="2x")
            div
              .text-muted.small.font-weight-bold 今日到期
              .small.text-warning 本日午夜期滿
          .h3.font-weight-bold.text-warning.mb-0 {{ statusCounts.TODAY_DUE }}

    //- 3. 3日內到期
    .col-12.col-sm-6.col-md.p-1
      .card.h-100.border-orange.shadow-sm.kpi-card(
        :class="{ 'active-card-orange': statusFilter === 'DUE_SOON' }"
        @click="toggleStatusFilter('DUE_SOON')"
        style="cursor: pointer;"
        title="即將期滿，提早調卷備辦"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-orange.mr-2(icon="clock" size="2x")
            div
              .text-muted.small.font-weight-bold 3日內即將到期
              .small.text-orange 提早調卷備辦
          .h3.font-weight-bold.text-orange.mb-0 {{ statusCounts.DUE_SOON }}

    //- 4. 正常公告中
    .col-12.col-sm-6.col-md.p-1
      .card.h-100.border-success.shadow-sm.kpi-card(
        :class="{ 'active-card-success': statusFilter === 'IN_PROGRESS' }"
        @click="toggleStatusFilter('IN_PROGRESS')"
        style="cursor: pointer;"
        title="合法公告期進行中"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-success.mr-2(icon="check-circle" size="2x")
            div
              .text-muted.small.font-weight-bold 公告進行中
              .small.text-success 正常合法期內
          .h3.font-weight-bold.text-success.mb-0 {{ statusCounts.IN_PROGRESS }}

    //- 5. 公告初核中 (RM30='L')
    .col-12.col-sm-6.col-md.p-1
      .card.h-100.border-info.shadow-sm.kpi-card(
        :class="{ 'active-card-info': statusFilter === 'REVIEWING' }"
        @click="toggleStatusFilter('REVIEWING')"
        style="cursor: pointer;"
        title="主管審核中 (RM30=L)"
      )
        .card-body.p-2.d-flex.justify-content-between.align-items-center
          .d-flex.align-items-center
            lah-fa-icon.text-info.mr-2(icon="spinner" action="spin" size="2x")
            div
              .text-muted.small.font-weight-bold 公告初核中
              .small.text-info 主管簽核中 (L)
          .h3.font-weight-bold.text-info.mb-0 {{ statusCounts.REVIEWING }}

  //- 登記原因快捷分流列
  lah-transition(appear): .d-flex.align-items-center.flex-wrap.p-2.my-1.bg-light.rounded.border(v-if="dataReady && reasonStatPills.length > 0")
    span.font-weight-bold.text-secondary.mr-2.small
      lah-fa-icon.mr-1(icon="tags" variant="secondary")
      | 登記原因分流：
    b-button-group(size="sm")
      b-button(
        :variant="selectedReason === 'ALL' ? 'dark' : 'outline-secondary'"
        @click="selectedReason = 'ALL'"
        class="mr-1 mb-1 rounded-pill px-3"
      )
        | 全部原因 ({{ currentReviewerFilteredCases.length }})
      b-button(
        v-for="r in reasonStatPills"
        :key="r.reason"
        :variant="selectedReason === r.reason ? 'primary' : 'outline-primary'"
        @click="toggleReasonFilter(r.reason)"
        class="mr-1 mb-1 rounded-pill px-2"
        :title="`${r.reason} (法定公告 ${r.days} 日)`"
      )
        span.font-weight-bold {{ r.reason }}
        b-badge.ml-1(variant="light" pill) {{ r.days }}日
        span.ml-1 ({{ r.count }})

  //- 篩選標籤 Bar
  lah-transition: .d-flex.align-items-center.bg-light.px-2.py-1.rounded.my-1.border(
    v-if="hasActiveFilters"
    style="min-height: 40px;"
  )
    .d-flex.align-items-center.flex-wrap.w-100
      .d-flex.align-items-center.text-nowrap.mr-2(v-if="statusFilter !== 'ALL'")
        span.small.text-muted 狀態：
        b-badge.mx-1.p-2(pill :variant="statusFilterBadgeVariant") {{ statusFilterText }}
        b-link.text-danger.ml-1(@click="statusFilter = 'ALL'" title="清除狀態篩選"): lah-fa-icon(icon="times-circle")

      .d-flex.align-items-center.text-nowrap.mr-2(v-if="selectedReviewer !== 'ALL'")
        span.small.text-muted 初審：
        b-badge.mx-1.p-2(pill variant="warning") {{ selectedReviewerText }}
        b-link.text-danger.ml-1(@click="selectedReviewer = 'ALL'" title="清除初審篩選"): lah-fa-icon(icon="times-circle")

      .d-flex.align-items-center.text-nowrap.mr-2(v-if="selectedReason !== 'ALL'")
        span.small.text-muted 原因：
        b-badge.mx-1.p-2(pill variant="info") {{ selectedReason }}
        b-link.text-danger.ml-1(@click="selectedReason = 'ALL'" title="清除原因分流"): lah-fa-icon(icon="times-circle")

      b-tag(
        v-for="(tag, idx) in advTags"
        :key="`advtag-${idx}`"
        @remove="removeAdvTag(tag)"
        :title="`移除篩選：${tag.text}`"
        :variant="tag.variant"
        pill
        class="mr-1 my-1 b-tag-size"
      ) {{ tag.text }}

      .ml-auto.d-flex.align-items-center
        span.text-muted.small.mr-2 篩選後共 {{ filterBakedData.length }} 筆
        b-link.small.text-danger.font-weight-bold(@click="resetAllFilters")
          lah-fa-icon.mr-1(icon="redo-alt")
          | 全部重設

  //- 分頁器
  lah-pagination(
    v-model="pagination"
    :total-rows="filterBakedData.length"
    :caption="`共找到 ${filterBakedData.length} 筆公告案件`"
  )

  //- 主資料表
  lah-transition(appear): b-table.text-center.align-middle(
    id="expiry-announcement-table"
    ref="bTable"
    caption-top
    :sticky-header="`${maxHeight}px`"
    :busy="isBusy"
    :items="filterBakedData"
    :responsive="'lg'"
    :striped="true"
    :hover="true"
    :bordered="true"
    :small="true"
    :head-variant="'dark'"
    :fields="fields"
    :per-page="pagination.perPage"
    :current-page="pagination.currentPage"
    :tbody-tr-class="rowClassCallback"
  )
    template(#table-busy): span.ld-txt 讀取中...

    //- 序號
    template(#cell(序號)="{ index }")
      span {{ (pagination.currentPage - 1) * pagination.perPage + index + 1 }}

    //- 管考狀態
    template(#cell(status_badge)="{ item }")
      .d-flex.flex-column.align-items-center
        b-badge.p-2.text-nowrap.shadow-sm(
          pill
          :variant="getItemCalc(item).statusVariant"
        )
          lah-fa-icon.mr-1(:icon="getItemCalc(item).statusIcon")
          | {{ getItemCalc(item).statusShortText }}
        small.font-weight-bold.mt-1(
          :class="getItemCalc(item).diffTextClass"
        ) {{ getItemCalc(item).diffText }}

    //- 收件字號與快速複製
    template(#cell(收件字號)="{ item }")
      .d-flex.align-items-center.justify-content-center.text-nowrap
        b-link.font-weight-bold.text-dark.text-nowrap(
          @click="popup(item)"
          title="開啟案件詳細資料"
        )
          | {{ item.收件字號 }}
        b-button.ml-1.p-0.text-primary(
          variant="link"
          size="sm"
          @click="copyCaseId(item)"
          title="複製完整字號至剪貼簿（便於貼入地政主系統）"
        )
          lah-fa-icon(icon="copy" regular)
        b-link.ml-1.text-secondary(
          :to="`/regcase/${item.ID}`"
          target="_blank"
          title="新分頁開啟案件專頁"
        )
          lah-fa-icon(icon="external-link-alt")

    //- 登記原因
    template(#cell(登記原因)="{ item }")
      .d-flex.flex-column.align-items-center
        span.font-weight-bold {{ item.登記原因 }}
        b-badge(variant="secondary" pill class="mt-1") 代碼: {{ item.RM09 }}

    //- 辦理情形
    template(#cell(辦理情形)="{ item }")
      b-badge(
        pill
        :variant="item.RM30 === 'L' ? 'info' : 'light'"
        class="border"
      ) {{ item.RM30 }}:{{ item.辦理情形 }}

    //- 初審人員
    template(#cell(初審人員)="{ item }")
      b-button(
        variant="outline-primary"
        size="sm"
        pill
        @click="filterByReviewer(item)"
        :title="`點擊僅篩選【${item.初審人員}】之公告案件`"
      )
        lah-avatar(:id="item.RM45" :name="item.初審人員")
          span.font-weight-bold {{ item.初審人員 }}

    //- 法定公告期限與視覺化進度條
    template(#cell(progress)="{ item }")
      .d-flex.flex-column.w-100.px-2(style="min-width: 230px;")
        .d-flex.justify-content-between.align-items-center.mb-1
          .d-flex.align-items-center
            b-badge.mr-1(variant="dark" pill) 法定 {{ getItemCalc(item).totalDays }} 日
            b-badge(
              v-if="getItemCalc(item).isRolledOver"
              variant="info"
              pill
              v-b-tooltip.hover.v-info="getItemCalc(item).tooltipText"
              style="cursor: help;"
            )
              lah-fa-icon.mr-1(icon="balance-scale")
              | §48順延
          small.text-muted 已公告 {{ getItemCalc(item).elapsedDays }} / {{ getItemCalc(item).totalDays }} 天
        b-progress(
          :value="getItemCalc(item).progressPercent"
          :variant="getItemCalc(item).progressVariant"
          height="8px"
          striped
          :animated="getItemCalc(item).status === 'IN_PROGRESS'"
          class="rounded-pill shadow-inner"
        )
        .d-flex.justify-content-between.align-items-center.mt-1.small
          span.text-muted 起: {{ item.公告日期 }}
          span.font-weight-bold(
            :class="getItemCalc(item).isRolledOver ? 'text-info' : 'text-secondary'"
            :title="getItemCalc(item).tooltipText"
          )
            | 迄: {{ getItemCalc(item).effectiveDeadlineMinguo }}
            lah-fa-icon.ml-1(v-if="getItemCalc(item).isRolledOver" icon="info-circle" variant="info")

    //- 操作動作
    template(#cell(actions)="{ item }")
      b-button-group(size="sm")
        b-button(
          variant="outline-primary"
          @click="popup(item)"
          title="開啟案件詳情"
        )
          lah-fa-icon(icon="window-restore" regular)
        b-button(
          variant="outline-secondary"
          @click="copyCaseId(item)"
          title="複製字號"
        )
          lah-fa-icon(icon="copy" regular)

  //- 查無資料提示
  lah-transition.center.h3: lah-fa-icon(
    v-cloak
    v-if="filterBakedData.length === 0 && !isBusy"
    icon="exclamation-circle"
    prefix="fas"
    variant="secondary"
  ) 無符合條件之公告案件

  //- 案件詳情彈跳視窗
  b-modal(
    ref="caseDetail"
    size="xl"
    hide-footer
    centered
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title)
      span 登記案件詳情 {{ clickedData ? $utils.caseId(clickedData.ID) : '' }}
    h4.text-center.text-info.my-5(v-if="modalLoading")
      b-spinner.my-auto(small type="grow")
      strong.ld-txt.ml-2 查詢中...
    lah-reg-case-detail(
      v-if="clickedData"
      :case-id="clickedData.ID"
      :parent-data="clickedData"
      @ready="modalLoading = !$event.detail"
    )

  //- 進階篩選彈跳視窗
  b-modal(
    ref="searchPlus"
    title="進階篩選 - 按住 Ctrl 鍵可多選"
    size="lg"
    hide-footer
  )
    b-form-row.mb-1
      b-col
        b-form-group(label="收件號")
          b-input(v-model="advOpts.caseNum", trim, placeholder="... 可輸入部分或完整數字 ...")
    b-form-row.my-1
      b-col(md="6")
        b-form-group(label="收件字")
          b-form-select(
            v-model="advOpts.caseWords"
            :options="advOpts.caseWordOpts"
            multiple
            :select-size="4"
          )
      b-col(md="6")
        b-form-group(label="登記原因")
          b-form-select(
            v-model="advOpts.caseReasons"
            :options="advOpts.caseReasonOpts"
            multiple
            :select-size="4"
          )
    b-form-row
      b-col(md="6")
        b-form-group(label="辦理情形")
          b-form-select(
            v-model="advOpts.caseStates"
            :options="advOpts.caseStateOpts"
            multiple
            :select-size="4"
          )
      b-col(md="6")
        b-form-group(label="初審人員")
          b-form-select(
            v-model="advOpts.casePreliminators"
            :options="advOpts.casePreliminatorOpts"
            multiple
            :select-size="4"
          )
    b-form-row.my-1
      b-col(md="6")
        b-form-group(label="公告日期")
          b-form-select(
            v-model="advOpts.caseAnnouncementDates"
            :options="advOpts.caseAnnouncementDateOpts"
            multiple
            :select-size="4"
          )
      b-col(md="6")
        b-form-group(label="期滿日期")
          b-form-select(
            v-model="advOpts.caseAnnouncementDeadlines"
            :options="advOpts.caseAnnouncementDeadlineOpts"
            multiple
            :select-size="4"
          )
    b-form-row
      b-col(md="6")
        b-form-group(label="公告燈號")
          b-form-select(
            v-model="advOpts.caseLights"
            :options="advOpts.caseLightOpts"
            multiple
            :select-size="4"
          )

    hr
    .center.d-flex.my-1
      lah-button(
        icon="recycle"
        @click="resetAdvOpts"
        variant="outline-success"
      ) 重設進階條件
      small.text-muted.ml-2 篩選後找到 {{ filterBakedData.length }} 筆
</template>

<script>
import dynamicHeight from '~/mixins/dynamic-height-mixin'
import { isOffDay, formatDateISO, toMinguoDateString } from '~/mixins/lah-fix-case-holiday.js'

export default {
  mixins: [dynamicHeight],
  fetchOnServer: false,
  data: () => ({
    bakedData: [],
    cachedMs: 12 * 60 * 60 * 1000,
    forceReload: false,
    clickedData: null,
    modalLoading: true,

    // 初審視角切換 ('MY': 我的案件, 'ALL': 全所案件)
    reviewerViewMode: 'ALL',
    selectedReviewer: 'ALL',

    // 5 大戰情卡片篩選 ('ALL', 'EXPIRED', 'TODAY_DUE', 'DUE_SOON', 'IN_PROGRESS', 'REVIEWING')
    statusFilter: 'ALL',

    // 登記原因快捷分流
    selectedReason: 'ALL',

    // 分頁設定
    pagination: {
      perPage: 20,
      currentPage: 1
    },

    // 表格欄位規劃
    fields: [
      { key: '序號', label: '#', sortable: false, thStyle: { width: '45px' }, class: 'text-nowrap' },
      { key: 'status_badge', label: '管考狀態', sortable: true, thStyle: { width: '130px' }, class: 'text-nowrap' },
      { key: '收件字號', label: '收件字號', sortable: true, thStyle: { width: '310px' }, class: 'text-nowrap' },
      { key: '登記原因', label: '登記原因', sortable: true, thStyle: { width: '120px' }, class: 'text-nowrap' },
      { key: '辦理情形', label: '辦理情形', sortable: true, thStyle: { width: '100px' }, class: 'text-nowrap' },
      { key: '初審人員', label: '初審人員', sortable: true, thStyle: { width: '120px' }, class: 'text-nowrap' },
      { key: 'progress', label: '法定公告期限與進度', sortable: false },
      { key: 'actions', label: '操作', sortable: false, thStyle: { width: '90px' }, class: 'text-nowrap' }
    ],

    // 進階篩選物件
    advOpts: {
      caseWords: [],
      caseWordOpts: [],
      caseNum: '',
      caseReasons: [],
      caseReasonOpts: [],
      caseStates: [],
      caseStateOpts: [],
      caseLights: [],
      caseLightOpts: [],
      casePreliminators: [],
      casePreliminatorOpts: [],
      caseAnnouncementDates: [],
      caseAnnouncementDateOpts: [],
      caseAnnouncementDeadlines: [],
      caseAnnouncementDeadlineOpts: []
    }
  }),

  fetch () {
    this.getCache(this.cacheKey).then((json) => {
      if (this.forceReload || json === false) {
        if (!this.isBusy) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'reg_rm30_H_case',
            reload: this.forceReload
          }).then(({ data }) => {
            this.bakedData = data.baked || []
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
            const remainS = data.cache_remaining_time
            const remainMs = remainS * 1000
            if (remainMs && remainMs > 0) {
              this.setCache(this.cacheKey, data, remainMs)
              this.$refs.countdown?.setCountdown(remainMs)
            } else {
              this.$refs.countdown?.setCountdown(this.cachedMs)
            }
            this.$refs.countdown?.startCountdown()
            this.initDefaultReviewer()
          }).catch((err) => {
            this.alert(err.message)
            this.$utils.error(err)
          }).finally(() => {
            this.isBusy = false
            this.forceReload = false
          })
        } else {
          this.notify('讀取中 ... 請稍後', { type: 'warning' })
        }
      } else {
        this.bakedData = json.baked || []
        this.resetCountdown()
        this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
          this.notify(`查詢成功，找到 ${this.bakedData.length} 筆公告中資料。`, {
            subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新`
          })
        })
        this.initDefaultReviewer()
      }
    })
  },

  head: {
    title: '公告案件管考-桃園市地政局'
  },

  computed: {
    dataReady () {
      return this.bakedData?.length > 0
    },
    cacheKey () {
      return 'reg_rm30_H_case'
    },

    // 登入者初審身分資訊
    myReviewerInfo () {
      const myId = (this.user?.id || '').toUpperCase()
      const myName = (this.user?.name || '').trim()
      if (!this.dataReady || (!myId && !myName)) {
        return { exists: false, count: 0, reviewerId: '', reviewerName: '' }
      }
      const myCases = this.bakedData.filter((item) => {
        const itemReviewerId = (item.RM45 || '').toUpperCase()
        const itemReviewerName = (item.初審人員 || '').trim()
        return (myId && itemReviewerId === myId) || (myName && itemReviewerName === myName)
      })
      return {
        exists: myCases.length > 0,
        count: myCases.length,
        reviewerId: myId,
        reviewerName: myName
      }
    },

    // 初審人員下拉選單選項
    reviewerDropdownOptions () {
      const base = [{ value: 'ALL', text: `全部初審人員 (${this.bakedData.length})` }]
      if (!this.dataReady) {
        return base
      }
      const map = new Map()
      this.bakedData.forEach((item) => {
        const id = (item.RM45 || '').toUpperCase()
        const name = (item.初審人員 || '').trim()
        if (name) {
          const count = (map.get(name)?.count || 0) + 1
          map.set(name, { id, name, count })
        }
      })
      const list = [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
      list.forEach((rev) => {
        const isMe = (rev.id && rev.id === this.myReviewerInfo.reviewerId) || (rev.name && rev.name === this.myReviewerInfo.reviewerName)
        base.push({
          value: rev.name,
          text: `${rev.name}${isMe ? ' (我)' : ''} (${rev.count}件)`
        })
      })
      return base
    },

    // 依初審身分篩選後的中繼案件池（作為統計卡片與原因分流基底）
    currentReviewerFilteredCases () {
      if (!this.dataReady) {
        return []
      }
      if (this.selectedReviewer !== 'ALL') {
        return this.bakedData.filter(item => (item.初審人員 || '').trim() === this.selectedReviewer)
      }
      if (this.reviewerViewMode === 'MY' && this.myReviewerInfo.exists) {
        const myId = this.myReviewerInfo.reviewerId
        const myName = this.myReviewerInfo.reviewerName
        return this.bakedData.filter(item =>
          ((item.RM45 || '').toUpperCase() === myId) || ((item.初審人員 || '').trim() === myName)
        )
      }
      return this.bakedData
    },

    // 5 大戰情卡片統計數字
    statusCounts () {
      const counts = {
        EXPIRED: 0,
        TODAY_DUE: 0,
        DUE_SOON: 0,
        IN_PROGRESS: 0,
        REVIEWING: 0
      }
      this.currentReviewerFilteredCases.forEach((item) => {
        const calc = this.getItemCalc(item)
        if (counts[calc.status] !== undefined) {
          counts[calc.status]++
        }
      })
      return counts
    },

    // 登記原因分流 Pills
    reasonStatPills () {
      if (!this.dataReady) {
        return []
      }
      const map = new Map()
      this.currentReviewerFilteredCases.forEach((item) => {
        const reason = item.登記原因 || '未註明'
        const calc = this.getItemCalc(item)
        if (!map.has(reason)) {
          map.set(reason, {
            reason,
            days: calc.totalDays,
            count: 0
          })
        }
        map.get(reason).count++
      })
      return [...map.values()].sort((a, b) => b.count - a.count)
    },

    // 是否有任何作用中的篩選條件
    hasActiveFilters () {
      return (
        this.statusFilter !== 'ALL' ||
        this.selectedReviewer !== 'ALL' ||
        this.selectedReason !== 'ALL' ||
        this.advTags.length > 0
      )
    },

    statusFilterText () {
      switch (this.statusFilter) {
        case 'EXPIRED': return '已到期可續辦'
        case 'TODAY_DUE': return '今日到期'
        case 'DUE_SOON': return '3日內即將到期'
        case 'IN_PROGRESS': return '公告進行中'
        case 'REVIEWING': return '公告初核中'
        default: return '全部狀態'
      }
    },

    statusFilterBadgeVariant () {
      switch (this.statusFilter) {
        case 'EXPIRED': return 'danger'
        case 'TODAY_DUE': return 'warning'
        case 'DUE_SOON': return 'warning'
        case 'IN_PROGRESS': return 'success'
        case 'REVIEWING': return 'info'
        default: return 'secondary'
      }
    },

    selectedReviewerText () {
      return this.selectedReviewer === 'ALL' ? '全所' : this.selectedReviewer
    },

    // 進階篩選產生的標籤
    advTags () {
      const tags = []
      const config = [
        { type: 'caseNum', prefix: '號', variant: 'secondary' },
        { type: 'caseWords', prefix: '字', variant: 'primary' },
        { type: 'caseReasons', prefix: '原因', variant: 'success' },
        { type: 'caseStates', prefix: '情形', variant: 'danger' },
        { type: 'casePreliminators', prefix: '初審', variant: 'warning' },
        { type: 'caseLights', prefix: '燈號', variant: 'info' },
        { type: 'caseAnnouncementDates', prefix: '公告日', variant: 'dark' },
        { type: 'caseAnnouncementDeadlines', prefix: '期滿日', variant: 'light' }
      ]

      config.forEach(({ type, prefix, variant }) => {
        const value = this.advOpts[type]
        if (Array.isArray(value)) {
          value.forEach((val) => {
            let text = val
            if (type === 'caseLights') {
              const found = this.advOpts.caseLightOpts.find(opt => opt.value === val)
              text = found ? found.text : val
            }
            if (type === 'casePreliminators') {
              const found = this.advOpts.casePreliminatorOpts.find(opt => opt.value === val)
              text = found ? found.text : val
            }
            tags.push({ type, value: val, text: `${prefix}：${text}`, variant })
          })
        } else if (!this.$utils.empty(value)) {
          tags.push({ type, value, text: `${prefix}：${value}`, variant })
        }
      })

      return tags
    },

    // 核心資料流：套用初審、戰情卡片、原因分流與進階過濾，並依管考緊急度智慧排序
    filterBakedData () {
      if (!this.dataReady) {
        return []
      }

      // 1. 初審人員過濾
      let list = this.currentReviewerFilteredCases

      // 2. 戰情卡片狀態過濾
      if (this.statusFilter !== 'ALL') {
        list = list.filter(item => this.getItemCalc(item).status === this.statusFilter)
      }

      // 3. 登記原因快捷分流
      if (this.selectedReason !== 'ALL') {
        list = list.filter(item => item.登記原因 === this.selectedReason)
      }

      // 4. 進階篩選過濾
      if (this.advTags.length > 0) {
        list = list.filter((item) => {
          const numMatch = this.$utils.empty(this.advOpts.caseNum) || item.收件字號.includes(this.advOpts.caseNum)
          const wordMatch = this.advOpts.caseWords.length === 0 || this.advOpts.caseWords.includes(item.RM02)
          const reasonMatch = this.advOpts.caseReasons.length === 0 || this.advOpts.caseReasons.includes(item.登記原因)
          const stateMatch = this.advOpts.caseStates.length === 0 || this.advOpts.caseStates.includes(item.辦理情形)
          const preliminatorMatch = this.advOpts.casePreliminators.length === 0 || this.advOpts.casePreliminators.includes(item.初審人員)
          const lightMatch = this.advOpts.caseLights.length === 0 || this.advOpts.caseLights.includes(item.公告燈號)
          const announcementMatch = this.advOpts.caseAnnouncementDates.length === 0 || this.advOpts.caseAnnouncementDates.includes(item.公告日期)
          const deadlineMatch = this.advOpts.caseAnnouncementDeadlines.length === 0 || this.advOpts.caseAnnouncementDeadlines.includes(item.公告期滿日期)
          return numMatch && wordMatch && reasonMatch && stateMatch && preliminatorMatch && lightMatch && announcementMatch && deadlineMatch
        })
      }

      // 5. 管考緊急度智慧排序
      // 順序：已到期 (逾期天數大者優先) ➔ 今日到期 ➔ 3日內到期 (剩餘天數小者優先) ➔ 正常公告中 ➔ 公告初核中
      const sorted = [...list].sort((a, b) => {
        const aCalc = this.getItemCalc(a)
        const bCalc = this.getItemCalc(b)

        if (aCalc.urgencyRank !== bCalc.urgencyRank) {
          return aCalc.urgencyRank - bCalc.urgencyRank
        }
        // 同為已到期：逾期越久越排在最前 (diffDays 為負數，故 a.diffDays - b.diffDays)
        if (aCalc.status === 'EXPIRED') {
          return aCalc.daysDiff - bCalc.daysDiff
        }
        // 同為 3日內到期或公告中：剩餘天數越少越前
        if (aCalc.status === 'DUE_SOON' || aCalc.status === 'IN_PROGRESS') {
          return aCalc.daysDiff - bCalc.daysDiff
        }
        // 預設依收件字號排序
        return (a.ID || '').localeCompare(b.ID || '')
      })

      return sorted
    },

    // 匯出至 Excel
    xlsxData () {
      return this.filterBakedData.map((item) => {
        const calc = this.getItemCalc(item)
        return {
          管考狀態: calc.statusFullText,
          收件字號: item.收件字號,
          登記原因: item.登記原因,
          辦理情形: item.辦理情形,
          初審人員: item.初審人員,
          法定公告天數: `${calc.totalDays}天`,
          公告日期: item.公告日期,
          公告期滿日期: item.公告期滿日期,
          依法順延期滿日: calc.isRolledOver ? calc.effectiveDeadlineMinguo : item.公告期滿日期,
          是否依法順延: calc.isRolledOver ? `是 (順延${calc.rolloverDays}天)` : '否',
          順延說明: calc.tooltipText || '',
          管考進度: `${calc.progressPercent}%`,
          剩餘逾期天數: calc.diffText
        }
      })
    }
  },

  watch: {
    statusFilter () {
      this.debouncedUpdateHeight?.()
    },
    selectedReason () {
      this.debouncedUpdateHeight?.()
    },
    selectedReviewer () {
      this.debouncedUpdateHeight?.()
    },
    reviewerViewMode () {
      this.debouncedUpdateHeight?.()
    },
    advTags () {
      this.debouncedUpdateHeight?.()
    },
    filterBakedData () {
      this.debouncedUpdateHeight?.()
    },
    bakedData (val) {
      this.debouncedUpdateHeight?.()
      if (val?.length > 0) {
        const caseWordOptions = [...new Set(val.map(item => item.RM02))].sort()
        this.advOpts.caseWordOpts = caseWordOptions
        this.applyDefaultCaseWordsSelection()

        this.advOpts.caseReasonOpts = [...new Set(val.map(item => item.登記原因))].sort()
        this.advOpts.caseStateOpts = [...new Set(val.map(item => item.辦理情形))].sort()

        const preliminatorMap = new Map()
        val.forEach((item) => {
          if (!preliminatorMap.has(item.初審人員)) {
            preliminatorMap.set(item.初審人員, {
              text: `${item.RM45} ${item.初審人員}`,
              value: item.初審人員
            })
          }
        })
        const uniquePreliminators = [...preliminatorMap.values()]
        uniquePreliminators.sort((a, b) => a.text.localeCompare(b.text, 'zh-TW'))
        this.advOpts.casePreliminatorOpts = uniquePreliminators

        this.advOpts.caseAnnouncementDateOpts = [...new Set(val.map(item => item.公告日期))].sort()
        this.advOpts.caseAnnouncementDeadlineOpts = [...new Set(val.map(item => item.公告期滿日期))].sort()
        this.advOpts.caseLightOpts = [
          { text: '🔵 審核中', value: 'info' },
          { text: '🟢 公告中', value: 'success' },
          { text: '🟡 快到期', value: 'warning' },
          { text: '🔴 已到期', value: 'danger' }
        ]
      }
    }
  },

  created () {
    this.maxHeightOffset = 185
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
    // 與 .version 下緣精確對齊之表格最大高度試算
    calculateMaxHeight () {
      this.$nextTick(() => {
        if (typeof window === 'undefined') { return }
        const wrapperEl = this.$el?.querySelector('.b-table-sticky-header') ||
                          this.$refs.bTable?.$el ||
                          document.getElementById('expiry-announcement-table')
        let tableTop = 0
        if (wrapperEl && typeof wrapperEl.getBoundingClientRect === 'function') {
          tableTop = wrapperEl.getBoundingClientRect().top
        } else if (this.$el && typeof this.$el.getBoundingClientRect === 'function') {
          tableTop = this.$el.getBoundingClientRect().top + 320
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
    },
    // 初始化初審人員預設過濾
    initDefaultReviewer () {
      this.$nextTick(() => {
        if (this.myReviewerInfo.exists) {
          this.reviewerViewMode = 'MY'
          this.selectedReviewer = this.myReviewerInfo.reviewerName || 'ALL'
          this.notify(`已為您自動載入【${this.myReviewerInfo.reviewerName}】的 ${this.myReviewerInfo.count} 件初審公告案件`, {
            type: 'primary',
            title: '初審身分自動比對'
          })
        } else {
          this.reviewerViewMode = 'ALL'
          this.selectedReviewer = 'ALL'
        }
      })
    },

    setReviewerViewMode (mode) {
      this.reviewerViewMode = mode
      if (mode === 'MY' && this.myReviewerInfo.exists) {
        this.selectedReviewer = this.myReviewerInfo.reviewerName
      } else {
        this.selectedReviewer = 'ALL'
      }
      this.pagination.currentPage = 1
    },

    toggleStatusFilter (statusKey) {
      if (this.statusFilter === statusKey) {
        this.statusFilter = 'ALL'
      } else {
        this.statusFilter = statusKey
      }
      this.pagination.currentPage = 1
    },

    toggleReasonFilter (reason) {
      if (this.selectedReason === reason) {
        this.selectedReason = 'ALL'
      } else {
        this.selectedReason = reason
      }
      this.pagination.currentPage = 1
    },

    filterByReviewer (item) {
      this.reviewerViewMode = 'CUSTOM'
      this.selectedReviewer = item.初審人員
      this.pagination.currentPage = 1
    },

    resetAllFilters () {
      this.statusFilter = 'ALL'
      this.selectedReason = 'ALL'
      this.selectedReviewer = 'ALL'
      this.reviewerViewMode = 'ALL'
      this.resetAdvOpts()
      this.pagination.currentPage = 1
    },

    resetAdvOpts () {
      this.advOpts.caseNum = ''
      this.advOpts.caseWords = []
      this.advOpts.caseReasons = []
      this.advOpts.caseStates = []
      this.advOpts.casePreliminators = []
      this.advOpts.caseLights = []
      this.advOpts.caseAnnouncementDates = []
      this.advOpts.caseAnnouncementDeadlines = []
      this.applyDefaultCaseWordsSelection()
    },

    applyDefaultCaseWordsSelection () {
      const caseWordOptions = this.advOpts.caseWordOpts
      if (caseWordOptions?.length > 0) {
        const regex = /^H[A-H]|^H[1-8]|[A-H]1$/
        this.advOpts.caseWords = caseWordOptions.filter(opt => regex.test(opt))
      }
    },

    removeAdvTag (tagToRemove) {
      const { type, value } = tagToRemove
      if (type === 'caseNum') {
        this.advOpts.caseNum = ''
      } else if (Array.isArray(this.advOpts[type])) {
        const index = this.advOpts[type].indexOf(value)
        if (index > -1) {
          this.advOpts[type].splice(index, 1)
        }
      }
    },

    // 核心法規與進度試算函式
    getItemCalc (item) {
      if (!item) {
        return {
          status: 'IN_PROGRESS',
          statusShortText: '公告中',
          statusFullText: '正常公告中',
          statusVariant: 'success',
          statusIcon: 'check-circle',
          diffText: '',
          diffTextClass: 'text-muted',
          totalDays: 30,
          elapsedDays: 0,
          progressPercent: 0,
          progressVariant: 'success',
          isRolledOver: false,
          rolloverDays: 0,
          effectiveDeadlineMinguo: '',
          tooltipText: '',
          daysDiff: 0,
          urgencyRank: 4
        }
      }

      // 1. 公告天數試算
      let totalDays = parseInt(item.RM49_DAY, 10)
      if (item.RM49_TYPE === '1') {
        totalDays = totalDays * 30
      }
      if (!totalDays || isNaN(totalDays) || totalDays <= 0) {
        const reason = item.登記原因 || ''
        if (reason.includes('第一次登記') || reason.includes('增建')) {
          totalDays = 15
        } else {
          totalDays = 30
        }
      }

      // 2. 日期解析
      const minguoToDate = (str) => {
        if (!str) { return null }
        const clean = String(str).replace(/[^0-9]/g, '')
        if (clean.length === 7) {
          const y = parseInt(clean.substring(0, 3), 10) + 1911
          const m = parseInt(clean.substring(3, 5), 10) - 1
          const d = parseInt(clean.substring(5, 7), 10)
          return new Date(y, m, d)
        }
        return null
      }

      const announcementDate = minguoToDate(item.RM49 || item.公告日期)
      let deadlineDate = minguoToDate(item.RM50 || item.公告期滿日期)
      if (!deadlineDate && announcementDate) {
        deadlineDate = new Date(announcementDate.getTime())
        deadlineDate.setDate(deadlineDate.getDate() + totalDays)
      }

      // 3. 行政程序法第 48 條例假日順延判定
      let rolledOver = false
      let rolloverDays = 0
      const rolloverReasons = []
      let effectiveDeadline = deadlineDate ? new Date(deadlineDate.getTime()) : new Date()

      if (deadlineDate) {
        const cur = new Date(deadlineDate.getTime())
        let offCheck = isOffDay(cur)
        while (offCheck.isOff) {
          rolledOver = true
          rolloverDays++
          rolloverReasons.push(`${formatDateISO(cur)}（${offCheck.reason}）`)
          cur.setDate(cur.getDate() + 1)
          offCheck = isOffDay(cur)
        }
        effectiveDeadline = cur
      }

      const effectiveDeadlineISO = formatDateISO(effectiveDeadline)
      const effectiveDeadlineMinguo = toMinguoDateString(effectiveDeadlineISO)

      let tooltipText = ''
      if (rolledOver) {
        const origMinguo = item.公告期滿日期 || (deadlineDate ? toMinguoDateString(formatDateISO(deadlineDate)) : '')
        tooltipText = `原期滿日為 ${origMinguo}，因末日適逢${rolloverReasons.join('、')}，依《行政程序法》第48條規定順延至次一上班日（${effectiveDeadlineMinguo}）。`
      }

      // 4. 與今日之天數差距 (基準時分秒歸零)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const target = new Date(effectiveDeadline.getFullYear(), effectiveDeadline.getMonth(), effectiveDeadline.getDate())
      const diffMs = target.getTime() - today.getTime()
      const daysDiff = Math.round(diffMs / (1000 * 60 * 60 * 24))

      let elapsedDays = 0
      if (announcementDate) {
        const start = new Date(announcementDate.getFullYear(), announcementDate.getMonth(), announcementDate.getDate())
        elapsedDays = Math.max(0, Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      }

      // 5. 狀態分類與緊急度 Rank
      let status = 'IN_PROGRESS'
      let statusShortText = '公告中'
      let statusFullText = '正常公告進行中'
      let statusVariant = 'success'
      let statusIcon = 'check-circle'
      let diffText = `剩餘 ${daysDiff} 天`
      let diffTextClass = 'text-success'
      let urgencyRank = 4

      if (item.RM30 === 'L') {
        status = 'REVIEWING'
        statusShortText = '初核中'
        statusFullText = '公告初核中 (主管簽核中)'
        statusVariant = 'info'
        statusIcon = 'spinner'
        diffText = '主管核定中'
        diffTextClass = 'text-info'
        urgencyRank = 5
      } else if (daysDiff < 0) {
        status = 'EXPIRED'
        const overdue = Math.abs(daysDiff)
        statusShortText = '已到期可續辦'
        statusFullText = `已到期 (逾期${overdue}天)`
        statusVariant = 'danger'
        statusIcon = 'exclamation-circle'
        diffText = `已逾期 ${overdue} 天`
        diffTextClass = 'text-danger font-weight-bold'
        urgencyRank = 1
      } else if (daysDiff === 0) {
        status = 'TODAY_DUE'
        statusShortText = '今日到期'
        statusFullText = '今日到期案件 (本日午夜期滿)'
        statusVariant = 'warning'
        statusIcon = 'bell'
        diffText = '今日最後期限'
        diffTextClass = 'text-warning font-weight-bold'
        urgencyRank = 2
      } else if (daysDiff <= 3) {
        status = 'DUE_SOON'
        statusShortText = '3日內到期'
        statusFullText = `即將到期 (剩餘${daysDiff}天)`
        statusVariant = 'warning'
        statusIcon = 'clock'
        diffText = `倒數 ${daysDiff} 天`
        diffTextClass = 'text-orange font-weight-bold'
        urgencyRank = 3
      } else {
        status = 'IN_PROGRESS'
        statusShortText = '公告中'
        statusFullText = '正常公告中'
        statusVariant = 'success'
        statusIcon = 'check-circle'
        diffText = `剩餘 ${daysDiff} 天`
        diffTextClass = 'text-muted'
        urgencyRank = 4
      }

      // 6. 進度條百分比
      let progressPercent = 0
      let progressVariant = 'success'
      if (status === 'EXPIRED') {
        progressPercent = 100
        progressVariant = 'danger'
      } else if (status === 'TODAY_DUE') {
        progressPercent = 100
        progressVariant = 'warning'
      } else if (status === 'DUE_SOON') {
        progressPercent = Math.min(95, Math.max(80, Math.round((elapsedDays / totalDays) * 100)))
        progressVariant = 'warning'
      } else if (status === 'REVIEWING') {
        progressPercent = 0
        progressVariant = 'info'
      } else {
        progressPercent = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)))
        progressVariant = 'success'
      }

      return {
        status,
        statusShortText,
        statusFullText,
        statusVariant,
        statusIcon,
        diffText,
        diffTextClass,
        totalDays,
        elapsedDays,
        progressPercent,
        progressVariant,
        isRolledOver: rolledOver,
        rolloverDays,
        effectiveDeadlineMinguo,
        tooltipText,
        daysDiff,
        urgencyRank
      }
    },

    // 表格列高亮 Class
    rowClassCallback (item) {
      if (!item) { return '' }
      const calc = this.getItemCalc(item)
      if (calc.status === 'EXPIRED') {
        return 'table-row-expired'
      }
      if (calc.status === 'TODAY_DUE') {
        return 'table-row-today'
      }
      return ''
    },

    // 一鍵複製案件字號至剪貼簿
    copyCaseId (item) {
      const fullText = item.收件字號 || `${item.RM01}年${item.RM02}字第${item.RM03}號`
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(fullText).then(() => {
          this.notify(`已複製字號【${fullText}】至剪貼簿`, {
            type: 'success',
            title: '複製成功'
          })
        }).catch(() => {
          this.notify(`複製失敗，請手動複製：${fullText}`, { type: 'warning' })
        })
      } else {
        this.notify(`已為您選取：${fullText}`, { type: 'info' })
      }
    },

    popup (item) {
      this.modalLoading = true
      this.clickedData = item
      this.$refs.caseDetail.show()
    },

    resetCountdown () {
      if (this.$refs.countdown) {
        this.getCacheExpireRemainingTime(this.cacheKey).then((remainMs) => {
          this.$refs.countdown.setCountdown(remainMs)
          this.$refs.countdown.startCountdown()
        })
      }
    },

    reload () {
      this.removeCache(this.cacheKey).then(() => {
        this.forceReload = true
        this.$fetch()
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.b-tag-size {
  font-size: 0.9rem;
}

.kpi-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-width: 2px !important;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12) !important;
  }
}

.text-orange {
  color: #fd7e14 !important;
}

.border-orange {
  border-color: #fd7e14 !important;
}

.active-card-danger {
  background-color: #fff5f5 !important;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.3) !important;
}

.active-card-warning {
  background-color: #fffdf5 !important;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.3) !important;
}

.active-card-orange {
  background-color: #fffaf0 !important;
  box-shadow: 0 0 0 3px rgba(253, 126, 20, 0.3) !important;
}

.active-card-success {
  background-color: #f6fff8 !important;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.3) !important;
}

.active-card-info {
  background-color: #f0f9ff !important;
  box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.3) !important;
}

.table-row-expired {
  background-color: rgba(220, 53, 69, 0.04) !important;
}

.table-row-today {
  background-color: rgba(255, 193, 7, 0.08) !important;
}

.shadow-inner {
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

// =========================================================
// 1. lah-header 48px 操作高度規範 (遵循 AGENTS.md)
// =========================================================
.header-left-group {
  ::v-deep .btn {
    height: 48px !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

.header-right-group {
  ::v-deep .custom-select,
  ::v-deep select.form-control,
  ::v-deep .btn-group > .btn,
  ::v-deep .btn {
    height: 48px !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  ::v-deep .btn-group {
    height: 48px;
  }

  .header-reset-link {
    display: inline-flex;
    align-items: center;
    height: 48px;
    line-height: 48px;
  }
}

// 表格 sticky-header 去除底部預設邊距以精確貼齊 .version 下緣
::v-deep .b-table-sticky-header {
  margin-bottom: 0 !important;
}
</style>
