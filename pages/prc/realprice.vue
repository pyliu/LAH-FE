<template lang="pug">
div
  lah-header
    lah-transition(appear): .d-flex.justify-content-between.align-items-center.w-100
      .d-flex.align-items-center
        h3.my-auto.font-weight-bold.mb-0.mr-2.text-nowrap 實價登錄案件控管
        b-badge.my-auto.mr-1(variant="secondary" pill style="font-size: 0.95rem; line-height: 1.2;") {{ filterDataCount }} / {{ regBakedData.length }}
        lah-button.my-auto(
          icon="info"
          action="bounce"
          variant="outline-success"
          no-border
          no-icon-gutter
          @click="showModalById('help-modal')"
          title="說明"
        )
        lah-help-modal(:modal-id="'help-modal'")
          h5 請參照下列步驟搜尋及操作
          ol
            li 選擇日期區間（預設為本月份）或點選快速切換按鈕後按 #[lah-fa-icon(icon="search" variant="primary" no-gutter)] 搜尋
            li 點擊上方「KPI 狀態看板」卡片可一鍵過濾逾期、即將到期、待追蹤或已申報案件
            li 可利用快搜輸入框進行跨欄位模糊搜尋（字號、地建號、作業員、序號、備註等）
            li 可點選個別案件的 #[lah-fa-icon(icon="edit" variant="primary" no-gutter)] 修改申報日期與備註
            li 可勾選多筆案件，使用上方浮現的「批次設定」功能快速套用申報日與常用備註
            li 可利用 #[lah-fa-icon(icon="file-excel" regular variant="success" no-gutter)] 將顯示資料匯出為 EXCEL 報表

      .header-tools.d-flex.align-items-center.flex-nowrap
        b-button-group.date-presets.mr-2(size="lg")
          b-button.text-nowrap(
            variant="outline-primary"
            :pressed="activeDatePreset === 'this_month'"
            @click="setDateRangePreset('this_month')"
          ) 本月
          b-button.text-nowrap(
            variant="outline-primary"
            :pressed="activeDatePreset === 'last_month'"
            @click="setDateRangePreset('last_month')"
          ) 上月
          b-button.text-nowrap(
            variant="outline-primary"
            :pressed="activeDatePreset === 'last_30_days'"
            @click="setDateRangePreset('last_30_days')"
          ) 近30天
        b-datepicker.date-input(
          v-model="startDateObj"
          placeholder="開始日期"
          boundary="viewport"
          :date-format-options="{ weekday: 'narrow' }"
          :max="yesterday"
          value-as-date
          hide-header
          dropleft
          size="lg"
        )
        span.date-divider.my-auto.mx-1.font-weight-bold ～
        b-datepicker.date-input.mr-1(
          v-model="endDateObj"
          placeholder="截止日期"
          boundary="viewport"
          :date-format-options="{ weekday: 'narrow' }"
          :min="startDateObj"
          hide-header
          dark
          value-as-date
          size="lg"
        )
        lah-button.mx-1(
          icon="search"
          variant="primary"
          title="搜尋"
          @click="$fetch"
          :disabled="isBusy"
          :busy="isBusy"
          no-icon-gutter
          size="lg"
        )
        lah-button-xlsx.mx-1(
          :jsons="xlsxData"
          header="實價登錄檢核案件"
          size="lg"
        )
        lah-countdown-button(
          ref="countdown"
          icon="sync-alt"
          action="ld-cycle"
          size="lg"
          variant="outline-secondary"
          badge-variant="secondary"
          title="強制重新搜尋"
          :milliseconds="0"
          :disabled="isBusy"
          :busy="isBusy"
          @end="reload"
          @click="reload"
        )

  //- KPI 狀態看板
  lah-transition
    .row.no-gutters.mb-2(v-if="committed")
      .col.px-1
        .card.kpi-card.kpi-all.py-1.px-2.d-flex.flex-row.align-items-center.justify-content-center.text-nowrap(
          :class="{ 'active': kpiFilter === 'all' }"
          @click="setKpiFilter('all')"
          v-b-tooltip.hover.top="'點擊篩選：全部案件'"
        )
          span.mr-1.font-weight-bold 📑 全部案件
          b-badge(variant="primary" pill style="font-size: 0.95rem;") {{ kpiCounts.all }}
      .col.px-1
        .card.kpi-card.kpi-overdue.py-1.px-2.d-flex.flex-row.align-items-center.justify-content-center.text-nowrap(
          :class="{ 'active': kpiFilter === 'overdue' }"
          @click="setKpiFilter('overdue')"
          v-b-tooltip.hover.top="'點擊篩選：逾期申報（結案已逾30日且未申報）'"
        )
          span.mr-1.font-weight-bold.text-danger 🚨 逾期申報
          b-badge(variant="danger" pill style="font-size: 0.95rem;") {{ kpiCounts.overdue }}
      .col.px-1
        .card.kpi-card.kpi-warning.py-1.px-2.d-flex.flex-row.align-items-center.justify-content-center.text-nowrap(
          :class="{ 'active': kpiFilter === 'warning' }"
          @click="setKpiFilter('warning')"
          v-b-tooltip.hover.top="'點擊篩選：即將到期（結案已逾20日且未申報）'"
        )
          span.mr-1.font-weight-bold.text-warning ⚠️ 即將到期
          b-badge(variant="warning" pill style="font-size: 0.95rem;") {{ kpiCounts.warning }}
      .col.px-1
        .card.kpi-card.kpi-pending.py-1.px-2.d-flex.flex-row.align-items-center.justify-content-center.text-nowrap(
          :class="{ 'active': kpiFilter === 'pending' }"
          @click="setKpiFilter('pending')"
          v-b-tooltip.hover.top="'點擊篩選：待追蹤案件（結案未逾20日且未申報）'"
        )
          span.mr-1.font-weight-bold.text-info ⏳ 待追蹤
          b-badge(variant="info" pill style="font-size: 0.95rem;") {{ kpiCounts.pending }}
      .col.px-1
        .card.kpi-card.kpi-declared.py-1.px-2.d-flex.flex-row.align-items-center.justify-content-center.text-nowrap(
          :class="{ 'active': kpiFilter === 'declared' }"
          @click="setKpiFilter('declared')"
          v-b-tooltip.hover.top="'點擊篩選：已完成申報案件'"
        )
          span.mr-1.font-weight-bold.text-success ✅ 已申報
          b-badge(variant="success" pill style="font-size: 0.95rem;") {{ kpiCounts.declared }}
      .col.px-1
        .card.kpi-card.kpi-processing.py-1.px-2.d-flex.flex-row.align-items-center.justify-content-center.text-nowrap(
          :class="{ 'active': kpiFilter === 'processing' }"
          @click="setKpiFilter('processing')"
          v-b-tooltip.hover.top="'點擊篩選：登記審查辦理中案件'"
        )
          span.mr-1.font-weight-bold.text-secondary 📝 辦理中
          b-badge(variant="secondary" pill style="font-size: 0.95rem;") {{ kpiCounts.processing }}

  //- 快速搜尋與篩選列
  lah-transition
    .card.mb-2.p-2.bg-light(v-if="committed")
      .d-flex.flex-wrap.align-items-center
        b-input-group.mr-2.mb-1(size="sm" style="flex: 2; min-width: 260px;" prepend="快速搜尋")
          b-input(
            v-model="keyword"
            placeholder="搜尋收件號 / 地建號 / 作業人員 / 序號 / 備註..."
            trim
          )
          b-input-group-append(v-if="keyword")
            b-button(variant="outline-secondary" size="sm" @click="keyword = ''" title="清除關鍵字") ✕
        b-input-group.mr-2.mb-1(size="sm" style="flex: 1; min-width: 170px;" prepend="段小段")
          b-select(
            v-model="advOpts.sectId"
            :options="advOpts.sectIdOpts"
          )
        b-input-group.mr-2.mb-1(size="sm" style="flex: 1; min-width: 170px;" prepend="申報狀態")
          b-select(
            v-model="kpiFilter"
            :options="kpiFilterOptions"
          )
        .d-flex.mb-1.ml-auto
          lah-button(
            :icon="showAdvCollapse ? 'chevron-up' : 'chevron-down'"
            variant="outline-info"
            size="sm"
            class="mr-1"
            @click="showAdvCollapse = !showAdvCollapse"
          ) {{ showAdvCollapse ? '收合進階條件' : '更多進階條件' }}
          lah-button(
            icon="recycle"
            variant="outline-secondary"
            size="sm"
            @click="resetAllFilters"
          ) 重設

      b-collapse(v-model="showAdvCollapse")
        hr.my-2
        .d-flex.flex-wrap.align-items-center
          b-input-group.mr-2.mb-1(size="sm" style="flex: 1; min-width: 140px;" prepend="收件字")
            b-select(v-model="advOpts.rm02" :options="advOpts.rm02Opts")
          b-input-group.mr-2.mb-1(size="sm" style="flex: 1; min-width: 140px;" prepend="收件日")
            b-select(v-model="advOpts.rm07Date" :options="advOpts.rm07DateOpts")
          b-input-group.mr-2.mb-1(size="sm" style="flex: 1; min-width: 140px;" prepend="作業人員")
            b-select(v-model="advOpts.operator" :options="advOpts.operatorOpts")
          b-input-group.mr-2.mb-1(size="sm" style="flex: 1; min-width: 140px;" prepend="登記註記")
            b-select(v-model="advOpts.regNote" :options="advOpts.regNoteOpts")
          b-input-group.mr-2.mb-1(size="sm" style="flex: 1; min-width: 140px;" prepend="地價註記")
            b-select(v-model="advOpts.valNote" :options="advOpts.valNoteOpts")
          b-input-group.mr-2.mb-1(size="sm" style="flex: 1; min-width: 140px;" prepend="申報備註")
            b-select(v-model="advOpts.declareNote" :options="advOpts.declareNoteOpts")

  //- 批次作業工具列 (有勾選時浮現)
  lah-transition
    b-alert(
      v-if="selectedItemKeys.length > 0"
      show
      variant="primary"
      class="d-flex justify-content-between align-items-center py-2 px-3 mb-2 shadow-sm"
    )
      div
        strong.mr-2 已勾選 {{ selectedItemKeys.length }} 筆案件
        small.text-muted (可跨頁累計選取)
      .d-flex.align-items-center
        b-button.mr-2(variant="success" size="sm" @click="openBatchEditModal")
          lah-fa-icon(icon="edit") 批次設定申報資訊
        b-button.mr-2(variant="outline-danger" size="sm" @click="confirmBatchClear")
          lah-fa-icon(icon="trash-alt") 批次清除申報
        b-button(variant="outline-secondary" size="sm" @click="clearSelection")
          lah-fa-icon(icon="times") 取消選取

  //- 分頁與篩選列 (同一排：左側每頁筆數與篩選標籤，右側分頁導航)
  .d-flex.justify-content-between.align-items-center.my-2(v-if="committed")
    .d-flex.align-items-center.flex-nowrap
      b-input-group.fixed-per-page.mr-3(
        prepend="每頁"
        append="筆"
        size="sm"
      ): b-select(
        v-model="perPage"
        :options="[20, 50, 100]"
      )
      .d-flex.align-items-center.flex-nowrap(v-if="advTags.length > 0")
        small.text-muted.mr-1 目前篩選：
        b-badge.mr-1.mb-0.py-1.px-2(
          v-for="(tag, idx) in advTags"
          :key="idx"
          variant="info"
          pill
        ) {{ tag }}
        b-button.py-0.px-2.mb-0(
          variant="link"
          size="sm"
          @click="resetAllFilters"
        ) 清除所有篩選

    .d-flex.align-items-center.ml-auto(v-if="showPagination")
      b-pagination(
        v-model="currentPage"
        class="my-auto mb-0"
        size="sm"
        :total-rows="paginationCount"
        :per-page="perPage"
        :title="`共 ${filterDataCount} 件`"
        last-number
        first-number
      )

  //- 主資料表格
  lah-transition
    div(v-if="committed")
      b-table.text-center(
        id="val-realprice-table"
        ref="realpriceTable"
        caption-top
        :sticky-header="`${maxHeight}px`"
        :responsive="'lg'"
        :striped="true"
        :hover="true"
        :bordered="true"
        :small="true"
        :head-variant="'dark'"
        :busy="isBusy"
        :items="filterRegBakedData"
        :fields="regFields"
        :per-page="perPage"
        :current-page="currentPage"
        :tbody-tr-class="tbodyTrClass"
      )
        template(#table-busy): span.ld-txt 讀取中...

        //- 表頭全選核取方塊
        template(#head(selected))
          b-checkbox(
            :checked="isAllSelected"
            :indeterminate="isIndeterminate"
            @change="toggleSelectAll"
            title="全選 / 取消全選"
          )

        //- 列選取核取方塊
        template(#cell(selected)="{ item }")
          b-checkbox(
            :checked="isItemSelected(item)"
            @change="toggleSelectItem(item)"
          )

        //- 1. 收件資訊與人員 (最多兩行)
        template(#cell(case_info)="{ item }")
          .d-flex.flex-column.justify-content-center
            .d-flex.align-items-center.justify-content-between.flex-nowrap
              b-link.font-weight-bold.text-nowrap(@click="popup(item)" :title="`查看詳情 - ${item.RM123}`")
                lah-fa-icon(icon="window-restore" regular variant="primary") {{ item.RM01 }}-{{ item.RM02 }}-{{ item.RM03 }}
              b-button.py-0.px-2.ml-1.text-nowrap(
                pill
                variant="outline-primary"
                size="sm"
                @click="popupUser(item)"
                v-b-tooltip.right="item.RM30_1"
              )
                lah-fa-icon(icon="user" size="sm") {{ item.作業人員 }}
            .small.text-muted.text-nowrap.mt-1
              | 收件：{{ $utils.addDateDivider(item.收件日期) || item.收件日期 || '-' }}

        //- 2. 不動產標的 (最多兩行)
        template(#cell(land_build)="{ item }")
          .d-flex.flex-column.justify-content-center
            .text-nowrap
              span.font-weight-bold {{ item.RM11_CHT || item.段小段 }}
              small.text-muted.ml-1 ({{ item.RM11 }})
            .small.text-nowrap.mt-1
              span 地號：#[span.font-weight-bold {{ $utils.formatLandNumber(item.RM12) || '無' }}]
              span.text-muted.mx-1 ｜
              span 建號：#[span.font-weight-bold {{ $utils.formatBuildNumber(item.RM15) || '無' }}]

        //- 3. 登記進度 (最多兩行)
        template(#cell(reg_progress)="{ item }")
          .d-flex.flex-column.justify-content-center
            div
              b-badge(:variant="item.登記處理註記 ? 'info' : 'secondary'") {{ item.登記處理註記 || '未更新' }}
            .small.text-nowrap.mt-1
              span.text-muted 登錄：{{ $utils.addDateDivider(item.RM54_1) || '-' }}
              span.text-muted.mx-1 ｜
              span(:class="item.RM58_1 ? 'text-success font-weight-bold' : 'text-muted'")
                | 結案：{{ $utils.addDateDivider(item.RM58_1) || '辦理中' }}

        //- 4. 地價進度 (最多兩行)
        template(#cell(val_progress)="{ item }")
          .d-flex.flex-column.justify-content-center
            div
              b-badge(:variant="item.地價處理註記 ? 'secondary' : 'light'") {{ item.地價處理註記 || '未更新' }}
            .small.text-nowrap.mt-1
              span.text-muted 登錄：{{ $utils.addDateDivider(item.SR_DATE) || '-' }}
              span.text-muted.mx-1 ｜
              span.text-muted 時間：{{ $utils.addTimeDivider(item.SR_TIME) || '-' }}

        //- 5. 申報控管與備註 (最多兩行)
        template(#cell(declare_status)="{ item }")
          .d-flex.flex-column.justify-content-center
            .d-flex.align-items-center.flex-nowrap
              b-badge(:variant="item._statusObj.variant" class="px-2 py-1 mr-1 text-nowrap")
                | {{ item._statusObj.text }}
              small.text-muted.mr-1.text-nowrap(v-if="item._deadlineRoc") 限: {{ item._deadlineRoc }}
              small.text-secondary.text-nowrap(v-if="item.P1MP_CASENO") 序: {{ item.P1MP_CASENO }}
              small.text-muted.text-nowrap(v-else) 序: 未輸入
            .small.d-flex.align-items-center.text-nowrap.mt-1
              span.text-dark(v-if="item.P1MP_DECLARE_DATE") 申報: {{ item.P1MP_DECLARE_DATE }}
              span.text-muted(v-else) 申報: 未申報
              span.text-muted.mx-1(v-if="item.P1MP_DECLARE_NOTE") ｜
              span.text-info.text-truncate(
                v-if="item.P1MP_DECLARE_NOTE"
                style="max-width: 220px;"
                v-b-tooltip.hover.top="item.P1MP_DECLARE_NOTE"
              )
                lah-fa-icon(icon="comment-dots" size="sm") {{ item.P1MP_DECLARE_NOTE }}

        //- 6. 操作
        template(#cell(actions)="{ item }")
          b-button(
            variant="outline-primary"
            size="sm"
            class="py-1 px-2"
            @click="openSingleEditModal(item)"
            title="編輯申報資訊"
          )
            lah-fa-icon(icon="edit") 編輯

      //- 分頁器 (下方：與上方分頁列結構與樣式完全一致)
      .d-flex.justify-content-between.align-items-center.my-2(v-if="committed")
        .d-flex.align-items-center.flex-nowrap
          b-input-group.fixed-per-page.mr-3(
            prepend="每頁"
            append="筆"
            size="sm"
          ): b-select(
            v-model="perPage"
            :options="[20, 50, 100]"
          )
        .d-flex.align-items-center.ml-auto(v-if="showPagination")
          b-pagination(
            v-model="currentPage"
            class="my-auto mb-0"
            size="sm"
            :total-rows="paginationCount"
            :per-page="perPage"
            :title="`共 ${filterDataCount} 件`"
            last-number
            first-number
          )

    h3(v-else class="text-center my-5"): lah-fa-icon(icon="search" action="breath" variant="primary") 請點擊查詢按鈕

  //- 單筆編輯 Modal
  b-modal(
    ref="singleEditModal"
    title="編輯案件申報資訊"
    hide-footer
    no-close-on-backdrop
  )
    div(v-if="currentEditingItem")
      .alert.alert-light.py-2.mb-3
        .font-weight-bold {{ currentEditingItem.RM123 }} ({{ currentEditingItem.RM11_CHT || currentEditingItem.段小段 }})
        small.text-muted 申報序號: {{ currentEditingItem.P1MP_CASENO || '未輸入' }} ｜ 結案日: {{ $utils.addDateDivider(currentEditingItem.RM58_1) || '辦理中' }}
      b-form-group(label="申報日期")
        .d-flex.text-nowrap
          b-datepicker(
            v-model="singleEditForm.declare_date"
            placeholder="選擇申報日期"
            boundary="viewport"
            size="sm"
            hide-header
            reset-button
            today-button
            :max="today"
          )
          b-button.ml-2(variant="outline-primary" size="sm" @click="setSingleDateToday") 今日
          b-button.ml-1(variant="outline-secondary" size="sm" @click="singleEditForm.declare_date = ''") 清除
      b-form-group(label="常用備註快捷片語")
        b-select(
          v-model="selectedPresetNoteSingle"
          :options="presetNoteOptions"
          size="sm"
          @change="applyPresetNoteSingle"
        )
      b-form-group(label="申報備註內容 (最多 200 字)")
        b-textarea(
          v-model="singleEditForm.declare_note"
          placeholder="請輸入申報備註資料..."
          maxlength="200"
          rows="3"
          size="sm"
        )
        .d-flex.justify-content-between.small.text-muted.mt-1
          span 字數限制：200 字
          span(:class="{ 'text-danger font-weight-bold': singleEditForm.declare_note.length > 190 }") {{ singleEditForm.declare_note.length }} / 200
      .d-flex.justify-content-end.mt-3
        b-button.mr-2(variant="secondary" size="sm" @click="$refs.singleEditModal.hide()") 取消
        b-button(variant="primary" size="sm" :disabled="isSaving" :busy="isSaving" @click="saveSingleEdit") 儲存

  //- 批次編輯 Modal
  b-modal(
    ref="batchEditModal"
    title="批次設定申報資訊"
    hide-footer
    no-close-on-backdrop
  )
    .alert.alert-info.py-2.mb-3
      lah-fa-icon(icon="info-circle") 即將批次套用至已勾選的 #[strong {{ selectedItemKeys.length }}] 筆案件。
    b-form-group(label="申報日期設定")
      b-form-radio-group(
        v-model="batchForm.dateMode"
        :options="[ { text: '維持原值不變', value: 'keep' }, { text: '統一設定日期', value: 'set' }, { text: '清空申報日期', value: 'clear' } ]"
        class="mb-2"
      )
      .d-flex(v-if="batchForm.dateMode === 'set'")
        b-datepicker(
          v-model="batchForm.declare_date"
          placeholder="選擇申報日期"
          boundary="viewport"
          size="sm"
          hide-header
          today-button
          :max="today"
        )
        b-button.ml-2(variant="outline-primary" size="sm" @click="setBatchDateToday") 今日
    hr
    b-form-group(label="申報備註設定")
      b-form-radio-group(
        v-model="batchForm.noteMode"
        :options="[ { text: '維持原值不變', value: 'keep' }, { text: '覆蓋現有備註', value: 'replace' }, { text: '追加至現有備註後', value: 'append' }, { text: '清空現有備註', value: 'clear' } ]"
        class="mb-2"
      )
      div(v-if="batchForm.noteMode === 'replace' || batchForm.noteMode === 'append'")
        b-input-group.mb-2(prepend="常用片語" size="sm")
          b-select(
            v-model="selectedPresetNoteBatch"
            :options="presetNoteOptions"
            @change="applyPresetNoteBatch"
          )
        b-textarea(
          v-model="batchForm.declare_note"
          placeholder="請輸入欲套用之備註文字..."
          maxlength="200"
          rows="3"
          size="sm"
        )
        .d-flex.justify-content-between.small.text-muted.mt-1
          span 字數限制：200 字
          span {{ batchForm.declare_note.length }} / 200
    div(v-if="isBatchSaving" class="my-3")
      .small.mb-1 正在儲存進度：{{ batchProgress }} / {{ selectedItemKeys.length }}
      b-progress(:value="batchProgress" :max="selectedItemKeys.length" animated variant="success")
    .d-flex.justify-content-end.mt-3
      b-button.mr-2(variant="secondary" size="sm" :disabled="isBatchSaving" @click="$refs.batchEditModal.hide()") 取消
      b-button(variant="primary" size="sm" :disabled="isBatchSaving" :busy="isBatchSaving" @click="executeBatchEdit") 開始批次更新

  //- 案件詳情 Modal
  b-modal(
    ref="caseDetail"
    :title="`案件詳情 - ${choosedItem ? choosedItem.RM123 : '未指定'}`"
    size="xl"
    hide-footer
  )
    lah-reg-case-detail(:parent-data="choosedItem")
</template>

<script>
import lahUserCard from '~/components/lah-user-card.vue'

export default {
  components: { lahUserCard },
  fetchOnServer: false,
  asyncData (nuxt) {
    const today = new Date()
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
    const firstDayofMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDayofMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return {
      startDateObj: firstDayofMonth,
      endDateObj: lastDayofMonth,
      startDate: `${firstDayofMonth.getFullYear() - 1911}${('0' + (firstDayofMonth.getMonth() + 1)).slice(-2)}${('0' + firstDayofMonth.getDate()).slice(-2)}`,
      endDate: `${lastDayofMonth.getFullYear() - 1911}${('0' + (lastDayofMonth.getMonth() + 1)).slice(-2)}${('0' + lastDayofMonth.getDate()).slice(-2)}`,
      firstDayofMonth,
      lastDayofMonth,
      today,
      yesterday
    }
  },
  data: () => ({
    maxHeight: 600,
    forceReload: false,
    committed: false,
    activeDatePreset: 'this_month',
    regBakedData: [],
    currentPage: 1,
    perPage: 20,
    keyword: '',
    kpiFilter: 'all',
    showAdvCollapse: false,
    selectedItemKeys: [],
    choosedItem: null,
    currentEditingItem: null,
    isSaving: false,
    isBatchSaving: false,
    batchProgress: 0,
    selectedPresetNoteSingle: '',
    selectedPresetNoteBatch: '',
    singleEditForm: {
      declare_date: '',
      declare_note: ''
    },
    batchForm: {
      dateMode: 'set',
      declare_date: '',
      noteMode: 'keep',
      declare_note: ''
    },
    presetNoteOptions: [
      { value: '', text: '-- 請選擇常用備註片語 --' },
      { value: '免申報案件', text: '免申報案件' },
      { value: '逾期補報', text: '逾期補報' },
      { value: '通知補正中', text: '通知補正中' },
      { value: '移送裁罰', text: '移送裁罰' },
      { value: '臨櫃/紙本申報', text: '臨櫃/紙本申報' }
    ],
    kpiFilterOptions: [
      { value: 'all', text: '全部案件' },
      { value: 'overdue', text: '🚨 逾期申報' },
      { value: 'warning', text: '⚠️ 即將到期' },
      { value: 'pending', text: '⏳ 待追蹤案件' },
      { value: 'declared', text: '✅ 已完成申報' },
      { value: 'processing', text: '登記辦理中' }
    ],
    regFields: [
      {
        key: 'selected',
        label: '',
        sortable: false,
        thClass: 'text-center align-middle',
        tdClass: 'text-center align-middle',
        thStyle: 'width: 45px;'
      },
      {
        key: 'case_info',
        label: '收件與承辦人員',
        sortable: true,
        sortByFormatted: true,
        formatter: (value, key, item) => `${item.RM01}${item.RM02}${item.RM03}`,
        thClass: 'text-center align-middle',
        tdClass: 'text-left align-middle',
        thStyle: 'min-width: 170px;'
      },
      {
        key: 'land_build',
        label: '不動產標的',
        sortable: true,
        sortByFormatted: true,
        formatter: (value, key, item) => `${item.RM11}-${item.RM12}-${item.RM15}`,
        thClass: 'text-center align-middle',
        tdClass: 'text-left align-middle',
        thStyle: 'min-width: 170px;'
      },
      {
        key: 'reg_progress',
        label: '登記進度',
        sortable: true,
        sortByFormatted: true,
        formatter: (value, key, item) => item.RM58_1 || item.RM54_1 || '',
        thClass: 'text-center align-middle',
        tdClass: 'text-left align-middle',
        thStyle: 'min-width: 150px;'
      },
      {
        key: 'val_progress',
        label: '地價進度',
        sortable: true,
        sortByFormatted: true,
        formatter: (value, key, item) => `${item.SR_DATE || ''}${item.SR_TIME || ''}`,
        thClass: 'text-center align-middle',
        tdClass: 'text-left align-middle',
        thStyle: 'min-width: 150px;'
      },
      {
        key: 'declare_status',
        label: '申報控管與備註',
        sortable: true,
        sortByFormatted: true,
        formatter: (value, key, item) => `${item._status}-${item.P1MP_DECLARE_DATE || ''}`,
        thClass: 'text-center align-middle',
        tdClass: 'text-left align-middle',
        thStyle: 'min-width: 230px;'
      },
      {
        key: 'actions',
        label: '操作',
        sortable: false,
        thClass: 'text-center align-middle',
        tdClass: 'text-center align-middle',
        thStyle: 'width: 90px;'
      }
    ],
    advOpts: {
      sectId: '',
      sectIdOpts: [],
      rm02: '',
      rm02Opts: [],
      rm07Date: '',
      rm07DateOpts: [],
      operator: '',
      operatorOpts: [],
      regNote: '',
      regNoteOpts: [],
      valNote: '',
      valNoteOpts: [],
      declareNote: '',
      declareNoteOpts: []
    }
  }),
  fetch () {
    this.reset()
    this.getCache(this.cacheKey).then((json) => {
      if (this.forceReload || json === false) {
        if (this.isBusy) {
          this.notify('讀取中 ... 請稍後再試', { type: 'warning' })
        } else {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.PREFETCH, {
            type: 'val_realprice_map',
            start_date: this.startDate,
            end_date: this.endDate,
            reload: this.forceReload
          }).then(({ data }) => {
            this.regBakedData = data.baked || []
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
            this.loaded()
          })
        }
      } else {
        this.regBakedData = json.baked || []
        this.loaded()
        this.getCacheExpireRemainingTime(this.cacheKey).then((remaining) => {
          this.notify(`查詢成功，找到 ${this.regBakedData.length} 筆實價登錄控管案件。`, { subtitle: `(快取) ${this.$utils.msToHuman(remaining)} 後更新` })
          if (this.$refs.countdown) {
            this.$refs.countdown.setCountdown(remaining)
            this.$refs.countdown.startCountdown()
          }
        })
      }
    })
  },
  head: {
    title: '實價登錄案件控管-桃園市地政局'
  },
  computed: {
    md5Hash () {
      return this.$utils.md5(`${this.startDate}_${this.endDate}`)
    },
    cacheKey () {
      return `realprice_mgmt_${this.md5Hash}`
    },
    captionRange () {
      return `【${this.startDate.substring(0, 3)}-${this.startDate.substring(3, 5)}-${this.startDate.substring(5)} ~ ${this.endDate.substring(0, 3)}-${this.endDate.substring(3, 5)}-${this.endDate.substring(5)}】`
    },
    showPagination () {
      return !this.$utils.empty(this.filterRegBakedData) && this.filterRegBakedData.length > this.perPage
    },
    paginationCount () {
      return this.filterRegBakedData.length
    },
    annotatedBakedData () {
      const refDate = this.today || new Date()
      return this.regBakedData.map((item) => {
        const status = this.computeCaseStatus(item, refDate)
        return {
          ...item,
          _status: status.code,
          _statusObj: status,
          _deadlineRoc: status.deadlineRoc,
          _daysOverdue: status.daysOverdue,
          _daysRemaining: status.daysRemaining
        }
      })
    },
    kpiCounts () {
      const counts = {
        all: this.annotatedBakedData.length,
        overdue: 0,
        warning: 0,
        pending: 0,
        declared: 0,
        processing: 0
      }
      this.annotatedBakedData.forEach((item) => {
        if (counts[item._status] !== undefined) {
          counts[item._status]++
        }
      })
      return counts
    },
    filterRegBakedData () {
      return this.filterBakedData(this.annotatedBakedData)
    },
    filterDataCount () {
      return this.filterRegBakedData.length
    },
    advTags () {
      const tags = []
      if (!this.$utils.empty(this.keyword)) {
        tags.push(`關鍵字：${this.keyword}`)
      }
      if (this.kpiFilter && this.kpiFilter !== 'all') {
        const found = this.kpiFilterOptions.find(opt => opt.value === this.kpiFilter)
        tags.push(`狀態：${found ? found.text : this.kpiFilter}`)
      }
      if (!this.$utils.empty(this.advOpts.sectId)) {
        tags.push(`段小段：${this.advOpts.sectId}`)
      }
      if (!this.$utils.empty(this.advOpts.rm02)) {
        tags.push(`收件字：${this.advOpts.rm02}`)
      }
      if (!this.$utils.empty(this.advOpts.rm07Date)) {
        tags.push(`收件日：${this.advOpts.rm07Date}`)
      }
      if (!this.$utils.empty(this.advOpts.operator)) {
        tags.push(`作業人員：${this.advOpts.operator}`)
      }
      if (!this.$utils.empty(this.advOpts.regNote)) {
        tags.push(`登記註記：${this.advOpts.regNote}`)
      }
      if (!this.$utils.empty(this.advOpts.valNote)) {
        tags.push(`地價註記：${this.advOpts.valNote}`)
      }
      if (this.advOpts.declareNote !== '') {
        tags.push(`申報備註：${this.advOpts.declareNote ? '有' : '無'}`)
      }
      return tags
    },
    xlsxData () {
      return this.prepareRegJsons()
    },
    isAllSelected () {
      if (this.filterRegBakedData.length === 0) { return false }
      return this.filterRegBakedData.every(item => this.selectedItemKeys.includes(this.caseKey(item)))
    },
    isIndeterminate () {
      if (this.filterRegBakedData.length === 0) { return false }
      const selectedCount = this.filterRegBakedData.filter(item => this.selectedItemKeys.includes(this.caseKey(item))).length
      return selectedCount > 0 && selectedCount < this.filterRegBakedData.length
    }
  },
  watch: {
    startDateObj (val) {
      if (val) {
        this.startDate = `${val.getFullYear() - 1911}${('0' + (val.getMonth() + 1)).slice(-2)}${('0' + val.getDate()).slice(-2)}`
      }
    },
    endDateObj (val) {
      if (val) {
        this.endDate = `${val.getFullYear() - 1911}${('0' + (val.getMonth() + 1)).slice(-2)}${('0' + val.getDate()).slice(-2)}`
      }
    },
    regBakedData (val) {
      this.refreshAdvOptsSelect(val)
      this.selectedItemKeys = []
    },
    filterRegBakedData () {
      this.currentPage = 1
      this.$nextTick(() => {
        this.calculateTableMaxHeight && this.calculateTableMaxHeight()
      })
    },
    perPage (val) {
      val > 5 && this.setCache('realprice-perpage', val)
      this.$nextTick(() => {
        this.calculateTableMaxHeight && this.calculateTableMaxHeight()
      })
    },
    showAdvCollapse () {
      setTimeout(() => {
        this.calculateTableMaxHeight && this.calculateTableMaxHeight()
      }, 350)
    },
    committed (val) {
      if (val) {
        this.$nextTick(() => {
          this.calculateTableMaxHeight && this.calculateTableMaxHeight()
        })
      }
    }
  },
  async mounted () {
    this.perPage = await this.getCache('realprice-perpage') || 20

    this.calculateTableMaxHeight = () => {
      this.$nextTick(() => {
        if (!this.committed) {
          return
        }
        const tableRef = this.$refs.realpriceTable
        const tableEl = tableRef?.$el || (typeof document !== 'undefined' && document.getElementById('val-realprice-table'))
        if (tableEl && typeof tableEl.getBoundingClientRect === 'function') {
          const rect = tableEl.getBoundingClientRect()
          const tableTop = rect.top
          if (tableTop > 0) {
            // 下方分頁器列高約 38px + 16px margins = 54px，預留安全間距共 80px，確保不觸發視窗外層滾動條
            const availableHeight = Math.max(200, Math.floor(window.innerHeight - tableTop - 80))
            if (Math.abs(this.maxHeight - availableHeight) > 2) {
              this.maxHeight = availableHeight
            }
          }
        }
      })
    }

    this.debouncedCalcTableHeight = this.$utils.debounce(this.calculateTableMaxHeight, 100)
    window.addEventListener('resize', this.debouncedCalcTableHeight)

    if (window.ResizeObserver) {
      this.tableResizeObserver = new ResizeObserver(this.debouncedCalcTableHeight)
      this.tableResizeObserver.observe(this.$el)
    }

    this.calculateTableMaxHeight()
  },
  beforeDestroy () {
    if (this.debouncedCalcTableHeight) {
      window.removeEventListener('resize', this.debouncedCalcTableHeight)
    }
    if (this.tableResizeObserver) {
      this.tableResizeObserver.disconnect()
      this.tableResizeObserver = null
    }
  },
  methods: {
    parseRocDate (rocStr) {
      if (!rocStr) { return null }
      const cleaned = String(rocStr).replace(/\D/g, '')
      if (cleaned.length < 6) { return null }
      const year = parseInt(cleaned.slice(0, cleaned.length - 4), 10) + 1911
      const month = parseInt(cleaned.slice(cleaned.length - 4, cleaned.length - 2), 10) - 1
      const day = parseInt(cleaned.slice(cleaned.length - 2), 10)
      const d = new Date(year, month, day)
      return isNaN(d.getTime()) ? null : d
    },
    formatRocDate (d, divider = '') {
      if (!d || !(d instanceof Date) || isNaN(d.getTime())) { return '' }
      const y = d.getFullYear() - 1911
      const m = ('0' + (d.getMonth() + 1)).slice(-2)
      const day = ('0' + d.getDate()).slice(-2)
      return divider ? `${y}${divider}${m}${divider}${day}` : `${y}${m}${day}`
    },
    computeCaseStatus (item, refDate = new Date()) {
      const hasDeclared = !this.$utils.empty(item.P1MP_DECLARE_DATE)
      if (hasDeclared) {
        return {
          code: 'declared',
          text: '已申報',
          variant: 'success',
          deadlineRoc: '',
          daysOverdue: 0,
          daysRemaining: 0
        }
      }

      const closingDate = this.parseRocDate(item.RM58_1)
      if (!closingDate) {
        return {
          code: 'processing',
          text: '登記辦理中',
          variant: 'secondary',
          deadlineRoc: '',
          daysOverdue: 0,
          daysRemaining: 0
        }
      }

      const deadlineDate = new Date(closingDate)
      deadlineDate.setDate(deadlineDate.getDate() + 30)
      const deadlineRoc = this.formatRocDate(deadlineDate, '/')

      const now = new Date(refDate)
      now.setHours(0, 0, 0, 0)
      closingDate.setHours(0, 0, 0, 0)

      const diffMs = now.getTime() - closingDate.getTime()
      const daysPassed = Math.floor(diffMs / (24 * 60 * 60 * 1000))

      if (daysPassed > 30) {
        const daysOverdue = daysPassed - 30
        return {
          code: 'overdue',
          text: `🚨 逾期 (${daysOverdue}天)`,
          variant: 'danger',
          deadlineRoc,
          daysOverdue,
          daysRemaining: 0
        }
      } else if (daysPassed > 20) {
        const daysRemaining = 30 - daysPassed
        return {
          code: 'warning',
          text: `⚠️ 剩餘 ${daysRemaining}天`,
          variant: 'warning',
          deadlineRoc,
          daysOverdue: 0,
          daysRemaining
        }
      } else {
        const daysRemaining = 30 - daysPassed
        return {
          code: 'pending',
          text: `⏳ 待申報 (剩${daysRemaining}天)`,
          variant: 'primary',
          deadlineRoc,
          daysOverdue: 0,
          daysRemaining
        }
      }
    },
    caseKey (item) {
      return item ? (item.RM123 || `${item.RM01}-${item.RM02}-${item.RM03}`) : ''
    },
    tbodyTrClass (item, type) {
      if (!item || type !== 'row') { return '' }
      if (item._status === 'overdue') { return 'table-danger-soft' }
      if (item._status === 'warning') { return 'table-warning-soft' }
      return ''
    },
    getTodayIsoString () {
      const d = new Date()
      const y = d.getFullYear()
      const m = ('0' + (d.getMonth() + 1)).slice(-2)
      const day = ('0' + d.getDate()).slice(-2)
      return `${y}-${m}-${day}`
    },
    setDateRangePreset (preset) {
      this.activeDatePreset = preset
      const now = new Date()
      if (preset === 'this_month') {
        this.startDateObj = new Date(now.getFullYear(), now.getMonth(), 1)
        this.endDateObj = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      } else if (preset === 'last_month') {
        this.startDateObj = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        this.endDateObj = new Date(now.getFullYear(), now.getMonth(), 0)
      } else if (preset === 'last_30_days') {
        this.startDateObj = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
        this.endDateObj = this.yesterday || now
      }
      this.$nextTick(() => {
        this.$fetch()
      })
    },
    setKpiFilter (val) {
      this.kpiFilter = this.kpiFilter === val ? 'all' : val
    },
    resetAllFilters () {
      this.keyword = ''
      this.kpiFilter = 'all'
      this.advOpts.sectId = ''
      this.advOpts.rm02 = ''
      this.advOpts.rm07Date = ''
      this.advOpts.operator = ''
      this.advOpts.regNote = ''
      this.advOpts.valNote = ''
      this.advOpts.declareNote = ''
    },
    toggleSelectAll (checked) {
      if (checked) {
        const keysToAdd = this.filterRegBakedData.map(item => this.caseKey(item))
        this.selectedItemKeys = [...new Set([...this.selectedItemKeys, ...keysToAdd])]
      } else {
        const filteredKeys = new Set(this.filterRegBakedData.map(item => this.caseKey(item)))
        this.selectedItemKeys = this.selectedItemKeys.filter(key => !filteredKeys.has(key))
      }
    },
    toggleSelectItem (item) {
      const key = this.caseKey(item)
      const idx = this.selectedItemKeys.indexOf(key)
      if (idx > -1) {
        this.selectedItemKeys.splice(idx, 1)
      } else {
        this.selectedItemKeys.push(key)
      }
    },
    isItemSelected (item) {
      return this.selectedItemKeys.includes(this.caseKey(item))
    },
    clearSelection () {
      this.selectedItemKeys = []
    },
    openSingleEditModal (item) {
      this.currentEditingItem = item
      this.selectedPresetNoteSingle = ''
      this.singleEditForm = {
        declare_date: item.P1MP_DECLARE_DATE || '',
        declare_note: item.P1MP_DECLARE_NOTE || ''
      }
      this.$refs.singleEditModal.show()
    },
    setSingleDateToday () {
      this.singleEditForm.declare_date = this.getTodayIsoString()
    },
    applyPresetNoteSingle (val) {
      if (val) {
        if (!this.singleEditForm.declare_note) {
          this.singleEditForm.declare_note = val
        } else {
          this.singleEditForm.declare_note = `${this.singleEditForm.declare_note}；${val}`
        }
        if (this.singleEditForm.declare_note.length > 200) {
          this.singleEditForm.declare_note = this.singleEditForm.declare_note.substring(0, 200)
        }
      }
    },
    async saveSingleEdit () {
      if (!this.currentEditingItem) { return }
      const item = this.currentEditingItem
      const caseNo = item.P1MP_CASENO || item.ID || `${item.RM01}${item.RM02}${item.RM03}`

      this.isSaving = true
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.MOIPRC, {
          type: 'upd_val_realprice_memo',
          case_no: caseNo,
          declare_date: this.singleEditForm.declare_date,
          declare_note: this.singleEditForm.declare_note
        })
        if (this.$utils.statusCheck(data.status)) {
          item.P1MP_DECLARE_DATE = this.singleEditForm.declare_date
          item.P1MP_DECLARE_NOTE = this.singleEditForm.declare_note
          this.clearCache()
          this.notify('更新成功！', { type: 'success' })
          this.$refs.singleEditModal.hide()
        } else {
          this.warning(data.message || '更新失敗')
        }
      } catch (err) {
        this.alert(err.message)
        this.$utils.error(err)
      } finally {
        this.isSaving = false
      }
    },
    openBatchEditModal () {
      this.batchForm = {
        dateMode: 'set',
        declare_date: this.getTodayIsoString(),
        noteMode: 'keep',
        declare_note: ''
      }
      this.selectedPresetNoteBatch = ''
      this.batchProgress = 0
      this.$refs.batchEditModal.show()
    },
    setBatchDateToday () {
      this.batchForm.declare_date = this.getTodayIsoString()
    },
    applyPresetNoteBatch (val) {
      if (val) {
        if (!this.batchForm.declare_note) {
          this.batchForm.declare_note = val
        } else {
          this.batchForm.declare_note = `${this.batchForm.declare_note}；${val}`
        }
        if (this.batchForm.declare_note.length > 200) {
          this.batchForm.declare_note = this.batchForm.declare_note.substring(0, 200)
        }
      }
    },
    async executeBatchEdit () {
      if (this.selectedItemKeys.length === 0) {
        this.notify('請先勾選欲更新的案件！', { type: 'warning' })
        return
      }

      const itemsToUpdate = this.regBakedData.filter(item =>
        this.selectedItemKeys.includes(this.caseKey(item))
      )

      this.isBatchSaving = true
      this.batchProgress = 0
      let successCount = 0
      let failCount = 0

      for (const item of itemsToUpdate) {
        const caseNo = item.P1MP_CASENO || item.ID || `${item.RM01}${item.RM02}${item.RM03}`

        let newDate = item.P1MP_DECLARE_DATE || ''
        if (this.batchForm.dateMode === 'set') {
          newDate = this.batchForm.declare_date
        } else if (this.batchForm.dateMode === 'clear') {
          newDate = ''
        }

        let newNote = item.P1MP_DECLARE_NOTE || ''
        if (this.batchForm.noteMode === 'replace') {
          newNote = this.batchForm.declare_note
        } else if (this.batchForm.noteMode === 'append') {
          newNote = newNote ? `${newNote}；${this.batchForm.declare_note}` : this.batchForm.declare_note
        } else if (this.batchForm.noteMode === 'clear') {
          newNote = ''
        }

        if (newNote && newNote.length > 200) {
          newNote = newNote.substring(0, 200)
        }

        try {
          const res = await this.$axios.post(this.$consts.API.JSON.MOIPRC, {
            type: 'upd_val_realprice_memo',
            case_no: caseNo,
            declare_date: newDate,
            declare_note: newNote
          })
          if (this.$utils.statusCheck(res.data.status)) {
            item.P1MP_DECLARE_DATE = newDate
            item.P1MP_DECLARE_NOTE = newNote
            successCount++
          } else {
            failCount++
          }
        } catch (err) {
          this.$utils.error(err)
          failCount++
        } finally {
          this.batchProgress++
        }
      }

      this.isBatchSaving = false
      this.clearCache()
      this.selectedItemKeys = []
      this.$refs.batchEditModal.hide()

      if (failCount === 0) {
        this.notify(`批次更新成功！共更新 ${successCount} 筆案件。`, { type: 'success' })
      } else {
        this.notify(`批次更新完成：成功 ${successCount} 筆，失敗 ${failCount} 筆。`, { type: 'warning' })
      }
    },
    async confirmBatchClear () {
      if (this.selectedItemKeys.length === 0) { return }
      const ans = await this.confirm(`確定要清除選取的 ${this.selectedItemKeys.length} 筆案件之申報日期與備註？`)
      if (ans) {
        this.batchForm.dateMode = 'clear'
        this.batchForm.noteMode = 'clear'
        this.executeBatchEdit()
      }
    },
    popup (item) {
      this.choosedItem = item
      this.$refs.caseDetail.show()
    },
    popupUser (item) {
      const name = item.作業人員
      const id = item.RM30_1
      this.modal(this.$createElement(lahUserCard, { props: { name, id } }), {
        title: `${id} ${name} 資訊`
      })
    },
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.regBakedData = []
      this.currentPage = 1
      this.selectedItemKeys = []
    },
    clearCache () {
      this.removeCache(this.cacheKey)
    },
    loaded () {
      this.isBusy = false
      this.forceReload = false
      this.committed = true
      this.$nextTick(() => {
        this.calculateTableMaxHeight && this.calculateTableMaxHeight()
      })
    },
    prepareRegJsons () {
      return this.filterRegBakedData.map((data) => {
        return {
          收件字號: `${data.RM01}-${data.RM02}-${data.RM03}`,
          收件日期: data.收件日期 || data.RM07_1,
          作業人員: data.作業人員,
          段代碼: data.RM11,
          段小段: data.RM11_CHT || data.段小段,
          地號: this.$utils.formatLandNumber(data.RM12),
          建號: this.$utils.formatBuildNumber(data.RM15),
          申報書序號: data.P1MP_CASENO || '',
          控管狀態: data._statusObj?.text || '',
          法定申報期限: data._deadlineRoc || '',
          申報日期: data.P1MP_DECLARE_DATE || '',
          申報備註: data.P1MP_DECLARE_NOTE || '',
          登記處理註記: data.登記處理註記 || '',
          登記登錄日期: data.RM54_1 || '',
          登記結案日期: data.RM58_1 || '',
          地價處理註記: data.地價處理註記 || '',
          地價登錄日期: data.SR_DATE || '',
          地價登錄時間: data.SR_TIME || ''
        }
      })
    },
    refreshAdvOptsSelect (val) {
      this.advOpts = {
        ...this.advOpts,
        sectId: '',
        sectIdOpts: [],
        rm02: '',
        rm02Opts: [],
        rm07Date: '',
        rm07DateOpts: [],
        operator: '',
        operatorOpts: [],
        regNote: '',
        regNoteOpts: [],
        valNote: '',
        valNoteOpts: [],
        declareNote: '',
        declareNoteOpts: []
      }
      if (val && Array.isArray(val)) {
        const tmp = [...new Map(val.map((item) => {
          return [
            item.RM11,
            {
              value: item.RM11,
              text: `${item.RM11} - ${item.RM11_CHT || item.段小段 || ''}`
            }
          ]
        }))].sort()
        this.advOpts.sectIdOpts = [...tmp.map(arr => arr[1])]
        this.advOpts.regNoteOpts = [...new Set(val.map(item => item.登記處理註記))].sort().filter(v => !this.$utils.empty(v))
        this.advOpts.valNoteOpts = [...new Set(val.map(item => item.地價處理註記))].sort().filter(v => !this.$utils.empty(v))
        this.advOpts.rm07DateOpts = [...new Set(val.map(item => item.收件日期))].sort().filter(v => v !== null)
        this.advOpts.rm02Opts = [...new Set(val.map(item => item.RM02))].sort().filter(v => v !== null)
        this.advOpts.operatorOpts = [...new Set(val.map(item => item.作業人員))].sort().filter(v => v !== null)

        this.advOpts.sectIdOpts.unshift('')
        this.advOpts.regNoteOpts.unshift('未更新')
        this.advOpts.regNoteOpts.unshift('')
        this.advOpts.valNoteOpts.unshift('未更新')
        this.advOpts.valNoteOpts.unshift('')
        this.advOpts.rm07DateOpts.unshift('')
        this.advOpts.rm02Opts.unshift('')
        this.advOpts.operatorOpts.unshift('')
        this.advOpts.declareNoteOpts = [
          '',
          { value: true, text: '有備註' },
          { value: false, text: '無備註' }
        ]
      }
    },
    filterBakedData (source) {
      if (!Array.isArray(source) || source.length === 0) { return [] }
      let pipeline = source

      if (this.kpiFilter && this.kpiFilter !== 'all') {
        pipeline = pipeline.filter(item => item._status === this.kpiFilter)
      }

      if (!this.$utils.empty(this.keyword)) {
        const kw = this.keyword.trim().toLowerCase()
        pipeline = pipeline.filter((item) => {
          const caseNo = (item.P1MP_CASENO || '').toLowerCase()
          const rm123 = (item.RM123 || `${item.RM01}-${item.RM02}-${item.RM03}` || '').toLowerCase()
          const rm03 = (item.RM03 || '').toLowerCase()
          const sect = (item.RM11_CHT || item.段小段 || item.RM11 || '').toLowerCase()
          const land = (item.RM12 || '').toLowerCase()
          const build = (item.RM15 || '').toLowerCase()
          const op = (item.作業人員 || '').toLowerCase()
          const note = (item.P1MP_DECLARE_NOTE || '').toLowerCase()
          const regNote = (item.登記處理註記 || '').toLowerCase()
          const valNote = (item.地價處理註記 || '').toLowerCase()

          return rm123.includes(kw) ||
                 rm03.includes(kw) ||
                 sect.includes(kw) ||
                 land.includes(kw) ||
                 build.includes(kw) ||
                 op.includes(kw) ||
                 caseNo.includes(kw) ||
                 note.includes(kw) ||
                 regNote.includes(kw) ||
                 valNote.includes(kw)
        })
      }

      if (!this.$utils.empty(this.advOpts.sectId)) {
        pipeline = pipeline.filter(item => item.RM11 && item.RM11.match(this.advOpts.sectId) !== null)
      }

      if (!this.$utils.empty(this.advOpts.rm02)) {
        pipeline = pipeline.filter(item => item.RM02 === this.advOpts.rm02)
      }

      if (!this.$utils.empty(this.advOpts.rm07Date)) {
        pipeline = pipeline.filter(item => item.收件日期 === this.advOpts.rm07Date)
      }

      if (!this.$utils.empty(this.advOpts.operator)) {
        pipeline = pipeline.filter(item => item.作業人員 === this.advOpts.operator)
      }

      if (!this.$utils.empty(this.advOpts.regNote)) {
        pipeline = pipeline.filter((item) => {
          if (this.advOpts.regNote === '未更新') {
            return this.$utils.empty(item.登記處理註記)
          }
          return item.登記處理註記 === this.advOpts.regNote
        })
      }

      if (!this.$utils.empty(this.advOpts.valNote)) {
        pipeline = pipeline.filter((item) => {
          if (this.advOpts.valNote === '未更新') {
            return this.$utils.empty(item.地價處理註記)
          }
          return item.地價處理註記 === this.advOpts.valNote
        })
      }

      if (this.advOpts.declareNote !== '') {
        pipeline = pipeline.filter((item) => {
          const hasNote = !this.$utils.empty(item.P1MP_DECLARE_NOTE)
          if (this.advOpts.declareNote === true) {
            return hasNote
          } else if (this.advOpts.declareNote === false) {
            return !hasNote
          }
          return this.$utils.equal(item.P1MP_DECLARE_NOTE, this.advOpts.declareNote)
        })
      }

      return pipeline
    }
  }
}
</script>

<style lang="scss" scoped>
.header-tools {
  height: 48px;

  .date-presets {
    flex-shrink: 0;
    height: 48px;

    ::v-deep .btn {
      height: 48px !important;
      min-height: 48px !important;
      max-height: 48px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0.5rem 0.85rem !important;
      font-size: 1rem !important;
      line-height: 1.5 !important;
      white-space: nowrap !important;
    }
  }

  .date-input {
    width: 200px;
    height: 48px !important;
    min-height: 48px !important;
    max-height: 48px !important;
    flex-shrink: 0;
    overflow: hidden !important;

    &.b-form-datepicker,
    &.form-control {
      height: 48px !important;
      min-height: 48px !important;
      max-height: 48px !important;
      overflow: hidden !important;
      padding: 0 0.4rem !important;
      display: inline-flex !important;
      align-items: center !important;
    }

    ::v-deep label,
    ::v-deep label.form-control,
    ::v-deep > label {
      height: 100% !important;
      max-height: 48px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      font-size: 0.85rem !important;
      padding: 0 0.2rem !important;
      margin: 0 !important;
      line-height: 1 !important;
    }

    ::v-deep label * {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      font-size: inherit !important;
    }

    ::v-deep button,
    ::v-deep .btn {
      height: 100% !important;
      max-height: 48px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 0.4rem !important;
      margin: 0 !important;
      flex-shrink: 0 !important;
    }
  }

  .date-divider {
    font-size: 1.2rem;
    line-height: 48px;
    user-select: none;
  }

  ::v-deep .btn {
    height: 48px !important;
    min-height: 48px !important;
    max-height: 48px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
}

.kpi-card {
  transition: all 0.2s ease-in-out;
  border: 1px solid #ced4da;
  border-radius: 6px;
  cursor: pointer !important;
  background-color: #fff;
  user-select: none;
  min-height: 38px;
  height: 38px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
  }

  &.kpi-all:hover { border-color: #007bff; background-color: #f0f7ff; }
  &.kpi-overdue:hover { border-color: #dc3545; background-color: #fff5f5; }
  &.kpi-warning:hover { border-color: #ffc107; background-color: #fffdf0; }
  &.kpi-pending:hover { border-color: #17a2b8; background-color: #f0fbff; }
  &.kpi-declared:hover { border-color: #28a745; background-color: #f0fff4; }
  &.kpi-processing:hover { border-color: #6c757d; background-color: #f8f9fa; }

  &.active {
    border-width: 2px !important;
  }
  &.kpi-all.active { border-color: #007bff !important; background-color: #e7f1ff; box-shadow: inset 0 1px 3px rgba(0, 123, 255, 0.1); }
  &.kpi-overdue.active { border-color: #dc3545 !important; background-color: #fde8e8; box-shadow: inset 0 1px 3px rgba(220, 53, 69, 0.1); }
  &.kpi-warning.active { border-color: #ffc107 !important; background-color: #fff9db; box-shadow: inset 0 1px 3px rgba(255, 193, 7, 0.15); }
  &.kpi-pending.active { border-color: #17a2b8 !important; background-color: #dcf5f8; box-shadow: inset 0 1px 3px rgba(23, 162, 184, 0.1); }
  &.kpi-declared.active { border-color: #28a745 !important; background-color: #e6f9ed; box-shadow: inset 0 1px 3px rgba(40, 167, 69, 0.1); }
  &.kpi-processing.active { border-color: #6c757d !important; background-color: #e9ecef; box-shadow: inset 0 1px 3px rgba(108, 117, 125, 0.1); }
}

.cursor-pointer {
  cursor: pointer;
}

::v-deep .table-danger-soft {
  background-color: rgba(220, 53, 69, 0.08) !important;
}

::v-deep .table-warning-soft {
  background-color: rgba(255, 193, 7, 0.12) !important;
}

.fixed-per-page {
  width: 150px !important;
  min-width: 150px !important;
  max-width: 150px !important;
  flex: 0 0 150px !important;

  ::v-deep .custom-select {
    width: 70px !important;
    min-width: 70px !important;
    flex: 0 0 70px !important;
  }
}

::v-deep #val-realprice-table {
  td, th {
    vertical-align: middle !important;
  }
}
</style>
