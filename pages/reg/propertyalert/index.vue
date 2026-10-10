<template lang="pug">
div
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.w-100
      .d-flex
        .my-auto 地籍異動即時通收件管理
        b-badge.my-auto.ml-2(variant="secondary" pill) {{ queryCount }} 筆
        lah-button(
          icon="info"
          action="bounce"
          variant="outline-success"
          no-border
          no-icon-gutter
          @click="$refs.help_modal.show()"
          title="使用說明"
        )
        lah-help-modal(ref="help_modal" size="lg")
          h5 收件登記與操作說明
          ol
            li: .d-flex.align-items-center.flex-wrap
              span 點選上方
              b-badge.mx-1(variant="primary") 新增收件
              span 按鈕開啟新增視窗，系統會自動帶入當前登入者為「收件人員」
            li
              strong 連續收件模式：
              | 新增視窗底部預設開啟「連續收件模式」，儲存後自動清空欄位並重設焦點、保留視窗，方便櫃檯快速連續登打
            li
              strong 隨案自動帶入人員：
              | 收件類型選擇「隨案」並輸入收件案號後（離開輸入框或點選「查人員」），可自動查詢該案之「代理人」與「權利人」供一鍵帶入姓名與手機號碼；列表中點擊案件號亦可直接檢視登記案件詳情
            li
              strong 編輯、刪除與匯出：
              | 左鍵點擊資料列可開啟編輯視窗；於資料列按
              strong 滑鼠右鍵
              | 可開啟快捷選單執行「編輯」或「刪除」；上方工具列亦支援將目前篩選結果匯出為 Excel (XLSX)
          hr
          h5 搜尋與複合快篩說明
          ol
            li
              strong 快捷日期與區間：
              | 可點選「快捷日期」一鍵切換「今天、昨天、近 3 天、近 7 天、本月迄今、本年度」，或自訂起訖日期查詢
            li
              strong 複合狀態快篩：
              | 支援同時組合「類型（全部/臨櫃/隨案）」、「簡訊狀態（全部/未發送/成功/失敗/忽略/無手機）」及「
              strong 只看我的
              | （僅顯示自己收件之案件）」即時過濾列表並顯示各分類筆數
            li
              strong 智慧關鍵字搜尋：
              | 輸入關鍵字可即時過濾並高亮標示「編號、申請人、手機號碼、案件號、收件人員（姓名/員編）與備註」
          hr
          h5 簡訊狀態管理與比對機制
          ul
            li
              strong 四種簡訊狀態切換：
              | 列表與新增/編輯視窗中皆可直接設定簡訊狀態：
              ul.mt-1
                li
                  b-badge.mr-1(variant="warning") 未發送 / 待比對
                  | 尚未確認簡訊結果，會納入後端排程自動比對與逾期提醒範圍
                li
                  b-badge.mr-1(variant="success") 發送成功
                  | 已確認簡訊發送成功
                li
                  b-badge.mr-1(variant="danger") 發送失敗
                  | 簡訊發送失敗，需留意後續處理
                li
                  b-badge.mr-1(variant="secondary") 忽略 / 免排查
                  | 提示後端排程略過此筆資料，不進行簡訊比對與逾期稽催（無手機案件亦可設定）
            li.mt-1
              strong 單筆手動即時檢測：
              | 當案件有填寫手機號碼且狀態為「
              strong 未發送 / 待比對
              | 」時，狀態選單右側會顯示
              b-badge.mx-1(variant="info") 放大鏡
              | 按鈕，點擊即可手動向後端查詢該手機於「
              strong 收件日期（含當日）之後
              | 」是否有地籍異動即時通簡訊紀錄，並自動更新為發送成功或失敗（檢測期間畫面會鎖定防止重複觸發）
            li.mt-1
              strong 後端自動排程排查：
              | 系統排程每日自動比對「未發送」案件之簡訊紀錄；收件滿 3 天仍未比對成功將通知收件人員，滿 7 天則通知登記課群組
            li.mt-1
              strong 手機號碼一鍵複製：
              | 手機號碼欄位右側附有複製按鈕，方便快速複製比對

      .d-flex
        //- 快捷日期選單
        b-dropdown.my-auto.mr-1(
          variant="outline-secondary"
          size="lg"
          right
          no-caret
          :disabled="isBusy"
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
          b-dropdown-item(@click="applyQuickDate('thisYear')")
            lah-fa-icon.text-secondary.mr-1(icon="calendar-check") 本年度

        //- 日期區間選擇器
        lah-datepicker(
          ref="datepicker"
          v-model="dateRange"
          :begin="firstDayOfYear"
        )

        lah-button.mx-1(
          icon="search"
          size="lg"
          title="依自訂區間重新查詢"
          action="swim"
          variant="outline-primary"
          :disabled="isBusy || isWrongDaysPeriod"
          :busy="isBusy"
          @click="$fetch"
          no-icon-gutter
        )

        //- 新增住址隱匿案件按鈕
        lah-button(
          icon="plus"
          size="lg"
          variant="primary"
          title="新增地籍異動即時通案件"
          :disabled="isBusy"
          @click="showAdd"
          no-icon-gutter
        ) 新增收件

        //- 匯出 XLSX 按鈕
        lah-button-xlsx.mx-1(
          :jsons="xlsxData"
          header="地籍異動即時通收件管理"
        )

        //- 重新整理按鈕
        lah-button(
          icon="rotate"
          size="lg"
          variant="outline-secondary"
          title="重新整理"
          :disabled="isBusy"
          @click="$fetch"
          no-icon-gutter
        )

  //- 複合式快篩工具列
  .d-flex.flex-wrap.align-items-center.justify-content-between.mb-2.p-2.bg-white.rounded.border.shadow-sm
    .d-flex.flex-wrap.align-items-center
      //- 收件類型標籤
      span.text-muted.small.mr-2.font-weight-bold 類型：
      b-button-group.mr-3(size="sm")
        b-button(
          :variant="typeFilter === 'all' ? 'primary' : 'outline-secondary'"
          :disabled="isBusy"
          @click="typeFilter = 'all'"
        ) 全部 ({{ typeCountAll }})
        b-button(
          :variant="typeFilter === '0' ? 'primary' : 'outline-secondary'"
          :disabled="isBusy"
          @click="typeFilter = '0'"
        ) 臨櫃 ({{ typeCountCounter }})
        b-button(
          :variant="typeFilter === '1' ? 'danger' : 'outline-secondary'"
          :disabled="isBusy"
          @click="typeFilter = '1'"
        ) 隨案 ({{ typeCountWithCase }})

      //- 簡訊狀態標籤
      span.text-muted.small.mr-2.font-weight-bold 簡訊：
      b-button-group.mr-2(size="sm")
        b-button(
          :variant="smsFilter === 'all' ? 'dark' : 'outline-secondary'"
          :disabled="isBusy"
          @click="smsFilter = 'all'"
        ) 全部
        b-button(
          :variant="smsFilter === '0' ? 'warning' : 'outline-secondary'"
          :disabled="isBusy"
          @click="smsFilter = '0'"
        ) 未發送 ({{ smsCountPending }})
        b-button(
          :variant="smsFilter === '1' ? 'success' : 'outline-secondary'"
          :disabled="isBusy"
          @click="smsFilter = '1'"
        ) 成功 ({{ smsCountSuccess }})
        b-button(
          :variant="smsFilter === '2' ? 'danger' : 'outline-secondary'"
          :disabled="isBusy"
          @click="smsFilter = '2'"
        ) 失敗 ({{ smsCountFail }})
        b-button(
          :variant="smsFilter === '3' ? 'secondary' : 'outline-secondary'"
          :disabled="isBusy"
          @click="smsFilter = '3'"
        ) 忽略 ({{ smsCountIgnored }})
        b-button(
          :variant="smsFilter === 'no_phone' ? 'secondary' : 'outline-secondary'"
          :disabled="isBusy"
          @click="smsFilter = 'no_phone'"
        ) 無手機 ({{ smsCountNoPhone }})

      //- 只看我的案件開關
      b-button(
        :variant="filterOnlyMine ? 'primary' : 'outline-primary'"
        size="sm"
        pill
        :disabled="isBusy"
        @click="filterOnlyMine = !filterOnlyMine"
        :title="`只顯示收件人員為 ${myname || myid} 的案件`"
      )
        lah-fa-icon.mr-1(:icon="filterOnlyMine ? 'user-check' : 'user'")
        | 只看我的 ({{ myCasesCount }})

    .d-flex.align-items-center.mt-2.mt-lg-0
      b-input-group(size="sm")
        template(#prepend)
          b-input-group-text
            lah-fa-icon(icon="filter")
        b-input(
          v-model="keyword"
          placeholder="快速快篩/搜尋 (姓名/案號/手機/備註)..."
          style="min-width: 250px;"
          :disabled="isBusy"
          @keyup.enter="$fetch"
        )
        template(#append)
          b-button(
            v-if="keyword"
            variant="outline-secondary"
            size="sm"
            title="清空關鍵字"
            :disabled="isBusy"
            @click="keyword = ''"
          )
            lah-fa-icon(icon="xmark")

  //- 分頁控制項
  lah-pagination(
    v-if="filteredCount > pagination.perPage"
    v-model="pagination"
    :total-rows="filteredCount"
    :caption="foundText"
  )

  //- 案件資料表格
  b-table.text-center.shadow-sm(
    ref="table"
    select-mode="single"
    selected-variant="success"
    :sticky-header="`${maxHeight}px`"
    :busy="isBusy"
    :items="filteredRows"
    :responsive="'lg'"
    :head-variant="'dark'"
    :fields="fields"
    :per-page="pagination.perPage"
    :current-page="pagination.currentPage"
    :borderless="false"
    :outlined="false"
    :dark="false"
    :fixed="false"
    :foot-clone="false"
    caption-top
    selectable
    striped
    hover
    bordered
    small
    no-border-collapse
    @row-selected="rowSelected"
    @row-contextmenu="onRowContextMenu"
  )
    template(#table-busy): span.ld-txt 讀取中...
    template(#cell(serial_no)="{ item }")
      .text-center.font-weight-bold {{ item.serial_no }}
    template(#cell(applicant)="{ item }")
      .text-center.font-weight-bold(v-html="highlightText(item.applicant)")
    template(#cell(cellphone)="{ item }")
      .d-flex.align-items-center.justify-content-center(v-if="item.cellphone")
        span.text-monospace.font-weight-bold(v-html="highlightText(item.cellphone)")
        b-button.ml-1.p-0.px-1(
          variant="outline-secondary"
          size="sm"
          title="複製手機號碼"
          :disabled="isBusy"
          @click.stop="copyCellphone(item.cellphone)"
        )
          lah-fa-icon(icon="copy" size="xs")
      span.text-muted(v-else) (無)
    template(#cell(sms_status)="{ item }")
      .d-inline-flex.align-items-stretch.justify-content-center(@click.stop)
        b-dropdown(
          size="sm"
          :variant="itemSmsVariant(item)"
          :disabled="isBusy"
          no-caret
          @click.stop
        )
          template(#button-content)
            lah-fa-icon.mr-1(:icon="itemSmsIcon(item)")
            span {{ itemSmsText(item) }}
            lah-fa-icon.ml-1(icon="caret-down" size="xs")
          b-dropdown-item-button(
            :active="parseInt(item.sms_status || 0) === 0"
            :disabled="isBusy"
            @click.stop="quickUpdateSmsStatus(item, 0)"
          )
            lah-fa-icon.text-warning.mr-1(icon="clock")
            | 未發送 / 待比對
          b-dropdown-item-button(
            :active="parseInt(item.sms_status) === 1"
            :disabled="isBusy"
            @click.stop="quickUpdateSmsStatus(item, 1)"
          )
            lah-fa-icon.text-success.mr-1(icon="circle-check")
            | 發送成功
          b-dropdown-item-button(
            :active="parseInt(item.sms_status) === 2"
            :disabled="isBusy"
            @click.stop="quickUpdateSmsStatus(item, 2)"
          )
            lah-fa-icon.text-danger.mr-1(icon="circle-xmark")
            | 發送失敗
          b-dropdown-item-button(
            :active="parseInt(item.sms_status) === 3"
            :disabled="isBusy"
            @click.stop="quickUpdateSmsStatus(item, 3)"
          )
            lah-fa-icon.text-secondary.mr-1(icon="bell-slash")
            | 忽略 / 免排查
        b-button.ml-1.px-2.d-inline-flex.align-items-center(
          v-if="item.cellphone && parseInt(item.sms_status || 0) === 0"
          variant="outline-info"
          size="sm"
          title="手動檢測此筆案件於收件日之後的簡訊發送狀態"
          :disabled="isBusy"
          @click.stop="checkSmsStatus(item)"
        )
          b-spinner(v-if="checkingSmsId === item.id" small)
          lah-fa-icon(v-else icon="magnifying-glass")
    template(#cell(receiving_type)="{ item }")
      b-badge(:variant="receivingTypeVariant(item.receiving_type)") {{ receivingTypeLabel(item.receiving_type) }}
    template(#cell(receiving_caseno)="{ item }")
      .text-left
        b-link(v-if="item.receiving_caseno" href="#" :disabled="isBusy" @click.prevent="showDetail(item.receiving_caseno)")
          span(v-html="highlightText(item.receiving_caseno)")
        span.text-muted(v-else) (無)
    template(#cell(receiver)="{ item }")
      .text-center(v-if="item.receiver")
        b-link.font-weight-bold.text-dark(
          href="#"
          @click.prevent="userinfo(userNames[item.receiver] || item.receiver, item.receiver)"
          :title="`點擊查看 ${userNames[item.receiver] || item.receiver} (${item.receiver}) 人員資訊`"
        )
          span(v-html="highlightText(userNames[item.receiver] || item.receiver)")
      span.text-muted(v-else) (未記錄)
    template(#cell(createtime)="{ item }")
      .mx-auto {{ $utils.toADDate(item.createtime * 1000, 'yyyy-LL-dd') }}
    template(#cell(modifytime)="{ item }")
      .mx-auto.small.text-muted {{ $utils.toADDate(item.modifytime * 1000) }}
    template(#cell(note)="{ item }")
      .text-left(v-html="handleNoteText(item.note)")

  //- 右鍵選單
  transition(name="ctx-fade")
    .ctx-menu(
      v-if="contextMenu.show"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
      @click.stop
    )
      .ctx-menu-item(@click="ctxEdit")
        lah-fa-icon.mr-2(icon="pen-to-square")
        span 編輯
      .ctx-menu-divider
      .ctx-menu-item.text-danger(@click="ctxDelete")
        lah-fa-icon.mr-2(icon="trash-can" variant="danger")
        span 刪除

  //- 案件詳情 Modal
  b-modal(
    ref="detail_modal",
    hide-footer,
    no-close-on-backdrop,
    size="xl",
    scrollable
  )
    template(#modal-title) 登記案件詳情 {{ clickedCaseno }}
    h4.text-center.text-info.my-5(v-if="detailLoading")
      b-spinner.mr-2(small type="grow")
      strong.ld-txt 查詢中...
    lah-reg-case-detail(
      v-show="!detailLoading",
      :case-id="clickedCaseno",
      @ready="detailLoading = !$event.detail"
    )

  //- 新增 Modal
  b-modal(
    ref="add_modal",
    hide-footer,
    no-close-on-backdrop,
    scrollable,
    size="lg"
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon.mr-2(icon="file-circle-plus")
        span 新增地籍異動即時通案件
    .p-2
      b-form(@submit.prevent="submitAdd")
        b-form-group(label="收件人員" label-cols="3")
          .d-flex.align-items-center.py-1
            lah-fa-icon.text-primary.mr-2(icon="user-check")
            span.font-weight-bold.text-dark {{ myname || myid }}
            b-badge.ml-2(variant="secondary" pill) {{ myid }}
            small.ml-2.text-muted (登入者自動帶入)
        b-form-group(label="收件類型" label-cols="3")
          b-form-radio-group(
            v-model="form.receiving_type"
            :options="receivingTypeOptions"
            buttons
            button-variant="outline-primary"
            size="sm"
            @change="onAddTypeChange"
            class="w-100"
          )
        b-form-group(label="收件案號" label-cols="3" v-if="form.receiving_type === 1")
          .d-flex
            b-input.flex-grow-1(
              ref="addCasenoInput"
              v-model="form.receiving_caseno"
              placeholder="如：115-HA81-012350"
              :state="addCasenoState"
              @blur="onAddCasenoBlur"
              @keyup.enter="onAddCasenoEnter"
            )
            lah-button.ml-1(
              icon="magnifying-glass",
              variant="outline-info",
              no-icon-gutter,
              title="查詢案件人員",
              :disabled="caseApplicantsBusy || addCasenoState !== true",
              @click="fetchCaseApplicants('add')"
            ) 查人員
          b-form-invalid-feedback(:state="addCasenoState") {{ casenoErrorMsg(form.receiving_caseno) }}
          //- 查詢結果選單
          b-list-group.mt-1.shadow-sm.applicant-dropdown-list(v-if="caseApplicants.length > 0")
            b-list-group-item.py-1.px-2.list-group-item-action(
              v-for="(p, i) in caseApplicants"
              :key="i"
              button
              @click="selectApplicant('add', p)"
            )
              .d-flex.align-items-center.justify-content-between
                .d-flex.align-items-center
                  b-badge.mr-2(:variant="p.role === '代理人' ? 'warning' : 'info'" pill) {{ p.role }}
                  strong {{ p.name }}
                  small.ml-1.text-muted(v-if="p.id_no") ({{ p.id_no }})
                small.text-primary.font-weight-bold(v-if="p.cellphone")
                  lah-fa-icon.mr-1(icon="mobile-screen")
                  | {{ p.cellphone }}
        b-form-group(label="申請人姓名 *" label-cols="3")
          b-input(
            ref="addApplicantInput"
            v-model="form.applicant"
            placeholder="請輸入申請人姓名"
            :state="form.applicant.length > 0 ? true : null"
            required
          )
        b-form-group(label="手機號碼" label-cols="3")
          b-input-group
            template(#prepend)
              b-input-group-text
                lah-fa-icon(icon="mobile-screen")
            b-input(
              ref="addCellphoneInput"
              v-model="form.cellphone"
              placeholder="09xx-xxx-xxx (選填，供簡訊比對)"
              :state="addCellphoneState"
              @input="formatAddCellphone"
            )
          b-form-invalid-feedback(:state="addCellphoneState") 手機格式應為 09 開頭 10 碼數字
        b-form-group(label="簡訊狀態" label-cols="3")
          b-select(
            v-model="form.sms_status"
            :options="smsStatusOptions"
          )
        b-form-group(label="備註說明" label-cols="3")
          b-textarea(
            v-model="form.note"
            placeholder="備註說明..."
            rows="3"
            max-rows="8"
          )
        .d-flex.justify-content-between.align-items-center.mt-3.pt-2.border-top
          b-form-checkbox(
            v-model="continuousIntake"
            switch
            size="sm"
            title="儲存後清空欄位並保留視窗，方便連續登打下一筆"
          )
            span.small.font-weight-bold 連續收件模式
          .d-flex.align-items-center
            b-button.mr-2(
              variant="outline-secondary"
              @click="$refs.add_modal.hide()"
            )
              lah-fa-icon.mr-1(icon="xmark")
              span 取消
            b-button.mr-2(
              variant="outline-secondary"
              @click="resetAddForm"
            )
              lah-fa-icon.mr-1(icon="rotate-left")
              span 清空
            lah-button(
              type="submit"
              icon="floppy-disk"
              variant="primary"
              :disabled="isBusy || !form.applicant || addCasenoState === false || addCellphoneState === false"
            ) {{ continuousIntake ? '儲存並新增下一筆' : '完成登記收件' }}

  //- 編輯 Modal
  b-modal(
    ref="edit_modal",
    hide-footer,
    no-close-on-backdrop,
    scrollable,
    size="lg"
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon.mr-2(icon="pen-to-square")
        span 修改地籍異動即時通案件
    .p-2(v-if="editRecord")
      b-form(@submit.prevent="submitEdit")
        b-form-group(label="收件人員" label-cols="3")
          .d-flex.align-items-center.py-1
            lah-fa-icon.text-secondary.mr-2(icon="user")
            span.font-weight-bold.text-dark {{ (userNames && userNames[editForm.receiver]) || editForm.receiver || '(未記錄)' }}
            b-badge.ml-2(v-if="editForm.receiver" variant="secondary" pill) {{ editForm.receiver }}
            small.ml-2.text-muted (建立時綁定，無法變更)
        b-form-group(label="收件類型" label-cols="3")
          b-select(
            v-model="editForm.receiving_type",
            :options="receivingTypeOptions",
            @change="onEditTypeChange"
          )
        b-form-group(label="收件案號" label-cols="3" v-if="editForm.receiving_type === 1")
          .d-flex
            b-input.flex-grow-1(
              v-model="editForm.receiving_caseno",
              placeholder="如：115-HA81-012350",
              :state="editCasenoState",
              @blur="onEditCasenoBlur"
            )
            lah-button.ml-1(
              icon="magnifying-glass",
              variant="outline-info",
              no-icon-gutter,
              title="查詢案件人員",
              :disabled="caseApplicantsBusy || editCasenoState !== true",
              @click="fetchCaseApplicants('edit')"
            ) 查人員
          b-form-invalid-feedback(:state="editCasenoState") {{ casenoErrorMsg(editForm.receiving_caseno) }}
          //- 查詢結果選單
          b-list-group.mt-1(v-if="caseApplicants.length > 0")
            b-list-group-item.py-1.px-2(
              v-for="(p, i) in caseApplicants"
              :key="i"
              button
              @click="selectApplicant('edit', p)"
            )
              .d-flex.align-items-center.justify-content-between
                .d-flex.align-items-center
                  b-badge.mr-2(:variant="p.role === '代理人' ? 'warning' : 'info'" pill) {{ p.role }}
                  span {{ p.name }}
                  small.ml-1.text-muted(v-if="p.id_no") {{ p.id_no }}
                small.text-primary.font-weight-bold(v-if="p.cellphone") {{ p.cellphone }}
        b-form-group(label="申請人 *" label-cols="3")
          b-input(
            v-model="editForm.applicant",
            placeholder="請輸入申請人姓名",
            :state="editForm.applicant.length > 0 ? true : null",
            required
          )
        b-form-group(label="手機號碼" label-cols="3")
          b-input-group
            template(#prepend)
              b-input-group-text
                lah-fa-icon(icon="mobile-screen")
            b-input(
              v-model="editForm.cellphone"
              placeholder="09xx-xxx-xxx (選填，供簡訊比對)"
              :state="editCellphoneState"
              @input="formatEditCellphone"
            )
          b-form-invalid-feedback(:state="editCellphoneState") 手機格式應為 09 開頭 10 碼數字
        b-form-group(label="簡訊狀態" label-cols="3")
          .d-flex.align-items-stretch
            b-select.flex-grow-1(
              v-model="editForm.sms_status"
              :options="smsStatusOptions"
              :disabled="isBusy"
            )
            b-button.ml-1.px-3.d-inline-flex.align-items-center.flex-shrink-0(
              v-if="editForm.cellphone && parseInt(editForm.sms_status || 0) === 0"
              variant="outline-info"
              title="手動檢測此筆案件於收件日之後的簡訊發送狀態"
              :disabled="isBusy"
              @click="checkSmsStatus(editRecord)"
            )
              b-spinner.mr-1(v-if="checkingSmsId === (editRecord && editRecord.id)" small)
              lah-fa-icon(v-else icon="magnifying-glass")
        b-form-group(label="備註說明" label-cols="3")
          b-textarea(
            v-model="editForm.note",
            placeholder="備註說明...",
            rows="3",
            max-rows="8"
          )
        .d-flex.justify-content-end.mt-3.pt-2.border-top
          lah-button.mr-2(
            variant="outline-secondary",
            icon="xmark",
            @click="$refs.edit_modal.hide()"
          ) 取消
          lah-button(
            type="submit",
            icon="floppy-disk",
            variant="warning",
            :disabled="isBusy || !editForm.applicant || editCasenoState === false || editCellphoneState === false"
          ) 更新

  //- 簡訊發送狀態手動檢測進度 Modal
  b-modal(
    ref="sms_check_modal"
    hide-footer
    no-close-on-backdrop
    :no-close-on-esc="smsCheckModal.busy"
    :hide-header-close="smsCheckModal.busy"
    centered
    scrollable
    size="lg"
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon.mr-2.text-info(icon="magnifying-glass")
        span 簡訊發送狀態檢測紀錄
    .p-2(v-if="smsCheckModal.item")
      //- 案件摘要資訊
      .d-flex.flex-wrap.align-items-center.justify-content-between.bg-light.rounded.p-2.mb-3.border
        div
          span.text-muted.small.mr-1 編號：
          strong.mr-3 {{ smsCheckModal.item.serial_no || '(無)' }}
          span.text-muted.small.mr-1 申請人：
          strong.mr-3 {{ smsCheckModal.item.applicant }}
        div
          span.text-muted.small.mr-1 手機號碼：
          strong.text-monospace.text-primary.mr-3 {{ smsCheckModal.item.cellphone }}
          span.text-muted.small.mr-1 收件日期：
          strong {{ $utils.toADDate(smsCheckModal.item.createtime * 1000, 'yyyy-LL-dd') }}

      //- 檢測步驟清單
      b-list-group.mb-3.shadow-sm
        b-list-group-item.d-flex.align-items-center.py-2.px-3(
          v-for="(step, idx) in smsCheckModal.steps"
          :key="idx"
        )
          b-spinner.mr-2.flex-shrink-0(v-if="step.state === 'running'" small variant="primary")
          lah-fa-icon.mr-2.text-success.flex-shrink-0(v-else-if="step.state === 'success'" icon="circle-check")
          lah-fa-icon.mr-2.text-warning.flex-shrink-0(v-else-if="step.state === 'warning'" icon="triangle-exclamation")
          lah-fa-icon.mr-2.text-danger.flex-shrink-0(v-else-if="step.state === 'error'" icon="circle-xmark")
          lah-fa-icon.mr-2.text-info.flex-shrink-0(v-else icon="circle-info")
          span(:class="{ 'font-weight-bold': idx === smsCheckModal.steps.length - 1 }") {{ step.text }}

      //- 查得之簡訊明細
      div(v-if="!smsCheckModal.busy && smsCheckModal.records.length > 0")
        .d-flex.align-items-center.mb-2
          lah-fa-icon.mr-1.text-secondary(icon="list-check")
          strong.small.text-secondary 收件日後查得之該手機簡訊明細（共 {{ smsCheckModal.records.length }} 筆）：
        .table-responsive(style="max-height: 240px; overflow-y: auto;")
          table.table.table-sm.table-bordered.table-striped.mb-0.small
            thead.thead-light.text-center
              tr
                th(style="width: 135px;") 發送時間
                th(style="width: 110px;") 業務類型
                th(style="width: 90px;") 傳送結果
                th 簡訊內容
            tbody
              tr(v-for="(rec, rIdx) in smsCheckModal.records" :key="rIdx")
                td.text-center.text-monospace.align-middle {{ rec.time_str }}
                td.text-center.align-middle
                  b-badge(:variant="rec.is_biz_match ? 'info' : 'secondary'") {{ rec.type }}
                td.text-center.align-middle
                  b-badge(:variant="rec.is_success ? 'success' : 'danger'") {{ rec.is_success ? `成功 (${rec.result})` : `失敗 (${rec.result})` }}
                td.text-left.align-middle {{ rec.content }}

      .d-flex.justify-content-end.mt-3.pt-2.border-top
        b-button(
          :variant="smsCheckModal.busy ? 'secondary' : 'primary'"
          :disabled="smsCheckModal.busy"
          @click="$refs.sms_check_modal.hide()"
        )
          b-spinner.mr-1(v-if="smsCheckModal.busy" small)
          lah-fa-icon.mr-1(v-else icon="check")
          span {{ smsCheckModal.busy ? '檢測進行中...' : '確認關閉' }}
</template>

<script>
import dynamicHeight from '~/mixins/dynamic-height-mixin'
import lahRegCaseDetail from '~/components/lah-reg-case-detail.vue'

export default {
  components: { lahRegCaseDetail },
  fetchOnServer: false,
  mixins: [dynamicHeight],
  data: () => ({
    keyword: '',
    typeFilter: 'all',
    smsFilter: 'all',
    filterOnlyMine: false,
    continuousIntake: true,
    editRecord: null,
    clickedCaseno: '',
    detailLoading: false,
    rows: [],
    dateRange: {
      begin: '',
      end: '',
      days: 0
    },
    contextMenu: {
      show: false,
      x: 0,
      y: 0,
      item: null
    },
    pagination: {
      perPage: 20,
      currentPage: 1
    },
    form: {
      applicant: '',
      receiving_type: 0,
      receiving_caseno: '',
      cellphone: '',
      sms_status: 0,
      note: '',
      receiver: ''
    },
    editForm: {
      applicant: '',
      receiving_type: 0,
      receiving_caseno: '',
      cellphone: '',
      sms_status: 0,
      note: '',
      receiver: ''
    },
    caseApplicants: [],
    caseApplicantsBusy: false,
    checkingSmsId: null,
    smsCheckModal: {
      busy: false,
      item: null,
      steps: [],
      records: []
    },
    receivingTypeMap: {
      0: '臨櫃',
      1: '隨案'
    },
    smsStatusMap: {
      0: '未發送',
      1: '發送成功',
      2: '發送失敗',
      3: '忽略'
    },
    smsStatusOptions: [
      { value: 0, text: '未發送 / 待比對' },
      { value: 1, text: '發送成功' },
      { value: 2, text: '發送失敗' },
      { value: 3, text: '忽略 / 免排查' }
    ],
    fields: [
      {
        key: 'serial_no',
        label: '編號',
        sortable: true,
        thStyle: { width: '110px' }
      },
      {
        key: 'applicant',
        label: '申請人',
        sortable: true,
        thStyle: { width: '120px' }
      },
      {
        key: 'cellphone',
        label: '手機號碼',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'sms_status',
        label: '簡訊狀態',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'receiving_type',
        label: '收件類型',
        sortable: true,
        thStyle: { width: '90px' }
      },
      {
        key: 'receiving_caseno',
        label: '案件號',
        sortable: true,
        thStyle: { width: '150px' }
      },
      {
        key: 'receiver',
        label: '收件人員',
        sortable: true,
        thStyle: { width: '120px' }
      },
      {
        key: 'createtime',
        label: '收件日期',
        sortable: true,
        thStyle: { width: '110px' }
      },
      {
        key: 'modifytime',
        label: '修改時間',
        sortable: true,
        thStyle: { width: '160px' }
      },
      {
        key: 'note',
        label: '備註',
        sortable: false,
        thStyle: { width: '220px' }
      }
    ]
  }),
  fetch () {
    if (this.isBusy) {
      this.warning('讀取中 ... 請稍後')
    } else {
      if (this.$utils.empty(this.dateRange.begin) || this.$utils.empty(this.dateRange.end)) {
        this.$utils.warn('dateRange is not ready ... postpone $fetch')
        this.timeout(this.$fetch, 250)
        return
      }
      this.reset()
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'property_alert_list',
        keyword: this.keyword,
        start_ts: +this.$utils.twToAdDateObj(this.dateRange.begin) / 1000,
        end_ts: +this.$utils.twToAdDateObj(this.dateRange.end) / 1000
      }).then(({ data }) => {
        if (Array.isArray(data.raw)) { this.rows = [...data.raw] }
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'info' : 'warning' })
      }).catch((err) => {
        this.alert(err.message)
      }).finally(() => {
        this.isBusy = false
      })
    }
  },
  head: {
    title: '地籍異動即時通收件管理-桃園市地政局'
  },
  computed: {
    dataReady () { return this.rows.length > 0 },
    queryCount () { return this.rows.length },
    filteredCount () { return this.filteredRows.length },
    foundText () {
      const message = `${this.dateRange.begin} ~ ${this.dateRange.end} 找到 ${this.queryCount} 筆「地籍異動即時通」資料`
      if (this.filteredCount !== this.queryCount) {
        return `${message}（快篩符合 ${this.filteredCount} 筆）`
      }
      return this.$utils.empty(this.keyword) ? message : `${message}【關鍵字：${this.keyword}】`
    },
    daysPeriod () { return this.dateRange.days || 0 },
    isWrongDaysPeriod () { return this.daysPeriod < 1 },
    todayTW () {
      return this.$utils.twDateStr(new Date())
    },
    firstDayOfYear () {
      return new Date(new Date().getFullYear(), 0, 1)
    },
    typeCountAll () { return this.rows.length },
    typeCountCounter () { return this.rows.filter(r => parseInt(r.receiving_type) === 0).length },
    typeCountWithCase () { return this.rows.filter(r => parseInt(r.receiving_type) === 1).length },
    smsCountPending () { return this.rows.filter(r => r.cellphone && parseInt(r.sms_status || 0) === 0).length },
    smsCountSuccess () { return this.rows.filter(r => r.cellphone && parseInt(r.sms_status) === 1).length },
    smsCountFail () { return this.rows.filter(r => r.cellphone && parseInt(r.sms_status) === 2).length },
    smsCountIgnored () { return this.rows.filter(r => parseInt(r.sms_status) === 3).length },
    smsCountNoPhone () { return this.rows.filter(r => !r.cellphone && parseInt(r.sms_status) !== 3).length },
    myCasesCount () {
      return this.rows.filter(r => r.receiver && r.receiver.toUpperCase() === (this.myid || '').toUpperCase()).length
    },
    filteredRows () {
      return this.rows.filter((item) => {
        // 只看我的案件篩選
        if (this.filterOnlyMine) {
          if (!item.receiver || item.receiver.toUpperCase() !== (this.myid || '').toUpperCase()) {
            return false
          }
        }
        // 類型篩選
        if (this.typeFilter !== 'all') {
          if (parseInt(item.receiving_type) !== parseInt(this.typeFilter)) {
            return false
          }
        }
        // 簡訊狀態篩選
        if (this.smsFilter === 'no_phone') {
          if (item.cellphone && item.cellphone.trim() !== '') {
            return false
          }
          if (parseInt(item.sms_status) === 3) {
            return false
          }
        } else if (this.smsFilter === '3') {
          if (parseInt(item.sms_status) !== 3) {
            return false
          }
        } else if (this.smsFilter !== 'all') {
          if (!item.cellphone || item.cellphone.trim() === '') {
            return false
          }
          if (parseInt(item.sms_status || 0) !== parseInt(this.smsFilter)) {
            return false
          }
        }
        // 關鍵字即時本地快篩 (比對姓名、案號、手機、備註、編號、收件人員編與姓名)
        if (!this.$utils.empty(this.keyword)) {
          const kw = this.keyword.trim().toLowerCase()
          const receiverName = (this.userNames && item.receiver ? this.userNames[item.receiver] : '') || ''
          const match =
            (item.applicant && item.applicant.toLowerCase().includes(kw)) ||
            (item.receiving_caseno && item.receiving_caseno.toLowerCase().includes(kw)) ||
            (item.cellphone && item.cellphone.toLowerCase().includes(kw)) ||
            (item.serial_no && item.serial_no.toLowerCase().includes(kw)) ||
            (item.receiver && item.receiver.toLowerCase().includes(kw)) ||
            (receiverName && receiverName.toLowerCase().includes(kw)) ||
            (item.note && item.note.toLowerCase().includes(kw))
          if (!match) {
            return false
          }
        }
        return true
      })
    },
    receivingTypeOptions () {
      return Object.entries(this.receivingTypeMap).map(([val, text]) => ({
        value: parseInt(val),
        text
      }))
    },
    xlsxData () {
      const fieldKeys = this.fields.map(field => field.key)
      return this.filteredRows.map((data) => {
        const obj = {}
        for (const [key, value] of Object.entries(data)) {
          if (fieldKeys.includes(key)) {
            const label = this.getLabel(key)
            if (key === 'createtime') {
              obj[label] = this.$utils.toADDate(value * 1000, 'yyyy-LL-dd')
            } else if (key === 'modifytime') {
              obj[label] = this.$utils.toADDate(value * 1000)
            } else if (key === 'receiving_type') {
              obj[label] = this.receivingTypeLabel(value)
            } else if (key === 'sms_status') {
              if (parseInt(value) === 3) {
                obj[label] = '忽略'
              } else if (!data.cellphone) {
                obj[label] = '無手機'
              } else {
                obj[label] = this.smsStatusText(value)
              }
            } else if (key === 'receiver') {
              obj[label] = value ? `${(this.userNames && this.userNames[value]) || value} (${value})` : ''
            } else {
              obj[label] = value || ''
            }
          }
        }
        return obj
      })
    },
    addCasenoState () {
      if (!this.form.receiving_caseno || this.form.receiving_type !== 1) { return null }
      return this.isCasenoValid(this.form.receiving_caseno)
    },
    editCasenoState () {
      if (!this.editForm.receiving_caseno || this.editForm.receiving_type !== 1) { return null }
      return this.isCasenoValid(this.editForm.receiving_caseno)
    },
    addCellphoneState () {
      if (!this.form.cellphone) { return null }
      const clean = this.form.cellphone.replace(/\D/g, '')
      return clean.length === 10 && clean.startsWith('09')
    },
    editCellphoneState () {
      if (!this.editForm.cellphone) { return null }
      const clean = this.editForm.cellphone.replace(/\D/g, '')
      return clean.length === 10 && clean.startsWith('09')
    }
  },
  watch: {
    daysPeriod (val) {
      if (val < 1) {
        this.alert('開始日期應小於或等於結束日期')
      }
    },
    editRecord (record) {
      if (record) {
        this.editForm.applicant = record.applicant || ''
        this.editForm.receiving_type = parseInt(record.receiving_type) || 0
        this.editForm.receiving_caseno = this.editForm.receiving_type === 1 ? (record.receiving_caseno || '') : ''
        this.editForm.cellphone = record.cellphone || ''
        this.editForm.sms_status = parseInt(record.sms_status || 0)
        this.editForm.note = record.note || ''
        this.editForm.receiver = record.receiver || ''
      }
    }
  },
  mounted () {
    document.addEventListener('click', this.hideContextMenu)
    document.addEventListener('keydown', this.onKeyDown)
  },
  beforeDestroy () {
    document.removeEventListener('click', this.hideContextMenu)
    document.removeEventListener('keydown', this.onKeyDown)
  },
  methods: {
    showDetail (caseno) {
      if (this.isBusy) { return }
      this.clickedCaseno = caseno
      this.detailLoading = true
      this.$refs.detail_modal.show()
    },
    showAdd () {
      if (this.isBusy) { return }
      this.resetAddForm()
      this.form.receiver = this.myid || ''
      this.$refs.add_modal.show()
      this.focusAddInput()
    },
    focusAddInput () {
      this.$nextTick(() => {
        if (this.form.receiving_type === 1) {
          this.$refs.addCasenoInput?.focus?.()
        } else {
          this.$refs.addApplicantInput?.focus?.()
        }
      })
    },
    resetAddForm () {
      this.form.applicant = ''
      this.form.receiving_caseno = ''
      this.form.cellphone = ''
      this.form.sms_status = 0
      this.form.note = ''
      this.form.receiver = this.myid || ''
      this.caseApplicants = []
      this.focusAddInput()
    },
    onAddTypeChange (val) {
      if (val !== 1) {
        this.form.receiving_caseno = ''
        this.caseApplicants = []
      }
      this.focusAddInput()
    },
    onEditTypeChange (val) {
      if (val !== 1) { this.editForm.receiving_caseno = '' }
    },
    fetchCaseApplicants (formKey) {
      const caseno = formKey === 'add' ? this.form.receiving_caseno : this.editForm.receiving_caseno
      if (!caseno) { return }
      this.caseApplicants = []
      this.caseApplicantsBusy = true
      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'get_case_applicants',
        caseno
      }).then(({ data }) => {
        if (Array.isArray(data.applicants) && data.applicants.length > 0) {
          this.caseApplicants = data.applicants
        } else {
          this.notify('查無代理人或權利人資料', { type: 'warning' })
        }
      }).catch((err) => {
        this.alert(err.message)
      }).finally(() => {
        this.caseApplicantsBusy = false
      })
    },
    selectApplicant (formKey, person) {
      const target = formKey === 'add' ? this.form : this.editForm
      target.applicant = person.name
      if (person.cellphone) {
        target.cellphone = person.cellphone
      }
      this.caseApplicants = []
      if (formKey === 'add') {
        this.$nextTick(() => {
          if (!target.cellphone) {
            this.$refs.addCellphoneInput?.focus?.()
          }
        })
      }
    },
    isCasenoValid (caseno) {
      if (!caseno) { return null }
      const raw = caseno.replace(/-/g, '')
      if (raw.length !== 13) { return false }
      const yearPart = raw.substring(0, 3)
      if (!/^\d{3}$/.test(yearPart)) { return false }
      const year = parseInt(yearPart)
      const currentRocYear = new Date().getFullYear() - 1911
      if (year > currentRocYear) { return false }
      const midPart = raw.substring(3, 7)
      if (!/^[a-zA-Z0-9]{4}$/.test(midPart)) { return false }
      const seqPart = raw.substring(7)
      if (!/^\d{6}$/.test(seqPart)) { return false }
      return true
    },
    casenoErrorMsg (caseno) {
      if (!caseno) { return '' }
      const raw = caseno.replace(/-/g, '')
      if (raw.length !== 13) { return `格式應為 XXX-XXXX-XXXXXX（目前去除「-」後共 ${raw.length}/13 碼）` }
      const yearPart = raw.substring(0, 3)
      if (!/^\d{3}$/.test(yearPart)) { return '前3碼應為民國年度數字' }
      const year = parseInt(yearPart)
      const currentRocYear = new Date().getFullYear() - 1911
      if (year > currentRocYear) { return `民國年度不可超過 ${currentRocYear} 年` }
      const midPart = raw.substring(3, 7)
      if (!/^[a-zA-Z0-9]{4}$/.test(midPart)) { return '中間4碼應為英數字組合（如 HA81）' }
      const seqPart = raw.substring(7)
      if (!/^\d{6}$/.test(seqPart)) { return '後6碼應為純數字' }
      return ''
    },
    formatCaseno (caseno) {
      if (!caseno) { return '' }
      const raw = caseno.replace(/-/g, '').toUpperCase()
      const yearRaw = raw.substring(0, 3).replace(/\D/g, '')
      if (!yearRaw) { return caseno }
      const currentRocYear = new Date().getFullYear() - 1911
      const yearNum = Math.min(parseInt(yearRaw) || 0, currentRocYear)
      const yearStr = String(yearNum).padStart(3, '0')
      const midStr = raw.substring(3, 7)
      if (midStr.length < 4) { return `${yearStr}-${midStr}` }
      const seqRaw = raw.substring(7).replace(/\D/g, '')
      const seqStr = seqRaw.padStart(6, '0').slice(-6)
      return `${yearStr}-${midStr}-${seqStr}`
    },
    onAddCasenoBlur () {
      if (this.form.receiving_caseno) {
        this.form.receiving_caseno = this.formatCaseno(this.form.receiving_caseno)
        if (this.isCasenoValid(this.form.receiving_caseno) && this.caseApplicants.length === 0) {
          this.fetchCaseApplicants('add')
        }
      }
    },
    onAddCasenoEnter () {
      this.onAddCasenoBlur()
    },
    onEditCasenoBlur () {
      if (this.editForm.receiving_caseno) {
        this.editForm.receiving_caseno = this.formatCaseno(this.editForm.receiving_caseno)
      }
    },
    formatAddCellphone () {
      if (this.form.cellphone) {
        this.form.cellphone = this.form.cellphone.replace(/[^\d-]/g, '')
      }
    },
    formatEditCellphone () {
      if (this.editForm.cellphone) {
        this.editForm.cellphone = this.editForm.cellphone.replace(/[^\d-]/g, '')
      }
    },
    copyCellphone (phone) {
      if (this.isBusy || !phone) { return }
      this.copyToClipboard(phone, `已複製手機號碼：${phone}`)
    },
    applyQuickDate (type) {
      if (this.isBusy) { return }
      const today = new Date()
      let start = new Date()
      let end = new Date()
      if (type === 'today') {
        start = today
        end = today
      } else if (type === 'yesterday') {
        start = new Date()
        start.setDate(today.getDate() - 1)
        end = new Date(start)
      } else if (type === '3days') {
        start = new Date()
        start.setDate(today.getDate() - 2)
        end = today
      } else if (type === '7days') {
        start = new Date()
        start.setDate(today.getDate() - 6)
        end = today
      } else if (type === 'thisMonth') {
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        end = today
      } else if (type === 'thisYear') {
        start = new Date(today.getFullYear(), 0, 1)
        end = today
      }
      if (this.$refs.datepicker) {
        this.$refs.datepicker.startDateObj = start
        this.$refs.datepicker.endDateObj = end
        this.$nextTick(() => {
          this.$fetch()
        })
      }
    },
    submitAdd () {
      this.isBusy = true
      let success = false
      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'add_property_alert',
        data: {
          applicant: this.form.applicant,
          receiving_type: this.form.receiving_type,
          receiving_caseno: this.form.receiving_caseno,
          cellphone: this.form.cellphone,
          sms_status: this.form.sms_status,
          note: this.form.note,
          receiver: this.form.receiver || this.myid || ''
        }
      }).then(({ data }) => {
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' })
        if (this.$utils.statusCheck(data.status)) {
          success = true
          if (this.continuousIntake) {
            this.resetAddForm()
          } else {
            this.$refs.add_modal.hide()
            this.resetAddForm()
          }
        }
      }).catch((err) => {
        this.alert(err.message)
      }).finally(() => {
        this.isBusy = false
        if (success) { this.$fetch() }
      })
    },
    quickUpdateSmsStatus (item, newStatus) {
      if (this.isBusy) { return }
      if (parseInt(item.sms_status) === newStatus) { return }
      const oldStatus = item.sms_status
      this.isBusy = true
      this.$set(item, 'sms_status', newStatus)
      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'edit_property_alert',
        id: item.id,
        data: {
          sms_status: newStatus
        }
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.notify(`已更新 ${item.applicant} 簡訊狀態為「${this.smsStatusText(newStatus)}」`, { type: 'success' })
        } else {
          this.$set(item, 'sms_status', oldStatus)
          this.notify(data.message, { type: 'warning' })
        }
      }).catch((err) => {
        this.$set(item, 'sms_status', oldStatus)
        this.alert(err.message)
      }).finally(() => {
        this.isBusy = false
      })
    },
    checkSmsStatus (item) {
      if (this.isBusy || !item || !item.cellphone) { return }
      this.hideContextMenu()
      const cleanPhone = (item.cellphone || '').replace(/\D/g, '')
      const intakeDateStr = item.createtime ? this.$utils.toADDate(item.createtime * 1000, 'yyyy-LL-dd') : '收件當日'
      const caseTitle = item.serial_no ? `${item.serial_no}（${item.applicant}）` : item.applicant

      this.isBusy = true
      this.checkingSmsId = item.id
      this.smsCheckModal.busy = true
      this.smsCheckModal.item = item
      this.smsCheckModal.records = []
      this.smsCheckModal.steps = [
        {
          state: 'success',
          text: `1. 連線 API 伺服器，準備檢測案件「${caseTitle}」`
        },
        {
          state: 'running',
          text: `2. 詢問是否有 ${intakeDateStr}（含當日）後 ${cleanPhone} 之簡訊紀錄...`
        }
      ]
      this.$refs.sms_check_modal?.show()

      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'check_reg_sms_status',
        biz_type: 'property_alert',
        id: item.id
      }).then(({ data }) => {
        this.$set(this.smsCheckModal.steps, 1, {
          state: 'success',
          text: `2. 詢問是否有 ${intakeDateStr}（含當日）後 ${cleanPhone} 之簡訊紀錄`
        })

        if (data.status < 0) {
          this.smsCheckModal.steps.push({
            state: 'error',
            text: `3. 查詢發生異常：${data.message}`
          })
          this.smsCheckModal.steps.push({
            state: 'warning',
            text: '4. 結束比對，未更新案件狀態'
          })
          return
        }

        const p = data.payload || {}
        const totalCount = p.total_count || 0
        const matchedCount = p.matched_count || 0
        const successCount = p.success_count || 0
        const failCount = p.fail_count || 0
        this.smsCheckModal.records = Array.isArray(p.sms_records) ? p.sms_records : []

        this.smsCheckModal.steps.push({
          state: matchedCount > 0 ? 'success' : 'warning',
          text: `3. 資料庫檢索完成：收件日後共找到 ${totalCount} 筆該手機簡訊，符合「地籍異動即時通」業務共 ${matchedCount} 筆`
        })

        if (successCount > 0) {
          this.smsCheckModal.steps.push({
            state: 'success',
            text: `4. 比對完成：有傳送成功紀錄（共 ${successCount} 筆成功，最新發送時間：${p.sms_time}）`
          })
        } else if (failCount > 0) {
          this.smsCheckModal.steps.push({
            state: 'warning',
            text: `4. 比對完成：無傳送成功紀錄（僅查得 ${failCount} 筆發送失敗紀錄，時間：${p.sms_time}）`
          })
        } else {
          this.smsCheckModal.steps.push({
            state: 'warning',
            text: '4. 比對完成：無傳送成功紀錄'
          })
        }

        if (p.updated) {
          this.$set(item, 'sms_status', p.sms_status)
          if (p.modifytime) {
            this.$set(item, 'modifytime', p.modifytime)
          }
          if (this.editRecord && this.editRecord.id === item.id) {
            this.editForm.sms_status = parseInt(p.sms_status)
          }
          const statusLabel = this.smsStatusText(p.sms_status)
          this.smsCheckModal.steps.push({
            state: parseInt(p.sms_status) === 1 ? 'success' : 'warning',
            text: `5. 結束比對，已自動更新狀態為「${statusLabel}」`
          })
        } else {
          this.smsCheckModal.steps.push({
            state: 'info',
            text: '5. 結束比對，查無符合紀錄，維持原狀態「未發送 / 待比對」'
          })
        }
      }).catch((err) => {
        this.$set(this.smsCheckModal.steps, 1, {
          state: 'error',
          text: `2. 詢問是否有 ${intakeDateStr}（含當日）後 ${cleanPhone} 之簡訊紀錄失敗`
        })
        this.smsCheckModal.steps.push({
          state: 'error',
          text: `3. 結束比對，連線發生錯誤：${err.message}`
        })
      }).finally(() => {
        this.checkingSmsId = null
        this.smsCheckModal.busy = false
        this.isBusy = false
      })
    },
    rowSelected (items) {
      if (this.isBusy) { return }
      if (Array.isArray(items) && items.length > 0) {
        this.popupEdit(items[0])
      }
    },
    popupEdit (record) {
      if (this.isBusy) { return }
      this.editRecord = record
      this.caseApplicants = []
      this.$refs.edit_modal?.show()
    },
    submitEdit () {
      if (!this.editRecord) { return }
      this.isBusy = true
      let success = false
      this.$axios.post(this.$consts.API.JSON.REG, {
        type: 'edit_property_alert',
        id: this.editRecord.id,
        data: {
          applicant: this.editForm.applicant,
          receiving_type: this.editForm.receiving_type,
          receiving_caseno: this.editForm.receiving_caseno,
          cellphone: this.editForm.cellphone,
          sms_status: this.editForm.sms_status,
          note: this.editForm.note,
          receiver: this.editForm.receiver || ''
        }
      }).then(({ data }) => {
        this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' })
        if (this.$utils.statusCheck(data.status)) {
          this.$refs.edit_modal.hide()
          success = true
        }
      }).catch((err) => {
        this.alert(err.message)
      }).finally(() => {
        this.isBusy = false
        if (success) { this.$fetch() }
      })
    },
    remove (item) {
      if (this.isBusy) { return }
      this.confirm(`
        請確認是否要刪除本筆資料？<br/>
        編號：${item.serial_no || '(無)'}<br/>
        申請人：${item.applicant}<br/>
        手機號碼：${item.cellphone || '(無)'}<br/>
        收件類型：${this.receivingTypeLabel(item.receiving_type)}<br/>
        收件案號：${item.receiving_caseno || '(無)'}
      `).then((YN) => {
        if (YN) {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.REG, {
            type: 'remove_property_alert',
            id: item.id
          }).then(({ data }) => {
            this.rows = this.rows.filter(row => row.id !== item.id)
            this.notify(data.message, { type: this.$utils.statusCheck(data.status) ? 'success' : 'warning' })
          }).catch((err) => {
            this.alert(err.message)
          }).finally(() => {
            this.isBusy = false
          })
        }
      })
    },
    reset () {
      this.rows = []
      this.pagination.currentPage = 1
    },
    getLabel (key) {
      const found = this.fields.find(item => this.$utils.equal(item.key, key))
      if (found && found.label) {
        return found.label
      }
      return key
    },
    receivingTypeLabel (val) {
      return this.receivingTypeMap[val] || `類型${val}`
    },
    receivingTypeVariant (val) {
      const map = {
        0: 'secondary',
        1: 'danger'
      }
      return map[val] || 'light'
    },
    smsStatusText (val) {
      return this.smsStatusMap[val] || '未發送'
    },
    smsStatusVariant (val) {
      const map = {
        0: 'warning',
        1: 'success',
        2: 'danger',
        3: 'secondary'
      }
      return map[val] || 'warning'
    },
    smsStatusIcon (val) {
      const map = {
        0: 'clock',
        1: 'circle-check',
        2: 'circle-xmark',
        3: 'bell-slash'
      }
      return map[val] || 'clock'
    },
    itemSmsText (item) {
      if (parseInt(item.sms_status) === 3) { return '忽略 / 免排查' }
      if (!item.cellphone) { return '無手機' }
      return this.smsStatusText(item.sms_status)
    },
    itemSmsVariant (item) {
      if (parseInt(item.sms_status) === 3) { return 'secondary' }
      if (!item.cellphone) { return 'secondary' }
      return this.smsStatusVariant(item.sms_status)
    },
    itemSmsIcon (item) {
      if (parseInt(item.sms_status) === 3) { return 'bell-slash' }
      if (!item.cellphone) { return 'phone-slash' }
      return this.smsStatusIcon(item.sms_status)
    },
    highlightText (text) {
      if (this.$utils.empty(text)) { return '' }
      if (!this.$utils.empty(this.keyword)) {
        return this.$utils.highlight(text, this.keyword, 'highlight-yellow')
      }
      return text
    },
    handleNoteText (note) {
      if (this.$utils.empty(note)) { return '' }
      if (!this.$utils.empty(this.keyword)) {
        note = this.$utils.highlight(note, this.keyword, 'highlight-yellow')
      }
      return note.replace(/(\n|\r\n)/g, '<br/>')
    },
    onRowContextMenu (item, index, event) {
      event.preventDefault()
      if (this.isBusy) { return }
      this.contextMenu.item = item
      const menuW = 160
      const x = event.clientX + menuW > window.innerWidth ? event.clientX - menuW : event.clientX
      this.contextMenu.x = x
      this.contextMenu.y = event.clientY
      this.contextMenu.show = true
    },
    hideContextMenu () {
      this.contextMenu.show = false
    },
    onKeyDown (e) {
      if (e.key === 'Escape') { this.hideContextMenu() }
    },
    ctxEdit () {
      this.hideContextMenu()
      if (this.contextMenu.item) { this.popupEdit(this.contextMenu.item) }
    },
    ctxDelete () {
      this.hideContextMenu()
      if (this.contextMenu.item) { this.remove(this.contextMenu.item) }
    }
  }
}
</script>

<style lang="scss" scoped>
.applicant-dropdown-list {
  max-height: 200px;
  overflow-y: auto;
}

.ctx-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 150px;
  overflow: hidden;

  .ctx-menu-item {
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    font-size: 0.9rem;
    white-space: nowrap;
    transition: background 0.15s;

    &:hover {
      background: #f0f0f0;
    }
  }

  .ctx-menu-divider {
    height: 1px;
    background: #dee2e6;
    margin: 2px 0;
  }
}

.ctx-fade-enter-active,
.ctx-fade-leave-active {
  transition: opacity 0.1s;
}
.ctx-fade-enter,
.ctx-fade-leave-to {
  opacity: 0;
}
</style>
