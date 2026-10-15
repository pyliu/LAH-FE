/* eslint-disable no-irregular-whitespace */
<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 領件管控查詢
        lah-button(icon="info" action="bounce" variant="outline-success" no-border no-icon-gutter @click="showModalById('help-modal')" title="說明")
        lah-help-modal(:modal-id="'help-modal'", size="lg")
          h5 資料庫搜尋說明
          ul
            li 搜尋已結案但未歸檔的登記案件資料
            li 請勿搜尋#[strong.text-danger 過大區間]，可能造成讀取時間過長而失敗
          hr
          h5 狀態說明
          .d-flex.justify-content-around
            span 🟢 已領件
            span 🟡 借閱中
            span 🔴 未領件
          hr
          h5 櫃檯發狀快捷作業指引
          ul
            li #[strong 狀態速查膠囊]：預設聚焦「🔴 未領件」，可一鍵切換看借閱中或全部。
            li #[strong 快捷搜尋 / 條碼槍]：隨時按鍵盤 #[code /] 鍵聚焦搜尋框，掃描條碼命中唯一案號時，按 Enter 可立即確認發狀。
            li #[strong ⚡ 一鍵發狀]：未領件之案件可直接點擊發狀按鈕秒速完成；點擊 #[code ⋯] 可設定借閱人或自訂狀態。
            li #[strong 批次發狀與簽收清單]：可自由勾選任意多筆案件，一鍵批次發狀或產生公務領狀簽收清單列印。
          hr
          h5 進階篩選與連續號批次
          ul
            li 點擊「進階篩選」可組合多重條件進行細緻過濾。
            li 點擊「區間批次」可依收件年、字、號區間進行大量修改。

      .d-flex.small
        b-link.s-90.text-muted.mr-1.align-self-center(
          v-if="advTags.length > 0"
          href="#"
          @click.prevent="resetAdvSearch"
        ) 重設
        lah-button.mr-1(
          icon="search-plus",
          size="lg",
          title="開啟進階篩選視窗",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady",
          no-icon-gutter
        ) 進階篩選
        lah-button.mr-1(
          icon="layer-group",
          size="lg",
          title="依收件號區間批次修改",
          variant="outline-info",
          @click="openBatchUpdateModal",
          :disabled="!dataReady",
          no-icon-gutter
        ) 區間批次
        lah-datepicker.mr-1(
          v-model="dateRange",
          :begin="dateBegin"
        )
        lah-button.mr-1(
          ref="search"
          icon="search"
          size="lg"
          title="搜尋"
          :disabled="isBusy || isWrongDaysPeriod"
          @click="$fetch"
          no-icon-gutter
        )
        lah-button-xlsx.mr-1(
          :jsons="xlsxData"
          header="領件控管案件"
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
          :disabled="isBusy || isWrongDaysPeriod"
          :busy="isBusy"
          @end="reload"
          @click="reload"
          auto-start
          end-attention
          no-badge
        )

  // Counter Dashboard & Smart Bar
  .card.border-0.shadow-sm.mb-2.bg-light
    .card-body.p-2
      .d-flex.flex-wrap.align-items-center.justify-content-between
        // Left: Quick Status Filter Pills
        .d-flex.align-items-center.flex-wrap
          span.font-weight-bold.mr-2.small.text-muted 狀態速查：
          b-button-group(size="sm")
            b-button(
              :variant="quickStatusFilter === '🔴' ? 'danger' : 'outline-danger'"
              @click="quickStatusFilter = '🔴'"
              class="font-weight-bold"
            )
              | 🔴 未領件
              b-badge.ml-1(variant="light") {{ countRed }}
            b-button(
              :variant="quickStatusFilter === '🟡' ? 'warning' : 'outline-warning'"
              @click="quickStatusFilter = '🟡'"
              class="font-weight-bold text-dark"
            )
              | 🟡 借閱中
              b-badge.ml-1(variant="dark") {{ countYellow }}
            b-button(
              :variant="quickStatusFilter === 'RETURNED' ? 'info' : 'outline-info'"
              @click="quickStatusFilter = 'RETURNED'"
              class="font-weight-bold"
            )
              | 🔵 已還卷
              b-badge.ml-1(variant="light") {{ countReturned }}
            b-button(
              :variant="quickStatusFilter === '🟢' ? 'success' : 'outline-success'"
              @click="quickStatusFilter = '🟢'"
              class="font-weight-bold"
            )
              | 🟢 已領件
              b-badge.ml-1(variant="light") {{ countGreen }}
            b-button(
              :variant="quickStatusFilter === 'ALL' ? 'secondary' : 'outline-secondary'"
              @click="quickStatusFilter = 'ALL'"
            )
              | 全部
              b-badge.ml-1(variant="light") {{ countTotal }}

        // Right: Achievement counter, sound toggle & column selector
        .d-flex.align-items-center.mt-1.mt-md-0
          .badge.badge-pill.badge-success.px-3.mr-2.shadow-sm.d-inline-flex.align-items-center(
            v-if="todayIssuedCount > 0"
            style="height: 31px; line-height: 1;"
            title="今日在此工作台完成發狀的案件數量"
          )
            lah-fa-icon(icon="medal").mr-1
            | 今日已發狀：#[strong.h6.mb-0.mx-1 {{ todayIssuedCount }}] 件 ✨
          lah-button(
            :icon="soundEnabled ? 'volume-up' : 'volume-mute'"
            :variant="soundEnabled ? 'outline-success' : 'outline-secondary'"
            size="sm"
            class="mr-2"
            :title="soundEnabled ? '音效已開啟（點擊靜音）' : '音效已靜音（點擊開啟）'"
            @click="toggleSound"
            no-icon-gutter
          )
          b-dropdown(
            size="sm"
            variant="outline-secondary"
            right
            no-caret
            title="自訂顯示欄位"
          )
            template(#button-content)
              lah-fa-icon(icon="columns" no-gutter)
              span.ml-1 欄位
            b-dropdown-form(style="min-width: 170px")
              b-form-checkbox(v-model="visibleColumnKeys" value="parties") 權利人/代理人
              b-form-checkbox(v-model="visibleColumnKeys" value="登記原因") 登記原因
              b-form-checkbox(v-model="visibleColumnKeys" value="land_building") 標的標示
              b-form-checkbox(v-model="visibleColumnKeys" value="UNTAKEN_TAKEN_TIME") 領件時間/人員
              b-form-checkbox(v-model="visibleColumnKeys" value="結案日期") 結案日期
              b-form-checkbox(v-model="visibleColumnKeys" value="初審人員") 初審人員
              b-form-checkbox(v-model="visibleColumnKeys" value="結案人員") 結案人員

      // Row 2: Smart Search & Barcode Input
      .d-flex.align-items-center.mt-2
        b-input-group(size="sm" class="flex-grow-1 mr-2")
          template(#prepend)
            b-input-group-text.bg-white.text-primary
              lah-fa-icon(icon="barcode")
              span.ml-1.d-none.d-sm-inline 快捷搜尋 / 條碼掃描
          b-form-input(
            ref="quickSearchInput"
            v-model="quickSearchKeyword"
            placeholder="掃描收執聯條碼，或輸入字號、姓名、統編（可按 / 鍵快速聚焦，Enter 立即定位確認）..."
            @keyup.enter="onQuickSearchEnter"
            @keydown.esc="quickSearchKeyword = ''"
            trim
          )
          template(#append)
            b-button(
              v-if="quickSearchKeyword"
              variant="outline-secondary"
              @click="quickSearchKeyword = ''"
              title="清除搜尋"
            )
              lah-fa-icon(icon="times" no-gutter)
            lah-button(
              icon="search"
              variant="primary"
              @click="onQuickSearchEnter"
              no-icon-gutter
            )

  // Floating Batch Action Bar
  lah-transition
    .alert.alert-primary.d-flex.align-items-center.justify-content-between.py-2.px-3.my-2.shadow-sm(
      v-if="selectedCaseIds.length > 0"
    )
      .d-flex.align-items-center
        lah-fa-icon(icon="check-circle" variant="primary" size="lg").mr-2
        span 已勾選 #[strong.text-danger.h5.mb-0.mx-1 {{ selectedCaseIds.length }}] 筆案件
        b-button.ml-3(variant="link" size="sm" @click="selectAllFiltered")
          | 勾選所有過濾出的案件 (共 {{ filteredDataCount }} 件)
      .d-flex.align-items-center
        lah-button(
          icon="bolt"
          variant="success"
          size="sm"
          class="font-weight-bold shadow-sm"
          @click="handleBatchIssueSelected"
          :busy="batchProcessing"
        ) ⚡ 批次發狀 ({{ selectedCaseIds.length }} 件)
        lah-button.ml-2(
          icon="print"
          variant="info"
          size="sm"
          class="font-weight-bold text-white shadow-sm"
          @click="openSignPrintModal"
        ) 🖨️ 列印領狀簽收單
        b-button.ml-2(
          variant="outline-secondary"
          size="sm"
          @click="selectedCaseIds = []"
        ) 取消勾選

  lah-transition
    .d-flex.mt-n2.mb-2(v-if="advTags.length > 0")
      .mr-auto.tags-container(
        ref="tagsContainer"
        :class="{ 'tags-collapsed': !tagsExpanded }"
      )
        b-form-tag.mr-1.my-1.adv-tag-style(
          v-for="(tag, idx) in advTags"
          :key="`tag-${idx}`"
          @remove="removeAdvTag(tag)"
          :title="`移除篩選：${tag.text}`"
          :variant="tag.variant"
          pill
        ) {{ tag.text }}
      lah-button(
        v-if="showTagsToggle"
        :icon="tagsExpanded ? 'angle-double-up' : 'angle-double-down'"
        variant="link"
        size="sm"
        @click="tagsExpanded = !tagsExpanded"
        :title="tagsExpanded ? '收合篩選條件' : '顯示所有篩選條件'"
        no-icon-gutter
      )

  lah-pagination(
    ref="pagination"
    v-model="pagination"
    :total-rows="filteredDataCount"
    :caption="foundText"
  )

  lah-transition
    b-table.text-center(
      v-if="committed"
      id="land-ref-table"
      ref="table"
      caption-top
      :tbody-tr-class="rowClass"
      :sticky-header="`${maxHeight}px`"
      :busy="isBusy"
      :items="filteredData"
      :fields="fields"
      :responsive="'lg'"
      :striped="true"
      :hover="true"
      :bordered="true"
      :small="true"
      :head-variant="'dark'"
      :sort-compare="sortCompare"
      :per-page="pagination.perPage"
      :current-page="pagination.currentPage"
    )
      template(#table-busy): span.ld-txt 讀取中...

      template(#head(select))
        b-checkbox(
          :checked="isAllPageSelected"
          :indeterminate="isPageIndeterminate"
          @change="toggleSelectAllPage"
          title="全選/取消全選本頁"
        )

      template(#cell(select)="{ item }")
        b-checkbox(
          v-model="selectedCaseIds"
          :value="item.ID"
          @click.native.stop
        )

      template(#cell(#)="{ index }")
        span {{ index + 1 + (pagination.currentPage - 1) * pagination.perPage }}

      template(#cell(UNTAKEN_TAKEN_STATUS)="{ item }")
        .d-flex.flex-column.align-items-center
          span.h5.mb-1 {{ statusLight(item) }}
          span.badge.badge-pill.px-2.py-1(:class="statusBadgeClass(item)") {{ statusText(item) }}

      template(#cell(quick_action)="{ item }")
        .d-flex.align-items-center.justify-content-center
          template(v-if="statusLight(item) === '🔴'")
            b-button(
              size="sm"
              variant="success"
              class="font-weight-bold px-2 shadow-sm"
              @click.stop="handleQuickIssue(item)"
              :disabled="isBusy"
              title="一鍵登記發狀（已領件）"
            )
              lah-fa-icon(icon="bolt" no-gutter)
              span.ml-1 發狀
            b-button.ml-1(
              size="sm"
              variant="outline-secondary"
              @click.stop="openSingleDetail(item)"
              title="設定借閱或自訂狀態"
            )
              lah-fa-icon(icon="ellipsis-h" no-gutter)
          template(v-else-if="statusLight(item) === '🟡'")
            b-button(
              size="sm"
              variant="warning"
              class="font-weight-bold text-dark px-2 shadow-sm"
              @click.stop="openSingleDetail(item)"
              title="案件借閱中，點擊管理或歸還"
            )
              lah-fa-icon(icon="undo" no-gutter)
              span.ml-1 還卷
            b-button.ml-1(
              size="sm"
              variant="outline-secondary"
              @click.stop="openSingleDetail(item)"
              title="詳細設定"
            )
              lah-fa-icon(icon="ellipsis-h" no-gutter)
          template(v-else)
            b-button(
              size="sm"
              variant="outline-success"
              class="px-2"
              @click.stop="openSingleDetail(item)"
              title="查看或修改發狀紀錄"
            )
              lah-fa-icon(icon="check" no-gutter)
              span.ml-1 已發狀
            b-button.ml-1(
              size="sm"
              variant="outline-secondary"
              @click.stop="openSingleDetail(item)"
              title="詳細設定"
            )
              lah-fa-icon(icon="ellipsis-h" no-gutter)

      template(#cell(收件字號)="{ item }")
        .text-nowrap
          b-link.font-weight-bold(@click.stop="popup(item)" title="查看登記案件詳情")
            | {{ item.RM01 }}-{{ item.RM02 }}-{{ item.RM03 }}
            lah-fa-icon.ml-1(icon="window-restore" regular variant="primary")

      template(#cell(parties)="{ item }")
        .d-flex.flex-column.text-left.text-nowrap
          .d-flex.align-items-center
            lah-fa-icon(icon="user" variant="primary" size="sm").mr-1
            strong.text-dark(v-if="item.權利人姓名 || item.RM19") {{ item.權利人姓名 || item.RM19 }}
            span.text-muted(v-else) (無權利人)
            small.text-secondary.ml-1(v-if="item.權利人統編 || item.RM18") ({{ item.權利人統編 || item.RM18 }})
          .d-flex.align-items-center.mt-1(v-if="item.代理人姓名 || item.AB02")
            lah-fa-icon(icon="user-tie" variant="info" size="sm").mr-1
            span.text-info.font-weight-bold {{ item.代理人姓名 || item.AB02 }}
            small.text-muted.ml-1(v-if="item.AB04_1 || item.AB04_2") {{ item.AB04_1 }}{{ item.AB04_2 }}
            b-link.ml-2.badge.badge-light.text-primary.border(
              @click.stop="filterByAgent(item.代理人姓名 || item.AB02)"
              title="快速過濾出此代理人的所有案件"
            )
              lah-fa-icon(icon="filter" size="xs").mr-1
              | 同代理人

      template(#cell(登記原因)="{ item }")
        .text-nowrap {{ item.RM09 }}:{{ item.登記原因 }}

      template(#cell(land_building)="{ item }")
        .d-flex.flex-column.text-left.land-building-cell
          span.font-weight-bold.text-dark(v-if="item.段小段 || item.RM10_C_KCNT") {{ item.段小段 || item.RM10_C_KCNT }}
          span.text-muted(v-if="item.地號") 地號：{{ item.地號 }}
          span.text-muted(v-if="item.建號") 建號：{{ item.建號 }}

      template(#cell(UNTAKEN_TAKEN_TIME)="{ item }")
        .d-flex.flex-column.small
          template(v-if="statusLight(item) === '🟢'")
            span {{ takenDate(item) }} {{ takenTime(item) }}
            span.text-muted(v-if="item.UNTAKEN_NOTE") 發件：{{ userNames[item.UNTAKEN_NOTE] || item.UNTAKEN_NOTE }}
          template(v-else-if="statusLight(item) === '🟡'")
            span.text-warning 借出：{{ formatLentDate(item) }}
            span.text-warning 借閱：{{ getBorrowerDisplay(item) }}
          template(v-else-if="isCaseReturned(item)")
            span.text-info 還卷：{{ formatReturnDate(item) }}
            span.text-muted 借閱：{{ getBorrowerDisplay(item) }}
          template(v-else)
            span.text-muted -

      template(#cell(結案日期)="{ item }")
        .text-nowrap {{ item.結案日期 ? item.結案日期.split(' ')[0] : '' }}

      template(#cell(初審人員)="{ item }")
        .text-nowrap {{ item.初審人員 || item.RM45 }}

      template(#cell(結案人員)="{ item }")
        .text-nowrap {{ item.結案人員 || item.RM59 }}

  // Case Detail Modal
  b-modal(
    ref="caseDetail"
    size="xl"
    hide-footer
    centered
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ $utils.caseId(clickedData?.ID) }}
    h4.text-center.text-info.my-5(v-if="modalLoading")
      b-spinner.my-auto(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(:parent-data="clickedData" @ready="modalLoading = !$event.detail")

  // Advanced Search Modal
  b-modal(
    ref="searchPlus",
    title="進階篩選",
    size="lg",
    hide-footer
  )
    template(#modal-title)
      .d-flex.align-items-center
        span 進階篩選
        small.text-muted.ml-2 按住 Ctrl 鍵可多選
    .center.d-flex
      b-input-group.align-self-stretch(prepend="收件號")
        b-input.h-100(
          v-model="advOpts.caseId",
          placeholder="... 可輸入部分收件號或區間 (如 120-450) ...",
          debounce="800",
          trim
        )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="收件字"): b-form-select(
        v-model="advOpts.caseWord",
        :options="advOpts.caseWordOpts",
        title="收件字",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="登記原因"): b-form-select(
        v-model="advOpts.caseReason",
        :options="advOpts.caseReasonOpts",
        title="登記原因",
        multiple,
        :select-size="4"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="初審人員"): b-form-select(
        v-model="advOpts.casePreliminator",
        :options="advOpts.casePreliminatorOpts",
        title="初審人員",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="發件人員"): b-form-select(
        v-model="advOpts.caseSetter",
        :options="advOpts.caseSetterOpts",
        title="發件人員",
        multiple,
        :select-size="4"
      )

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="結案人員"): b-form-select(
        v-model="advOpts.caseCloser",
        :options="advOpts.caseCloserOpts",
        title="結案人員",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="結案日期"): b-form-select(
        v-model="advOpts.caseCloseDate",
        :options="advOpts.caseCloseDateOpts",
        title="結案日期",
        multiple,
        :select-size="4"
      )

    .center.d-flex.my-1
      b-input-group.mr-1(prepend="領件狀態"): b-form-select(
        v-model="advOpts.caseLight",
        :options="advOpts.caseLightOpts",
        title="領件狀態",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="領件日期"): b-form-select(
        v-model="advOpts.caseTakenDate",
        :options="advOpts.caseTakenDateOpts",
        title="領件日期",
        multiple,
        :select-size="4"
      )
    .center.d-flex.my-1
      b-input-group.mr-1(prepend="借閱人員"): b-form-select(
        v-model="advOpts.caseBorrower",
        :options="advOpts.caseBorrowerOpts",
        title="借閱人員",
        multiple,
        :select-size="4"
      )
      b-input-group(prepend="借閱日期"): b-form-select(
        v-model="advOpts.caseLentDate",
        :options="advOpts.caseLentDateOpts",
        title="借閱日期",
        multiple,
        :select-size="4"
      )

    .center.mt-2
      lah-button.mr-1(
        icon="recycle",
        @click="resetAdvSearch",
        variant="outline-success"
      ) 重設
      small.text-primary.ml-2 找到 {{ filteredDataCount }} 筆

  // Legacy Batch Update Modal (by range)
  b-modal(
    ref="batchUpdateModal",
    title="區間批次修改領件狀態",
    no-close-on-backdrop,
    :hide-header-close="batchProcessing",
    size="md"
  )
    b-form-fieldset(:disabled="batchProcessing")
      .d-flex
        b-input-group.mr-1(prepend="收件年"): b-form-select(
          v-model="batchYear",
          :options="batchYearOpts",
          :state="!$utils.empty(batchYear)"
        )
        b-input-group(prepend="收件字"): b-form-select(
          v-model="batchWord",
          :options="batchWordOpts",
          :state="!$utils.empty(batchWord)"
        )
      .d-flex.my-1(v-if="!$utils.empty(batchWord)")
        b-input-group.mr-1(prepend="收件號起"): b-input(
          v-model="batchNumS",
          placeholder="... 000001 ...",
          :state="isStartNumState",
          trim,
          @blur="formatCaseNumber('batchNumS')"
        )
        b-input-group(prepend="收件號迄"): b-input(
          v-model="batchNumE",
          placeholder="... 000100 ...",
          :state="isEndNumState",
          trim,
          @blur="formatCaseNumber('batchNumE')"
        )

    section(v-if="!isBatchFormInvalid")
      hr
      b-row.align-items-center.no-gutters
        b-col.p-1(cols="5")
          .d-flex.align-items-center
            .text-nowrap.mr-1 領件狀態
            b-select.flex-grow-1(
              v-model="batchReceiveStatus",
              :options="batchStatusOpts",
              :disabled="batchProcessing"
            )
        b-col.p-1(cols="7")
          .d-flex.align-items-center
            .text-nowrap.mr-1 領件日期
            b-datepicker.flex-grow-1(
              v-model="batchReceiveDate"
              boundary="viewport"
              variant="primary"
              placeholder=""
              label-help="使用方向鍵操作移動日期"
              label-today-button="今天"
              label-reset-button="重設"
              label-close-button="關閉"
              :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
              :max="maxDate"
              :state="$utils.empty(batchReceiveStatus) ? true : !$utils.empty(batchReceiveStatus) && !$utils.empty(batchReceiveDate)"
              :disabled="batchProcessing || $utils.empty(batchReceiveStatus)"
              hide-header
              today-button
              close-button
              reset-button
            )

    .text-monospace.p-2.mt-2(v-if="isBatchFormInvalid")
      lah-message(
        :message="batchMessage",
        variant="danger"
      )
    section.mt-2(v-else-if="batchProcessing")
      lah-message(
        :message="batchProgressMessage",
        variant="info"
      )
      b-progress.mt-2(
        :value="progress",
        :max="progressMax",
        :variant="progressVariant",
        show-progress,
        animated,
        :precision="0"
      )
    .text-monospace.border.p-2.mt-2(v-else)
      div 針對 #[strong.text-info {{ batchYear }}-{{ batchWord }}] 區間 #[strong.text-info {{ batchNumS }} ~ {{ batchNumE }}] 共有 #[strong.text-danger {{ batchCases.length }}] 筆案件
      div 「領件狀態」設定為 #[strong.text-success {{ $utils.empty(batchReceiveStatus) ? '(未領件)' : batchReceiveStatus }}]
      div 「領件日期」設定為 #[strong.text-success {{ $utils.empty(batchReceiveDate) ? '(清空)' : batchReceiveDate }}]
      div 「領件時間」設定為 #[strong.text-success {{ $utils.empty(batchReceiveTime) ? '(清空)' : batchReceiveTime }}]
      div 「發件人員」設定為 #[strong(:class="$utils.empty(batchReceiveStatus) ? ['text-success'] : ['text-primary']") {{ $utils.empty(batchReceiveStatus) ? '(清空)' : user.name }}]

    template(#modal-footer="{ cancel }")
      lah-button(
        :icon="batchProcessing ? 'spinner' : 'check'"
        :spin="batchProcessing"
        variant="primary"
        :disabled="isBatchFormInvalid || batchProcessing  || (!$utils.empty(batchReceiveStatus) && $utils.empty(batchReceiveDate))"
        @click="handleBatchUpdate"
        pill
      )
        span {{ batchProcessing ? '處理中' : '確認送出' }}

  // Single Case Detail Management Modal
  b-modal(
    ref="singleDetailModal"
    size="lg"
    no-close-on-backdrop
    :title="detailModalTitle"
  )
    template(#default)
      div(v-if="detailTargetCase")
        // Case info banner
        .alert.alert-secondary.py-2.px-3.mb-3
          .d-flex.justify-content-between.align-items-center
            div
              strong.h5.text-primary.mr-2 {{ detailTargetCase.RM01 }}-{{ detailTargetCase.RM02 }}-{{ detailTargetCase.RM03 }}
              span.badge.badge-info.mr-1 {{ detailTargetCase.登記原因 }}
              span.badge(:class="statusBadgeClass(detailTargetCase)") {{ statusText(detailTargetCase) }}
            small.text-muted 結案：{{ detailTargetCase.結案日期 ? detailTargetCase.結案日期.split(' ')[0] : '-' }}
          .d-flex.justify-content-between.mt-2.small
            div
              lah-fa-icon(icon="user" variant="primary").mr-1
              span.mr-3 權利人：#[strong {{ detailTargetCase.權利人姓名 || detailTargetCase.RM19 || '-' }}]
              lah-fa-icon(icon="user-tie" variant="info").mr-1
              span 代理人：#[strong {{ detailTargetCase.代理人姓名 || detailTargetCase.AB02 || '-' }}]
            div.text-muted
              span(v-if="detailTargetCase.段小段 || detailTargetCase.RM10_C_KCNT") {{ detailTargetCase.段小段 || detailTargetCase.RM10_C_KCNT }}

        b-card.mb-3(header="領件狀態設定" header-tag="header" header-class="font-weight-bold py-2")
          .d-flex.flex-wrap.align-items-center
            b-button.status-tag-btn.m-1(
              v-for="opt in statusTagList"
              :key="opt.value"
              :variant="getStatusTagVariant(opt.value)"
              size="sm"
              pill
              @click="selectDetailStatus(opt.value)"
            )
              span.mr-1(v-if="opt.icon") {{ opt.icon }}
              span.font-weight-bold {{ opt.text }}
              lah-fa-icon.ml-1(v-if="detailForm.taken_status === opt.value" icon="check" size="xs")

          lah-transition
            .row.align-items-center.mt-3.pt-2.border-top(v-if="!$utils.empty(detailForm.taken_status)")
              .col-md-6.mb-2
                b-input-group.modal-datetime-group(prepend="領件日期")
                  b-datepicker(
                    v-model="detailForm.taken_date"
                    boundary="viewport"
                    variant="primary"
                    placeholder="選擇日期"
                    locale="zh-TW"
                    label-help="使用方向鍵操作移動日期"
                    label-today-button="今天"
                    label-reset-button="重設"
                    label-close-button="關閉"
                    :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
                    :max="maxDate"
                    hide-header
                    today-button
                    reset-button
                    close-button
                  )
              .col-md-6.mb-2
                b-input-group.modal-datetime-group(prepend="領件時間")
                  b-input(
                    v-model="detailForm.taken_time"
                    placeholder="HH:mm:ss"
                  )
                  b-input-group-append
                    b-button(variant="outline-primary" @click="setDetailTimeToNow" title="填入現在時間")
                      lah-fa-icon(icon="clock").mr-1
                      | 現在
              .col-12.small.text-muted
                span 發件登記人：#[strong.text-primary {{ user.name }} ({{ user.id }})]

        b-card(header="卷宗借閱管理" header-tag="header" header-class="font-weight-bold py-2")
          .row.align-items-center.mb-2
            .col-md-12.mb-2
              .d-flex.align-items-center
                span.mr-2 借閱人員：
                strong.mr-2(:class="detailForm.borrower ? 'text-primary' : 'text-muted'")
                  | {{ detailForm.borrower ? `${detailForm.borrower} ${userNames[detailForm.borrower] || ''}` : '(無借閱人)' }}
                lah-button(icon="user-friends" size="sm" variant="outline-dark" @click="openBorrowerSelect") 選擇借閱人
                lah-button.ml-2(
                  v-if="detailForm.borrower"
                  icon="times"
                  size="sm"
                  variant="outline-danger"
                  @click="onBorrowerClean"
                  title="清除借閱人"
                ) 清除借閱人
          .row(v-if="detailForm.borrower")
            .col-md-6.mb-2
              b-input-group.modal-datetime-group(prepend="借出日期")
                b-datepicker(
                  v-model="detailForm.lent_date"
                  boundary="viewport"
                  variant="primary"
                  placeholder="借出日期"
                  locale="zh-TW"
                  label-help="使用方向鍵操作移動日期"
                  label-today-button="今天"
                  label-reset-button="重設"
                  label-close-button="關閉"
                  :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
                  :max="maxDate"
                  hide-header
                  today-button
                  reset-button
                  close-button
                )
            .col-md-6.mb-2
              b-input-group.modal-datetime-group(prepend="歸還日期")
                b-datepicker(
                  v-model="detailForm.return_date"
                  boundary="viewport"
                  variant="primary"
                  placeholder="點選設定歸還日期"
                  locale="zh-TW"
                  label-help="使用方向鍵操作移動日期"
                  label-today-button="今天"
                  label-reset-button="重設"
                  label-close-button="關閉"
                  :date-format-options="{ year: 'numeric', month: '2-digit', day: '2-digit', weekday: undefined }"
                  :max="maxDate"
                  hide-header
                  today-button
                  reset-button
                  close-button
                )
    template(#modal-footer="{ cancel }")
      lah-button(
        icon="times"
        variant="outline-secondary"
        class="modal-footer-btn mr-2"
        @click="cancel"
      ) 取消
      lah-button(
        icon="save"
        variant="primary"
        class="modal-footer-btn"
        @click="saveSingleDetail"
        :busy="isBusy"
      ) 儲存更新

  // Borrower User Select Modal
  b-modal(
    ref="borrowerModal"
    size="lg"
    hide-footer
    centered
    title="選擇借閱人員"
  )
    lah-user-select(
      :case-reviewer="detailTargetCase ? (detailTargetCase.初審人員 || detailTargetCase.RM45 || '') : ''"
      :init-keyword="detailForm.borrower ? (userNames[detailForm.borrower] || '') : ''"
      @update="onBorrowerSelected"
      @clean="onBorrowerClean"
    )

  // Sign Sheet Print Modal
  b-modal(
    ref="signPrintModal"
    size="xl"
    hide-footer
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon(icon="print" variant="primary").mr-2
        span 領狀簽收清冊列印預覽
        b-badge.ml-2(variant="info") 共 {{ printCases.length }} 案

    .sign-sheet-wrapper.p-2
      .d-flex.justify-content-between.align-items-center.mb-3.no-print
        .text-muted 提示：點擊「列印」後將直接呼叫印表機，已套用公務 A4 標準清冊樣式。
        .d-flex.align-items-center
          lah-button(icon="print" variant="primary" size="lg" @click="printSignSheet") 列印簽收清單
          lah-button.ml-2(icon="times" variant="outline-secondary" size="lg" @click="$refs.signPrintModal.hide()") 關閉

      .sign-sheet-paper.p-4.border.bg-white
        .text-center.mb-3
          h3.font-weight-bold.mb-1 桃園市{{ currentOfficeName }} 登記案件領狀簽收清冊
          .text-muted.small 列印時間：中華民國 {{ printDateTw }}  發狀人員：{{ user.name }} ({{ user.id }})

        .d-flex.justify-content-between.small.mb-2
          div 領狀代理人／受領人：#[strong {{ printAgentDisplay }}]
          div 總計案件數：#[strong {{ printCases.length }}] 件

        table.table.table-bordered.table-sm.sign-table.text-center
          thead.thead-light
            tr
              th(style="width: 45px") 項次
              th(style="width: 140px") 收件字號
              th(style="width: 110px") 登記原因
              th 權利人 (統編)
              th 代理人 (電話)
              th 土地標示 / 地建號
              th(style="width: 90px") 領狀狀態
          tbody
            tr(v-for="(c, idx) in printCases" :key="`print-${c.ID}`")
              td {{ idx + 1 }}
              td.font-weight-bold {{ c.RM01 }}-{{ c.RM02 }}-{{ c.RM03 }}
              td {{ c.登記原因 }}
              td {{ c.權利人姓名 || c.RM19 || '-' }} {{ (c.權利人統編 || c.RM18) ? `(${c.權利人統編 || c.RM18})` : '' }}
              td {{ c.代理人姓名 || c.AB02 || '-' }} {{ (c.AB04_1 || c.AB04_2) ? `(${c.AB04_1 || ''}${c.AB04_2 || ''})` : '' }}
              td {{ c.段小段 || c.RM10_C_KCNT || '' }} {{ c.地號 ? `地號: ${c.地號}` : '' }} {{ c.建號 ? `建號: ${c.建號}` : '' }}
              td {{ c.UNTAKEN_TAKEN_STATUS || '已領件' }}

        .row.mt-4.pt-3.sign-footer
          .col-7
            .mb-3 領狀人／受領人簽名或蓋章：________________________
            .mb-3 領狀人身分證字號：________________________
            div 聯絡電話：________________________
          .col-5.text-right
            .mb-4 領取日期：民國 _______ 年 _____ 月 _____ 日
            .text-muted.small 本清冊供地政事務所權利書狀領取存查之用

</template>

<script>
import lahRegUntakenMgt from '~/components/lah-reg-untaken-mgt.vue'
import lahUserSelect from '~/components/lah-user-select.vue'

export default {
  components: { lahRegUntakenMgt, lahUserSelect },
  data: () => ({
    maxHeight: 400,
    cachedMs: 24 * 60 * 60 * 1000,
    modalLoading: true,
    clickedData: undefined,
    rows: [],
    dateBegin: (() => {
      const d = new Date()
      d.setDate(d.getDate() - 7)
      return d
    })(),
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    forceReload: false,
    committed: false,
    warnDays: 730,
    // Fast Counter Dashboard & Quick Tools
    quickStatusFilter: '🔴',
    quickSearchKeyword: '',
    todayIssuedCount: 0,
    soundEnabled: true,
    selectedCaseIds: [],
    highlightedCaseId: '',
    visibleColumnKeys: [
      'select',
      '#',
      'UNTAKEN_TAKEN_STATUS',
      'quick_action',
      '收件字號',
      'parties',
      '登記原因',
      'land_building',
      'UNTAKEN_TAKEN_TIME',
      '結案日期',
      '初審人員',
      '結案人員'
    ],
    // Single Detail Modal
    detailTargetCase: null,
    detailForm: {
      id: '',
      taken_status: '',
      taken_date: '',
      taken_time: '',
      borrower: '',
      lent_date: '',
      return_date: '',
      note: ''
    },
    // Advanced Search Options
    advOpts: {
      caseId: '',
      caseWord: [],
      caseWordOpts: [],
      caseReason: [],
      caseReasonOpts: [],
      caseCloser: [],
      caseCloserOpts: [],
      casePreliminator: [],
      casePreliminatorOpts: [],
      caseLight: [],
      caseLightOpts: [
        { text: '🟢 已領件', value: '🟢' },
        { text: '🟡 借閱中', value: '🟡' },
        { text: '🔵 已還卷', value: 'RETURNED' },
        { text: '🔴 未領件', value: '🔴' }
      ],
      caseTakenDate: [],
      caseTakenDateOpts: [],
      caseCloseDate: [],
      caseCloseDateOpts: [],
      caseSetter: [],
      caseSetterOpts: [],
      caseBorrower: [],
      caseBorrowerOpts: [],
      caseLentDate: [],
      caseLentDateOpts: []
    },
    // Batch Update Options (flattened)
    batchYear: '',
    batchYearOpts: [],
    batchWord: '',
    batchWordOpts: [],
    batchNumS: '',
    batchNumE: '',
    batchReceiveStatus: '',
    batchReceiveDate: '',
    batchReceiveTime: '',
    batchStatusOpts: [
      { text: '未領件', value: '' },
      '已領件',
      '免發狀',
      '附件領回',
      '內部更正',
      '駁回',
      '撤回',
      '郵寄',
      'i領件'
    ],
    statusTagList: [
      { text: '未領件', value: '', icon: '🔴', activeVariant: 'danger', idleVariant: 'outline-danger' },
      { text: '已領件', value: '已領件', icon: '🟢', activeVariant: 'success', idleVariant: 'outline-success' },
      { text: '免發狀', value: '免發狀', icon: '📄', activeVariant: 'info', idleVariant: 'outline-info' },
      { text: '附件領回', value: '附件領回', icon: '📎', activeVariant: 'info', idleVariant: 'outline-info' },
      { text: '內部更正', value: '內部更正', icon: '🔧', activeVariant: 'warning', idleVariant: 'outline-warning' },
      { text: '駁回', value: '駁回', icon: '❌', activeVariant: 'danger', idleVariant: 'outline-danger' },
      { text: '撤回', value: '撤回', icon: '↩️', activeVariant: 'secondary', idleVariant: 'outline-secondary' },
      { text: '郵寄', value: '郵寄', icon: '📮', activeVariant: 'primary', idleVariant: 'outline-primary' },
      { text: 'i領件', value: 'i領件', icon: '📱', activeVariant: 'primary', idleVariant: 'outline-primary' }
    ],
    batchMessage: '',
    maxDate: new Date(),
    batchProcessing: false,
    progress: 0,
    progressMax: 0,
    tagsExpanded: false,
    showTagsToggle: false
  }),
  fetch () {
    if (this.isBusy) {
      this.notify('讀取中 ... 請稍後', { type: 'warning' })
    } else {
      if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
        this.$utils.warn('dateRange is not ready ... postpone $fetch')
        this.timeout(this.$fetch, 400)
        return
      }

      this.isBusy = true
      this.committed = false
      this.$axios.post(this.$consts.API.JSON.PREFETCH, {
        type: 'reg_untaken_case',
        start: this.dateRange.begin,
        end: this.dateRange.end,
        reload: this.forceReload
      }).then(({ data }) => {
        this.rows = data.raw || []
        this.selectedCaseIds = []
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
        const remainSec = data.cache_remaining_time
        const remainMs = remainSec * 1000
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
        this.calculateTableHeight()
      })
    }
  },
  head: {
    title: '案件領狀管控-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    cacheKey () { return `query_reg_untaken_case_${this.dateRange.begin}_${this.dateRange.end}` },
    foundText () {
      if (this.quickStatusFilter === '🔴') {
        return `找到 ${this.filteredDataCount} 筆「未領件」案件 (總計 ${this.rows.length} 案)`
      } else if (this.quickStatusFilter === '🟡') {
        return `找到 ${this.filteredDataCount} 筆「借閱中」案件 (總計 ${this.rows.length} 案)`
      } else if (this.quickStatusFilter === 'RETURNED') {
        return `找到 ${this.filteredDataCount} 筆「已還卷」案件 (總計 ${this.rows.length} 案)`
      } else if (this.quickStatusFilter === '🟢') {
        return `找到 ${this.filteredDataCount} 筆「已領件」案件 (總計 ${this.rows.length} 案)`
      }
      return `找到 ${this.filteredDataCount} 筆登記案件資料 (總計 ${this.rows.length} 案)`
    },
    daysPeriod () { return this.dateRange.days || 0 },
    isWrongDaysPeriod () { return this.daysPeriod < 1 },
    countTotal () { return this.rows.length },
    countRed () { return this.rows.filter(item => this.statusLight(item) === '🔴').length },
    countYellow () { return this.rows.filter(item => this.statusLight(item) === '🟡').length },
    countReturned () { return this.rows.filter(item => this.isCaseReturned(item)).length },
    countGreen () { return this.rows.filter(item => this.statusLight(item) === '🟢').length },
    fields () {
      const allFields = [
        { key: 'select', label: '', thStyle: 'width: 40px', class: 'text-center' },
        { key: '#', label: '#', thStyle: 'width: 48px', class: 'text-center' },
        { key: 'UNTAKEN_TAKEN_STATUS', label: '狀態', sortable: true, thStyle: 'width: 85px', class: 'text-center' },
        { key: 'quick_action', label: '發狀作業', thStyle: 'width: 140px', class: 'text-center' },
        { key: '收件字號', label: '收件字號', sortable: true, thStyle: 'width: 175px; min-width: 175px;', class: 'text-center text-nowrap' },
        { key: 'parties', label: '權利人 / 代理人', sortable: true, thStyle: 'width: 180px; max-width: 200px;', class: 'text-left text-nowrap' },
        { key: '登記原因', label: '登記原因', sortable: true, thStyle: 'min-width: 110px' },
        { key: 'land_building', label: '標的標示', thStyle: 'min-width: 120px', class: 'text-left' },
        { key: 'UNTAKEN_TAKEN_TIME', label: '領件時間/人員', sortable: true, thStyle: 'min-width: 130px' },
        { key: '結案日期', label: '結案日期', sortable: true, thStyle: 'width: 95px' },
        { key: '初審人員', label: '初審人員', sortable: true, thStyle: 'width: 90px' },
        { key: '結案人員', label: '結案人員', sortable: true, thStyle: 'width: 90px' }
      ]
      return allFields.filter(f => this.visibleColumnKeys.includes(f.key))
    },
    filteredData () {
      let pipelineItems = [...this.rows]

      // 1. Quick Status Filter (🔴 / 🟡 / RETURNED / 🟢 / ALL)
      if (this.quickStatusFilter === 'RETURNED') {
        pipelineItems = pipelineItems.filter(item => this.isCaseReturned(item))
      } else if (this.quickStatusFilter !== 'ALL') {
        pipelineItems = pipelineItems.filter(item => this.statusLight(item) === this.quickStatusFilter)
      }

      // 2. Quick Search Keyword Filter (CaseId, Owner Name, Agent Name, ID, Tel, Reason)
      if (!this.$utils.empty(this.quickSearchKeyword)) {
        const kw = this.quickSearchKeyword.trim().toUpperCase()
        const cleanKw = kw.replace(/[-]/g, '')
        pipelineItems = pipelineItems.filter((item) => {
          const fullCaseId = `${item.RM01}${item.RM02}${item.RM03}`
          const formattedCaseId = `${item.RM01}-${item.RM02}-${item.RM03}`
          const numOnly = parseInt(item.RM03, 10).toString()
          const ownerName = item.權利人姓名 || item.RM19 || ''
          const ownerId = item.權利人統編 || item.RM18 || ''
          const agentName = item.代理人姓名 || item.AB02 || ''
          const agentId = item.代理人統編 || item.RM24 || ''
          const agentTel = (item.AB04_1 || '') + (item.AB04_2 || '')
          const reason = item.登記原因 || ''
          const section = item.段小段 || item.RM10_C_KCNT || ''
          const landNum = item.地號 || ''
          const buildNum = item.建號 || ''

          return fullCaseId.includes(cleanKw) ||
                 formattedCaseId.includes(kw) ||
                 item.RM03.includes(kw) ||
                 numOnly === kw ||
                 ownerName.includes(kw) ||
                 ownerId.includes(kw) ||
                 agentName.includes(kw) ||
                 agentId.includes(kw) ||
                 agentTel.includes(kw) ||
                 reason.includes(kw) ||
                 section.includes(kw) ||
                 landNum.includes(kw) ||
                 buildNum.includes(kw)
        })
      }

      // 3. Advanced Search Options (advOpts)
      if (!this.$utils.empty(this.advOpts.caseId)) {
        const query = this.advOpts.caseId.trim()
        const rangeParts = query.split(/\s*[-~]\s*/)

        let isRangeSearch = false
        let startNum, endNum

        if (rangeParts.length === 2) {
          const potentialStart = Number(rangeParts[0])
          const potentialEnd = Number(rangeParts[1])
          if (!isNaN(potentialStart) && !isNaN(potentialEnd) && potentialStart <= potentialEnd) {
            isRangeSearch = true
            startNum = potentialStart
            endNum = potentialEnd
          }
        }

        if (isRangeSearch) {
          pipelineItems = pipelineItems.filter((item) => {
            const itemNum = parseInt(item.RM03, 10)
            return !isNaN(itemNum) && itemNum >= startNum && itemNum <= endNum
          })
        } else {
          pipelineItems = pipelineItems.filter(item => item.RM03.includes(query.toUpperCase()))
        }
      }

      if (this.advOpts.caseWord.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseWord.includes(item.RM02))
      }
      if (this.advOpts.caseReason.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseReason.includes(item.登記原因))
      }
      if (this.advOpts.caseCloser.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseCloser.includes(item.結案人員))
      }
      if (this.advOpts.casePreliminator.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.casePreliminator.includes(item.初審人員))
      }
      if (this.advOpts.caseLight.length > 0) {
        pipelineItems = pipelineItems.filter((item) => {
          const matchLight = this.advOpts.caseLight.includes(this.statusLight(item))
          const matchReturned = this.advOpts.caseLight.includes('RETURNED') && this.isCaseReturned(item)
          return matchLight || matchReturned
        })
      }
      if (this.advOpts.caseTakenDate.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseTakenDate.includes(this.takenDate(item)))
      }
      if (this.advOpts.caseCloseDate.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseCloseDate.includes(this.$utils.addDateDivider(item.RM58_1)))
      }
      if (this.advOpts.caseSetter.length > 0) {
        pipelineItems = pipelineItems.filter(item => this.advOpts.caseSetter.includes(item.UNTAKEN_NOTE))
      }
      if (this.advOpts.caseLentDate.length > 0) {
        pipelineItems = pipelineItems.filter((item) => {
          const d = item?.UNTAKEN_LENT_DATE?.split('T')[0]
          return this.advOpts.caseLentDate.includes(d)
        })
      }
      if (this.advOpts.caseBorrower.length > 0) {
        pipelineItems = pipelineItems.filter((item) => {
          const borrowerId = item?.UNTAKEN_BORROWER
          if (this.$utils.empty(borrowerId)) { return false }
          const borrowerText = `${borrowerId} ${this.userNames[borrowerId]}`
          return this.advOpts.caseBorrower.includes(borrowerText)
        })
      }
      return pipelineItems
    },
    filteredDataCount () {
      return this.filteredData.length
    },
    currentPageItems () {
      const start = (this.pagination.currentPage - 1) * this.pagination.perPage
      const end = start + this.pagination.perPage
      return this.filteredData.slice(start, end)
    },
    isAllPageSelected () {
      if (!this.currentPageItems || this.currentPageItems.length === 0) { return false }
      return this.currentPageItems.every(item => this.selectedCaseIds.includes(item.ID))
    },
    isPageIndeterminate () {
      if (!this.currentPageItems || this.currentPageItems.length === 0) { return false }
      const some = this.currentPageItems.some(item => this.selectedCaseIds.includes(item.ID))
      return some && !this.isAllPageSelected
    },
    printCases () {
      return this.rows.filter(item => this.selectedCaseIds.includes(item.ID))
    },
    printDateTw () {
      const d = new Date()
      const year = d.getFullYear() - 1911
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const date = String(d.getDate()).padStart(2, '0')
      const time = this.$utils.formatTime(d)
      return `${year} 年 ${m} 月 ${date} 日 ${time}`
    },
    printAgentDisplay () {
      const agents = [...new Set(this.printCases.map(c => c.代理人姓名 || c.AB02).filter(Boolean))]
      if (agents.length === 1) {
        const tel = (this.printCases[0].AB04_1 || '') + (this.printCases[0].AB04_2 || '')
        return `${agents[0]} ${tel ? `(電話: ${tel})` : ''}`
      } else if (agents.length > 1) {
        return '多位代理人（如清單所示）'
      }
      return '臨櫃民眾親領'
    },
    currentOfficeName () {
      if (this.siteName) {
        return this.siteName.endsWith('所') ? `${this.siteName.slice(0, -1)}地政事務所` : this.siteName
      }
      return '地政事務所'
    },
    detailModalTitle () {
      if (!this.detailTargetCase) { return '案件領狀與借閱管理' }
      return `發狀與借閱管理 - ${this.detailTargetCase.RM01}-${this.detailTargetCase.RM02}-${this.detailTargetCase.RM03}`
    },
    advTags () {
      const tags = []
      const config = [
        { key: 'caseWord', prefix: '收件字', variant: 'primary' },
        { key: 'caseId', prefix: '收件號', variant: 'info' },
        { key: 'caseReason', prefix: '登記原因', variant: 'success' },
        { key: 'casePreliminator', prefix: '初審人員', variant: 'secondary' },
        { key: 'caseCloser', prefix: '結案人員', variant: 'danger' },
        { key: 'caseCloseDate', prefix: '結案日期', variant: 'dark' },
        { key: 'caseLight', prefix: '領件狀態', variant: 'warning' },
        { key: 'caseTakenDate', prefix: '領件日期', variant: 'light' },
        { key: 'caseSetter', prefix: '發件人員', variant: 'info' },
        { key: 'caseBorrower', prefix: '借閱人員', variant: 'primary' },
        { key: 'caseLentDate', prefix: '借閱日期', variant: 'info' }
      ]

      config.forEach(({ key, prefix, variant }) => {
        const value = this.advOpts[key]
        if (Array.isArray(value)) {
          value.forEach((val) => {
            let textToShow = val
            if (key === 'casePreliminator' || key === 'caseCloser' || key === 'caseSetter' || key === 'caseLight') {
              let opts
              if (key === 'casePreliminator') { opts = this.advOpts.casePreliminatorOpts } else if (key === 'caseCloser') { opts = this.advOpts.caseCloserOpts } else if (key === 'caseSetter') { opts = this.advOpts.caseSetterOpts } else { opts = this.advOpts.caseLightOpts }
              const found = opts.find(opt => opt.value === val)
              if (found) { textToShow = found.text }
            }
            tags.push({ type: key, value: val, text: `${prefix}：${textToShow}`, variant })
          })
        } else if (!this.$utils.empty(value)) {
          tags.push({ type: key, value, text: `${prefix}：${value.toUpperCase()}`, variant })
        }
      })
      return tags
    },
    caseNumberRangeForBatch () {
      const { batchYear, batchWord } = this
      if (!this.$utils.empty(batchYear) && !this.$utils.empty(batchWord)) {
        const numbers = this.rows
          .filter(item => item.RM01 === batchYear && item.RM02 === batchWord)
          .map(item => item.RM03)
          .sort((a, b) => a.localeCompare(b))
        if (numbers.length > 0) {
          return {
            min: numbers[0],
            max: numbers[numbers.length - 1]
          }
        }
      }
      return { min: null, max: null }
    },
    isStartNumState () {
      const { batchNumS } = this
      if (this.$utils.empty(batchNumS)) { return null }
      const range = this.caseNumberRangeForBatch
      if (!range.min) { return null }
      return batchNumS >= range.min && batchNumS <= range.max
    },
    isEndNumState () {
      const { batchNumE } = this
      if (this.$utils.empty(batchNumE)) { return null }
      const range = this.caseNumberRangeForBatch
      if (!range.max) { return null }
      return batchNumE <= range.max && batchNumE >= range.min
    },
    isBatchFormInvalid () {
      if (this.$utils.empty(this.batchYear) || this.$utils.empty(this.batchWord) || this.$utils.empty(this.batchNumS) || this.$utils.empty(this.batchNumE)) {
        return true
      }
      const orderValid = this.batchNumS <= this.batchNumE
      const startInRange = this.isStartNumState
      const endInRange = this.isEndNumState
      if (orderValid === false || startInRange === false || endInRange === false) {
        return true
      }
      return false
    },
    batchProgressMessage () {
      if (this.progress < this.progressMax) {
        return `批次處理中，請勿關閉視窗 ... ${this.progress} / ${this.progressMax}`
      }
      return '批次處理完成 ... 等待重新整理資料'
    },
    progressVariant () {
      if (this.progressMax === 0) {
        return 'secondary'
      }
      const percentage = (this.progress / this.progressMax) * 100
      if (percentage <= 75) {
        return 'secondary'
      } else if (percentage <= 90) {
        return 'warning'
      }
      return 'success'
    },
    xlsxData () {
      const formatToMinguoDate = (dateString) => {
        if (this.$utils.empty(dateString)) {
          return ''
        }
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          return ''
        }
        const year = date.getFullYear() - 1911
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }
      const formatTime = (dateString) => {
        const ts = Date.parse(dateString)
        return ts ? this.$utils.formatTime(new Date(ts)) : ''
      }
      const jsons = this.filteredData.map((data) => {
        const obj = {
          收件年: data.RM01,
          收件字: data.RM02,
          收件號: data.RM03,
          收件日期: data.收件日期,
          登記原因: data.登記原因,
          權利人: data.權利人姓名 || data.RM19 || '',
          權利人統編: data.權利人統編 || data.RM18 || '',
          代理人: data.代理人姓名 || data.AB02 || '',
          代理人電話: (data.AB04_1 || '') + (data.AB04_2 || ''),
          初審人員: data.初審人員,
          發件人員: this.userNames[data.UNTAKEN_NOTE] || data.UNTAKEN_NOTE || '',
          借閱人員: this.userNames[data.UNTAKEN_BORROWER] || data.UNTAKEN_BORROWER || '',
          借閱日期: formatToMinguoDate(data.UNTAKEN_LENT_DATE),
          借閱時間: formatTime(data.UNTAKEN_LENT_DATE),
          歸還日期: formatToMinguoDate(data.UNTAKEN_RETURN_DATE),
          歸還時間: formatTime(data.UNTAKEN_RETURN_DATE),
          領件日期: formatToMinguoDate(data.UNTAKEN_TAKEN_DATE),
          領件時間: formatTime(data.UNTAKEN_TAKEN_DATE),
          領件狀態: data.UNTAKEN_TAKEN_STATUS
        }
        return obj
      })
      return jsons
    },
    batchCases () {
      return this.rows.filter(item =>
        item.RM01 === this.batchYear &&
        item.RM02 === this.batchWord &&
        item.RM03 >= this.batchNumS &&
        item.RM03 <= this.batchNumE
      )
    }
  },
  fetchOnServer: false,
  watch: {
    advTags: {
      handler () {
        this.calculateTableHeight()
        this.tagsExpanded = false
        this.$nextTick(() => {
          const container = this.$refs.tagsContainer
          if (container) {
            this.showTagsToggle = container.scrollHeight > 40
          } else {
            this.showTagsToggle = false
          }
        })
      },
      deep: true
    },
    rows (val) {
      const lightOpts = this.advOpts.caseLightOpts
      this.advOpts = {
        caseId: '',
        caseWord: [],
        caseWordOpts: [],
        caseReason: [],
        caseReasonOpts: [],
        caseCloser: [],
        caseCloserOpts: [],
        casePreliminator: [],
        casePreliminatorOpts: [],
        caseLight: [],
        caseLightOpts: lightOpts,
        caseTakenDate: [],
        caseTakenDateOpts: [],
        caseCloseDate: [],
        caseCloseDateOpts: [],
        caseSetter: [],
        caseSetterOpts: [],
        caseBorrower: [],
        caseBorrowerOpts: [],
        caseLentDate: [],
        caseLentDateOpts: []
      }
      if (val) {
        const wordMap = new Map()
        val.forEach((item) => {
          if (item.RM02 && !wordMap.has(item.RM02)) {
            wordMap.set(item.RM02, {
              text: `${item.RM02} ${item.收件字}`,
              value: item.RM02
            })
          }
        })
        this.advOpts.caseWordOpts = [...wordMap.values()].sort((a, b) => a.text.localeCompare(b.text))

        const reasonMap = new Map()
        val.forEach((item) => {
          if (item.登記原因 && !reasonMap.has(item.登記原因)) {
            reasonMap.set(item.登記原因, {
              text: `${item.RM09} ${item.登記原因}`,
              value: item.登記原因
            })
          }
        })
        this.advOpts.caseReasonOpts = [...reasonMap.values()].sort((a, b) => a.text.localeCompare(b.text))

        const preliminatorMap = new Map()
        val.forEach((item) => {
          if (item.初審人員 && !preliminatorMap.has(item.初審人員)) {
            preliminatorMap.set(item.初審人員, {
              text: `${item.RM45} ${item.初審人員}`,
              value: item.初審人員
            })
          }
        })
        this.advOpts.casePreliminatorOpts = [...preliminatorMap.values()].sort((a, b) => a.text.localeCompare(b.text))

        const closerMap = new Map()
        val.forEach((item) => {
          if (item.結案人員 && !closerMap.has(item.結案人員)) {
            closerMap.set(item.結案人員, {
              text: `${item.RM59} ${item.結案人員}`,
              value: item.結案人員
            })
          }
        })
        this.advOpts.caseCloserOpts = [...closerMap.values()].sort((a, b) => a.text.localeCompare(b.text))

        this.advOpts.caseTakenDateOpts = [...new Set(val.map(item => this.takenDate(item)))].filter(Boolean).sort()
        this.advOpts.caseCloseDateOpts = [...new Set(val.map(item => this.$utils.addDateDivider(item.RM58_1)))].filter(Boolean).sort()
        this.advOpts.caseBorrowerOpts = [...new Set(val.map((item) => {
          const bid = this.borrower(item)
          return bid ? `${bid} ${this.userNames[bid]}` : ''
        }))].filter(Boolean).sort()
        this.advOpts.caseLentDateOpts = [...new Set(val.map((item) => {
          const d = this.lentDate(item)
          return d ? d.split('T')[0] : ''
        }))].filter(Boolean).sort()

        const setterMap = new Map()
        val.forEach((item) => {
          const setterId = item?.UNTAKEN_NOTE
          if (setterId && !setterMap.has(setterId)) {
            setterMap.set(setterId, {
              text: `${setterId} ${this.userNames[setterId] || ''}`.trim(),
              value: setterId
            })
          }
        })
        this.advOpts.caseSetterOpts = [...setterMap.values()].sort((a, b) => a.text.localeCompare(b.text))

        this.batchYearOpts = [...new Set(val.map(item => item.RM01))].filter(Boolean).sort()
        this.batchWordOpts = [...new Set(val.map(item => item.RM02))].filter(Boolean).sort()
      }
      this.calculateTableHeight()
    },
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期', { pos: 'tr' })
      }
    },
    batchYear () {
      this.prefillBatchStEdNumber()
    },
    batchWord () {
      this.prefillBatchStEdNumber()
    },
    batchNumS () {
      this.validateBatchRangeDebounced()
    },
    batchNumE () {
      this.validateBatchRangeDebounced()
    },
    batchReceiveStatus (newStatus) {
      if (this.$utils.empty(newStatus)) {
        this.$nextTick(() => {
          this.batchReceiveDate = ''
          this.batchReceiveTime = ''
        })
      }
      const today = new Date()
      this.batchReceiveDate = this.$utils.formatDate(today)
    },
    batchReceiveDate (val) {
      if (this.$utils.empty(val)) {
        this.batchReceiveTime = ''
      } else {
        this.batchReceiveTime = this.$utils.formatTime(new Date())
      }
    }
  },
  created () {
    this.validateBatchRangeDebounced = this.$utils.debounce(this.validateBatchRange, 1200)
  },
  mounted () {
    this.calculateTableHeight()
    window.addEventListener('resize', this.calculateTableHeight)
    window.addEventListener('keydown', this.handleGlobalKeyDown)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.calculateTableHeight)
    window.removeEventListener('keydown', this.handleGlobalKeyDown)
  },
  methods: {
    sortCompare (a, b, key) {
      if (key === 'parties') {
        const aVal = (a.權利人姓名 || a.RM19 || a.代理人姓名 || a.AB02 || '').toString()
        const bVal = (b.權利人姓名 || b.RM19 || b.代理人姓名 || b.AB02 || '').toString()
        return aVal.localeCompare(bVal, 'zh-Hant')
      }
      if (key === '收件字號') {
        const aVal = (a.ID || `${a.RM01}${a.RM02}${a.RM03}` || '').toString()
        const bVal = (b.ID || `${b.RM01}${b.RM02}${b.RM03}` || '').toString()
        return aVal.localeCompare(bVal)
      }
      return false
    },
    handleGlobalKeyDown (e) {
      const tag = e.target?.tagName?.toLowerCase()
      if (e.key === '/' && tag !== 'input' && tag !== 'textarea') {
        e.preventDefault()
        this.$refs.quickSearchInput?.focus()
      }
    },
    playDingSound () {
      if (!this.soundEnabled) { return }
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (!AudioContext) { return }
        const ctx = new AudioContext()
        const now = ctx.currentTime

        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(659.25, now) // E5
        osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.08) // E6
        gain.gain.setValueAtTime(0.18, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + 0.38)
      } catch (e) {
        // Audio error silently handled
      }
    },
    toggleSound () {
      this.soundEnabled = !this.soundEnabled
      this.notify(this.soundEnabled ? '已開啟發狀提示音效 🔔' : '已關閉發狀音效 🔕', { type: 'info' })
    },
    async handleQuickIssue (item) {
      if (this.isBusy) { return }
      const now = new Date()
      const payload = {
        id: item.ID,
        taken_date: now,
        taken_status: '已領件',
        borrower: item?.UNTAKEN_BORROWER || '',
        lent_date: item?.UNTAKEN_LENT_DATE || '',
        return_date: item?.UNTAKEN_RETURN_DATE || '',
        note: this.user.id
      }

      this.isBusy = true
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'upd_reg_cert_taken_date',
          ...payload
        })
        if (this.$utils.statusCheck(data.status)) {
          item.UNTAKEN_TAKEN_STATUS = '已領件'
          item.UNTAKEN_TAKEN_DATE = now.toISOString()
          item.UNTAKEN_NOTE = this.user.id
          this.todayIssuedCount++
          this.playDingSound()
          this.highlightedCaseId = item.ID
          this.notify(`已完成「${item.RM01}-${item.RM02}-${item.RM03}」發狀作業 🎉`, { type: 'success' })
          this.timeout(() => {
            if (this.highlightedCaseId === item.ID) {
              this.highlightedCaseId = ''
            }
          }, 3500)
        } else {
          this.alert(data.message || '發狀更新失敗', { title: item.收件字號, type: 'danger' })
        }
      } catch (err) {
        this.alert(err.message, { title: item.收件字號, type: 'danger' })
        this.$utils.error(err)
      } finally {
        this.isBusy = false
      }
    },
    onQuickSearchEnter () {
      if (this.filteredData.length === 1) {
        const target = this.filteredData[0]
        this.highlightAndPrompt(target)
      } else if (this.filteredData.length > 1) {
        const kw = this.quickSearchKeyword.trim().toUpperCase().replace(/[-]/g, '')
        const exact = this.filteredData.find(item => `${item.RM01}${item.RM02}${item.RM03}` === kw || item.RM03 === kw)
        if (exact) {
          this.highlightAndPrompt(exact)
        } else {
          this.notify(`找到 ${this.filteredData.length} 筆符合條件，請從列表點選`, { type: 'info' })
        }
      } else {
        this.notify('查無符合條件的案件', { type: 'warning' })
      }
    },
    highlightAndPrompt (targetCase) {
      this.highlightedCaseId = targetCase.ID
      if (this.statusLight(targetCase) === '🔴') {
        const titleStr = `${targetCase.RM01}-${targetCase.RM02}-${targetCase.RM03}`
        const pStr = `權利人：<strong>${targetCase.權利人姓名 || targetCase.RM19 || '-'}</strong><br>代理人：<strong>${targetCase.代理人姓名 || targetCase.AB02 || '-'}</strong>`
        this.confirm(`<p class="mb-2">已命中案件 <strong class="text-primary h5">${titleStr}</strong></p><p class="small text-muted mb-3">${pStr}</p><strong class="text-success h6">是否立即登記發狀（已領件）？</strong>`, {
          title: '⚡ 快速發狀確認'
        }).then((yn) => {
          if (yn) {
            this.handleQuickIssue(targetCase)
          }
        })
      } else {
        this.notify(`已定位案件 ${targetCase.RM01}-${targetCase.RM02}-${targetCase.RM03} (${this.statusText(targetCase)})`, { type: 'info' })
      }
    },
    filterByAgent (agentName) {
      if (!agentName) { return }
      this.quickSearchKeyword = agentName
      this.quickStatusFilter = '🔴'
      this.notify(`已為您速篩代理人「${agentName}」之未領案件`, { type: 'info' })
    },
    toggleSelectAllPage (checked) {
      const pageIds = this.currentPageItems.map(item => item.ID)
      if (checked) {
        this.selectedCaseIds = Array.from(new Set([...this.selectedCaseIds, ...pageIds]))
      } else {
        this.selectedCaseIds = this.selectedCaseIds.filter(id => !pageIds.includes(id))
      }
    },
    selectAllFiltered () {
      const allFilteredIds = this.filteredData.map(item => item.ID)
      this.selectedCaseIds = Array.from(new Set([...this.selectedCaseIds, ...allFilteredIds]))
      this.notify(`已全選過濾出的 ${this.selectedCaseIds.length} 筆案件`, { type: 'info' })
    },
    handleBatchIssueSelected () {
      const selectedItems = this.rows.filter(item => this.selectedCaseIds.includes(item.ID))
      if (selectedItems.length === 0) { return }

      this.confirm(`確定要將已勾選的 <strong class="text-danger h5">${selectedItems.length}</strong> 筆案件批次標記為「已領件」？`, {
        title: '⚡ 批次發狀確認'
      }).then(async (yn) => {
        if (!yn) { return }
        this.batchProcessing = true
        this.progress = 0
        this.progressMax = selectedItems.length

        let successCount = 0
        const now = new Date()
        for (const item of selectedItems) {
          this.progress++
          const payload = {
            id: item.ID,
            taken_date: now,
            taken_status: '已領件',
            borrower: item?.UNTAKEN_BORROWER || '',
            lent_date: item?.UNTAKEN_LENT_DATE || '',
            return_date: item?.UNTAKEN_RETURN_DATE || '',
            note: this.user.id
          }
          try {
            const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
              type: 'upd_reg_cert_taken_date',
              ...payload
            })
            if (this.$utils.statusCheck(data.status)) {
              item.UNTAKEN_TAKEN_STATUS = '已領件'
              item.UNTAKEN_TAKEN_DATE = now.toISOString()
              item.UNTAKEN_NOTE = this.user.id
              successCount++
            }
          } catch (e) {
            this.$utils.error(e)
          }
          await new Promise(resolve => setTimeout(resolve, 150))
        }

        this.batchProcessing = false
        this.todayIssuedCount += successCount
        this.playDingSound()
        this.success(`成功完成 ${successCount} 筆案件批次發狀 🎉`)

        this.confirm(`批次發狀已完成！是否立即開啟並列印這 <strong class="text-primary">${successCount}</strong> 筆案件之「領狀簽收清冊」？`, {
          title: '🖨️ 列印領狀簽收清單'
        }).then((printYn) => {
          if (printYn) {
            this.openSignPrintModal()
          } else {
            this.selectedCaseIds = []
          }
        })
      })
    },
    openSignPrintModal () {
      if (this.selectedCaseIds.length === 0) {
        this.notify('請先勾選欲列印簽收單之案件', { type: 'warning' })
        return
      }
      this.$refs.signPrintModal.show()
    },
    printSignSheet () {
      window.print()
    },
    openSingleDetail (item) {
      this.detailTargetCase = item
      this.detailForm = {
        id: item.ID,
        taken_status: item.UNTAKEN_TAKEN_STATUS || '',
        taken_date: item.UNTAKEN_TAKEN_DATE ? this.$utils.formatDate(new Date(item.UNTAKEN_TAKEN_DATE)) : '',
        taken_time: item.UNTAKEN_TAKEN_DATE ? this.$utils.formatTime(new Date(item.UNTAKEN_TAKEN_DATE)) : '',
        borrower: item.UNTAKEN_BORROWER || '',
        lent_date: item.UNTAKEN_LENT_DATE ? item.UNTAKEN_LENT_DATE.split('T')[0] : '',
        return_date: item.UNTAKEN_RETURN_DATE ? item.UNTAKEN_RETURN_DATE.split('T')[0] : '',
        note: item.UNTAKEN_NOTE || this.user.id
      }
      this.$refs.singleDetailModal.show()
    },
    onDetailStatusChange (val) {
      if (this.$utils.empty(val)) {
        this.detailForm.taken_date = ''
        this.detailForm.taken_time = ''
      } else if (this.$utils.empty(this.detailForm.taken_date)) {
        this.detailForm.taken_date = this.$utils.formatDate(new Date())
        this.detailForm.taken_time = this.$utils.formatTime(new Date())
      }
    },
    selectDetailStatus (val) {
      this.detailForm.taken_status = val
      this.onDetailStatusChange(val)
    },
    getStatusTagVariant (val) {
      const isSelected = this.detailForm.taken_status === val
      const item = this.statusTagList.find(opt => opt.value === val)
      if (!item) { return isSelected ? 'primary' : 'outline-secondary' }
      return isSelected ? item.activeVariant : item.idleVariant
    },
    setDetailTimeToNow () {
      this.detailForm.taken_time = this.$utils.formatTime(new Date())
    },
    openBorrowerSelect () {
      this.$refs.borrowerModal.show()
    },
    onBorrowerSelected (payload) {
      this.detailForm.borrower = payload.detail
      this.detailForm.lent_date = this.$utils.formatDate(new Date())
      this.detailForm.return_date = ''
      this.$refs.borrowerModal.hide()
    },
    onBorrowerClean () {
      this.confirm('確定要清除借閱人設定？', { title: '⚠ 清除借閱人' }).then((yn) => {
        if (!yn) { return }
        this.detailForm.borrower = ''
        this.detailForm.lent_date = ''
        this.detailForm.return_date = ''
        this.$refs.borrowerModal?.hide()
      })
    },
    async saveSingleDetail () {
      if (this.isBusy || !this.detailTargetCase) { return }
      const item = this.detailTargetCase
      let takenDate = ''
      if (!this.$utils.empty(this.detailForm.taken_status)) {
        if (!this.$utils.empty(this.detailForm.taken_date)) {
          const timeStr = this.detailForm.taken_time || this.$utils.formatTime(new Date())
          takenDate = new Date(`${this.detailForm.taken_date} ${timeStr}`)
        } else {
          takenDate = new Date()
        }
      }

      const payload = {
        id: item.ID,
        taken_date: this.$utils.isValidDateObject(takenDate) ? takenDate : '',
        taken_status: this.detailForm.taken_status || '',
        borrower: this.detailForm.borrower || '',
        lent_date: this.detailForm.lent_date || '',
        return_date: this.detailForm.return_date || '',
        note: this.$utils.empty(this.detailForm.taken_status) ? '' : (this.detailForm.note || this.user.id)
      }

      this.isBusy = true
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'upd_reg_cert_taken_date',
          ...payload
        })
        if (this.$utils.statusCheck(data.status)) {
          item.UNTAKEN_TAKEN_STATUS = payload.taken_status
          item.UNTAKEN_TAKEN_DATE = payload.taken_date ? (payload.taken_date instanceof Date ? payload.taken_date.toISOString() : payload.taken_date) : ''
          item.UNTAKEN_BORROWER = payload.borrower
          item.UNTAKEN_LENT_DATE = payload.lent_date
          item.UNTAKEN_RETURN_DATE = payload.return_date
          item.UNTAKEN_NOTE = payload.note

          if (payload.taken_status === '已領件') {
            this.todayIssuedCount++
            this.playDingSound()
          }
          this.notify(`「${item.RM01}-${item.RM02}-${item.RM03}」資料更新成功`, { type: 'success' })
          this.$refs.singleDetailModal.hide()
        } else {
          this.alert(data.message || '更新失敗', { title: item.收件字號 })
        }
      } catch (err) {
        this.alert(err.message, { title: item.收件字號 })
        this.$utils.error(err)
      } finally {
        this.isBusy = false
      }
    },
    formatLentDate (item) {
      const d = item?.UNTAKEN_LENT_DATE
      return d ? d.split('T')[0] : ''
    },
    getBorrowerDisplay (item) {
      const bid = item?.UNTAKEN_BORROWER
      if (!bid) { return '未記錄' }
      return `${this.userNames[bid] || bid}`
    },
    statusBadgeClass (item) {
      const light = this.statusLight(item)
      if (light === '🔴') { return 'badge-danger' }
      if (light === '🟡') { return 'badge-warning text-dark' }
      return 'badge-success'
    },
    rowClass (item, type) {
      if (!item || type !== 'row') { return '' }
      const classes = []
      if (this.highlightedCaseId === item.ID) {
        classes.push('highlight-case')
      }
      if (this.selectedCaseIds.includes(item.ID)) {
        classes.push('table-primary')
      }
      return classes.join(' ')
    },
    validateBatchRange () {
      this.batchMessage = ''
      const { batchNumS, batchNumE, batchYear, batchWord } = this
      const range = this.caseNumberRangeForBatch
      const orderValid = batchNumS <= batchNumE

      if (!this.$utils.empty(batchNumS) && !this.$utils.empty(batchNumE) && !orderValid) {
        this.batchMessage = `收件號起號 ${batchNumS} 不可大於迄號 ${batchNumE}`
        return
      }
      if (!this.$utils.empty(batchNumS) && this.isStartNumState === false) {
        this.batchMessage = `收件號起號 ${batchNumS} 超出 ${batchYear}-${batchWord} 的資料範圍 (${range.min} ~ ${range.max})`
        return
      }
      if (!this.$utils.empty(batchNumE) && this.isEndNumState === false) {
        this.batchMessage = `收件號迄號 ${batchNumE} 超出 ${batchYear}-${batchWord} 的資料範圍 (${range.min} ~ ${range.max})`
      }
    },
    formatCaseNumber (key) {
      const value = this[key]
      if (this.$utils.empty(value)) {
        return
      }
      const formatted = String(value).replace(/\D/g, '').substring(0, 6).padStart(6, '0')
      if (formatted !== value) {
        this[key] = formatted
      }
    },
    openBatchUpdateModal () {
      this.resetAdvSearch()
      this.batchYear = ''
      this.batchWord = ''
      this.batchNumS = ''
      this.batchNumE = ''
      this.batchReceiveStatus = ''
      this.batchReceiveDate = ''
      this.batchReceiveTime = ''
      this.batchMessage = ''
      if (this.batchYearOpts.length > 0) {
        const maxYear = Math.max(...this.batchYearOpts)
        this.batchYear = String(maxYear)
      }
      this.$refs.batchUpdateModal.show()
    },
    handleBatchUpdate () {
      if (this.isBatchFormInvalid) {
        this.batchMessage = '請填寫所有必填欄位或修正錯誤'
        return
      }
      this.batchMessage = ''

      if (this.batchCases.length === 0) {
        this.batchMessage = '在指定的區間內找不到任何案件可供更新'
        this.batchProcessing = false
        return
      }

      this.progressMax = this.batchCases.length
      this.confirm(`⚠ 請確認，此操作將一旦變更無法復原，共 <strong class="text-danger">${this.progressMax}</strong> 件待處理。`, { title: '批次變更領件狀態' }).then(async (YN) => {
        if (YN) {
          this.progress = 0
          this.batchProcessing = true
          try {
            for (let i = 0; i < this.batchCases.length; i++) {
              this.handleBatchSingleUpdate(this.batchCases[i])
              await new Promise(resolve => setTimeout(resolve, 250))
            }
            this.success(`成功更新 ${this.progress} / ${this.progressMax} 筆案件`)
          } catch (error) {
            this.$utils.error(error)
            this.alert('批次更新時發生錯誤', { title: '錯誤' })
          } finally {
            this.timeout(() => {
              this.batchProcessing = false
              this.progress = 0
              this.progressMax = 0
              this.$refs.batchUpdateModal.hide()
              this.reload()
            }, 2000)
          }
        }
      })
    },
    async handleBatchSingleUpdate (item) {
      this.progress++
      const takenDate = this.$utils.empty(this.batchReceiveStatus) ? null : new Date(`${this.batchReceiveDate} ${this.batchReceiveTime}`)
      const updateData = {
        id: item.ID,
        taken_date: this.$utils.isValidDateObject(takenDate) ? takenDate : '',
        taken_status: this.batchReceiveStatus || '',
        borrower: item?.UNTAKEN_BORROWER || '',
        lent_date: item?.UNTAKEN_LENT_DATE || '',
        return_date: item?.UNTAKEN_RETURN_DATE || '',
        note: this.$utils.empty(this.batchReceiveStatus) ? '' : this.user.id
      }
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'upd_reg_cert_taken_date',
          ...updateData
        })
        if (this.$utils.statusCheck(data.status)) {
          this.$utils.warn(`更新 ${item.ID} 資料成功`, updateData)
          return true
        } else {
          this.$utils.error(item.ID, data.message, updateData)
          return false
        }
      } catch (err) {
        this.alert(err.message, { title: item.收件字號 })
        this.$utils.error(err)
        return false
      }
    },
    prefillBatchStEdNumber () {
      this.batchNumS = this.caseNumberRangeForBatch.min || ''
      this.batchNumE = this.caseNumberRangeForBatch.max || ''
    },
    calculateTableHeight () {
      this.$nextTick(() => {
        const paginationEl = this.$refs.pagination?.$el
        if (paginationEl) {
          const rect = paginationEl.getBoundingClientRect()
          const viewportHeight = window.innerHeight
          const availableHeight = viewportHeight - rect.bottom
          const bottomOffset = 15
          const newMaxHeight = availableHeight - bottomOffset
          this.maxHeight = Math.max(200, newMaxHeight)
        }
      })
    },
    removeAdvTag (tagToRemove) {
      const { type, value } = tagToRemove
      if (this.advOpts[type] && Array.isArray(this.advOpts[type])) {
        const index = this.advOpts[type].indexOf(value)
        if (index > -1) {
          this.advOpts[type].splice(index, 1)
        }
      } else {
        this.advOpts[type] = ''
      }
    },
    resetAdvSearch () {
      this.advOpts = {
        ...this.advOpts,
        caseId: '',
        caseWord: [],
        caseReason: [],
        caseCloser: [],
        casePreliminator: [],
        caseLight: [],
        caseTakenDate: [],
        caseCloseDate: [],
        caseBorrower: [],
        caseLentDate: [],
        caseSetter: []
      }
      this.$nextTick(() => {
        this.timeout(this.calculateTableHeight, 800)
        this.pagination.currentPage = 1
      })
    },
    isCaseReturned (item) {
      return !this.$utils.empty(item?.UNTAKEN_RETURN_DATE)
    },
    formatReturnDate (item) {
      const d = item?.UNTAKEN_RETURN_DATE
      return d ? d.split('T')[0] : ''
    },
    statusLight (item) {
      if (!this.$utils.empty(item?.UNTAKEN_BORROWER) && this.$utils.empty(item?.UNTAKEN_RETURN_DATE)) {
        return '🟡'
      } else if (this.$utils.empty(item?.UNTAKEN_TAKEN_STATUS)) {
        return '🔴'
      }
      return '🟢'
    },
    statusText (item) {
      const light = this.statusLight(item)
      switch (light) {
        case '🟡':
          return '借閱中'
        case '🔴':
          return '未領件'
        default:
          return item.UNTAKEN_TAKEN_STATUS
      }
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
    takenDate (item) {
      const ts = Date.parse(item.UNTAKEN_TAKEN_DATE)
      return ts ? this.$utils.formatDate(new Date(ts)) : ''
    },
    takenTime (item) {
      const ts = Date.parse(item.UNTAKEN_TAKEN_DATE)
      return ts ? this.$utils.formatTime(new Date(ts)) : ''
    },
    borrower (item) {
      return item?.UNTAKEN_BORROWER || ''
    },
    lentDate (item) {
      return item?.UNTAKEN_LENT_DATE || ''
    }
  }
}
</script>

<style lang="scss" scoped>
.adv-tag-style {
  font-size: 0.95rem;
}
.tags-container {
  transition: max-height 0.25s ease-in-out;
}
.tags-container.tags-collapsed {
  max-height: 2.4rem;
  overflow: hidden;
}
::v-deep .modal-dialog.modal-lg {
  width: 685px;
}
::v-deep .form-control.is-valid {
  min-width: 130px;
}
.highlight-case {
  animation: glow-pulse 1.8s ease-in-out infinite alternate;
  background-color: #d4edda !important;
}

@keyframes glow-pulse {
  from {
    background-color: #d4edda;
  }
  to {
    background-color: #fff3cd;
  }
}

.status-tag-btn {
  font-size: 0.95rem;
  padding: 0.35rem 0.85rem;
  transition: all 0.18s ease-in-out;
  cursor: pointer;
  user-select: none;
  border-width: 1.5px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
  }
}
.modal-footer-btn {
  min-width: 105px;
  height: 38px;
}
.land-building-cell {
  font-size: 0.95rem;
  line-height: 1.4;
}

::v-deep .modal-datetime-group {
  .input-group-prepend .input-group-text {
    font-size: 0.85rem;
    font-weight: 500;
    background-color: #f8f9fa;
    color: #495057;
    min-width: 80px;
    justify-content: center;
  }
  > input.form-control {
    font-size: 0.875rem;
  }
  > .b-form-datepicker {
    > label.form-control {
      font-size: 0.875rem;
      color: #333;
      white-space: nowrap;
    }
  }
  > .input-group-append > .btn {
    font-size: 0.85rem;
    display: flex;
    align-items: center;
  }
}

// Print Styles for Sign Sheet
@media print {
  /* Hide all non-printable elements */
  header, footer, nav, .lah-header, .btn, .b-pagination, .custom-control, .no-print, .modal-backdrop, .modal-header {
    display: none !important;
  }
  body {
    background: #fff !important;
    color: #000 !important;
    font-size: 11pt !important;
  }
  .sign-sheet-paper {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    margin: 0 !important;
    padding: 15mm !important;
    border: none !important;
    box-shadow: none !important;
    z-index: 999999 !important;
    background: #fff !important;
  }
  .sign-table {
    width: 100% !important;
    border-collapse: collapse !important;
  }
  .sign-table th, .sign-table td {
    border: 1px solid #333 !important;
    padding: 5px 6px !important;
    font-size: 10pt !important;
  }
  .sign-footer {
    margin-top: 35px !important;
    page-break-inside: avoid;
  }
}
</style>
