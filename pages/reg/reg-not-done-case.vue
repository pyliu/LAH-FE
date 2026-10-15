<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.align-items-center.w-100
      .d-flex.align-items-center.header-left-group
        .my-auto.font-weight-bold.h3.mb-0 辦畢通知控管
        b-badge.ml-2.align-self-center(variant="primary" pill style="font-size: 0.95rem; padding: 0.4em 0.8em;") 初審人員專用
        lah-button(
          icon="info"
          action="bounce"
          variant="outline-success"
          size="lg"
          no-border
          no-icon-gutter
          @click="showModalById('help-modal')"
          title="功能說明與快捷指引"
        )
        lah-help-modal(:modal-id="'help-modal'" size="lg" modal-title="辦畢通知控管操作說明")
          h5.d-flex.align-items-center
            lah-fa-icon(icon="user-shield" variant="primary")
            span.ml-2 初審人員專屬功能
          ul
            li #[strong 「只看我的初審案件」快速切換]：一鍵過濾出目前登入者負責初審之登記案件，免除繁瑣篩選。
            li #[strong 狀態指標膠囊列 (KPI Dashboard Bar)]：即時彙整案件總數、需通知、待補公文號、免通知與個人案件數，#[strong 點擊按鈕可秒速切換過濾]。
            li #[strong 常見需通知快篩]：一鍵快速過濾「跨所案件」、「塗銷登記」、「書狀補給」、「第一次登記」等實務常需通知之案件。
          hr
          h5.d-flex.align-items-center
            lah-fa-icon(icon="tasks" variant="success")
            span.ml-2 批次管理作業
          ul
            li 表格左側提供多選核取方塊，勾選後上方會彈出 #[strong 批次管理工具列]。
            li 支援 #[strong 批次設為「需通知」] 或 #[strong 「不需通知」]。
            li 支援 #[strong 批次填入公文文號]，可選擇「全部套用同一文號」或「由起始文號連號遞增 (+1)」。
          hr
          h5.d-flex.align-items-center
            lah-fa-icon(icon="file-signature" variant="info")
            span.ml-2 表格內智慧填寫與小工具
          ul
            li #[strong 公文文號 (12碼)]：輸入時具備即時字數計數、合規勾勾提示與缺號橘色警示。
            li #[strong 智慧按鈕]：提供「同上」（帶入上一筆文號）、「+1」（自動遞增連號）與「年份前綴快填」。
            li #[strong 快速複製]：點擊收件號或電話旁的 #[lah-fa-icon(icon="copy" regular variant="secondary")] 按鈕即可一鍵複製至剪貼簿。
            li #[strong 地政WebAP外連]：點擊 #[lah-fa-icon(icon="external-link-alt" variant="primary")] 可快速另開視窗查看案件辦理流程。
          hr
          h5.d-flex.align-items-center
            lah-fa-icon(icon="filter" variant="secondary")
            span.ml-2 搜尋與匯出
          ul
            li 支援上方快速日期切換（今日、近3天、近一週、近一月、近三月）。
            li 即時搜尋列支援快速打字過濾（收件號、字號、姓名、電話、登記原因、公文號等）。
            li 可匯出已篩選資料為 Excel (XLSX) 報表。

      .d-flex.align-items-center.header-right-group
        //- Quick Date Preset Buttons
        b-button-group.mr-2
          b-button(
            v-for="preset in datePresets"
            :key="preset.id"
            :variant="activeDatePreset === preset.id ? 'primary' : 'outline-secondary'"
            :disabled="isBusy"
            @click="applyDatePreset(preset.id)"
            :title="preset.title"
          ) {{ preset.label }}

        lah-datepicker.mr-1(ref="datepicker" v-model="dateRange" size="lg")

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
          header="辦畢通知控管"
          size="lg"
          :disabled="!dataReady"
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

  //- Compact KPI & Quick Filter Dashboard Bar
  lah-transition(appear)
    .d-flex.justify-content-between.align-items-center.flex-wrap.px-1.my-1.compact-dashboard-bar(v-if="dataReady")
      //- Left Side: Compact KPI Status Button Group
      .d-flex.align-items-center.flex-wrap.my-1.mr-2
        span.small.font-weight-bold.text-muted.mr-2
          lah-fa-icon.mr-1(icon="tachometer-alt" variant="primary")
          | 狀態總覽：
        b-button-group(size="sm")
          //- 1. 全部案件
          b-button(
            :variant="quickStatusFilter === 'all' && !onlyMyCases ? 'primary' : 'outline-primary'"
            @click="setQuickFilter('all')"
            :title="`點擊顯示全部案件 (共 ${stats.total} 筆結案)`"
          )
            lah-fa-icon.mr-1(icon="folder-open")
            | 全部
            b-badge.ml-1(
              :variant="quickStatusFilter === 'all' && !onlyMyCases ? 'light' : 'primary'"
              pill
            ) {{ stats.total }}

          //- 2. 需辦畢通知
          b-button(
            :variant="quickStatusFilter === 'need' ? 'info' : 'outline-info'"
            @click="setQuickFilter('need')"
            :title="`點擊篩選需通知案件 (共 ${stats.needNotify} 筆，佔 ${stats.needNotifyPct}%)`"
          )
            lah-fa-icon.mr-1(icon="bullhorn")
            | 需通知
            b-badge.ml-1(
              :variant="quickStatusFilter === 'need' ? 'light' : 'info'"
              pill
            ) {{ stats.needNotify }}

          //- 3. 待補公文號 (警示色)
          b-button(
            :variant="quickStatusFilter === 'missing' ? 'warning' : (stats.missingNote > 0 ? 'outline-danger' : 'outline-secondary')"
            @click="setQuickFilter('missing')"
            :title="stats.missingNote > 0 ? `⚠️ 尚有 ${stats.missingNote} 筆需通知案件缺12碼公文文號！` : '✔ 需通知案件之公文號皆已完備'"
          )
            lah-fa-icon.mr-1(
              icon="exclamation-triangle"
              :action="stats.missingNote > 0 ? 'bounce' : ''"
              :variant="quickStatusFilter === 'missing' ? 'dark' : (stats.missingNote > 0 ? 'danger' : 'secondary')"
            )
            | 待補文號
            b-badge.ml-1(
              :variant="quickStatusFilter === 'missing' ? 'dark' : (stats.missingNote > 0 ? 'danger' : 'secondary')"
              pill
            ) {{ stats.missingNote }}

          //- 4. 無需通知
          b-button(
            :variant="quickStatusFilter === 'none' ? 'success' : 'outline-success'"
            @click="setQuickFilter('none')"
            :title="`點擊篩選無需通知案件 (共 ${stats.noNotify} 筆，佔 ${stats.noNotifyPct}%)`"
          )
            lah-fa-icon.mr-1(icon="check-circle")
            | 免通知
            b-badge.ml-1(
              :variant="quickStatusFilter === 'none' ? 'light' : 'success'"
              pill
            ) {{ stats.noNotify }}

          //- 5. 我的初審案件
          b-button(
            :variant="onlyMyCases ? 'dark' : 'outline-dark'"
            @click="toggleOnlyMyCases"
            :title="`點擊切換只看我的案件：${currentStaffName} (共 ${stats.myCases} 筆，佔 ${stats.myCasesPct}%)`"
          )
            lah-fa-icon.mr-1(icon="user-check")
            | 我的初審
            b-badge.ml-1(
              :variant="onlyMyCases ? 'light' : 'dark'"
              pill
            ) {{ stats.myCases }}

      //- Right Side: Smart Category Notification Presets
      .d-flex.align-items-center.flex-wrap.my-1
        span.small.font-weight-bold.text-muted.mr-2
          lah-fa-icon.mr-1(icon="lightbulb" variant="warning")
          | 常見快篩：
        b-button-group.mr-2(size="sm")
          b-button(
            :variant="smartCategory === 'crossOffice' ? 'info' : 'outline-info'"
            @click="toggleSmartCategory('crossOffice')"
            title="篩選跨所登記案件 (RM99=Y)"
          )
            lah-fa-icon.mr-1(icon="building")
            | 跨所 ({{ smartStats.crossOffice }})
          b-button(
            :variant="smartCategory === 'cancellation' ? 'warning' : 'outline-warning'"
            @click="toggleSmartCategory('cancellation')"
            title="篩選登記原因含「塗銷」案件"
          )
            lah-fa-icon.mr-1(icon="file-signature")
            | 塗銷 ({{ smartStats.cancellation }})
          b-button(
            :variant="smartCategory === 'replacement' ? 'secondary' : 'outline-secondary'"
            @click="toggleSmartCategory('replacement')"
            title="篩選登記原因含「書狀補給」案件"
          )
            lah-fa-icon.mr-1(icon="certificate")
            | 補給 ({{ smartStats.replacement }})
          b-button(
            :variant="smartCategory === 'firstReg' ? 'dark' : 'outline-dark'"
            @click="toggleSmartCategory('firstReg')"
            title="篩選登記原因含「第一次」案件"
          )
            lah-fa-icon.mr-1(icon="landmark")
            | 第一次 ({{ smartStats.firstReg }})
          b-button(
            :variant="smartCategory === 'allSuggested' ? 'primary' : 'outline-primary'"
            @click="toggleSmartCategory('allSuggested')"
            title="篩選所有符合上述常見需通知條件之案件"
          )
            lah-fa-icon.mr-1(icon="magic")
            | 全部建議 ({{ smartStats.allSuggested }})
        b-button(
          v-if="smartCategory"
          variant="link"
          size="sm"
          class="text-muted p-0 my-1"
          @click="smartCategory = ''"
          title="清除常見快篩"
        ) 清除快篩

  //- Interactive Quick Search & Action Bar
  lah-transition(appear)
    .d-flex.justify-content-between.align-items-center.flex-wrap.px-1.mb-2(v-if="dataReady")
      //- Left side: Active Filter Tags
      .d-flex.align-items-center.flex-wrap.my-1.mr-2(style="flex: 1 1 auto; min-width: 0;")
        .tags-container(
          v-if="advTags.length > 0"
          ref="tagsContainer"
          :class="{ 'tags-collapsed': !tagsExpanded }"
        )
          b-tag.mr-1.my-1(
            v-for="(tag, index) in advTags"
            :key="`${tag.key}-${tag.value}-${index}`"
            :variant="tag.variant"
            @remove="removeAdvTag(tag)"
            pill
            removable
          ) {{ tag.text }}
        lah-button(
          v-if="advTags.length > 0 && showTagsToggle"
          :icon="tagsExpanded ? 'angle-double-up' : 'angle-double-down'"
          variant="link"
          size="sm"
          @click="tagsExpanded = !tagsExpanded"
          :title="tagsExpanded ? '收合篩選條件' : '顯示所有篩選條件'"
          no-icon-gutter
        )

      //- Right side: KEYWORD => 進階篩選 => 清除篩選
      .d-flex.align-items-center.flex-wrap.my-1.ml-auto
        //- 1. Quick keyword search
        b-input-group.mr-2(size="sm" style="width: 320px;")
          template(#prepend)
            b-input-group-text: lah-fa-icon(icon="search" size="sm")
          b-input(
            v-model="quickKeyword"
            placeholder="關鍵字：字、號、人名、原因、住址、文號..."
            trim
            debounce="300"
          )
          template(#append v-if="quickKeyword")
            b-button(variant="outline-secondary" size="sm" @click="quickKeyword = ''" title="清除關鍵字") ✕

        //- 2. Advanced Search Button
        lah-button.mr-2(
          icon="search-plus",
          size="sm",
          title="開啟完整進階篩選",
          @click="$refs.searchPlus.show()",
          :disabled="!dataReady"
        ) 進階篩選

        //- 3. Reset All Filters Button
        b-button(
          v-if="hasActiveFilters"
          variant="outline-danger"
          size="sm"
          @click="resetAllFilters"
          title="重設所有過濾條件"
        )
          lah-fa-icon.mr-1(icon="redo-alt" size="xs")
          | 清除所有篩選

  //- Batch Action Floating Toolbar
  lah-transition(appear)
    .batch-toolbar.card.border-primary.shadow-sm.mb-2.p-2.bg-light(v-if="selectedRows.length > 0")
      .d-flex.justify-content-between.align-items-center.flex-wrap
        .d-flex.align-items-center.mr-3.my-1
          b-badge.mr-2.p-2(variant="primary")
            lah-fa-icon.mr-1(icon="check-square")
            | 已選取 {{ selectedRows.length }} 筆案件
          small.text-muted 可對已勾選案件執行批次設定：

        .d-flex.align-items-center.flex-wrap.my-1
          b-button.mr-1.my-1(
            variant="outline-info"
            size="sm"
            @click="openBatchModal('need')"
            :disabled="batchUpdating"
          )
            lah-fa-icon.mr-1(icon="bullhorn")
            | 批次設為「需通知」

          b-button.mr-1.my-1(
            variant="outline-success"
            size="sm"
            @click="batchSetNoNotify"
            :disabled="batchUpdating"
          )
            lah-fa-icon.mr-1(icon="check-circle")
            | 批次設為「不需通知」

          b-button.mr-1.my-1(
            variant="outline-primary"
            size="sm"
            @click="openBatchModal('noteOnly')"
            :disabled="batchUpdating"
          )
            lah-fa-icon.mr-1(icon="file-signature")
            | 批次填公文文號

          b-button.mr-1.my-1(
            variant="outline-secondary"
            size="sm"
            @click="batchClearNote"
            :disabled="batchUpdating"
          )
            lah-fa-icon.mr-1(icon="eraser")
            | 批次清空文號

          b-button.my-1(
            variant="light"
            size="sm"
            @click="clearSelection"
            :disabled="batchUpdating"
          ) 取消勾選

  lah-pagination(
    v-model="pagination"
    :total-rows="filterDataCount"
    :caption="foundText"
  )

  lah-transition: b-table.text-center.align-middle(
    v-if="committed"
    id="land-ref-table"
    ref="table"
    caption-top
    selectable
    select-mode="single"
    selected-variant="info"
    :sticky-header="`${maxHeight}px`"
    :busy="isBusy"
    :items="currentPageItems"
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
  )
    template(#table-busy): span.ld-txt 讀取中...

    //- Selection Master Checkbox in Header
    template(#head(selection))
      b-form-checkbox(
        :checked="isAllCurrentPageSelected"
        :indeterminate="isCurrentPageIndeterminate"
        @change="toggleSelectCurrentPage"
        title="全選 / 取消全選本頁案件"
      )

    //- Selection Checkbox in Cell
    template(#cell(selection)="{ item }")
      b-form-checkbox(
        :checked="isRowSelected(item)"
        @change="toggleRowSelect(item)"
        title="勾選此案件"
      )

    template(v-slot:cell(#)="{ item, index, rowSelected }")
      template(v-if="rowSelected")
        span.text-primary(aria-hidden="true") &check;
        span.sr-only 勾選
      template(v-else)
        span(aria-hidden="true") &nbsp;
        span.sr-only 無勾選
      span {{ index + 1 + (pagination.currentPage - 1) * pagination.perPage }}

    template(#cell(customize)="{ item, index }")
      lah-reg-case-notify(
        :case-id="`${item.ID}`"
        :parent-data="item"
        :prev-note="getPrevNote(index)"
        @updated="onNotifyUpdated"
      )

    template(#cell(收件字號)="{ item }")
      .align-middle.text-nowrap
        b-link(
          @click="popup(item)"
          :title="`查看 ${item.收件字號} 詳情`"
          v-html="highlight(`${item.RM01}-${item.RM02}-${item.RM03}`)"
        ).font-weight-bold
        b-button-group.ml-1(size="sm")
          b-button(
            variant="link"
            size="sm"
            class="p-0 text-muted btn-icon-tool"
            @click="copyCaseId(item, 'hyphen')"
            title="複製收件字號 (115-HA81-164361)"
          )
            lah-fa-icon(icon="copy" regular size="sm")
          b-button(
            variant="link"
            size="sm"
            class="p-0 text-info btn-icon-tool ml-1"
            @click="openWebAp(item)"
            title="另開地政WebAP查詢案件辦理流程"
          )
            lah-fa-icon(icon="external-link-alt" size="sm")

    template(#cell(收件日期)="{ item }")
      .text-nowrap(v-html="highlight(item.收件日期)")

    template(#cell(預定結案日期)="{ item }")
      .text-nowrap(v-html="highlight(item.預定結案日期 ? item.預定結案日期.split(' ')[0] : '')")

    template(#cell(RM09)="{ item }")
      .text-nowrap
        span(v-html="highlight(`${item.RM09}:${item.登記原因}`)")
        b-badge.ml-1(
          v-if="item.RM99 === 'Y'"
          variant="info"
          pill
          title="此案為跨所案件，建議確認是否需辦畢通知"
        ) 跨所
        b-badge.ml-1(
          v-if="isCancellationCase(item)"
          variant="warning"
          pill
          title="此案為塗銷登記，建議確認是否需辦畢通知"
        ) 塗銷
        b-badge.ml-1(
          v-if="isReplacementCase(item)"
          variant="secondary"
          pill
          title="此案為書狀補給，建議確認是否需辦畢通知"
        ) 書狀補給
        b-badge.ml-1(
          v-if="isFirstRegCase(item)"
          variant="dark"
          pill
          title="此案為第一次登記，建議確認是否需辦畢通知"
        ) 第一次

    template(#cell(辦理情形)="{ item }")
      .text-nowrap(v-html="highlight(`${item.RM30}:${item.辦理情形}`)")

    template(#cell(初審人員)="{ item }")
      .text-nowrap
        span(v-html="highlight(item.初審人員)")
        b-badge.ml-1(v-if="isMyCase(item)" variant="success" pill title="您為此案件初審人員") 我 ⭐

    template(#cell(複審人員)="{ item }")
      .text-nowrap(v-html="highlight(item.複審人員)")

    template(#cell(代理人姓名)="{ item }")
      .text-nowrap
        span(v-html="highlight(item.代理人姓名)")
        b-button(
          v-if="item.代理人姓名"
          variant="link"
          size="sm"
          class="p-0 text-muted btn-icon-tool ml-1"
          @click="copyText(item.代理人姓名, `已複製代理人姓名：${item.代理人姓名}`)"
          title="複製代理人姓名"
        )
          lah-fa-icon(icon="copy" regular size="xs")

    template(#cell(代理人電話)="{ item }")
      .text-nowrap
        span(v-html="highlight(item.代理人電話)")
        b-button(
          v-if="item.代理人電話"
          variant="link"
          size="sm"
          class="p-0 text-muted btn-icon-tool ml-1"
          @click="copyText(item.代理人電話, `已複製電話：${item.代理人電話}`)"
          title="複製電話號碼"
        )
          lah-fa-icon(icon="phone" size="xs")

    template(#cell(代理人住址)="{ item }")
      .text-truncate(style="max-width: 180px;" :title="item.代理人住址" v-html="highlight(item.代理人住址)")

  //- Case Detail Modal
  b-modal(
    ref="caseDetail"
    size="xl"
    hide-footer
    centered
    no-close-on-backdrop
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ $utils.caseId(clickedData ? clickedData.ID : '') }}
    h4.text-center.text-info.my-5(v-if="modalLoading")
      b-spinner.my-auto(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(@ready="modalLoading = !$event.detail" :parent-data="clickedData")

  //- Batch Document Settings Modal
  b-modal(
    ref="batchDocModal"
    :title="batchModalTitle"
    hide-footer
    centered
  )
    .p-2
      .alert.alert-info.py-2.small
        lah-fa-icon.mr-1(icon="info-circle")
        | 即將套用至已勾選的 #[strong {{ selectedRows.length }}] 筆登記案件。

      b-form-group(label="辦畢通知狀態：" label-class="font-weight-bold")
        b-form-radio-group(
          v-model="batchForm.authority"
          :options="[ { text: '📢 設為「需要通知」(authority = 1)', value: 1 }, { text: '⚪ 設為「不需通知」(authority = 0)', value: 0 } ]"
          stacked
        )

      b-form-group(
        v-if="batchForm.authority === 1"
        label="公文文號 (12碼數字)："
        label-class="font-weight-bold"
      )
        b-input(
          v-model="batchForm.baseNote"
          placeholder="請輸入12碼起始公文文號 (例如 115000000001)"
          maxlength="12"
          trim
          :state="batchNoteState"
        )
        b-form-invalid-feedback 請輸入完整的12碼數字文號

      b-form-group(
        v-if="batchForm.authority === 1"
        label="文號套用規則："
        label-class="font-weight-bold"
      )
        b-form-radio-group(
          v-model="batchForm.noteMode"
          :options="[ { text: '所有選取案件套用「同一個公文文號」', value: 'same' }, { text: '由起始文號「自動連號遞增 (+1)」套用', value: 'increment' } ]"
          stacked
        )

      b-progress.my-3(
        v-if="batchUpdating"
        :value="batchProgress"
        :max="batchTotal"
        show-progress
        animated
        variant="primary"
      )

      .d-flex.justify-content-end.mt-3
        b-button.mr-2(variant="secondary" @click="$refs.batchDocModal.hide()" :disabled="batchUpdating") 取消
        b-button(
          variant="primary"
          @click="executeBatchSubmit"
          :disabled="batchUpdating || (batchForm.authority === 1 && !isBatchNoteValid)"
        )
          lah-fa-icon.mr-1(v-if="batchUpdating" icon="spinner" action="spin")
          | 確認批次套用 ({{ selectedRows.length }} 筆)

  //- Advanced Search Modal (Modernized)
  b-modal(
    ref="searchPlus"
    size="lg"
    centered
    scrollable
    title="進階篩選"
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon(icon="filter" variant="primary")
        span.ml-2.font-weight-bold 進階條件篩選
        b-badge.ml-2(v-if="advTags.length > 0" variant="primary" pill) 已設定 {{ advTags.length }} 項條件

    .container-fluid.p-0
      //- Case Number Input Card
      .filter-card.p-2.rounded.border.bg-white.mb-2
        .d-flex.justify-content-between.align-items-center.mb-1
          span.font-weight-bold.small
            lah-fa-icon.mr-1(icon="hashtag" variant="secondary")
            | 收件號碼 (單號或區間)
          b-button(
            v-if="advOpts.caseNum"
            variant="link"
            size="sm"
            class="p-0 text-muted btn-micro"
            @click="advOpts.caseNum = ''"
          ) 清除
        b-input(
          v-model="advOpts.caseNum"
          size="sm"
          placeholder="例如輸入 200 或區間 200-900"
          trim
        )

      //- 2-Column Responsive Filter Grid
      .row.no-gutters
        //- 1. 辦畢通知狀態
        .col-12.col-md-6.p-1
          .filter-card.p-2.rounded.border.bg-white.h-100
            .d-flex.justify-content-between.align-items-center.mb-1
              span.font-weight-bold.small
                lah-fa-icon.mr-1(icon="bullhorn" variant="info")
                | 辦畢通知狀態
              .d-flex.align-items-center
                b-badge.mr-1(v-if="advOpts.caseNotify.length > 0" variant="info" pill) {{ advOpts.caseNotify.length }}
                b-button(
                  v-if="advOpts.caseNotify.length > 0"
                  variant="link"
                  size="sm"
                  class="p-0 text-muted btn-micro"
                  @click="clearGroup('caseNotify')"
                ) 清空
            .filter-checkbox-list
              b-form-checkbox-group(
                v-model="advOpts.caseNotify"
                :options="advOpts.caseNotifyOpts"
                stacked
                size="sm"
              )

        //- 2. 初審人員
        .col-12.col-md-6.p-1
          .filter-card.p-2.rounded.border.bg-white.h-100
            .d-flex.justify-content-between.align-items-center.mb-1
              span.font-weight-bold.small
                lah-fa-icon.mr-1(icon="user-shield" variant="primary")
                | 初審人員
              .d-flex.align-items-center
                b-badge.mr-1(v-if="advOpts.casePreliminator.length > 0" variant="primary" pill) {{ advOpts.casePreliminator.length }}
                b-button(
                  variant="link"
                  size="sm"
                  class="p-0 text-primary btn-micro mr-1 font-weight-bold"
                  @click="selectMyselfPreliminator"
                  title="一鍵選取我自己的初審案件"
                ) 👤 選自己
                span.text-muted.mr-1 |
                b-button(variant="link" size="sm" class="p-0 text-muted btn-micro mr-1" @click="selectAllGroup('casePreliminator', advOpts.casePreliminatorOpts)") 全選
                span.text-muted.mr-1 |
                b-button(variant="link" size="sm" class="p-0 text-muted btn-micro" @click="clearGroup('casePreliminator')") 清空
            b-input.mb-1(
              v-model="advSearchKeywords.casePreliminator"
              size="sm"
              placeholder="🔍 快速搜尋初審人員..."
              trim
              debounce="200"
              class="filter-subsearch"
            )
            .filter-checkbox-list
              b-form-checkbox-group(
                v-model="advOpts.casePreliminator"
                :options="filteredCasePreliminatorOpts"
                stacked
                size="sm"
              )
              .small.text-muted.text-center.py-2(v-if="filteredCasePreliminatorOpts.length === 0") 無符合人員

        //- 3. 收件字
        .col-12.col-md-6.p-1
          .filter-card.p-2.rounded.border.bg-white.h-100
            .d-flex.justify-content-between.align-items-center.mb-1
              span.font-weight-bold.small
                lah-fa-icon.mr-1(icon="font" variant="secondary")
                | 收件字
              .d-flex.align-items-center
                b-badge.mr-1(v-if="advOpts.caseWord.length > 0" variant="secondary" pill) {{ advOpts.caseWord.length }}
                b-button(variant="link" size="sm" class="p-0 text-muted btn-micro mr-1" @click="selectAllGroup('caseWord', advOpts.caseWordOpts)") 全選
                span.text-muted.mr-1 |
                b-button(variant="link" size="sm" class="p-0 text-muted btn-micro" @click="clearGroup('caseWord')") 清空
            b-input.mb-1(
              v-model="advSearchKeywords.caseWord"
              size="sm"
              placeholder="🔍 快速搜尋字軌 (如 HA81)..."
              trim
              debounce="200"
              class="filter-subsearch"
            )
            .filter-checkbox-list
              b-form-checkbox-group(
                v-model="advOpts.caseWord"
                :options="filteredCaseWordOpts"
                stacked
                size="sm"
              )
              .small.text-muted.text-center.py-2(v-if="filteredCaseWordOpts.length === 0") 無符合字軌

        //- 4. 登記原因
        .col-12.col-md-6.p-1
          .filter-card.p-2.rounded.border.bg-white.h-100
            .d-flex.justify-content-between.align-items-center.mb-1
              span.font-weight-bold.small
                lah-fa-icon.mr-1(icon="tag" variant="success")
                | 登記原因
              .d-flex.align-items-center
                b-badge.mr-1(v-if="advOpts.caseReason.length > 0" variant="success" pill) {{ advOpts.caseReason.length }}
                b-button(variant="link" size="sm" class="p-0 text-muted btn-micro mr-1" @click="selectAllGroup('caseReason', advOpts.caseReasonOpts)") 全選
                span.text-muted.mr-1 |
                b-button(variant="link" size="sm" class="p-0 text-muted btn-micro" @click="clearGroup('caseReason')") 清空
            b-input.mb-1(
              v-model="advSearchKeywords.caseReason"
              size="sm"
              placeholder="🔍 快速搜尋原因 (如 買賣、塗銷)..."
              trim
              debounce="200"
              class="filter-subsearch"
            )
            .filter-checkbox-list
              b-form-checkbox-group(
                v-model="advOpts.caseReason"
                :options="filteredCaseReasonOpts"
                stacked
                size="sm"
              )
              .small.text-muted.text-center.py-2(v-if="filteredCaseReasonOpts.length === 0") 無符合登記原因

        //- 5. 辦理情形
        .col-12.col-md-6.p-1
          .filter-card.p-2.rounded.border.bg-white.h-100
            .d-flex.justify-content-between.align-items-center.mb-1
              span.font-weight-bold.small
                lah-fa-icon.mr-1(icon="info-circle" variant="info")
                | 辦理情形
              .d-flex.align-items-center
                b-badge.mr-1(v-if="advOpts.caseState.length > 0" variant="info" pill) {{ advOpts.caseState.length }}
                b-button(variant="link" size="sm" class="p-0 text-muted btn-micro mr-1" @click="selectAllGroup('caseState', advOpts.caseStateOpts)") 全選
                span.text-muted.mr-1 |
                b-button(variant="link" size="sm" class="p-0 text-muted btn-micro" @click="clearGroup('caseState')") 清空
            .filter-checkbox-list
              b-form-checkbox-group(
                v-model="advOpts.caseState"
                :options="advOpts.caseStateOpts"
                stacked
                size="sm"
              )

        //- 6. 複審人員
        .col-12.col-md-6.p-1
          .filter-card.p-2.rounded.border.bg-white.h-100
            .d-flex.justify-content-between.align-items-center.mb-1
              span.font-weight-bold.small
                lah-fa-icon.mr-1(icon="user-tie" variant="secondary")
                | 複審人員
              .d-flex.align-items-center
                b-badge.mr-1(v-if="advOpts.caseReviewer.length > 0" variant="secondary" pill) {{ advOpts.caseReviewer.length }}
                b-button(variant="link" size="sm" class="p-0 text-muted btn-micro mr-1" @click="selectAllGroup('caseReviewer', advOpts.caseReviewerOpts)") 全選
                span.text-muted.mr-1 |
                b-button(variant="link" size="sm" class="p-0 text-muted btn-micro" @click="clearGroup('caseReviewer')") 清空
            b-input.mb-1(
              v-model="advSearchKeywords.caseReviewer"
              size="sm"
              placeholder="🔍 快速搜尋複審人員..."
              trim
              debounce="200"
              class="filter-subsearch"
            )
            .filter-checkbox-list
              b-form-checkbox-group(
                v-model="advOpts.caseReviewer"
                :options="filteredCaseReviewerOpts"
                stacked
                size="sm"
              )
              .small.text-muted.text-center.py-2(v-if="filteredCaseReviewerOpts.length === 0") 無符合人員

        //- 7. 代理人姓名
        .col-12.col-md-6.p-1
          .filter-card.p-2.rounded.border.bg-white.h-100
            .d-flex.justify-content-between.align-items-center.mb-1
              span.font-weight-bold.small
                lah-fa-icon.mr-1(icon="id-badge" variant="danger")
                | 代理人姓名
              .d-flex.align-items-center
                b-badge.mr-1(v-if="advOpts.proxyName.length > 0" variant="danger" pill) {{ advOpts.proxyName.length }}
                b-button(
                  v-if="advOpts.proxyName.length > 0"
                  variant="link"
                  size="sm"
                  class="p-0 text-muted btn-micro"
                  @click="clearGroup('proxyName')"
                ) 清空
            b-input.mb-1(
              v-model="advSearchKeywords.proxyName"
              size="sm"
              placeholder="🔍 快速搜尋代理人姓名..."
              trim
              debounce="200"
              class="filter-subsearch"
            )
            .filter-checkbox-list
              b-form-checkbox-group(
                v-model="advOpts.proxyName"
                :options="filteredProxyNameOpts"
                stacked
                size="sm"
              )
              .small.text-muted.text-center.py-2(v-if="filteredProxyNameOpts.length === 0") 無符合姓名

        //- 8. 代理人統編
        .col-12.col-md-6.p-1
          .filter-card.p-2.rounded.border.bg-white.h-100
            .d-flex.justify-content-between.align-items-center.mb-1
              span.font-weight-bold.small
                lah-fa-icon.mr-1(icon="credit-card" variant="secondary")
                | 代理人統編
              .d-flex.align-items-center
                b-badge.mr-1(v-if="advOpts.proxyId.length > 0" variant="secondary" pill) {{ advOpts.proxyId.length }}
                b-button(
                  v-if="advOpts.proxyId.length > 0"
                  variant="link"
                  size="sm"
                  class="p-0 text-muted btn-micro"
                  @click="clearGroup('proxyId')"
                ) 清空
            b-input.mb-1(
              v-model="advSearchKeywords.proxyId"
              size="sm"
              placeholder="🔍 快速搜尋統一編號..."
              trim
              debounce="200"
              class="filter-subsearch"
            )
            .filter-checkbox-list
              b-form-checkbox-group(
                v-model="advOpts.proxyId"
                :options="filteredProxyIdOpts"
                stacked
                size="sm"
              )
              .small.text-muted.text-center.py-2(v-if="filteredProxyIdOpts.length === 0") 無符合統編

    //- Modal Footer Template
    template(#modal-footer="{ close }")
      .d-flex.justify-content-between.align-items-center.w-100
        .small.text-muted
          lah-fa-icon.mr-1(icon="check-circle" variant="success")
          | 即時符合：#[strong.text-primary {{ filterDataCount }}] 筆資料
        .d-flex.align-items-center
          b-button.mr-2(
            variant="outline-danger"
            size="sm"
            @click="resetAdvSearch"
            title="清除彈窗內的所有篩選條件"
          )
            lah-fa-icon.mr-1(icon="redo-alt" size="xs")
            | 重設所有條件
          b-button(
            variant="primary"
            size="sm"
            @click="close()"
            title="關閉篩選視窗並檢視結果"
          )
            lah-fa-icon.mr-1(icon="check" size="xs")
            | 確認套用 ({{ filterDataCount }} 筆)
</template>

<script>
import _ from 'lodash'
import dynamicHeight from '~/mixins/dynamic-height-mixin'

export default {
  mixins: [dynamicHeight],

  data: () => ({
    cachedMs: 24 * 60 * 60 * 1000,
    modalLoading: true,
    clickedData: undefined,
    rows: [],
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
    tagsExpanded: false,
    showTagsToggle: false,
    // Custom Enhancements
    quickKeyword: '',
    onlyMyCases: false,
    quickStatusFilter: 'all', // 'all', 'need', 'missing', 'none'
    activeDatePreset: 'month',
    selectedRows: [],
    smartCategory: '', // 'crossOffice', 'cancellation', 'replacement', 'firstReg', 'allSuggested'
    batchUpdating: false,
    batchProgress: 0,
    batchTotal: 0,
    batchForm: {
      authority: 1,
      baseNote: '',
      noteMode: 'same' // 'same' | 'increment'
    },
    datePresets: [
      { id: 'today', label: '今天', title: '查詢今日案件' },
      { id: '3days', label: '近3天', title: '查詢近3天案件' },
      { id: 'week', label: '近一週', title: '查詢近7天案件' },
      { id: 'month', label: '近一月', title: '查詢近1個月案件' },
      { id: '3months', label: '近三月', title: '查詢近3個月案件' }
    ],
    fields: [
      {
        key: 'selection',
        label: '',
        sortable: false,
        thStyle: { width: '40px' }
      },
      '#',
      {
        key: 'customize',
        label: '辦畢通知',
        sortable: false,
        thStyle: { width: '260px' }
      },
      {
        key: '收件字號',
        sortable: true
      },
      {
        key: '收件日期',
        sortable: true
      },
      {
        key: '預定結案日期',
        sortable: true
      },
      {
        key: '代理人姓名',
        sortable: true
      },
      {
        key: '代理人住址',
        sortable: true
      },
      {
        key: '代理人電話',
        sortable: true
      },
      {
        key: 'RM09',
        label: '登記原因',
        sortable: true
      },
      {
        key: '辦理情形',
        sortable: true
      },
      {
        key: '初審人員',
        sortable: true
      },
      {
        key: '複審人員',
        sortable: true
      }
    ],
    advSearchKeywords: {
      caseWord: '',
      caseReason: '',
      casePreliminator: '',
      caseReviewer: '',
      proxyName: '',
      proxyId: ''
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
      caseReviewer: [],
      caseReviewerOpts: [],
      caseNotify: [],
      caseNotifyOpts: [
        { text: '🟢 已通知 (文號齊備)', value: '1' },
        { text: '🟡 待補文號 (需通知缺公文號)', value: 'missing' },
        { text: '⚪ 不需通知', value: '0' }
      ],
      proxyName: [],
      proxyNameOpts: [],
      proxyId: [],
      proxyIdOpts: []
    }
  }),

  fetch () {
    if (this.isBusy) {
      this.notify('讀取中 ... 請稍候', { type: 'warning' })
    } else {
      if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
        this.$utils.warn('dateRange is not ready ... postpone $fetch')
        this.timeout(this.$fetch, 400)
        return
      }

      this.isBusy = true
      this.committed = false
      this.selectedRows = []
      this.$axios.post(this.$consts.API.JSON.PREFETCH, {
        type: 'reg_not_done_case',
        start: this.dateRange.begin,
        end: this.dateRange.end,
        reload: this.forceReload
      }).then(({ data }) => {
        this.rows = data.raw || []
        this.notify(data.message, {
          type: this.$utils.statusCheck(data.status) ? 'info' : 'warning'
        })
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
    title: '辦畢通知控管-桃園市地政局'
  },

  computed: {
    dataReady () {
      return this.rows.length > 0
    },
    filterDataCount () {
      return this.filteredData.length
    },
    currentPageItems () {
      const start = (this.pagination.currentPage - 1) * this.pagination.perPage
      return this.filteredData.slice(start, start + this.pagination.perPage)
    },
    cacheKey () {
      return `query_reg_not_done_case_${this.dateRange.begin}_${this.dateRange.end}`
    },
    foundText () {
      return `找到 ${this.filterDataCount} 筆「已結案未歸檔」案件資料`
    },
    daysPeriod () {
      return this.dateRange.days || 0
    },
    isWrongDaysPeriod () {
      return this.daysPeriod < 1
    },
    currentStaffName () {
      return this.myname || this.myid || '目前人員'
    },
    hasActiveFilters () {
      return (
        this.advTags.length > 0 ||
        this.onlyMyCases ||
        this.quickStatusFilter !== 'all' ||
        !this.$utils.empty(this.smartCategory) ||
        !this.$utils.empty(this.quickKeyword)
      )
    },
    stats () {
      const total = this.rows.length
      if (total === 0) {
        return {
          total: 0,
          needNotify: 0,
          needNotifyPct: 0,
          missingNote: 0,
          noNotify: 0,
          noNotifyPct: 0,
          myCases: 0,
          myCasesPct: 0
        }
      }

      let needNotify = 0
      let missingNote = 0
      let noNotify = 0
      let myCases = 0

      this.rows.forEach((item) => {
        const auth = parseInt(item.CASE_NOTIFY_AUTHORITY)
        const note = (item.CASE_NOTIFY_NOTE || '').trim()
        if (auth === 1) {
          needNotify++
          if (note.length !== 12) {
            missingNote++
          }
        } else {
          noNotify++
        }

        if (this.isMyCase(item)) {
          myCases++
        }
      })

      return {
        total,
        needNotify,
        needNotifyPct: Math.round((needNotify / total) * 1000) / 10,
        missingNote,
        noNotify,
        noNotifyPct: Math.round((noNotify / total) * 1000) / 10,
        myCases,
        myCasesPct: Math.round((myCases / total) * 1000) / 10
      }
    },
    smartStats () {
      let crossOffice = 0
      let cancellation = 0
      let replacement = 0
      let firstReg = 0
      let allSuggested = 0

      this.rows.forEach((item) => {
        const isCross = item.RM99 === 'Y'
        const isCancel = this.isCancellationCase(item)
        const isRep = this.isReplacementCase(item)
        const isFirst = this.isFirstRegCase(item)

        if (isCross) { crossOffice++ }
        if (isCancel) { cancellation++ }
        if (isRep) { replacement++ }
        if (isFirst) { firstReg++ }
        if (isCross || isCancel || isRep || isFirst) {
          allSuggested++
        }
      })

      return {
        crossOffice,
        cancellation,
        replacement,
        firstReg,
        allSuggested
      }
    },
    filteredCaseWordOpts () {
      const kw = (this.advSearchKeywords.caseWord || '').trim().toLowerCase()
      if (!kw) { return this.advOpts.caseWordOpts }
      return this.advOpts.caseWordOpts.filter(opt => String(opt).toLowerCase().includes(kw))
    },
    filteredCaseReasonOpts () {
      const kw = (this.advSearchKeywords.caseReason || '').trim().toLowerCase()
      if (!kw) { return this.advOpts.caseReasonOpts }
      return this.advOpts.caseReasonOpts.filter(opt => String(opt).toLowerCase().includes(kw))
    },
    filteredCasePreliminatorOpts () {
      const kw = (this.advSearchKeywords.casePreliminator || '').trim().toLowerCase()
      if (!kw) { return this.advOpts.casePreliminatorOpts }
      return this.advOpts.casePreliminatorOpts.filter(opt => String(opt).toLowerCase().includes(kw))
    },
    filteredCaseReviewerOpts () {
      const kw = (this.advSearchKeywords.caseReviewer || '').trim().toLowerCase()
      if (!kw) { return this.advOpts.caseReviewerOpts }
      return this.advOpts.caseReviewerOpts.filter(opt => String(opt).toLowerCase().includes(kw))
    },
    filteredProxyNameOpts () {
      const kw = (this.advSearchKeywords.proxyName || '').trim().toLowerCase()
      if (!kw) { return this.advOpts.proxyNameOpts }
      return this.advOpts.proxyNameOpts.filter(opt => String(opt).toLowerCase().includes(kw))
    },
    filteredProxyIdOpts () {
      const kw = (this.advSearchKeywords.proxyId || '').trim().toLowerCase()
      if (!kw) { return this.advOpts.proxyIdOpts }
      return this.advOpts.proxyIdOpts.filter(opt => String(opt).toLowerCase().includes(kw))
    },
    filteredData () {
      let pipeline = [...this.rows]

      // 1. Filter by Only My Cases
      if (this.onlyMyCases) {
        pipeline = pipeline.filter(item => this.isMyCase(item))
      }

      // 2. Filter by Quick Status Filter
      if (this.quickStatusFilter === 'need') {
        pipeline = pipeline.filter(item => parseInt(item.CASE_NOTIFY_AUTHORITY) === 1)
      } else if (this.quickStatusFilter === 'missing') {
        pipeline = pipeline.filter(
          item =>
            parseInt(item.CASE_NOTIFY_AUTHORITY) === 1 &&
            (!item.CASE_NOTIFY_NOTE || item.CASE_NOTIFY_NOTE.trim().length !== 12)
        )
      } else if (this.quickStatusFilter === 'none') {
        pipeline = pipeline.filter(item => parseInt(item.CASE_NOTIFY_AUTHORITY) === 0)
      }

      // 3. Filter by Quick Keyword (supports multiple space-separated keywords and address field)
      if (!this.$utils.empty(this.quickKeyword)) {
        const keywords = this.quickKeyword.trim().toLowerCase().split(/\s+/).filter(Boolean)
        if (keywords.length > 0) {
          pipeline = pipeline.filter((item) => {
            const combined = [
              item.ID || '',
              `${item.RM01}-${item.RM02}-${item.RM03}`,
              item.收件字號 || '',
              item.收件日期 || '',
              item.預定結案日期 || '',
              item.代理人姓名 || '',
              item.代理人電話 || '',
              item.代理人住址 || '',
              item.登記原因 || '',
              item.RM09 || '',
              item.辦理情形 || '',
              item.RM30 || '',
              item.初審人員 || '',
              item.複審人員 || '',
              item.CASE_NOTIFY_NOTE || ''
            ].join(' ').toLowerCase()

            return keywords.every(kw => combined.includes(kw))
          })
        }
      }

      // 4. Filter by Smart Category
      if (this.smartCategory === 'crossOffice') {
        pipeline = pipeline.filter(item => item.RM99 === 'Y')
      } else if (this.smartCategory === 'cancellation') {
        pipeline = pipeline.filter(item => this.isCancellationCase(item))
      } else if (this.smartCategory === 'replacement') {
        pipeline = pipeline.filter(item => this.isReplacementCase(item))
      } else if (this.smartCategory === 'firstReg') {
        pipeline = pipeline.filter(item => this.isFirstRegCase(item))
      } else if (this.smartCategory === 'allSuggested') {
        pipeline = pipeline.filter(item => this.isSuggestedCase(item))
      }

      // 5. Advanced Filters (advOpts)
      if (this.advTags.length > 0) {
        const filters = [
          {
            key: 'caseNum',
            condition: (item, val) => {
              if (!item.RM03) { return false }
              const numVal = val.trim()
              if (/\d+\s*[-~]\s*\d+/.test(numVal)) {
                const match = numVal.match(/(\d+)\s*[-~]\s*(\d+)/)
                if (match) {
                  const start = parseInt(match[1], 10)
                  const end = parseInt(match[2], 10)
                  const itemNum = parseInt(item.RM03, 10)
                  if (!isNaN(start) && !isNaN(end) && !isNaN(itemNum)) {
                    return itemNum >= start && itemNum <= end
                  }
                }
                return false
              }
              return item.RM03.includes(numVal)
            }
          },
          { key: 'caseWord', condition: (item, val) => val.some(word => item.收件字號.includes(word)) },
          { key: 'caseReason', condition: (item, val) => val.includes(item.登記原因) },
          { key: 'caseState', condition: (item, val) => val.includes(item.辦理情形) },
          { key: 'casePreliminator', condition: (item, val) => val.includes(item.初審人員) },
          { key: 'caseReviewer', condition: (item, val) => val.includes(item.複審人員) },
          {
            key: 'caseNotify',
            condition: (item, val) => {
              const auth = parseInt(item.CASE_NOTIFY_AUTHORITY)
              const note = (item.CASE_NOTIFY_NOTE || '').trim()
              const isReady = auth === 1 && note.length === 12
              const isMissing = auth === 1 && note.length !== 12
              const isNone = auth === 0
              return val.some((v) => {
                if (v === '1') { return isReady }
                if (v === 'missing') { return isMissing }
                if (v === '0') { return isNone }
                return false
              })
            }
          },
          { key: 'proxyName', condition: (item, val) => val.includes(item.代理人姓名) },
          { key: 'proxyId', condition: (item, val) => val.includes(item.代理人統編) }
        ]

        for (const filter of filters) {
          const value = this.advOpts[filter.key]
          if (!_.isEmpty(value)) {
            if (filter.key === 'caseNotify' && value.length === this.advOpts.caseNotifyOpts.length) {
              continue
            }
            pipeline = pipeline.filter(item => filter.condition(item, value))
          }
        }
      }

      return pipeline
    },
    advTags () {
      const tags = []
      const tagConfig = {
        caseWord: { label: '字', variant: 'primary' },
        caseNum: { label: '號', variant: 'secondary' },
        caseReason: { label: '登記原因', variant: 'success' },
        caseState: { label: '辦理情形', variant: 'info' },
        casePreliminator: { label: '初審人員', variant: 'dark' },
        caseReviewer: { label: '複審人員', variant: 'secondary' },
        caseNotify: { label: '辦畢通知', variant: 'warning' },
        proxyName: { label: '代理人姓名', variant: 'danger' },
        proxyId: { label: '代理人統編', variant: 'light' }
      }

      for (const key in tagConfig) {
        const values = this.advOpts[key]
        if (!_.isEmpty(values)) {
          const { label, variant } = tagConfig[key]
          if (Array.isArray(values)) {
            values.forEach((value) => {
              const textValue =
                key === 'caseNotify'
                  ? (this.advOpts.caseNotifyOpts.find(opt => opt.value === value)?.text || value)
                  : value
              tags.push({
                key,
                value,
                text: `${label}：${textValue.trim()}`,
                variant
              })
            })
          } else {
            tags.push({
              key,
              value: values,
              text: `${label}：${values}`,
              variant
            })
          }
        }
      }
      return tags
    },
    xlsxData () {
      const notifyDesc = (status) => {
        if (status === 1) { return '需通知' }
        if (status === 0) { return '不需通知' }
        return '未知'
      }
      return this.filteredData.map(item => ({
        辦畢通知狀態: notifyDesc(item.CASE_NOTIFY_AUTHORITY),
        公文文號: item.CASE_NOTIFY_NOTE || '',
        收件字號: `${item.RM01}-${item.RM02}-${item.RM03}`,
        收件日期: item.收件日期,
        預定結案日期: item.預定結案日期,
        登記原因: `${item.RM09}:${item.登記原因}`,
        辦理情形: `${item.RM30}:${item.辦理情形}`,
        初審人員: item.初審人員,
        複審人員: item.複審人員,
        代理人姓名: item.代理人姓名,
        代理人住址: item.代理人住址,
        代理人電話: item.代理人電話
      }))
    },
    isAllCurrentPageSelected () {
      if (this.currentPageItems.length === 0) { return false }
      return this.currentPageItems.every(item => this.isRowSelected(item))
    },
    isCurrentPageIndeterminate () {
      const count = this.currentPageItems.filter(item => this.isRowSelected(item)).length
      return count > 0 && count < this.currentPageItems.length
    },
    batchModalTitle () {
      return `批次設定辦畢通知 (${this.selectedRows.length} 筆)`
    },
    isBatchNoteValid () {
      return !this.$utils.empty(this.batchForm.baseNote) && /^\d{12}$/.test(this.batchForm.baseNote)
    },
    batchNoteState () {
      if (this.$utils.empty(this.batchForm.baseNote)) { return null }
      return this.isBatchNoteValid
    }
  },

  fetchOnServer: false,

  watch: {
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期', { pos: 'tr' })
      }
    },
    committed (val) {
      if (val) {
        this.$nextTick(() => {
          this.calculateMaxHeight()
        })
      }
    },
    selectedRows () {
      this.$nextTick(() => {
        this.calculateMaxHeight()
      })
    },
    tagsExpanded () {
      this.$nextTick(() => {
        this.calculateMaxHeight()
      })
    },
    advTags () {
      this.tagsExpanded = false
      this.$nextTick(() => {
        const container = this.$refs.tagsContainer
        if (container) {
          this.showTagsToggle = container.scrollHeight > 39
        } else {
          this.showTagsToggle = false
        }
        this.calculateMaxHeight()
      })
    },
    rows (val) {
      this.resetAdvSearch()
      if (!_.isEmpty(val)) {
        const genOptions = (key, useCompact = false) => {
          let opts = _.map(val, key)
          if (useCompact) {
            opts = _.compact(opts)
          }
          opts = _.uniq(opts)
          opts = _.sortBy(opts)
          return opts
        }
        this.advOpts.caseReasonOpts = genOptions('登記原因')
        this.advOpts.caseStateOpts = genOptions('辦理情形')
        this.advOpts.casePreliminatorOpts = genOptions('初審人員', true)
        this.advOpts.caseReviewerOpts = genOptions('複審人員', true)
        this.advOpts.caseWordOpts = genOptions('RM02')
        this.advOpts.proxyNameOpts = genOptions('代理人姓名', true)
        this.advOpts.proxyIdOpts = genOptions('代理人統編', true)
      }
      this.$nextTick(() => {
        this.calculateMaxHeight()
      })
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
                          this.$refs.table?.$el ||
                          document.getElementById('land-ref-table')
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
    highlight (text) {
      if (text === null || text === undefined || text === '') { return '' }
      const str = String(text)
      const rawKw = (this.quickKeyword || '').trim()
      if (!rawKw) { return this.escapeHtml(str) }

      const keywords = rawKw.split(/\s+/).filter(Boolean)
      if (keywords.length === 0) { return this.escapeHtml(str) }

      const pattern = keywords
        .map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|')
      const regex = new RegExp(`(${pattern})`, 'gi')

      const safeStr = this.escapeHtml(str)
      return safeStr.replace(regex, '<mark class="lah-highlight">$1</mark>')
    },
    escapeHtml (text) {
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
    },
    reload () {
      this.forceReload = true
      this.$fetch()
    },
    reset () {
      this.committed = false
      this.rows = []
      this.pagination.currentPage = 1
    },
    popup (data) {
      this.modalLoading = true
      this.clickedData = data
      this.$refs.caseDetail.show()
    },
    resetAdvSearch () {
      this.advOpts = {
        ...this.advOpts,
        ...{
          caseWord: [],
          caseNum: '',
          caseReason: [],
          caseState: [],
          casePreliminator: [],
          caseReviewer: [],
          caseNotify: [],
          proxyName: [],
          proxyId: []
        }
      }
      this.advSearchKeywords = {
        caseWord: '',
        caseReason: '',
        casePreliminator: '',
        caseReviewer: '',
        proxyName: '',
        proxyId: ''
      }
    },
    selectAllGroup (key, opts) {
      if (Array.isArray(opts)) {
        const values = opts.map(o => (typeof o === 'object' && o !== null && 'value' in o ? o.value : o))
        this.advOpts[key] = [...values]
      }
    },
    clearGroup (key) {
      this.advOpts[key] = []
    },
    selectMyselfPreliminator () {
      const myName = (this.myname || '').trim()
      const myId = (this.myid || '').trim().toUpperCase()
      const matched = this.advOpts.casePreliminatorOpts.filter(
        name => (myName && name.includes(myName)) || (myId && name.toUpperCase().includes(myId))
      )
      if (matched.length > 0) {
        this.advOpts.casePreliminator = [...matched]
        this.notify(`已為您勾選初審人員：${matched.join('、')}`, { type: 'info' })
      } else if (myName) {
        this.advOpts.casePreliminator = [myName]
        this.notify(`已為您勾選初審人員：${myName}`, { type: 'info' })
      } else {
        this.alert('無法取得您的使用者名稱，請手動勾選')
      }
    },
    removeAdvTag (tagToRemove) {
      const { key, value } = tagToRemove
      const currentValues = this.advOpts[key]
      if (Array.isArray(currentValues)) {
        this.advOpts[key] = currentValues.filter(v => v !== value)
      } else {
        this.advOpts[key] = ''
      }
    },
    resetAllFilters () {
      this.resetAdvSearch()
      this.onlyMyCases = false
      this.quickStatusFilter = 'all'
      this.smartCategory = ''
      this.quickKeyword = ''
      this.pagination.currentPage = 1
    },
    setQuickFilter (type) {
      if (this.quickStatusFilter === type) {
        this.quickStatusFilter = 'all'
      } else {
        this.quickStatusFilter = type
      }
      this.pagination.currentPage = 1
    },
    toggleOnlyMyCases () {
      this.onlyMyCases = !this.onlyMyCases
      this.pagination.currentPage = 1
    },
    toggleSmartCategory (category) {
      this.smartCategory = this.smartCategory === category ? '' : category
      this.pagination.currentPage = 1
    },
    isCancellationCase (item) {
      return Boolean(item && item.登記原因 && item.登記原因.includes('塗銷'))
    },
    isReplacementCase (item) {
      return Boolean(item && item.登記原因 && item.登記原因.includes('書狀補給'))
    },
    isFirstRegCase (item) {
      return Boolean(item && item.登記原因 && item.登記原因.includes('第一次'))
    },
    isSuggestedCase (item) {
      if (!item) { return false }
      return Boolean(
        item.RM99 === 'Y' ||
        this.isCancellationCase(item) ||
        this.isReplacementCase(item) ||
        this.isFirstRegCase(item)
      )
    },
    isMyCase (item) {
      if (!item) { return false }
      const myName = (this.myname || '').trim()
      const myId = (this.myid || '').trim().toUpperCase()
      if (myName && item.初審人員 && item.初審人員.trim() === myName) { return true }
      if (myId && item.RM45 && item.RM45.trim().toUpperCase() === myId) { return true }
      return false
    },
    getPrevNote (currentIndex) {
      const globalIndex = (this.pagination.currentPage - 1) * this.pagination.perPage + currentIndex
      for (let i = globalIndex - 1; i >= 0; i--) {
        const item = this.filteredData[i]
        if (item && item.CASE_NOTIFY_NOTE && item.CASE_NOTIFY_NOTE.length === 12) {
          return item.CASE_NOTIFY_NOTE
        }
      }
      return ''
    },
    onNotifyUpdated (dataset) {
      const item = this.rows.find(r => r.ID === dataset.id)
      if (item) {
        item.CASE_NOTIFY_AUTHORITY = dataset.authority
        item.CASE_NOTIFY_NOTE = dataset.note
      }
    },
    // Row selection handlers
    isRowSelected (item) {
      return this.selectedRows.some(r => r.ID === item.ID)
    },
    toggleRowSelect (item) {
      const idx = this.selectedRows.findIndex(r => r.ID === item.ID)
      if (idx > -1) {
        this.selectedRows.splice(idx, 1)
      } else {
        this.selectedRows.push(item)
      }
    },
    toggleSelectCurrentPage () {
      if (this.isAllCurrentPageSelected) {
        const pageIds = this.currentPageItems.map(i => i.ID)
        this.selectedRows = this.selectedRows.filter(r => !pageIds.includes(r.ID))
      } else {
        this.currentPageItems.forEach((item) => {
          if (!this.isRowSelected(item)) {
            this.selectedRows.push(item)
          }
        })
      }
    },
    clearSelection () {
      this.selectedRows = []
    },
    // Batch operations
    openBatchModal (mode) {
      if (this.selectedRows.length === 0) {
        this.alert('請先勾選欲批次修改之案件！')
        return
      }
      if (mode === 'need') {
        this.batchForm.authority = 1
        const rocYear = String(new Date().getFullYear() - 1911)
        this.batchForm.baseNote = this.batchForm.baseNote || `${rocYear}00000001`
      } else if (mode === 'noteOnly') {
        this.batchForm.authority = 1
      }
      this.$refs.batchDocModal.show()
    },
    batchSetNoNotify () {
      if (this.selectedRows.length === 0) {
        this.alert('請先勾選欲批次修改之案件！')
        return
      }
      this.confirm(`確定要將已選取的 ${this.selectedRows.length} 筆案件批次設為「不需通知」並清空文號？`).then((ans) => {
        if (ans) {
          this.runBatchUpdate(0, '')
        }
      })
    },
    batchClearNote () {
      if (this.selectedRows.length === 0) {
        this.alert('請先勾選欲批次修改之案件！')
        return
      }
      this.confirm(`確定要清除已選取的 ${this.selectedRows.length} 筆案件之公文文號？`).then((ans) => {
        if (ans) {
          this.runBatchUpdate(undefined, '')
        }
      })
    },
    executeBatchSubmit () {
      if (this.batchForm.authority === 1 && !this.isBatchNoteValid) {
        this.alert('請輸入12碼合規數字公文文號！')
        return
      }
      this.runBatchUpdate(
        this.batchForm.authority,
        this.batchForm.baseNote,
        this.batchForm.noteMode
      )
    },
    async runBatchUpdate (authority, baseNote, noteMode = 'same') {
      this.batchUpdating = true
      this.batchProgress = 0
      this.batchTotal = this.selectedRows.length
      let currentNum = baseNote && /^\d+$/.test(baseNote) ? BigInt(baseNote) : 0n
      const padLen = baseNote ? baseNote.length : 12

      for (let i = 0; i < this.selectedRows.length; i++) {
        const item = this.selectedRows[i]
        const targetAuth = authority !== undefined ? authority : item.CASE_NOTIFY_AUTHORITY
        let targetNote = item.CASE_NOTIFY_NOTE || ''

        if (baseNote !== undefined) {
          if (noteMode === 'increment' && currentNum > 0n) {
            targetNote = currentNum.toString().padStart(padLen, '0')
            currentNum++
          } else {
            targetNote = baseNote
          }
        }

        try {
          const res = await this.$axios.post(this.$consts.API.JSON.QUERY, {
            type: 'upd_reg_auth_checks',
            id: item.ID,
            authority: targetAuth,
            note: targetNote
          })
          if (this.$utils.statusCheck(res.data.status)) {
            item.CASE_NOTIFY_AUTHORITY = targetAuth
            item.CASE_NOTIFY_NOTE = targetNote
          }
        } catch (err) {
          this.$utils.error('批次更新異常', item.ID, err)
        }
        this.batchProgress = i + 1
      }

      this.batchUpdating = false
      this.notify(`已完成 ${this.batchTotal} 筆案件之批次更新！`, { type: 'success' })
      if (this.$refs.batchDocModal) {
        this.$refs.batchDocModal.hide()
      }
      this.selectedRows = []
    },
    // Copy helper
    copyCaseId (item, format = 'hyphen') {
      const text = format === 'hyphen' ? `${item.RM01}-${item.RM02}-${item.RM03}` : item.ID
      this.copyText(text, `已複製收件號：${text}`)
    },
    openWebAp (item) {
      const url = `http://${this.webapIp}:9080/Land${this.site}/CAS/CCD01/CCD0103.jsp?rm01=${item.RM01}&rm02=${item.RM02}&rm03=${item.RM03}`
      window.open(url, '_blank')
    },
    // Date presets
    applyDatePreset (presetId) {
      this.activeDatePreset = presetId
      const today = new Date()
      let startDate = new Date()

      if (presetId === 'today') {
        startDate = new Date(today)
      } else if (presetId === '3days') {
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)
      } else if (presetId === 'week') {
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
      } else if (presetId === 'month') {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
      } else if (presetId === '3months') {
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
      }

      if (this.$refs.datepicker && this.$refs.datepicker.setRange) {
        this.$refs.datepicker.setRange(startDate, today)
        this.timeout(this.$fetch, 200)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// =========================================================
// 1. lah-header 48px 操作高度規範 (遵循 AGENTS.md)
// =========================================================
.header-left-group {
  display: inline-flex;
  align-items: center;

  ::v-deep .btn {
    height: 48px !important;
    min-height: 48px !important;
    max-height: 48px !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

.header-right-group {
  display: inline-flex;
  align-items: center;

  ::v-deep .btn-group,
  ::v-deep .btn-group > .btn,
  ::v-deep .btn,
  ::v-deep .btn-lg,
  ::v-deep .custom-select,
  ::v-deep select.form-control,
  ::v-deep .form-control {
    height: 48px !important;
    min-height: 48px !important;
    max-height: 48px !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  ::v-deep .btn-group {
    height: 48px !important;
  }

  ::v-deep .lah-datepicker {
    height: 48px !important;
    display: inline-flex;
    align-items: center;

    .display-input,
    .form-control,
    .b-form-btn-label-control,
    .btn {
      height: 48px !important;
      min-height: 48px !important;
      max-height: 48px !important;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
    }

    .my-auto {
      margin-top: auto !important;
      margin-bottom: auto !important;
      line-height: 48px;
    }
  }
}

.badge {
  font-size: .85rem;
}
.tags-container {
  transition: max-height 0.25s ease-in-out;
}
.tags-container.tags-collapsed {
  max-height: 2.4rem;
  overflow: hidden;
}
.kpi-card {
  background-color: #ffffff;
  min-height: 86px;
  transition: all 0.2s ease-in-out;
  user-select: none;
  box-sizing: border-box;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
  }
}
.cursor-pointer {
  cursor: pointer;
}
.active-card {
  border-width: 2px !important;
  background-color: #f8faff;
}
.border-purple {
  border-color: #6f42c1 !important;
}
.bg-light-warning {
  background-color: #fff9e6 !important;
}
.batch-toolbar {
  animation: slideDown 0.25s ease-out;
  border-left-width: 4px;
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.btn-icon-tool {
  opacity: 0.65;
  transition: opacity 0.15s ease-in-out;
  &:hover {
    opacity: 1;
  }
}

// 表格 sticky-header 去除底部預設邊距以精確貼齊 .version 下緣
::v-deep .b-table-sticky-header {
  margin-bottom: 0 !important;
}

// =========================================================
// Advanced Filter Modal Enhancements
// =========================================================
.filter-card {
  background-color: #ffffff;
  border-color: #e2e8f0 !important;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  &:hover {
    border-color: #cbd5e1 !important;
  }
}

.filter-checkbox-list {
  max-height: 140px;
  overflow-y: auto;
  padding: 4px 6px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }

  ::v-deep .custom-control {
    margin-bottom: 3px;
    line-height: 1.4;
    .custom-control-label {
      cursor: pointer;
      font-size: 0.85rem;
    }
  }
}

.filter-subsearch {
  font-size: 0.8rem;
  height: 30px;
  background-color: #f8fafc;
}

.btn-micro {
  font-size: 0.75rem;
  line-height: 1;
  padding: 2px 4px;
  text-decoration: none !important;
  &:hover {
    text-decoration: underline !important;
  }
}

// =========================================================
// Table Search Keyword Highlight
// =========================================================
::v-deep mark.lah-highlight,
::v-deep .lah-highlight,
mark.lah-highlight,
.lah-highlight {
  background-color: #fff3bf !important;
  color: #212529 !important;
  font-weight: bold;
  padding: 0 2px;
  border-radius: 3px;
  box-shadow: 0 0 0 1px #ffe066;
}
</style>
