<template lang="pug">
div(v-cloak)
  //- 頁面標題列 (符合 48px 高度規範)
  lah-header: lah-transition(appear)
    .d-flex.justify-content-between.align-items-center.w-100
      .d-flex.align-items-center.header-left-group
        h3.my-auto.font-weight-bold.mb-0 員工資訊管理
        lah-button.ml-1(
          v-b-modal.help-modal
          icon="info"
          variant="outline-success"
          size="lg"
          no-border
          no-icon-gutter
          title="操作說明與權限規則"
        )

      .d-flex.align-items-center.flex-nowrap.text-nowrap.header-right-group
        //- 視圖切換按鈕群組
        b-button-group.mr-2(size="lg")
          lah-button(
            icon="id-card"
            :variant="viewMode === 'badge' ? 'primary' : 'outline-primary'"
            title="名牌分組視圖：視覺化檢視各部門與角色名牌"
            @click="viewMode = 'badge'"
          ) 名牌視圖
          lah-button(
            icon="table"
            :variant="viewMode === 'table' ? 'primary' : 'outline-primary'"
            title="表格快改視圖：高密度清單，支援行內直接修改 IP、分機與課室"
            @click="viewMode = 'table'"
          ) 表格快改
          lah-button(
            icon="satellite-dish"
            :variant="viewMode === 'radar' ? 'primary' : 'outline-primary'"
            title="網段 IP 雷達：視覺化盤點本所網段空閒 IP 與衝突狀態"
            @click="switchToRadarView"
          ) 網段雷達

        //- 管理工具按鈕群組
        b-button-group(size="lg")
          lah-button.mr-1.text-nowrap(
            icon="user-lock"
            :variant="lockedUserIds.length > 0 ? 'danger' : 'outline-secondary'"
            :badge-text="lockedUserIds.length > 0 ? String(lockedUserIds.length) : ''"
            badge-variant="light"
            title="即時檢測 AD 鎖定帳號"
            :disabled="isCheckingLocked"
            :busy="isCheckingLocked"
            @click="checkAdLockedUsers(true)"
          ) AD 鎖定檢測

          lah-button.mr-1.text-nowrap(
            icon="cogs"
            :variant="adConfigVariant"
            v-b-tooltip.hover
            :title="adConfigTooltip"
            @click="showAdConfigModal"
          ) AD 設定

          lah-button.mr-1.text-nowrap(
            icon="network-wired"
            variant="outline-info"
            title="獲取最近 7 天登入紀錄並依權重更新 IP"
            :disabled="isBusy"
            @click="getDynamicIPEntries"
          ) 更新 IP

          lah-button.mr-1.text-nowrap(
            icon="file-import"
            variant="outline-success"
            title="上傳「服務電話一覽表 (.xlsx / .csv)」智慧解析並批次更新人員職掌與分機"
            :disabled="isBusy"
            @click="openRosterImportModal"
          ) 匯入分機表

          lah-button-xlsx.mr-1(
            :jsons="xlsxData"
            header="員工資訊管理清單"
            size="lg"
          )

          lah-button(
            icon="user-plus"
            variant="outline-primary"
            title="手動新增使用者"
            no-icon-gutter
            @click="add"
          )

  //- 幫助說明 Modal
  lah-help-modal(:modal-id="'help-modal'" size="xl" modal-title="員工資訊管理 — 操作指南與權限說明")
    h5.font-weight-bold.text-primary 🚀 三大檢視與管理模式
    ul.pl-4
      li.mb-2
        span.font-weight-bold 📇 名牌視圖：
        span 升級版個人資訊微卡片，同時呈現「大頭照、姓名、ID、職稱/分機、IP 狀態」與「多重權限徽章」（一人身兼多職時完整顯示所有權限標籤），點擊卡片右側圖示可一鍵複製帳號或 IP。
      li.mb-2
        span.font-weight-bold 📋 表格快改：
        span 整合原 IP 清單並支援#[b 行內極速編輯]！可直接在表格中修改「課室」、「電腦 IP」與「分機」，按 #[code Enter] 或點擊 #[b.text-success ✓] 即可秒存，免去反覆開關彈窗與雙重確認。
      li.mb-2
        span.font-weight-bold 📡 網段雷達（驚喜功能）：
        span 自動掃描本所優先網段（#[code 1 ~ 254]），以燈號標示「🟢 空閒可用」、「🔵 已配發」、「🔴 多人衝突」與「🟡 近期動態登入」。點擊「🟢 空閒可用」格即可一鍵將該空閒 IP 指派給待設定同仁！

    hr

    h5.font-weight-bold.text-primary 💡 智慧診斷與效率工具
    ul.pl-4
      li.mb-2
        span.font-weight-bold 匯入分機表（XLSX 智慧解析）：
        span 支援直接上傳本所「服務電話一覽表 (.xlsx / .csv)」三欄並排印表格式（自動識別頂部主任/秘書/主管列、合併儲存格向下繼承職掌與共用分機、外駐工作站 #[code #] 分機擷取），並提供#[b 異動比對預覽表]讓你勾選與微調後再批次寫入！
        a.ml-2.font-weight-bold.text-success(
          href="/xlsx/桃園所最新電話一覽表.xlsx"
          download="桃園所最新電話一覽表.xlsx"
        )
          lah-fa-icon.mr-1(icon="file-excel")
          span 點此下載範例：桃園所最新電話一覽表.xlsx
      li.mb-2
        span.font-weight-bold 頂部診斷指標卡：
        span 點擊頂部任一指標卡（如「無效/缺失 IP」、「重複 IP 衝突」、「資料待補齊」、「AD 鎖定帳號」），即可一鍵過濾出問題名單。
      li.mb-2
        span.font-weight-bold 連續編輯切換：
        span 點擊同仁開啟完整編輯視窗後，可使用視窗頂部的 #[b 「◀ 上一位 / 下一位 ▶」] 按鈕（或鍵盤 #[code Alt + ← / →]）直接切換下一位同仁，且自動記憶擴充欄位展開狀態。
      li.mb-2
        span.font-weight-bold 全欄位搜尋快捷鍵：
        span 在頁面任意處按下 #[code /] 鍵即可快速聚焦搜尋框，支援同時搜尋姓名、ID、IP 尾碼（如 #[code .15]）、分機、課室、職稱、工作內容與手機，按 #[code Esc] 鍵一鍵清空。

    hr

    h5.font-weight-bold.text-primary 🏷️ 角色權限圖例
    .row.no-gutters
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-badge.mr-2.px-2.py-1(variant="secondary") 一般人員
        span.small 預設權限人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-badge.mr-2.px-2.py-1(variant="dark") 已離職
        span.small 已離職或停用人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-badge.mr-2.px-2.py-1(variant="success") 系統管理
        span.small 最高權限管理者
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-badge.mr-2.px-2.py-1(variant="primary") 主管
        span.small 課室主管人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-badge.mr-2.px-2.py-1(variant="warning") 研考
        span.small 研考相關人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-badge.mr-2.px-2.py-1(variant="info") 人員管理
        span.small 人事管理人員
      .col-6.col-md-4.p-1.d-flex.align-items-center
        b-badge.mr-2.px-2.py-1(variant="danger") 公告管理
        span.small 訊息公告發布人員

    hr

    h5.font-weight-bold.text-primary 🔐 權限生效規則
    p.small.text-muted.mb-2 使用者連線後，系統依其 IP 對應到使用者，最終權限為下列來源的#[b 聯集（只增加、不取消）]：
    ol.pl-4.small
      li.mb-1 #[b 個人權限]：本頁編輯視窗「權限」欄位勾選的項目。
      li.mb-1 #[b IP 角色]：「使用者角色管理」頁以電腦 IP 設定的角色，IP 無法對應到使用者時僅依此生效。
      li.mb-1 #[b 角色與部門預設權限]：見下表，不需另外勾選。
    .table-responsive
      table.table.table-sm.table-bordered.small.mb-2
        thead.thead-light
          tr
            th 對象
            th 判定依據
            th 預設權限
        tbody
          tr
            td 研考
            td 個人勾選「研考」或 IP 角色為研考
            td 發布公告
          tr
            td 主管
            td 個人勾選「主管」或 IP 角色為主管
            td 發布公告
          tr
            td 總務
            td IP 角色為總務
            td 發布公告
          tr
            td 人事人員
            td IP 角色為人事，或使用者部門為「人事室」
            td 發布公告、管理人員
          tr
            td 資訊課人員
            td 使用者部門為「資訊課」
            td 管理者（全部管理權限）、發布公告、管理人員
          tr
            td 超級管理者
            td IP 角色為超級管理者，或 127.0.0.1 / ::1
            td 全部權限

  //- =========================================================
  //- 1. 頂部互動式智慧診斷指標卡 (Diagnostic KPI Cards)
  //- =========================================================
  section.kpi-dashboard.mb-3
    .row.no-gutters.mx-n1
      //- 總覽指標
      .col-6.col-md-4.col-xl-2.px-1.mb-2
        .kpi-card.p-2.rounded.shadow-sm(
          :class="{ 'kpi-active kpi-primary': quickFilter === '' }"
          @click="setQuickFilter('')"
          title="點擊顯示全部載入人員"
        )
          .d-flex.justify-content-between.align-items-center
            .kpi-label.text-muted.small.font-weight-bold 目前載入名單
            lah-fa-icon.text-primary(icon="users" size="lg")
          .d-flex.align-items-baseline.mt-1
            span.h4.font-weight-bold.mb-0.text-primary {{ users.length }}
            span.small.text-muted.ml-1 人
            span.small.ml-auto.badge.badge-light 篩選出 {{ filteredUsers.length }} 人

      //- 無效 / 缺失 IP 指標
      .col-6.col-md-4.col-xl-2.px-1.mb-2
        .kpi-card.p-2.rounded.shadow-sm(
          :class="{ 'kpi-active kpi-danger': quickFilter === 'invalid_ip', 'border-danger': invalidIpUsers.length > 0 }"
          @click="setQuickFilter('invalid_ip')"
          title="點擊篩選「無 IP」或「尾數 .0」之異常名單"
        )
          .d-flex.justify-content-between.align-items-center
            .kpi-label.small.font-weight-bold(:class="invalidIpUsers.length > 0 ? 'text-danger' : 'text-muted'") 無效 / 缺失 IP
            lah-fa-icon(:icon="invalidIpUsers.length > 0 ? 'exclamation-circle' : 'check-circle'" :variant="invalidIpUsers.length > 0 ? 'danger' : 'success'" size="lg")
          .d-flex.align-items-baseline.mt-1
            span.h4.font-weight-bold.mb-0(:class="invalidIpUsers.length > 0 ? 'text-danger' : 'text-success'") {{ invalidIpUsers.length }}
            span.small.text-muted.ml-1 人
            span.small.ml-auto(:class="invalidIpUsers.length > 0 ? 'text-danger font-weight-bold' : 'text-muted'") {{ invalidIpUsers.length > 0 ? '點擊檢視' : '全數正常' }}

      //- 重複 IP 衝突指標
      .col-6.col-md-4.col-xl-2.px-1.mb-2
        .kpi-card.p-2.rounded.shadow-sm(
          :class="{ 'kpi-active kpi-warning': quickFilter === 'duplicate_ip', 'border-warning': duplicateIpUsers.length > 0 }"
          @click="setQuickFilter('duplicate_ip')"
          title="點擊篩選「多人共用同一個有效 IP」之衝突名單"
        )
          .d-flex.justify-content-between.align-items-center
            .kpi-label.small.font-weight-bold(:class="duplicateIpUsers.length > 0 ? 'text-warning-dark' : 'text-muted'") 重複 IP 衝突
            lah-fa-icon(icon="clone" :variant="duplicateIpUsers.length > 0 ? 'warning' : 'secondary'" size="lg")
          .d-flex.align-items-baseline.mt-1
            span.h4.font-weight-bold.mb-0(:class="duplicateIpUsers.length > 0 ? 'text-warning-dark' : 'text-secondary'") {{ duplicateIpUsers.length }}
            span.small.text-muted.ml-1 人 ({{ duplicateIpGroupCount }} 組)
            span.small.ml-auto.text-muted {{ duplicateIpUsers.length > 0 ? '點擊排解' : '無衝突' }}

      //- 資料待補齊指標 (未分配課室 / 無分機 / 無職稱)
      .col-6.col-md-4.col-xl-2.px-1.mb-2
        .kpi-card.p-2.rounded.shadow-sm(
          :class="{ 'kpi-active kpi-info': quickFilter === 'incomplete' }"
          @click="setQuickFilter('incomplete')"
          title="點擊篩選「未分配課室」、「無職稱」或「未填分機」的新進/待補資料人員"
        )
          .d-flex.justify-content-between.align-items-center
            .kpi-label.text-muted.small.font-weight-bold 資料待補齊
            lah-fa-icon(icon="user-edit" variant="info" size="lg")
          .d-flex.align-items-baseline.mt-1
            span.h4.font-weight-bold.mb-0.text-info {{ incompleteUsers.length }}
            span.small.text-muted.ml-1 人
            span.small.ml-auto.text-muted 缺單位/職稱/分機

      //- 特殊權限人員指標
      .col-6.col-md-4.col-xl-2.px-1.mb-2
        .kpi-card.p-2.rounded.shadow-sm(
          :class="{ 'kpi-active kpi-success': quickFilter === 'special_role' }"
          @click="setQuickFilter('special_role')"
          title="點擊篩選具備「系統管理 / 主管 / 研考 / 人事 / 公告」任一特殊權限的人員"
        )
          .d-flex.justify-content-between.align-items-center
            .kpi-label.text-muted.small.font-weight-bold 特殊角色權限
            lah-fa-icon(icon="user-shield" variant="success" size="lg")
          .d-flex.align-items-baseline.mt-1
            span.h4.font-weight-bold.mb-0.text-success {{ specialRoleUsers.length }}
            span.small.text-muted.ml-1 人
            span.small.ml-auto.text-muted 具管理/主管權限

      //- AD 帳號鎖定指標
      .col-6.col-md-4.col-xl-2.px-1.mb-2
        .kpi-card.p-2.rounded.shadow-sm(
          :class="{ 'kpi-active kpi-danger': quickFilter === 'ad_locked', 'border-danger': lockedUsersInList.length > 0 }"
          @click="handleAdLockedCardClick"
          title="點擊檢測或過濾目前 AD 被鎖定的員工帳號"
        )
          .d-flex.justify-content-between.align-items-center
            .kpi-label.small.font-weight-bold(:class="lockedUsersInList.length > 0 ? 'text-danger' : 'text-muted'") AD 帳號鎖定
            lah-fa-icon(:icon="isCheckingLocked ? 'spinner' : 'lock'" :spin="isCheckingLocked" :variant="lockedUsersInList.length > 0 ? 'danger' : 'secondary'" size="lg")
          .d-flex.align-items-baseline.mt-1
            template(v-if="adLockedChecked")
              span.h4.font-weight-bold.mb-0(:class="lockedUsersInList.length > 0 ? 'text-danger' : 'text-success'") {{ lockedUsersInList.length }}
              span.small.text-muted.ml-1 人
              span.small.ml-auto.text-primary(style="text-decoration: underline" @click.stop="checkAdLockedUsers(true)") 重新檢測
            template(v-else)
              span.small.font-weight-bold.text-primary.py-1 點擊立即檢測 AD 鎖定狀態

  //- =========================================================
  //- 2. 全方位複合智慧搜尋與篩選控制列 (Unified Filter Bar)
  //- =========================================================
  section.control-panel.bg-white.p-3.rounded.shadow-sm.mb-3.border
    //- 第一排：全欄位關鍵字搜尋 + 課室/職稱/角色/在職狀態複合篩選
    .d-flex.flex-wrap.align-items-center.justify-content-between
      //- 智慧搜尋框
      .search-box-wrapper.mr-2.mb-2.flex-grow-1(style="min-width: 260px; max-width: 420px")
        b-input-group(size="sm")
          b-input-group-prepend(is-text)
            lah-fa-icon.text-primary(icon="search")
          b-form-input(
            ref="searchInput"
            v-model="keyword"
            placeholder="搜尋姓名、ID、IP(如 .15)、分機、職稱、工作、手機... (按 / 聚焦)"
            trim
            @keydown.esc="keyword = ''"
          )
          b-input-group-append(v-if="keyword")
            b-button(variant="outline-secondary" title="清空關鍵字 (Esc)" @click="keyword = ''")
              lah-fa-icon(icon="times")

      //- 課室下拉篩選
      b-input-group.mr-2.mb-2(size="sm" style="width: 175px")
        b-input-group-prepend(is-text) 課室
        b-form-select(v-model="selectedUnit" :options="unitFilterOptions")
          template(#first)
            b-form-select-option(value="") 全部課室

      //- 職稱下拉篩選
      b-input-group.mr-2.mb-2(size="sm" style="width: 175px")
        b-input-group-prepend(is-text) 職稱
        b-form-select(v-model="selectedTitle" :options="titleFilterOptions")
          template(#first)
            b-form-select-option(value="") 全部職稱

      //- 角色權限下拉篩選
      b-input-group.mr-2.mb-2(size="sm" style="width: 180px")
        b-input-group-prepend(is-text) 權限
        b-form-select(v-model="selectedRole" :options="roleFilterOptions")

      //- 在職 / 離職狀態切換
      .d-flex.align-items-center.mb-2.mr-2
        b-form-checkbox-group(
          v-model="filter"
          :options="filterOptions"
          buttons
          button-variant="outline-secondary"
          size="sm"
        )

      //- 清除篩選按鈕
      .mb-2(v-if="hasActiveFilter")
        lah-button(
          icon="filter-circle-xmark"
          variant="danger"
          size="sm"
          title="重設所有搜尋與快篩條件"
          @click="resetAllFilters"
        ) 清除篩選 ({{ filteredUsers.length }})

    //- 第二排：依當前視圖模式切換專屬工具列
    hr.my-2(v-if="viewMode !== 'radar'")

    //- 2A. 名牌視圖專屬控制列
    .d-flex.flex-wrap.align-items-center.justify-content-between(v-if="viewMode === 'badge'")
      .d-flex.align-items-center.flex-wrap.my-1
        span.small.text-muted.font-weight-bold.mr-2 分組方式：
        b-form-radio-group(
          v-model="selectedGroup"
          :options="groupOptions"
          buttons
          button-variant="outline-dark"
          size="sm"
        )
        b-form-radio-group.ml-2(
          v-model="sortOrder"
          :options="sortOpts"
          buttons
          button-variant="outline-secondary"
          size="sm"
          title="切換分組排序方向"
        )
        b-button-group.ml-2(size="sm" v-if="categories.length > 1")
          b-button(variant="outline-secondary" title="展開所有分組" @click="toggleAllCategories(true)")
            lah-fa-icon.mr-1(icon="angles-down")
            span 全展開
          b-button(variant="outline-secondary" title="收合所有分組" @click="toggleAllCategories(false)")
            lah-fa-icon.mr-1(icon="angles-up")
            span 全收合

      .d-flex.align-items-center.flex-wrap.my-1
        b-form-checkbox.mr-3(v-model="showAvatar" switch) 大頭照
        b-form-checkbox.mr-3(v-model="showIp" switch) 電腦 IP
        b-form-checkbox.mr-2(v-model="showMeta" switch) 職稱與分機

    //- 2B. 表格快改視圖專屬控制列
    .d-flex.flex-wrap.align-items-center.justify-content-between(v-else-if="viewMode === 'table'")
      .small.text-muted.my-1
        lah-fa-icon.text-info.mr-1(icon="bolt")
        span #[b 極速模式]：直接在列內修改「課室」、「職稱」、「電腦 IP」或「分機」即可免彈窗秒存；點擊「姓名」或「編輯」可開啟詳細設定。
      .d-flex.align-items-center.my-1
        span.small.text-muted.mr-2 每頁顯示：
        b-form-input.text-center(
          v-model.number="tablePerPage"
          type="number"
          min="5"
          max="100"
          step="1"
          size="sm"
          style="width: 72px"
          title="每頁顯示筆數（最少 5 筆，最多 100 筆）"
          @change="clampTablePerPage"
          @blur="clampTablePerPage"
        )
        span.small.text-muted.ml-1 筆

  //- =========================================================
  //- 3A. 視圖一：現代化精緻名牌分組視圖 (Badge Grid View)
  //- =========================================================
  template(v-if="viewMode === 'badge'")
    //- 空資料提示
    .text-center.py-5.bg-white.rounded.shadow-sm.border(v-if="filteredUsers.length === 0")
      lah-fa-icon.text-muted.mb-2(icon="user-slash" size="3x")
      h5.text-muted 找不到符合目前篩選條件的員工
      p.small.text-muted 請嘗試調整關鍵字或清除頂部診斷快篩條件
      lah-button(v-if="hasActiveFilter" icon="rotate-left" variant="outline-primary" size="sm" @click="resetAllFilters") 重設所有篩選條件

    //- 分組列表
    section.category-section.mb-3(v-for="category in categories" :key="category.NAME || 'uncategorized'")
      .category-header.d-flex.align-items-center.px-3.py-2.rounded-top.border(
        @click="toggleCategory(category.NAME)"
        style="cursor: pointer"
      )
        lah-fa-icon.mr-2.text-primary(
          :icon="isCategoryOpen(category.NAME) ? 'folder-open' : 'folder'"
          regular
        )
        h6.mb-0.font-weight-bold {{ translateGroupName(category.NAME) }}
        b-badge.ml-2(pill variant="info") {{ category.LIST.length }} 人
        span.ml-auto.small.text-muted
          lah-fa-icon(:icon="isCategoryOpen(category.NAME) ? 'chevron-up' : 'chevron-down'")

      b-collapse(:visible="isCategoryOpen(category.NAME)")
        .category-body.p-2.bg-white.border.border-top-0.rounded-bottom.shadow-sm
          .user-card-grid
            .user-mini-card(
              v-for="user in category.LIST"
              :key="user.id"
              :class="cardClass(user)"
              :title="userCardTitle(user)"
              @click="edit(user)"
            )
              //- 左側角色色條
              .card-accent-bar(:class="accentBarClass(user)")

              //- 頭像區
              .card-avatar-wrap.mr-2(v-if="showAvatar")
                b-avatar(
                  variant="light"
                  size="3.1rem"
                  :src="avatarSrc(user)"
                )
                span.locked-badge(
                  v-if="isUserAdLocked(user.id)"
                  title="AD 帳號目前已鎖定！點擊右側鑰匙可立即解鎖"
                )
                  lah-fa-icon(icon="lock" variant="light")

              //- 卡片主要內容區
              .card-info-wrap.flex-grow-1.min-w-0
                //- 第一列：姓名 + 快捷複製按鈕 + 分機
                .d-flex.align-items-center.justify-content-between
                  .d-flex.align-items-center.min-w-0
                    .text-truncate(:title="userCardTitle(user)")
                      span.user-name-text.font-weight-bold(v-html="highlight(user.name)")
                    //- 懸浮快捷工具組 (無邊框，緊鄰名字後方)
                    .card-quick-actions.ml-1.flex-shrink-0(@click.stop)
                      b-button.p-0.px-1.border-0.text-danger(
                        v-if="isUserAdLocked(user.id)"
                        variant="link"
                        size="sm"
                        title="立即解除 AD 鎖定"
                        @click.stop="quickUnlockAd(user)"
                      )
                        lah-fa-icon(icon="unlock" size="xs")
                      b-button.p-0.px-1.border-0.text-secondary(
                        v-if="isValidIp(user)"
                        variant="link"
                        size="sm"
                        :title="`複製 IP 位址 (${user.ip})`"
                        @click.stop="copyToClipboard(user.ip, 'IP')"
                      )
                        lah-fa-icon(icon="copy" size="xs")
                      b-button.p-0.px-1.border-0.text-secondary(
                        variant="link"
                        size="sm"
                        :title="`複製員工帳號 ID (${user.id})`"
                        @click.stop="copyToClipboard(user.id, '帳號')"
                      )
                        lah-fa-icon(icon="id-badge" size="xs")
                  b-badge.ext-pill.ml-1.flex-shrink-0(
                    v-if="showMeta && user.ext"
                    variant="light"
                    title="分機號碼"
                  )
                    lah-fa-icon.mr-1(icon="phone" size="xs")
                    span(v-html="highlight(user.ext)")

                //- 第二列：單位職稱 + 多重角色權限徽章
                .d-flex.align-items-center.flex-wrap.mt-1(v-if="showMeta || roleBadges(user).length > 0")
                  span.small.text-muted.mr-1.text-truncate(
                    v-if="showMeta && (user.unit || user.title)"
                    style="max-width: 120px"
                    :title="`${user.unit || ''} ${user.title || ''} ${user.work ? '(' + user.work + ')' : ''}`"
                  )
                    span(v-if="selectedGroup !== 'unit' && user.unit" v-html="highlight(user.unit)")
                    span(v-if="selectedGroup !== 'unit' && user.unit && user.title") ·
                    span(v-if="user.title" v-html="highlight(user.title)")

                  //- 多重角色權限徽章 (完整呈現所有勾選之權限)
                  b-badge.role-mini-badge.mr-1(
                    v-for="rb in roleBadges(user)"
                    :key="rb.text"
                    :variant="rb.variant"
                  ) {{ rb.text }}

                //- 第三列：IP 顯示與衝突/異常警示
                .d-flex.align-items-center.justify-content-between.mt-1.small(v-if="showIp")
                  template(v-if="isValidIp(user)")
                    .d-flex.align-items-center.text-truncate
                      lah-fa-icon.mr-1.text-muted(icon="desktop" size="xs")
                      span.text-muted(v-html="highlight(ipParts(user)[0] + '.' + ipParts(user)[1])")
                      span.font-weight-bold.text-primary(v-html="highlight('.' + ipParts(user)[2] + '.' + ipParts(user)[3])")
                      b-badge.ml-1(
                        v-if="isDuplicateIp(user)"
                        variant="warning"
                        :title="`IP 衝突：與 ${getDuplicateIpPeers(user)} 共用同一 IP`"
                      ) 衝突({{ getDuplicateIpCount(user) }})
                  template(v-else)
                    span.ip-alert-style
                      lah-fa-icon.mr-1(icon="triangle-exclamation")
                      | {{ user.ip && user.ip.endsWith('.0') ? user.ip : '無效/未設 IP' }}

  //- =========================================================
  //- 3B. 視圖二：高密度表格 + 行內極速快改視圖 (Table Quick-Edit View)
  //- =========================================================
  section.bg-white.rounded.shadow-sm.border.p-2(v-else-if="viewMode === 'table'")
    b-table(
      :items="filteredUsers"
      :fields="tableFields"
      :per-page="safeTablePerPage"
      :current-page="tableCurrentPage"
      :sort-compare="tableSortCompare"
      :tbody-tr-class="tableRowClass"
      striped
      hover
      bordered
      responsive
      small
      head-variant="dark"
      show-empty
      empty-text="找不到符合目前篩選條件的員工"
    )
      //- 帳號欄
      template(#cell(id)="{ item }")
        .d-flex.align-items-center.justify-content-between
          div
            span.font-weight-bold.text-monospace(v-html="highlight(item.id)")
            b-badge.ml-1(v-if="isUserAdLocked(item.id)" variant="danger" title="AD 帳號已鎖定") 鎖定
          b-button.p-0.px-1.text-muted(
            variant="link"
            size="sm"
            title="複製帳號"
            @click.stop="copyToClipboard(item.id, '帳號')"
          )
            lah-fa-icon(icon="copy" size="xs")

      //- 姓名欄 (點擊開啟完整編輯)
      template(#cell(name)="{ item }")
        .d-flex.align-items-center.pointer(@click="edit(item)" title="點擊開啟完整編輯視窗")
          b-avatar.mr-2(size="sm" :src="avatarSrc(item)" variant="light")
          div
            .font-weight-bold.text-primary(v-html="highlight(item.name)")
            .small.text-muted(v-if="item.work" v-html="highlight(item.work)")

      //- 課室欄 (行內下拉秒存)
      template(#cell(unit)="{ item }")
        b-form-select(
          :value="item.unit"
          :options="inlineUnitOptions"
          size="sm"
          :disabled="isUserDisabled(item) || savingRowId === item.id"
          :class="{ 'border-danger bg-light-danger': !item.unit || item.unit === '未分配' }"
          @change="quickSaveDept(item, $event)"
        )

      //- 職稱欄 (行內下拉秒存)
      template(#cell(title)="{ item }")
        b-form-select(
          :value="item.title"
          :options="inlineTitleOptions"
          size="sm"
          :disabled="isUserDisabled(item) || savingRowId === item.id"
          :class="{ 'border-danger bg-light-danger': !item.title || item.title === '無資料', 'border-warning': item.title === '其他' }"
          @change="quickSaveTitle(item, $event)"
        )

      //- 電腦 IP 欄 (行內極速輸入 + 格式與衝突提示)
      template(#cell(ip)="{ item }")
        .d-flex.align-items-center
          b-input-group(size="sm" style="min-width: 195px; max-width: 230px")
            b-form-input.text-monospace(
              :value="getInlineEditValue(item, 'ip')"
              :disabled="isUserDisabled(item) || savingRowId === item.id"
              :state="getInlineIpState(item)"
              placeholder="192.168.X.X"
              @input="setInlineEditValue(item, 'ip', $event)"
              @keydown.enter.prevent="quickSaveIp(item)"
              @keydown.esc.prevent="resetInlineEdit(item, 'ip')"
            )
            b-input-group-append
              b-button(
                v-if="isInlineDirty(item, 'ip')"
                variant="success"
                title="儲存 IP (Enter)"
                :disabled="!isInlineIpValid(item) || savingRowId === item.id"
                @click="quickSaveIp(item)"
              )
                lah-fa-icon(icon="check")
              b-button(
                v-if="isInlineDirty(item, 'ip')"
                variant="outline-secondary"
                title="取消修改 (Esc)"
                @click="resetInlineEdit(item, 'ip')"
              )
                lah-fa-icon(icon="rotate-left")
              b-button(
                v-if="!isInlineDirty(item, 'ip') && isValidIp(item)"
                variant="outline-secondary"
                title="複製 IP"
                @click="copyToClipboard(item.ip, 'IP')"
              )
                lah-fa-icon(icon="copy")

          b-badge.ml-1(
            v-if="isDuplicateIp(item)"
            variant="warning"
            :title="`與 ${getDuplicateIpPeers(item)} 共用同一 IP`"
          ) 衝突({{ getDuplicateIpCount(item) }})
          b-badge.ml-1(
            v-else-if="!isValidIp(item)"
            variant="danger"
          ) 無效

      //- 分機欄 (行內極速輸入)
      template(#cell(ext)="{ item }")
        b-input-group(size="sm" style="width: 115px")
          b-form-input(
            :value="getInlineEditValue(item, 'ext')"
            :disabled="isUserDisabled(item) || savingRowId === item.id"
            placeholder="分機"
            @input="setInlineEditValue(item, 'ext', $event)"
            @keydown.enter.prevent="quickSaveExt(item)"
            @keydown.esc.prevent="resetInlineEdit(item, 'ext')"
          )
          b-input-group-append(v-if="isInlineDirty(item, 'ext')")
            b-button(
              variant="success"
              title="儲存分機 (Enter)"
              :disabled="savingRowId === item.id"
              @click="quickSaveExt(item)"
            )
              lah-fa-icon(icon="check")

      //- 權限角色欄
      template(#cell(authority)="{ item }")
        .d-flex.flex-wrap.align-items-center.pointer(@click="edit(item)" title="點擊調整權限設定")
          template(v-if="roleBadges(item).length > 0")
            b-badge.mr-1.mb-1(
              v-for="rb in roleBadges(item)"
              :key="rb.text"
              :variant="rb.variant"
            ) {{ rb.text }}
          b-badge.mb-1(v-else variant="light") 一般人員

      //- 操作欄
      template(#cell(actions)="{ item }")
        b-button-group(size="sm")
          lah-button(
            icon="pen-to-square"
            variant="outline-primary"
            title="開啟完整編輯視窗"
            @click="edit(item)"
          ) 編輯
          lah-button(
            v-if="!isUserDisabled(item)"
            icon="unlock"
            :variant="isUserAdLocked(item.id) ? 'danger' : 'outline-warning'"
            title="解除 AD 帳號鎖定"
            @click="quickUnlockAd(item)"
          ) 解鎖
          lah-button(
            v-if="!isUserDisabled(item)"
            icon="key"
            variant="outline-danger"
            title="重設 AD 密碼"
            no-icon-gutter
            @click="quickResetAdPw(item)"
          )

    //- 分頁控制
    .d-flex.justify-content-between.align-items-center.mt-2.px-2.flex-wrap
      .small.text-muted 共 {{ filteredUsers.length }} 筆符合條件（第 {{ tableCurrentPage }} 頁）
      b-pagination.mb-0(
        v-model="tableCurrentPage"
        :total-rows="filteredUsers.length"
        :per-page="safeTablePerPage"
        size="sm"
        align="right"
      )

  //- =========================================================
  //- 3C. 視圖三：【驚喜功能】本所網段 IP 佔用雷達 (Subnet IP Radar)
  //- =========================================================
  section.bg-white.rounded.shadow-sm.border.p-3(v-else-if="viewMode === 'radar'")
    .d-flex.flex-wrap.justify-content-between.align-items-center.mb-3
      div
        h5.font-weight-bold.mb-1
          lah-fa-icon.text-primary.mr-2(icon="satellite-dish")
          span 本所網段 IP 佔用雷達與空閒尋址器
        p.small.text-muted.mb-0
          | 視覺化盤點網段 #[code 1 ~ 254] 配發狀況。點擊 #[b.text-success 🟢 空閒可用] 格可一鍵將該 IP 指派給員工；點擊 #[b.text-primary 🔵 已配發] 或 #[b.text-danger 🔴 衝突] 格可檢視並編輯該員工。

      //- 雷達狀態篩選器
      b-form-radio-group(
        v-model="radarFilter"
        buttons
        button-variant="outline-secondary"
        size="sm"
      )
        b-form-radio(value="all") 全部 (254)
        b-form-radio(value="free") 🟢 空閒可用 ({{ currentSubnetStats.free }})
        b-form-radio(value="assigned") 🔵 已配發 ({{ currentSubnetStats.assigned }})
        b-form-radio(value="conflict") 🔴 衝突 ({{ currentSubnetStats.conflict }})
        b-form-radio(v-if="currentSubnetStats.dynamic > 0" value="dynamic") 🟡 動態未綁定 ({{ currentSubnetStats.dynamic }})

    //- 子網段切換 Tabs
    .d-flex.flex-wrap.align-items-center.mb-3.pb-2.border-bottom
      span.small.font-weight-bold.text-muted.mr-2 選擇網段：
      b-button.mr-2.mb-1(
        v-for="sub in availableSubnets"
        :key="sub.prefix"
        :variant="selectedSubnet === sub.prefix ? 'dark' : 'outline-dark'"
        size="sm"
        @click="selectedSubnet = sub.prefix"
      )
        span.font-weight-bold {{ sub.prefix }}.*
        b-badge.ml-1(:variant="selectedSubnet === sub.prefix ? 'info' : 'secondary'" pill) {{ sub.usedCount }} 人
        b-badge.ml-1(v-if="sub.conflictCount > 0" variant="danger" pill) 衝突 {{ sub.conflictCount }}

    //- 1 ~ 254 雷達矩陣
    .ip-radar-grid
      .ip-radar-cell(
        v-for="cell in filteredRadarCells"
        :key="cell.ip"
        :class="`radar-cell-${cell.status}`"
        :title="cell.tooltip"
        @click="handleRadarCellClick(cell)"
      )
        .d-flex.justify-content-between.align-items-center
          span.radar-octet.font-weight-bold .{{ cell.octet }}
          span.radar-status-dot(:class="`dot-${cell.status}`")
        .radar-cell-body.text-truncate.mt-1
          template(v-if="cell.status === 'conflict'")
            .font-weight-bold.text-danger ⚠️ {{ cell.users.length }}人衝突
            .radar-subtext.text-truncate {{ cell.users.map(u => u.name).join('、') }}
          template(v-else-if="cell.status === 'assigned'")
            .font-weight-bold {{ cell.users[0].name }}
            .radar-subtext.text-muted.text-truncate {{ cell.users[0].unit || cell.users[0].id }}
          template(v-else-if="cell.status === 'dynamic'")
            .font-weight-bold.text-warning-dark ⚡ 動態紀錄
            .radar-subtext.text-truncate {{ cell.dynamicEntry.entry_id }}
          template(v-else)
            .text-success.small 空閒可用
            .radar-subtext.text-muted 點擊指派/複製

  //- =========================================================
  //- 4. 空閒 IP 快速指派 Modal (由網段雷達觸發)
  //- =========================================================
  b-modal(
    id="assign-ip-modal"
    title="快速指派或複製空閒 IP"
    size="md"
    centered
    hide-footer
  )
    .text-center.p-3.bg-light.rounded.border.mb-3
      .small.text-muted 已選擇空閒可用 IP 位址
      .h3.font-weight-bold.text-success.my-1.text-monospace {{ selectedFreeIp }}
      lah-button.mt-1(
        icon="copy"
        variant="outline-secondary"
        size="sm"
        @click="copyToClipboard(selectedFreeIp, '空閒 IP')"
      ) 僅複製此 IP 位址

    b-form-group(
      label="直接將此 IP 配發給員工："
      label-for="assign-target-user"
      description="清單優先置頂「無效/未設 IP」與「IP 衝突」之在職同仁"
    )
      b-form-select(
        id="assign-target-user"
        v-model="assignTargetUserId"
        :options="assignableUserOptions"
      )
        template(#first)
          b-form-select-option(value="") -- 請選擇要配發此 IP 的員工 --

    .d-flex.justify-content-end.mt-3
      b-button.mr-2(variant="outline-secondary" size="sm" @click="hideModalById('assign-ip-modal')") 取消
      lah-button(
        icon="check"
        variant="success"
        size="sm"
        :disabled="!assignTargetUserId || isBusy"
        @click="confirmAssignFreeIp"
      ) 立即配發此 IP

  //- =========================================================
  //- 5. 強化版編輯使用者 Modal (支援上一位 / 下一位無縫切換)
  //- =========================================================
  b-modal(
    id="edit-user-modal"
    size="xl"
    hide-footer
    scrollable
    no-close-on-backdrop
  )
    template(#modal-title)
      .d-flex.align-items-center.flex-wrap
        span.font-weight-bold.mr-2 {{ editUserTitle }}
        b-badge(v-if="currentEditIndex !== -1" variant="info" pill) 第 {{ currentEditIndex + 1 }} / {{ navigableUsers.length }} 位

    //- 頂部快速導航列 (上一位 / 下一位 + 快速複製)
    .d-flex.justify-content-between.align-items-center.bg-light.p-2.rounded.border.mb-2(v-if="navigableUsers.length > 1")
      lah-button(
        icon="arrow-left"
        variant="outline-secondary"
        size="sm"
        :disabled="!hasPrevUser"
        title="切換至上一位員工 (Alt + ←)"
        @click="navigateEditUser(-1)"
      ) 上一位 {{ prevUserName }}

      .small.text-muted.d-none.d-md-block
        lah-fa-icon.mr-1(icon="keyboard" regular)
        span 可按 #[code Alt + ← / →] 切換同仁，按 #[code Ctrl + S] 極速存檔，按 #[code Ctrl + V] 貼上照片

      lah-button(
        icon="arrow-right"
        icon-append
        variant="outline-secondary"
        size="sm"
        :disabled="!hasNextUser"
        title="切換至下一位員工 (Alt + →)"
        @click="navigateEditUser(1)"
      ) 下一位 {{ nextUserName }}

    lah-user-edit-card(
      :raw="[clickedUser]"
      :has-next="hasNextUser"
      @saved="saved($event)"
      @save-and-next="savedAndNext($event)"
    )

  //- 新增使用者 Modal
  b-modal(id="add-user-modal" title="手動新增使用者" size="lg" hide-footer scrollable no-close-on-backdrop)
    lah-user-add-card(@added="added($event)" @added-continue="addedContinue($event)")

  //- AD 連線設定 Modal
  b-modal(
    id="ad-config-modal"
    title="AD 連線設定"
    size="lg"
    no-close-on-backdrop
  )
    lah-ad-config-card(:init-data="adConfig" @saved="adConfigSaved" @reload="loadAdConfig" @synced="$fetch")
    template(#modal-footer="{ close }")
      b-button(variant="outline-secondary" size="sm" @click="close()") 關閉

  //- IP 更新衝突選擇 Modal
  b-modal(id="ip-conflict-modal" title="IP 更新選擇" size="xl" hide-footer scrollable)
    p.text-muted 偵測到以下人員有多筆符合規則的 IP 紀錄。系統已過濾目前 IP，請點選欲套用的正確地址：
    b-table(:items="ipConflictList" :fields="conflictFields" striped hover bordered responsive)
      template(#cell(candidates)="{ item }")
        b-form-radio-group(v-model="item.selectedIp" stacked)
          b-form-radio(v-for="cand in item.candidates" :value="cand.ip" :key="cand.ip")
            span.mr-2.font-weight-bold {{ cand.ip }}
            span.small.text-muted (最後登入: {{ cand.timestamp }})

      template(#cell(action)="{ item }")
        lah-button(
          icon="check"
          size="sm"
          variant="outline-primary"
          :disabled="!item.selectedIp"
          @click="updateUserIp(item.id, item.selectedIp)"
        ) 套用此 IP

  //- =========================================================
  //- 6. 分機表 XLSX 智慧解析與異動預覽 Modal
  //- =========================================================
  b-modal(
    id="roster-import-modal"
    size="xl"
    scrollable
    no-close-on-backdrop
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon.mr-2.text-success(icon="file-excel" size="lg")
        span.font-weight-bold 分機表智慧解析與批次更新（工作職掌 / 分機）

    //- 隱藏檔案選擇器
    input.d-none(
      ref="rosterFileInput"
      type="file"
      accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
      @change="onRosterFileChange"
    )

    //- 尚未載入檔案或重新選檔拖曳區
    .roster-dropzone.p-4.text-center.rounded.mb-3(
      v-if="rosterDiffItems.length === 0 && !rosterParsing"
      :class="{ 'drag-active': rosterDragOver }"
      @click="triggerRosterFileSelect"
      @dragover.prevent="rosterDragOver = true"
      @dragleave.prevent="rosterDragOver = false"
      @drop.prevent="onRosterFileDrop"
    )
      lah-fa-icon.text-success.mb-2(icon="cloud-upload-alt" size="3x")
      h5.font-weight-bold.mb-1 點擊選擇或拖曳「服務電話一覽表 (.xlsx / .csv)」至此處
      p.text-muted.small.mb-2
        | 支援「桃園地政事務所服務電話一覽表」三欄並排印表格式（自動解析頂部主管列、合併儲存格職掌與共用分機、外駐站 #[code #] 分機）及一般平面表格
      .d-flex.justify-content-center.align-items-center.flex-wrap
        lah-button.mr-2(icon="folder-open" variant="success" size="sm" @click.stop="triggerRosterFileSelect") 選擇 Excel / CSV 檔案
        a.btn.btn-sm.btn-outline-secondary(
          href="/xlsx/桃園所最新電話一覽表.xlsx"
          download="桃園所最新電話一覽表.xlsx"
          @click.stop
        )
          lah-fa-icon.mr-1(icon="download")
          span 下載範例：桃園所最新電話一覽表.xlsx

    //- 解析中狀態
    .text-center.py-5(v-else-if="rosterParsing")
      b-spinner(variant="success" label="解析中")
      .mt-2.font-weight-bold.text-secondary 正在智慧解析分機表並比對所內人員資料...

    //- 解析完成：異動預覽與微調介面
    div(v-else)
      //- 檔案資訊與統計列
      .d-flex.flex-wrap.justify-content-between.align-items-center.bg-light.p-2.rounded.border.mb-2
        .d-flex.align-items-center.flex-wrap
          b-badge.mr-2.px-2.py-1(variant="dark")
            lah-fa-icon.mr-1(icon="file-alt")
            span {{ rosterFileName }}
          span.small.text-muted.mr-3 共擷取 #[b.text-dark {{ rosterTotalParsed }}] 筆人員資料
          b-button-group(size="sm")
            b-button(
              :variant="rosterViewTab === 'changed' ? 'primary' : 'outline-primary'"
              @click="rosterViewTab = 'changed'"
            )
              span ⚡ 有異動待更新
              b-badge.ml-1(variant="light") {{ rosterChangedItems.length }}
            b-button(
              :variant="rosterViewTab === 'unchanged' ? 'secondary' : 'outline-secondary'"
              @click="rosterViewTab = 'unchanged'"
            )
              span ✓ 資料已一致
              b-badge.ml-1(variant="light") {{ rosterUnchangedItems.length }}
            b-button(
              v-if="rosterUnmatchedNames.length > 0"
              :variant="rosterViewTab === 'unmatched' ? 'warning' : 'outline-warning'"
              @click="rosterViewTab = 'unmatched'"
            )
              span ⚠️ 未匹配名單
              b-badge.ml-1(variant="dark") {{ rosterUnmatchedNames.length }}

        .d-flex.align-items-center.mt-2.mt-md-0
          lah-button(
            icon="sync-alt"
            variant="outline-secondary"
            size="sm"
            title="重新上傳其他分機表檔案"
            :disabled="rosterSaving"
            @click="triggerRosterFileSelect"
          ) 重新選檔

      //- 欄位更新範圍與搜尋工具列
      .d-flex.flex-wrap.justify-content-between.align-items-center.mb-2.px-1(v-if="rosterViewTab !== 'unmatched'")
        .d-flex.align-items-center.flex-wrap
          b-form-checkbox.mr-3.font-weight-bold(
            v-model="rosterApplyWork"
            :disabled="rosterSaving"
          ) 同步更新「工作職掌」
          b-form-checkbox.mr-3.font-weight-bold(
            v-model="rosterApplyExt"
            :disabled="rosterSaving"
          ) 同步更新「分機號碼」
          b-button.mr-1(
            size="sm"
            variant="outline-primary"
            :disabled="rosterSaving"
            @click="toggleSelectAllRoster(true)"
          ) 全選有異動項 ({{ rosterChangedItems.length }})
          b-button(
            size="sm"
            variant="outline-secondary"
            :disabled="rosterSaving"
            @click="toggleSelectAllRoster(false)"
          ) 取消全選

        .d-flex.align-items-center.mt-2.mt-md-0(style="width: 240px;")
          b-input-group(size="sm")
            b-form-input(
              v-model.trim="rosterSearchKeyword"
              placeholder="篩選預覽姓名 / 職掌 / 分機..."
            )
            b-input-group-append(v-if="rosterSearchKeyword")
              b-button(variant="outline-secondary" @click="rosterSearchKeyword = ''") ×

      //- 批次寫入進度條
      .mb-2(v-if="rosterSaving")
        .d-flex.justify-content-between.small.font-weight-bold.mb-1
          span.text-success 正在批次寫入人員職掌與分機...
          span {{ rosterSaveProgress }} / {{ rosterSelectedItems.length }} 筆
        b-progress(:value="rosterSaveProgress" :max="Math.max(1, rosterSelectedItems.length)" variant="success" striped animated height="12px")

      //- 未匹配名單檢視
      .p-3.bg-light.rounded.border(v-if="rosterViewTab === 'unmatched'")
        p.small.text-muted.mb-2 以下為分機表中解析出、但在目前載入之人員清單中查無同名在職紀錄的項目（可能為已離職/調職或非人員項目）：
        .d-flex.flex-wrap
          .badge.badge-warning.p-2.mr-2.mb-2.text-left(
            v-for="(u, idx) in rosterUnmatchedNames"
            :key="idx"
            style="font-size: 0.85rem;"
          )
            span.font-weight-bold {{ u.name }}
            span.ml-1.text-dark ({{ u.work || '無職掌' }} / 分機 {{ u.ext || '無' }})

      //- 異動比對預覽表格
      b-table(
        v-else
        :items="rosterFilteredItems"
        :fields="rosterPreviewFields"
        small
        hover
        bordered
        responsive
        sticky-header="52vh"
        head-variant="light"
        show-empty
        empty-text="此分類下無符合條件之人員資料"
      )
        template(#cell(selected)="{ item }")
          b-form-checkbox(
            v-model="item.selected"
            :disabled="rosterSaving"
          )

        template(#cell(user)="{ item }")
          .d-flex.align-items-center
            .mr-2
              .font-weight-bold.text-dark {{ item.name }}
              .small.text-muted.text-monospace {{ item.id }}
            b-badge.ml-auto(variant="light" class="border") {{ item.unit || '未分配' }}

        template(#cell(workDiff)="{ item }")
          .d-flex.align-items-center
            .text-muted.small.mr-2(style="min-width: 95px;")
              span {{ item.oldWork || '(未填)' }}
            span.text-muted.mr-2 ➔
            b-form-input.flex-grow-1(
              v-model.trim="item.newWork"
              size="sm"
              :disabled="!rosterApplyWork || rosterSaving"
              :class="{ 'border-success bg-success-light font-weight-bold': rosterApplyWork && isRosterWorkChanged(item) }"
              placeholder="輸入工作職掌"
            )
            b-badge.ml-2(
              v-if="rosterApplyWork && isRosterWorkChanged(item)"
              variant="success"
            ) 異動

        template(#cell(extDiff)="{ item }")
          .d-flex.align-items-center
            .text-muted.small.mr-2.text-monospace(style="min-width: 45px;")
              span {{ item.oldExt || '(無)' }}
            span.text-muted.mr-2 ➔
            b-form-input(
              v-model.trim="item.newExt"
              size="sm"
              maxlength="4"
              style="width: 85px;"
              :disabled="!rosterApplyExt || rosterSaving"
              :class="{ 'border-primary bg-primary-light font-weight-bold text-monospace': rosterApplyExt && isRosterExtChanged(item) }"
              placeholder="分機"
            )
            b-badge.ml-2(
              v-if="rosterApplyExt && isRosterExtChanged(item)"
              variant="primary"
            ) 異動

    template(#modal-footer="{ close }")
      .d-flex.justify-content-between.align-items-center.w-100
        .small.text-muted
          span(v-if="rosterDiffItems.length > 0")
            | 已勾選 #[b.text-success {{ rosterSelectedItems.length }}] 筆準備更新（職掌異動 #[b {{ rosterWorkDiffCount }}] 筆、分機異動 #[b {{ rosterExtDiffCount }}] 筆）
          span(v-else) 請先選擇或拖入分機表檔案
        .d-flex.align-items-center
          b-button.mr-2(variant="outline-secondary" size="sm" :disabled="rosterSaving" @click="close()") 關閉
          lah-button(
            v-if="rosterDiffItems.length > 0"
            icon="check-double"
            variant="success"
            size="sm"
            :disabled="rosterSelectedItems.length === 0 || (!rosterApplyWork && !rosterApplyExt) || rosterSaving"
            :busy="rosterSaving"
            @click="executeRosterBatchUpdate"
          ) 確認批次更新 ({{ rosterSelectedItems.length }} 筆)
</template>

<script>
import lahAdConfigCard from '~/components/lah-ad-config-card.vue'
import lahUserAddCard from '~/components/lah-user-add-card.vue'
import lahUserEditCard from '~/components/lah-user-edit-card.vue'

export default {
  components: { lahUserEditCard, lahUserAddCard, lahAdConfigCard },
  middleware: ['isAdmin'],

  data: () => ({
    // 視圖模式: 'badge' (名牌視圖) | 'table' (表格快改) | 'radar' (網段雷達)
    viewMode: 'badge',

    // 頂部智慧診斷快篩: '' | 'invalid_ip' | 'duplicate_ip' | 'incomplete' | 'special_role' | 'ad_locked'
    quickFilter: '',

    // 複合篩選條件
    keyword: '',
    selectedUnit: '',
    selectedTitle: '',
    selectedRole: '',
    filter: ['on'],
    filterOptions: [
      { text: '在職', value: 'on' },
      { text: '離職', value: 'off' }
    ],

    // 名牌視圖設定
    selectedGroup: 'unit',
    groupOptions: [
      { text: '部門', value: 'unit' },
      { text: '角色', value: 'role' },
      { text: '職稱', value: 'title' },
      { text: '工作', value: 'work' },
      { text: '性別', value: 'sex' },
      { text: '電腦', value: 'ip' },
      { text: '未分類', value: '' }
    ],
    sortOrder: false,
    sortOpts: [
      { html: '↓', value: true },
      { html: '↑', value: false }
    ],
    showAvatar: true,
    showIp: true,
    showMeta: true,
    collapsedCategories: {},

    // 表格快改視圖設定
    tablePerPage: 15,
    tableCurrentPage: 1,
    tableFields: [
      { key: 'id', label: '帳號', sortable: true, thStyle: 'width: 115px' },
      { key: 'name', label: '姓名 / 職掌', sortable: true, thStyle: 'min-width: 140px' },
      { key: 'unit', label: '課室 (直接快改)', sortable: true, thStyle: 'width: 145px' },
      { key: 'title', label: '職稱 (直接快改)', sortable: true, thStyle: 'width: 145px' },
      { key: 'ip', label: '電腦 IP (Enter 秒存)', sortable: true, thStyle: 'width: 260px' },
      { key: 'ext', label: '分機 (Enter 秒存)', sortable: true, thStyle: 'width: 135px' },
      { key: 'authority', label: '個人權限徽章', sortable: true },
      { key: 'actions', label: '操作', class: 'text-center text-nowrap', thStyle: 'width: 150px' }
    ],
    inlineEdits: {},
    savingRowId: '',
    recentlySavedMap: {},

    // 網段雷達視圖設定
    selectedSubnet: '',
    radarFilter: 'all',
    selectedFreeIp: '',
    assignTargetUserId: '',

    // AD 鎖定帳號狀態
    lockedUserIds: [],
    adLockedChecked: false,
    isCheckingLocked: false,

    // 分機表 XLSX 智慧解析與異動預覽狀態
    rosterFileName: '',
    rosterDragOver: false,
    rosterParsing: false,
    rosterSaving: false,
    rosterSaveProgress: 0,
    rosterTotalParsed: 0,
    rosterDiffItems: [],
    rosterUnmatchedNames: [],
    rosterViewTab: 'changed',
    rosterSearchKeyword: '',
    rosterApplyWork: true,
    rosterApplyExt: true,
    rosterPreviewFields: [
      { key: 'selected', label: '勾選', class: 'text-center align-middle', thStyle: 'width: 55px' },
      { key: 'user', label: '對應員工 (姓名 / 帳號 / 課室)', class: 'align-middle', thStyle: 'width: 220px' },
      { key: 'workDiff', label: '工作職掌 (原職掌 ➔ 新職掌，可直接微調)', class: 'align-middle' },
      { key: 'extDiff', label: '分機號碼 (原分機 ➔ 新分機)', class: 'align-middle', thStyle: 'width: 230px' }
    ],

    // 核心資料與原有設定
    users: [],
    clickedUser: { id: '', name: '' },
    adConfig: {},
    dynamicIPEntries: [],
    ipConflictList: [],
    conflictFields: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'name', label: '姓名', sortable: true },
      { key: 'currentIp', label: '目前 IP' },
      { key: 'candidates', label: '候選 IP (請點選)' },
      { key: 'action', label: '操作', class: 'text-center' }
    ]
  }),

  fetch () {
    this.isBusy = true
    this.$axios.post(this.$consts.API.JSON.USER, {
      type: this.type
    }).then(({ data }) => {
      if (this.$utils.statusCheck(data.status)) {
        this.users = data.raw || []
        this.ensureDefaultSubnet()
      } else {
        this.notify(data.message, { type: 'warning' })
      }
    }).catch((err) => {
      this.$utils.error(err)
    }).finally(() => {
      this.isBusy = false
    })
    this.loadAdConfig()
  },

  head: { title: '員工資訊管理-桃園市地政局' },

  computed: {
    type () {
      if (this.filter.length === 2) { return 'all_users' }
      if (this.filter.includes('on')) { return 'on_board_users' }
      if (this.filter.includes('off')) { return 'off_board_users' }
      return ''
    },

    // --- 頂部診斷統計計算 ---
    invalidIpUsers () {
      return this.users.filter(u => !this.isUserDisabled(u) && !this.isValidIp(u))
    },

    duplicateIpMap () {
      const map = {}
      this.users.forEach((u) => {
        if (!this.isUserDisabled(u) && this.isValidIp(u)) {
          if (!map[u.ip]) { map[u.ip] = [] }
          map[u.ip].push(u)
        }
      })
      return map
    },

    duplicateIpUsers () {
      return this.users.filter(u => !this.isUserDisabled(u) && this.isDuplicateIp(u))
    },

    duplicateIpGroupCount () {
      return Object.values(this.duplicateIpMap).filter(list => list.length > 1).length
    },

    incompleteUsers () {
      return this.users.filter((u) => {
        if (this.isUserDisabled(u)) { return false }
        const noUnit = !u.unit || u.unit === '未分配' || u.unit === '無資料'
        const noTitle = !u.title || u.title === '無資料'
        const noExt = !u.ext
        return noUnit || noTitle || noExt
      })
    },

    specialRoleUsers () {
      return this.users.filter((u) => {
        const auth = this.getAuthority(u)
        return auth.isAdmin || auth.isChief || auth.isRAE || auth.isUserMgtStaff || auth.isNotifyMgtStaff
      })
    },

    lockedUsersInList () {
      if (this.lockedUserIds.length === 0) { return [] }
      const set = new Set(this.lockedUserIds.map(id => String(id).toUpperCase()))
      return this.users.filter(u => u.id && set.has(String(u.id).toUpperCase()))
    },

    // --- 下拉篩選選項 ---
    unitFilterOptions () {
      const counts = {}
      this.users.forEach((u) => {
        const key = u.unit || '未設定'
        counts[key] = (counts[key] || 0) + 1
      })
      return Object.keys(counts).sort().map(u => ({
        value: u === '未設定' ? '__EMPTY__' : u,
        text: `${u} (${counts[u]})`
      }))
    },

    inlineUnitOptions () {
      const defaultUnits = [
        '登記課', '測量課', '行政課', '地價課',
        '資訊課', '人事室', '會計室', '秘書室', '主任室'
      ]
      const dynamicUnits = this.users.map(u => u.unit).filter(Boolean)
      const merged = [...new Set([...defaultUnits, ...dynamicUnits])]
      return merged.map(u => ({ value: u, text: u }))
    },

    inlineTitleOptions () {
      const defaultTitles = [
        '業務助理', '約僱人員', '雇工', '工友', '書記',
        '助理員', '辦事員', '課員', '測量助理', '測量員',
        '技佐', '技工', '技士', '管理師', '助理管理師',
        '會計員', '人事管理員', '課長', '秘書', '主任',
        '臨時人員', '工讀生', '其他'
      ]
      const dynamicTitles = this.users.map(u => u.title).filter(Boolean)
      const merged = [...new Set([...defaultTitles, ...dynamicTitles])]
      return merged.map(t => ({ value: t, text: t }))
    },

    titleFilterOptions () {
      const counts = {}
      this.users.forEach((u) => {
        if (u.title) {
          counts[u.title] = (counts[u.title] || 0) + 1
        }
      })
      return Object.keys(counts).sort().map(t => ({
        value: t,
        text: `${t} (${counts[t]})`
      }))
    },

    roleFilterOptions () {
      return [
        { value: '', text: '全部角色權限' },
        { value: 'admin', text: '系統管理' },
        { value: 'chief', text: '主管' },
        { value: 'rae', text: '研考' },
        { value: 'user_mgt', text: '人員管理' },
        { value: 'notify_mgt', text: '公告管理' },
        { value: 'normal', text: '一般人員 (無特殊權限)' },
        { value: 'disabled', text: '已離職 / 停用' }
      ]
    },

    hasActiveFilter () {
      return Boolean(
        this.keyword ||
        this.quickFilter ||
        this.selectedUnit ||
        this.selectedTitle ||
        this.selectedRole
      )
    },

    // --- 主清單綜合過濾邏輯 ---
    filteredUsers () {
      const k = (this.keyword || '').toLowerCase()
      const lockedSet = new Set(this.lockedUserIds.map(id => String(id).toUpperCase()))

      return this.users.filter((u) => {
        // 1. 頂部指標快篩 (quickFilter)
        if (this.quickFilter === 'invalid_ip' && (this.isUserDisabled(u) || this.isValidIp(u))) {
          return false
        }
        if (this.quickFilter === 'duplicate_ip' && (this.isUserDisabled(u) || !this.isDuplicateIp(u))) {
          return false
        }
        if (this.quickFilter === 'incomplete') {
          if (this.isUserDisabled(u)) { return false }
          const noUnit = !u.unit || u.unit === '未分配' || u.unit === '無資料'
          const noTitle = !u.title || u.title === '無資料'
          const noExt = !u.ext
          if (!noUnit && !noTitle && !noExt) { return false }
        }
        if (this.quickFilter === 'special_role') {
          const auth = this.getAuthority(u)
          if (!(auth.isAdmin || auth.isChief || auth.isRAE || auth.isUserMgtStaff || auth.isNotifyMgtStaff)) {
            return false
          }
        }
        if (this.quickFilter === 'ad_locked') {
          if (!u.id || !lockedSet.has(String(u.id).toUpperCase())) {
            return false
          }
        }

        // 2. 課室過濾
        if (this.selectedUnit) {
          if (this.selectedUnit === '__EMPTY__') {
            if (u.unit) { return false }
          } else if (u.unit !== this.selectedUnit) {
            return false
          }
        }

        // 3. 職稱過濾
        if (this.selectedTitle && u.title !== this.selectedTitle) {
          return false
        }

        // 4. 角色權限過濾
        if (this.selectedRole) {
          const auth = this.getAuthority(u)
          if (this.selectedRole === 'admin' && !auth.isAdmin) { return false }
          if (this.selectedRole === 'chief' && !auth.isChief) { return false }
          if (this.selectedRole === 'rae' && !auth.isRAE) { return false }
          if (this.selectedRole === 'user_mgt' && !auth.isUserMgtStaff) { return false }
          if (this.selectedRole === 'notify_mgt' && !auth.isNotifyMgtStaff) { return false }
          if (this.selectedRole === 'disabled' && !auth.isDisabled) { return false }
          if (this.selectedRole === 'normal') {
            if (auth.isAdmin || auth.isChief || auth.isRAE || auth.isUserMgtStaff || auth.isNotifyMgtStaff || auth.isDisabled) {
              return false
            }
          }
        }

        // 5. 全欄位關鍵字搜尋 (ID、姓名、IP、分機、單位、職稱、工作內容、手機)
        if (k) {
          const matchId = u.id && String(u.id).toLowerCase().includes(k)
          const matchName = u.name && String(u.name).toLowerCase().includes(k)
          const matchIp = u.ip && String(u.ip).toLowerCase().includes(k)
          const matchExt = u.ext && String(u.ext).toLowerCase().includes(k)
          const matchUnit = u.unit && String(u.unit).toLowerCase().includes(k)
          const matchTitle = u.title && String(u.title).toLowerCase().includes(k)
          const matchWork = u.work && String(u.work).toLowerCase().includes(k)
          const matchCell = u.cell && String(u.cell).toLowerCase().includes(k)
          return matchId || matchName || matchIp || matchExt || matchUnit || matchTitle || matchWork || matchCell
        }

        return true
      })
    },

    categories () {
      switch (this.selectedGroup) {
        case 'unit': return this.groupBy('unit')
        case 'title': return this.groupBy('title')
        case 'work': return this.groupBy('work')
        case 'sex': return this.groupBy('sex')
        case 'ip': return this.groupBy('ip')
        case 'role': return this.groupByRole()
        default: return [{ NAME: '全部篩選結果', LIST: this.showIp ? this.usersByIpAsc : this.usersById }]
      }
    },

    usersByIpAsc () {
      return [...this.filteredUsers].sort((a, b) => {
        return this.$utils.ipv4Int(a.ip) - this.$utils.ipv4Int(b.ip)
      })
    },

    usersById () {
      return [...this.filteredUsers].sort((a, b) => String(a.id || '').localeCompare(String(b.id || '')))
    },

    // --- 編輯視窗上一位 / 下一位導航 (名牌視圖依分組視覺順序，表格視圖依篩選清單順序) ---
    navigableUsers () {
      if (this.viewMode === 'badge') {
        const list = []
        this.categories.forEach((cat) => {
          if (Array.isArray(cat.LIST)) {
            list.push(...cat.LIST)
          }
        })
        return list
      }
      return this.filteredUsers
    },
    currentEditIndex () {
      if (!this.clickedUser || !this.clickedUser.id) { return -1 }
      return this.navigableUsers.findIndex(u => u.id === this.clickedUser.id)
    },
    hasPrevUser () {
      return this.currentEditIndex > 0
    },
    hasNextUser () {
      return this.currentEditIndex !== -1 && this.currentEditIndex < this.navigableUsers.length - 1
    },
    prevUserName () {
      return this.hasPrevUser ? `(${this.navigableUsers[this.currentEditIndex - 1].name})` : ''
    },
    nextUserName () {
      return this.hasNextUser ? `(${this.navigableUsers[this.currentEditIndex + 1].name})` : ''
    },
    editUserTitle () {
      return `編輯 ${this.clickedUser.id} ${this.clickedUser.name} 資訊`
    },

    // --- AD 設定狀態 ---
    isAdConfigValid () {
      const c = this.adConfig
      return c.AD_HOST && c.AD_PORT && c.BASE_DN && c.QUERY_USER && c.QUERY_PASSWORD
    },
    adConfigVariant () { return this.isAdConfigValid ? 'outline-secondary' : 'outline-danger' },
    adConfigTooltip () { return this.isAdConfigValid ? 'AD 設定已完成' : 'AD 設定不完整，請點擊更新' },

    // --- 網段雷達 (Subnet IP Radar) 計算 ---
    availableSubnets () {
      const prefixMap = {}

      // 1. 依據本所站點代碼加入預設優先網段 (例如 HA -> 192.168.10 ~ 16)
      const site = this.site || ''
      const code = site.length > 1 ? site.charAt(1).toUpperCase() : ''
      if (code >= 'A' && code <= 'H') {
        const idx = code.charCodeAt(0) - 64
        const start = idx * 10
        for (let s = start; s <= start + 6; s++) {
          prefixMap[`192.168.${s}`] = { prefix: `192.168.${s}`, usedCount: 0, conflictCount: 0 }
        }
      }

      // 2. 掃描現有在職員工實際使用中的 192.168.X 網段
      this.users.forEach((u) => {
        if (!this.isUserDisabled(u) && this.isValidIp(u)) {
          const parts = u.ip.split('.')
          if (parts.length === 4) {
            const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`
            if (!prefixMap[prefix]) {
              prefixMap[prefix] = { prefix, usedCount: 0, conflictCount: 0 }
            }
            prefixMap[prefix].usedCount++
          }
        }
      })

      // 計算各網段衝突組數
      Object.keys(this.duplicateIpMap).forEach((ip) => {
        if (this.duplicateIpMap[ip].length > 1) {
          const parts = ip.split('.')
          const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`
          if (prefixMap[prefix]) {
            prefixMap[prefix].conflictCount++
          }
        }
      })

      const list = Object.values(prefixMap).sort((a, b) => {
        if (b.usedCount !== a.usedCount) { return b.usedCount - a.usedCount }
        return a.prefix.localeCompare(b.prefix, undefined, { numeric: true })
      })

      return list.length > 0 ? list : [{ prefix: '192.168.10', usedCount: 0, conflictCount: 0 }]
    },

    radarCells () {
      const prefix = this.selectedSubnet || (this.availableSubnets[0] && this.availableSubnets[0].prefix) || '192.168.10'
      const dynamicByIp = {}
      this.dynamicIPEntries.forEach((entry) => {
        if (entry.ip && (!dynamicByIp[entry.ip] || entry.timestamp > dynamicByIp[entry.ip].timestamp)) {
          dynamicByIp[entry.ip] = entry
        }
      })

      const cells = []
      for (let i = 1; i <= 254; i++) {
        const ip = `${prefix}.${i}`
        const assignedUsers = this.duplicateIpMap[ip] || []
        const dyn = dynamicByIp[ip] || null

        let status = 'free'
        let tooltip = `${ip} — 空閒可用（點擊可快速配發給員工或複製）`

        if (assignedUsers.length > 1) {
          status = 'conflict'
          tooltip = `${ip} — ⚠️ IP 衝突：${assignedUsers.map(u => `${u.id} ${u.name}(${u.unit || ''})`).join('、')}`
        } else if (assignedUsers.length === 1) {
          status = 'assigned'
          const u = assignedUsers[0]
          tooltip = `${ip} — ${u.id} ${u.name}（${u.unit || '未分配'} / ${u.title || ''} / 分機 ${u.ext || '無'}）`
        } else if (dyn) {
          status = 'dynamic'
          tooltip = `${ip} — 近期動態登入紀錄：${dyn.entry_id}（尚未綁定於在職人員資料）`
        }

        cells.push({
          octet: i,
          ip,
          status,
          users: assignedUsers,
          dynamicEntry: dyn,
          tooltip
        })
      }
      return cells
    },

    currentSubnetStats () {
      const stats = { free: 0, assigned: 0, conflict: 0, dynamic: 0 }
      this.radarCells.forEach((c) => {
        if (stats[c.status] !== undefined) { stats[c.status]++ }
      })
      return stats
    },

    filteredRadarCells () {
      if (this.radarFilter === 'all') { return this.radarCells }
      return this.radarCells.filter(c => c.status === this.radarFilter)
    },

    assignableUserOptions () {
      const activeUsers = this.users.filter(u => !this.isUserDisabled(u))
      const sorted = [...activeUsers].sort((a, b) => {
        const aNeed = !this.isValidIp(a) ? 0 : (this.isDuplicateIp(a) ? 1 : 2)
        const bNeed = !this.isValidIp(b) ? 0 : (this.isDuplicateIp(b) ? 1 : 2)
        if (aNeed !== bNeed) { return aNeed - bNeed }
        return String(a.id).localeCompare(String(b.id))
      })

      return sorted.map((u) => {
        let tag = ''
        if (!this.isValidIp(u)) {
          tag = '🚨 [無效/未設 IP] '
        } else if (this.isDuplicateIp(u)) {
          tag = '⚠️ [IP 衝突] '
        }
        return {
          value: u.id,
          text: `${tag}${u.id} ${u.name} (${u.unit || '未分配'} — 目前 IP: ${u.ip || '無'})`
        }
      })
    },

    // 供 lah-button-xlsx 匯出之 JSON 資料陣列
    xlsxData () {
      return this.filteredUsers.map(u => ({
        帳號: u.id || '',
        姓名: u.name || '',
        單位: u.unit || '',
        職稱: u.title || '',
        工作職掌: u.work || '',
        電腦IP: u.ip || '',
        分機: u.ext || '',
        手機: u.cell || '',
        到職日: u.onboard_date || '',
        角色權限: this.roleBadges(u).map(r => r.text).join('、') || '一般人員'
      }))
    },

    // --- 分機表 XLSX 異動預覽統計與篩選 ---
    rosterChangedItems () {
      return this.rosterDiffItems.filter(item => this.isRosterItemChanged(item))
    },

    rosterUnchangedItems () {
      return this.rosterDiffItems.filter(item => !this.isRosterItemChanged(item))
    },

    rosterFilteredItems () {
      const baseList = this.rosterViewTab === 'changed'
        ? this.rosterChangedItems
        : this.rosterUnchangedItems
      const k = (this.rosterSearchKeyword || '').toLowerCase()
      if (!k) { return baseList }
      return baseList.filter((item) => {
        return (
          (item.id && String(item.id).toLowerCase().includes(k)) ||
          (item.name && String(item.name).toLowerCase().includes(k)) ||
          (item.unit && String(item.unit).toLowerCase().includes(k)) ||
          (item.oldWork && String(item.oldWork).toLowerCase().includes(k)) ||
          (item.newWork && String(item.newWork).toLowerCase().includes(k)) ||
          (item.oldExt && String(item.oldExt).toLowerCase().includes(k)) ||
          (item.newExt && String(item.newExt).toLowerCase().includes(k))
        )
      })
    },

    rosterSelectedItems () {
      return this.rosterDiffItems.filter(item => item.selected && this.isRosterItemChanged(item))
    },

    rosterWorkDiffCount () {
      if (!this.rosterApplyWork) { return 0 }
      return this.rosterSelectedItems.filter(item => this.isRosterWorkChanged(item)).length
    },

    rosterExtDiffCount () {
      if (!this.rosterApplyExt) { return 0 }
      return this.rosterSelectedItems.filter(item => this.isRosterExtChanged(item)).length
    },

    safeTablePerPage () {
      const n = parseInt(this.tablePerPage, 10)
      if (isNaN(n)) { return 15 }
      return Math.min(100, Math.max(5, n))
    }
  },

  watch: {
    type (val) {
      this.users = []
      if (val !== '') { this.$fetch() }
    },
    viewMode (val) {
      localStorage.setItem('user_mgt_view_mode', val)
    },
    showAvatar (val) {
      localStorage.setItem('user_mgt_show_avatar', val)
    },
    showIp (val) {
      localStorage.setItem('user_mgt_show_ip', val)
    },
    showMeta (val) {
      localStorage.setItem('user_mgt_show_meta', val)
    },
    dynamicIPEntries (val) {
      this.$utils.warn('Dynamic IP entries fetched:', val.length)
    },
    // 當篩選條件變動並影響表格顯示資料時，重設當前頁碼為 1 (遵守 AGENTS.md 規範)
    filteredUsers () {
      this.tableCurrentPage = 1
    },
    tablePerPage () {
      this.tableCurrentPage = 1
      localStorage.setItem('user_mgt_table_per_page', this.safeTablePerPage)
    },
    rosterApplyWork () {
      this.syncRosterSelectionByDiff()
    },
    rosterApplyExt () {
      this.syncRosterSelectionByDiff()
    }
  },

  mounted () {
    const savedView = localStorage.getItem('user_mgt_view_mode')
    const savedPerPage = parseInt(localStorage.getItem('user_mgt_table_per_page'), 10)
    const avatar = localStorage.getItem('user_mgt_show_avatar')
    const ip = localStorage.getItem('user_mgt_show_ip')
    const meta = localStorage.getItem('user_mgt_show_meta')
    if (savedView && ['badge', 'table', 'radar'].includes(savedView)) {
      this.viewMode = savedView
    }
    if (!isNaN(savedPerPage) && savedPerPage >= 5 && savedPerPage <= 100) {
      this.tablePerPage = savedPerPage
    }
    if (avatar !== null) { this.showAvatar = avatar === 'true' }
    if (ip !== null) { this.showIp = ip === 'true' }
    if (meta !== null) { this.showMeta = meta === 'true' }

    // 註冊全域鍵盤快捷鍵 (/ 聚焦搜尋框、Alt + 左右鍵切換編輯員工)
    this.handleKeydown = (e) => {
      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : ''
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || (e.target && e.target.isContentEditable)

      if (e.key === '/' && !isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        if (this.$refs.searchInput && this.$refs.searchInput.$el) {
          this.$refs.searchInput.$el.focus()
        } else if (this.$refs.searchInput && this.$refs.searchInput.focus) {
          this.$refs.searchInput.focus()
        }
      } else if (e.altKey && e.key === 'ArrowLeft') {
        if (this.hasPrevUser) {
          e.preventDefault()
          this.navigateEditUser(-1)
        }
      } else if (e.altKey && e.key === 'ArrowRight') {
        if (this.hasNextUser) {
          e.preventDefault()
          this.navigateEditUser(1)
        }
      }
    }
    window.addEventListener('keydown', this.handleKeydown)
  },

  beforeDestroy () {
    if (this.handleKeydown) {
      window.removeEventListener('keydown', this.handleKeydown)
    }
  },

  methods: {
    // --- 頂部指標與篩選控制 ---
    clampTablePerPage () {
      this.tablePerPage = this.safeTablePerPage
    },

    setQuickFilter (filterName) {
      if (this.quickFilter === filterName) {
        this.quickFilter = ''
      } else {
        this.quickFilter = filterName
        // 若點擊「重複 IP 衝突」，在名牌視圖下自動切換為依「電腦」分組方便比對
        if (filterName === 'duplicate_ip' && this.viewMode === 'badge') {
          this.selectedGroup = 'ip'
        }
      }
    },

    resetAllFilters () {
      this.keyword = ''
      this.quickFilter = ''
      this.selectedUnit = ''
      this.selectedTitle = ''
      this.selectedRole = ''
      this.tableCurrentPage = 1
    },

    // --- 分組展開與收合 ---
    isCategoryOpen (name) {
      const key = name || '__EMPTY__'
      return this.collapsedCategories[key] !== true
    },

    toggleCategory (name) {
      const key = name || '__EMPTY__'
      this.$set(this.collapsedCategories, key, !this.collapsedCategories[key])
    },

    toggleAllCategories (expand) {
      const next = {}
      if (!expand) {
        this.categories.forEach((c) => {
          next[c.NAME || '__EMPTY__'] = true
        })
      }
      this.collapsedCategories = next
    },

    // --- AD 鎖定帳號檢測與一鍵解鎖 ---
    handleAdLockedCardClick () {
      if (!this.adLockedChecked) {
        this.checkAdLockedUsers(true)
      } else {
        this.setQuickFilter('ad_locked')
      }
    },

    checkAdLockedUsers (autoFilterIfFound = false) {
      this.isCheckingLocked = true
      this.$axios.post(this.$consts.API.JSON.USER, {
        type: 'ad_users_locked'
      }).then(({ data }) => {
        this.adLockedChecked = true
        if (this.$utils.statusCheck(data.status) && Array.isArray(data.raw)) {
          this.lockedUserIds = data.raw.map(u => u.id || u.sAMAccountName || u).filter(Boolean)
          if (this.lockedUserIds.length > 0) {
            this.notify(`偵測到 ${this.lockedUserIds.length} 個 AD 鎖定帳號`, { type: 'warning' })
            if (autoFilterIfFound && this.lockedUsersInList.length > 0) {
              this.quickFilter = 'ad_locked'
            }
          } else {
            this.notify('目前無任何 AD 帳號被鎖定', { type: 'success' })
            if (this.quickFilter === 'ad_locked') { this.quickFilter = '' }
          }
        } else {
          this.lockedUserIds = []
          this.notify('目前無被鎖定的 AD 帳號', { type: 'info' })
          if (this.quickFilter === 'ad_locked') { this.quickFilter = '' }
        }
      }).catch((err) => {
        this.$utils.error(err)
      }).finally(() => {
        this.isCheckingLocked = false
      })
    },

    isUserAdLocked (userId) {
      if (!userId || this.lockedUserIds.length === 0) { return false }
      const target = String(userId).toUpperCase()
      return this.lockedUserIds.some(id => String(id).toUpperCase() === target)
    },

    quickUnlockAd (user) {
      this.$bvModal.msgBoxConfirm(`確定要解除「${user.id} ${user.name}」的 AD 帳號鎖定嗎？`, {
        title: 'AD 解鎖確認',
        size: 'md',
        okVariant: 'warning',
        okTitle: '確定解鎖',
        cancelTitle: '取消',
        centered: true
      }).then((ans) => {
        if (!ans) { return }
        this.$bvModal.msgBoxConfirm(`是否要同時將「${user.id} ${user.name}」的 AD 密碼重設為預設值 (a.000000)？`, {
          title: '重設密碼選項',
          size: 'md',
          okVariant: 'danger',
          okTitle: '是，同時重設密碼',
          cancelVariant: 'outline-secondary',
          cancelTitle: '否，僅解鎖',
          centered: true
        }).then((resetAns) => {
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.USER, {
            type: 'ad_user_unlock',
            id: user.id,
            password: resetAns ? 'a.000000' : null
          }).then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              this.notify(data.message || `已解除 ${user.id} 鎖定`, { type: 'success' })
              this.lockedUserIds = this.lockedUserIds.filter(id => String(id).toUpperCase() !== String(user.id).toUpperCase())
            } else {
              this.notify(data.message || '解鎖失敗', { type: 'warning' })
            }
          }).catch(err => this.$utils.error(err)).finally(() => {
            this.isBusy = false
          })
        })
      })
    },

    quickResetAdPw (user) {
      this.$bvModal.msgBoxConfirm(`確定要重設「${user.id} ${user.name}」的 AD 密碼嗎？`, {
        title: '重設 AD 密碼',
        size: 'md',
        okVariant: 'danger',
        okTitle: '繼續',
        cancelTitle: '取消',
        centered: true
      }).then((ans) => {
        if (!ans) { return }
        const newPassword = prompt(`請輸入 ${user.id} ${user.name} 的新 AD 密碼：`, 'a.000000')
        if (newPassword !== null) {
          if (this.$utils.empty(newPassword)) {
            this.notify('密碼不得為空', { type: 'warning' })
            return
          }
          this.isBusy = true
          this.$axios.post(this.$consts.API.JSON.USER, {
            type: 'ad_pw_reset',
            id: user.id,
            password: newPassword
          }).then(({ data }) => {
            if (this.$utils.statusCheck(data.status)) {
              this.notify(data.message || `已重設 ${user.id} 密碼`, { type: 'success' })
            } else {
              this.notify(data.message || '重設密碼失敗', { type: 'warning' })
            }
          }).catch(err => this.$utils.error(err)).finally(() => {
            this.isBusy = false
          })
        }
      })
    },

    // --- 表格行內極速編輯 (Inline Quick Edit) ---
    getInlineEditValue (user, field) {
      if (this.inlineEdits[user.id] && this.inlineEdits[user.id][field] !== undefined) {
        return this.inlineEdits[user.id][field]
      }
      return user[field] || ''
    },

    setInlineEditValue (user, field, val) {
      if (!this.inlineEdits[user.id]) {
        this.$set(this.inlineEdits, user.id, {})
      }
      this.$set(this.inlineEdits[user.id], field, val ? String(val).trim() : '')
    },

    resetInlineEdit (user, field) {
      if (this.inlineEdits[user.id]) {
        this.$delete(this.inlineEdits[user.id], field)
      }
    },

    isInlineDirty (user, field) {
      if (!this.inlineEdits[user.id] || this.inlineEdits[user.id][field] === undefined) {
        return false
      }
      return String(this.inlineEdits[user.id][field]) !== String(user[field] || '')
    },

    isInlineIpValid (user) {
      const val = this.getInlineEditValue(user, 'ip')
      return this.$utils.isIPv4(val) || val === '::1'
    },

    getInlineIpState (user) {
      if (!this.isInlineDirty(user, 'ip')) {
        return null
      }
      return this.isInlineIpValid(user)
    },

    markRowSaved (userId) {
      this.$set(this.recentlySavedMap, userId, true)
      setTimeout(() => {
        this.$delete(this.recentlySavedMap, userId)
      }, 1600)
    },

    async quickSaveDept (user, newDept) {
      if (!newDept || newDept === user.unit) { return }
      this.savingRowId = user.id
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.USER, {
          type: 'upd_dept',
          id: user.id,
          dept: newDept
        })
        if (this.$utils.statusCheck(data.status)) {
          this.update({ id: user.id, unit: newDept })
          this.markRowSaved(user.id)
          this.notify(`${user.name} 課室已更新為「${newDept}」`, { type: 'success' })
        } else {
          this.warning(data.message || '更新課室失敗')
        }
      } catch (err) {
        this.$utils.error(err)
      } finally {
        this.savingRowId = ''
      }
    },

    async quickSaveTitle (user, newTitle) {
      if (!newTitle || newTitle === user.title) { return }
      this.savingRowId = user.id
      try {
        const payload = { ...user, title: newTitle }
        const { data } = await this.$axios.post(this.$consts.API.JSON.USER, {
          type: 'save_user_info',
          data: payload
        })
        if (this.$utils.statusCheck(data.status)) {
          this.update({ id: user.id, title: newTitle })
          this.markRowSaved(user.id)
          this.notify(`${user.name} 職稱已更新為「${newTitle}」`, { type: 'success' })
        } else {
          this.warning(data.message || '更新職稱失敗')
        }
      } catch (err) {
        this.$utils.error(err)
      } finally {
        this.savingRowId = ''
      }
    },

    async quickSaveIp (user) {
      if (!this.isInlineDirty(user, 'ip')) { return }
      if (!this.isInlineIpValid(user)) {
        this.notify('IP 格式不正確，請輸入合法的 IPv4 位址', { type: 'warning' })
        return
      }
      const newIp = this.getInlineEditValue(user, 'ip')
      this.savingRowId = user.id
      const res = await this.updateUserIp(user.id, newIp, false)
      if (res && this.$utils.statusCheck(res.status)) {
        this.resetInlineEdit(user, 'ip')
        this.markRowSaved(user.id)
      }
      this.savingRowId = ''
    },

    async quickSaveExt (user) {
      if (!this.isInlineDirty(user, 'ext')) { return }
      const newExt = this.getInlineEditValue(user, 'ext')
      if (newExt && !/^\d{3,4}$/.test(newExt)) {
        this.notify('分機號碼須為 3 ~ 4 位數字', { type: 'warning' })
        return
      }
      this.savingRowId = user.id
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.USER, {
          type: 'upd_ext',
          id: user.id,
          ext: newExt
        })
        if (this.$utils.statusCheck(data.status)) {
          this.update({ id: user.id, ext: newExt })
          this.resetInlineEdit(user, 'ext')
          this.markRowSaved(user.id)
          this.notify(`${user.name} 分機已更新為 ${newExt}`, { type: 'success' })
        } else {
          this.warning(data.message || '更新分機失敗')
        }
      } catch (err) {
        this.$utils.error(err)
      } finally {
        this.savingRowId = ''
      }
    },

    tableSortCompare (a, b, key) {
      if (key === 'ip') {
        const ipA = this.$utils.ipv4Int(a.ip) || 0
        const ipB = this.$utils.ipv4Int(b.ip) || 0
        return ipA - ipB
      }
      return null
    },

    tableRowClass (item, type) {
      if (!item || type !== 'row') { return '' }
      if (this.recentlySavedMap[item.id]) {
        return 'row-saved-flash'
      }
      if (this.isUserAdLocked(item.id)) {
        return 'table-danger'
      }
      return ''
    },

    // --- 網段 IP 雷達 (Subnet IP Radar) 邏輯 ---
    ensureDefaultSubnet () {
      if (!this.selectedSubnet && this.availableSubnets.length > 0) {
        this.selectedSubnet = this.availableSubnets[0].prefix
      }
    },

    switchToRadarView () {
      this.ensureDefaultSubnet()
      this.viewMode = 'radar'
    },

    handleRadarCellClick (cell) {
      if (cell.status === 'free' || cell.status === 'dynamic') {
        this.selectedFreeIp = cell.ip
        this.assignTargetUserId = ''
        this.showModalById('assign-ip-modal')
      } else if (cell.users && cell.users.length > 0) {
        this.edit(cell.users[0])
      }
    },

    async confirmAssignFreeIp () {
      if (!this.assignTargetUserId || !this.selectedFreeIp) { return }
      const res = await this.updateUserIp(this.assignTargetUserId, this.selectedFreeIp, false)
      if (res && this.$utils.statusCheck(res.status)) {
        this.hideModalById('assign-ip-modal')
      }
    },

    // --- 複製剪貼簿工具 ---
    copyToClipboard (text, label = '內容') {
      if (!text) { return }
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.notify(`已複製 ${label}「${text}」`, { type: 'info' })
        }).catch(() => {
          this.fallbackCopy(text, label)
        })
      } else {
        this.fallbackCopy(text, label)
      }
    },

    fallbackCopy (text, label) {
      try {
        const input = document.createElement('input')
        input.setAttribute('value', text)
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
        this.notify(`已複製 ${label}「${text}」`, { type: 'info' })
      } catch (e) {
        this.warning(`無法複製 ${label}`)
      }
    },

    // --- 關鍵字安全高亮 ---
    highlight (text) {
      if (!text || this.$utils.empty(this.keyword)) { return text }
      const escaped = String(this.keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${escaped})`, 'gi')
      return text.toString().replace(regex, '<span class="bg-warning text-dark font-weight-bold px-1 rounded">$1</span>')
    },

    translateGroupName (name) {
      if (parseInt(name) === 1) { return '男生' }
      if (parseInt(name) === 0) { return '女生' }
      return this.$utils.empty(name) ? '未設定' : name
    },

    groupBy (field) {
      const res = []
      const sortTarget = (this.showIp ? this.usersByIpAsc : this.usersById)
      sortTarget.forEach((item) => {
        const found = res.find(c => c.NAME === item[field])
        if (found) { found.LIST.push(item) } else { res.push({ NAME: item[field], LIST: [item] }) }
      })
      res.sort(this.sortOrder ? this.sortDesc : this.sortAsc)
      return res
    },

    groupByRole () {
      const res = [
        { NAME: '系統管理者', LIST: [] },
        { NAME: '主管', LIST: [] },
        { NAME: '研考', LIST: [] },
        { NAME: '人事管理者', LIST: [] },
        { NAME: '公告管理者', LIST: [] },
        { NAME: '一般使用者', LIST: [] }
      ]
      const sortTarget = (this.showIp ? this.usersByIpAsc : this.usersById)
      sortTarget.forEach((item) => {
        const auth = this.getAuthority(item)
        if (auth.isAdmin) { return res[0].LIST.push(item) }
        if (auth.isChief) { return res[1].LIST.push(item) }
        if (auth.isRAE) { return res[2].LIST.push(item) }
        if (auth.isUserMgtStaff) { return res[3].LIST.push(item) }
        if (auth.isNotifyMgtStaff) { return res[4].LIST.push(item) }
        return res[5].LIST.push(item)
      })
      res.sort(this.sortOrder ? this.sortDesc : this.sortAsc)
      return res.filter(g => g.LIST.length > 0)
    },

    sortAsc (a, b) {
      if (a.LIST.length === b.LIST.length) {
        return String(a.NAME || '').localeCompare(String(b.NAME || ''))
      }
      return b.LIST.length - a.LIST.length
    },

    sortDesc (a, b) { return this.sortAsc(b, a) },

    // --- 新增 / 編輯 / 上下一位切換 ---
    add () { this.showModalById('add-user-modal') },
    added (event) {
      this.users.unshift(event.detail)
      this.hideModalById('add-user-modal')
      this.notify(`新增 ${event.detail.id} ${event.detail.name || ''} 成功`, { type: 'success' })
    },
    addedContinue (event) {
      this.users.unshift(event.detail)
      this.notify(`已新增 ${event.detail.id} ${event.detail.name || ''}，請直接輸入下一位`, { type: 'success' })
    },
    edit (user) {
      this.clickedUser = { ...user }
      this.showModalById('edit-user-modal')
    },
    navigateEditUser (step) {
      const nextIdx = this.currentEditIndex + step
      if (nextIdx >= 0 && nextIdx < this.navigableUsers.length) {
        this.clickedUser = { ...this.navigableUsers[nextIdx] }
      }
    },
    saved (event) {
      this.update(event.detail)
      this.clickedUser = { ...this.clickedUser, ...event.detail }
      this.hideModalById('edit-user-modal')
      this.notify(`更新 ${this.clickedUser.id} 完成`, { type: 'success' })
    },
    savedAndNext (event) {
      const prevName = this.clickedUser.name
      this.update(event.detail)
      this.clickedUser = { ...this.clickedUser, ...event.detail }
      this.notify(`已儲存 ${prevName}，自動切換至下一位`, { type: 'success' })
      this.navigateEditUser(1)
    },
    update (userData) {
      const idx = this.users.findIndex(u => u.id === userData.id)
      if (idx !== -1) {
        this.users.splice(idx, 1, { ...this.users[idx], ...userData })
      }
    },

    showAdConfigModal () {
      this.loadAdConfig()
      this.showModalById('ad-config-modal')
    },
    loadAdConfig () {
      this.$axios.post(this.$consts.API.JSON.USER, { type: 'ad_config' }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) { this.adConfig = { ...data.raw } }
      }).catch(err => this.$utils.error(err))
    },
    adConfigSaved (newConfig) {
      this.adConfig = { ...newConfig }
      this.hideModalById('ad-config-modal')
    },

    // --- 更新 IP 核心邏輯 ---
    getDynamicIPEntries () {
      this.isBusy = true
      this.$axios.post(this.$consts.API.JSON.IP, {
        type: 'dynamic_ip_entries',
        offset: 604800 // 7 days
      }).then(({ data }) => {
        if (this.$utils.statusCheck(data.status)) {
          this.dynamicIPEntries = [...data.raw]
          this.notify('登入紀錄讀取成功，開始權重比對...', { type: 'success' })
          this.checkIpUpdates(this.dynamicIPEntries)
        } else {
          this.notify(data.message, { type: 'warning' })
        }
      }).catch(err => this.$utils.error(err)).finally(() => { this.isBusy = false })
    },

    isPriorityIp (ip) {
      if (!ip) { return false }
      const parts = ip.split('.').map(Number)
      if (parts[0] !== 192 || parts[1] !== 168) { return false }

      const site = this.site || ''
      const code = site.length > 1 ? site.charAt(1).toUpperCase() : ''

      if (code >= 'A' && code <= 'H') {
        const idx = code.charCodeAt(0) - 64
        const start = idx * 10
        const end = start + 6
        return parts[2] >= start && parts[2] <= end
      }

      return false
    },

    async checkIpUpdates (entries) {
      const userMap = {}
      entries.forEach((e) => {
        if (!userMap[e.entry_id]) { userMap[e.entry_id] = [] }
        userMap[e.entry_id].push(e)
      })

      const autoUpdateList = []
      const manualConflictList = []

      this.users.forEach((user) => {
        const records = userMap[user.id]
        if (!records) { return }

        const validDiffIps = [...new Set(records.map(r => r.ip))]
          .filter(ip => ip !== user.ip && this.isPriorityIp(ip))

        if (validDiffIps.length === 0) { return }

        if (validDiffIps.length === 1) {
          autoUpdateList.push({ id: user.id, ip: validDiffIps[0], name: user.name })
        } else {
          const candidates = validDiffIps.map((ip) => {
            const latest = records.filter(r => r.ip === ip).sort((a, b) => b.timestamp - a.timestamp)[0]
            return { ip, timestamp: this.$utils.phpTsToAdDateStr(latest.timestamp, true) }
          })
          manualConflictList.push({ id: user.id, name: user.name, currentIp: user.ip, candidates, selectedIp: null })
        }
      })

      if (autoUpdateList.length > 0) {
        const h = this.$createElement
        const messageNode = h('div', [
          h('p', `偵測到 ${autoUpdateList.length} 位人員具備內部網段之 IP 變動，是否執行同步？`),
          h('ul', { class: 'pl-4 text-left', style: { maxHeight: '300px', overflowY: 'auto' } },
            autoUpdateList.map(item => h('li', { class: 'mb-1' }, [
              h('span', { class: 'font-weight-bold mr-2' }, `${item.id} ${item.name}`),
              h('span', { class: 'text-muted' }, '➔'),
              h('span', { class: 'text-primary ml-2 font-weight-bold' }, item.ip)
            ]))
          )
        ])

        const ans = await this.$bvModal.msgBoxConfirm(messageNode, {
          title: 'IP 自動更新確認',
          size: 'md',
          okVariant: 'success',
          okTitle: '確認更新',
          cancelTitle: '取消',
          centered: true
        })

        if (ans) { await this.processUpdatesSequentially(autoUpdateList) }
      }

      if (manualConflictList.length > 0) {
        this.ipConflictList = manualConflictList
        this.showModalById('ip-conflict-modal')
      } else if (autoUpdateList.length === 0) {
        this.notify('目前無符合內部網段規則的 IP 變動。', { type: 'info' })
      }
    },

    async processUpdatesSequentially (list) {
      this.isBusy = true
      let count = 0
      for (const item of list) {
        const res = await this.updateUserIp(item.id, item.ip, true)
        if (res && this.$utils.statusCheck(res.status)) { count++ }
      }
      this.notify(`同步作業結束，共成功更新 ${count} 位人員 IP。`, { type: 'success' })
      this.isBusy = false
    },

    async updateUserIp (id, ip, silent = false) {
      try {
        const { data } = await this.$axios.post(this.$consts.API.JSON.USER, { type: 'upd_ip', id, ip })
        if (this.$utils.statusCheck(data.status)) {
          if (!silent) { this.notify(`${id} IP 已更新為 ${ip}`, { type: 'success' }) }
          this.update({ id, ip })
          if (this.ipConflictList.length > 0) {
            this.ipConflictList = this.ipConflictList.filter(item => item.id !== id)
            if (this.ipConflictList.length === 0) { this.hideModalById('ip-conflict-modal') }
          }
        } else if (!silent) {
          this.warning(`${id} 更新失敗: ${data.message}`)
        }
        return data
      } catch (err) {
        this.$utils.error(err)
        return null
      }
    },

    // --- UI 狀態與多重權限徽章輔助方法 ---
    isUserDisabled (user) {
      return this.getAuthority(user).isDisabled
    },

    isDuplicateIp (user) {
      if (!user || !this.isValidIp(user)) { return false }
      const list = this.duplicateIpMap[user.ip]
      return Array.isArray(list) && list.length > 1
    },

    getDuplicateIpCount (user) {
      const list = this.duplicateIpMap[user.ip]
      return Array.isArray(list) ? list.length : 0
    },

    getDuplicateIpPeers (user) {
      const list = this.duplicateIpMap[user.ip] || []
      return list.filter(u => u.id !== user.id).map(u => `${u.id} ${u.name}`).join('、')
    },

    roleBadges (user) {
      const auth = this.getAuthority(user)
      const badges = []
      if (auth.isDisabled) {
        badges.push({ text: '已離職', variant: 'dark' })
        return badges
      }
      if (auth.isAdmin) { badges.push({ text: '系統管理', variant: 'success' }) }
      if (auth.isChief) { badges.push({ text: '主管', variant: 'primary' }) }
      if (auth.isRAE) { badges.push({ text: '研考', variant: 'warning' }) }
      if (auth.isUserMgtStaff) { badges.push({ text: '人員管理', variant: 'info' }) }
      if (auth.isNotifyMgtStaff) { badges.push({ text: '公告管理', variant: 'danger' }) }
      return badges
    },

    cardClass (user) {
      const classes = []
      if (this.isUserDisabled(user)) {
        classes.push('card-disabled')
      }
      if (this.isUserAdLocked(user.id) || (!this.isUserDisabled(user) && !this.isValidIp(user))) {
        classes.push('card-alert')
      } else if (!this.isUserDisabled(user) && this.isDuplicateIp(user)) {
        classes.push('card-conflict')
      }
      return classes
    },

    accentBarClass (user) {
      const auth = this.getAuthority(user)
      if (auth.isDisabled) { return 'bg-secondary' }
      if (auth.isAdmin) { return 'bg-success' }
      if (auth.isChief) { return 'bg-primary' }
      if (auth.isRAE) { return 'bg-warning' }
      if (auth.isUserMgtStaff) { return 'bg-info' }
      if (auth.isNotifyMgtStaff) { return 'bg-danger' }
      return 'bg-light-border'
    },

    getAuthority (user) {
      const a = user.authority || 0
      return {
        isAdmin: (a & this.$consts.AUTHORITY.ADMIN) === this.$consts.AUTHORITY.ADMIN,
        isChief: (a & this.$consts.AUTHORITY.CHIEF) === this.$consts.AUTHORITY.CHIEF,
        isDisabled: (a & this.$consts.AUTHORITY.DISABLED) === this.$consts.AUTHORITY.DISABLED || !this.$utils.empty(user.offboard_date),
        isRAE: (a & this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION) === this.$consts.AUTHORITY.RESEARCH_AND_EVALUATION,
        isUserMgtStaff: (a & this.$consts.AUTHORITY.USER_MANAGEMENT) === this.$consts.AUTHORITY.USER_MANAGEMENT,
        isNotifyMgtStaff: (a & this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT) === this.$consts.AUTHORITY.ANNOUNCEMENT_MANAGEMENT
      }
    },

    avatarSrc (user) {
      return `/img/get_user_img.php?id=${user.id}_avatar&name=${user.name}_avatar&timestamp=${this.timestamp}`
    },

    isValidIp (user) {
      if (!user || !user.ip || typeof user.ip !== 'string') { return false }
      const parts = user.ip.split('.')
      if (parts.length !== 4 || parts[3] === '0') { return false }
      return parts.every(p => /^\d+$/.test(p) && Number(p) >= 0 && Number(p) <= 255)
    },

    ipParts (user) {
      return (user.ip || '').split('.')
    },

    userCardTitle (user) {
      if (!user) { return '' }
      const lines = [
        `帳號：${user.id || '無'}`,
        `姓名：${user.name || '無'}`,
        `課室：${user.unit || '未分配'}${user.title ? ' (' + user.title + ')' : ''}`
      ]
      if (user.work) { lines.push(`職掌：${user.work}`) }
      if (user.ext) { lines.push(`分機：${user.ext}`) }
      if (user.ip) { lines.push(`電腦 IP：${user.ip}`) }
      return lines.join('\n')
    },

    // =========================================================
    // 分機表 XLSX / CSV 智慧解析與異動預覽核心方法
    // =========================================================
    openRosterImportModal () {
      this.rosterDragOver = false
      this.rosterSearchKeyword = ''
      this.showModalById('roster-import-modal')
    },

    triggerRosterFileSelect () {
      if (this.$refs.rosterFileInput) {
        this.$refs.rosterFileInput.value = ''
        this.$refs.rosterFileInput.click()
      }
    },

    onRosterFileDrop (e) {
      this.rosterDragOver = false
      const files = e.dataTransfer && e.dataTransfer.files
      if (files && files.length > 0) {
        this.processRosterFile(files[0])
      }
    },

    onRosterFileChange (e) {
      const files = e.target && e.target.files
      if (files && files.length > 0) {
        this.processRosterFile(files[0])
      }
    },

    getExcelJS () {
      if (typeof window !== 'undefined' && window.ExcelJS) {
        return Promise.resolve(window.ExcelJS)
      }
      return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') {
          return reject(new Error('非瀏覽器環境無法載入 ExcelJS'))
        }
        const existing = document.querySelector('script[src="/js/exceljs.min.js"]')
        if (existing) {
          if (window.ExcelJS) { return resolve(window.ExcelJS) }
          existing.addEventListener('load', () => resolve(window.ExcelJS))
          existing.addEventListener('error', reject)
          return
        }
        const script = document.createElement('script')
        script.src = '/js/exceljs.min.js'
        script.onload = () => resolve(window.ExcelJS)
        script.onerror = () => reject(new Error('載入 /js/exceljs.min.js 失敗'))
        document.head.appendChild(script)
      })
    },

    normalizeRosterExt (raw) {
      if (!raw) { return '' }
      const s = String(raw).trim()
      if (s.includes('#')) {
        const afterHash = s.split('#').pop().trim()
        const m = afterHash.match(/\d{3,4}/)
        if (m) { return m[0] }
      }
      const m = s.match(/\d{3,4}/)
      return m ? m[0] : ''
    },

    extractCellString (cell) {
      if (!cell) { return '' }
      let v = cell.value
      if (v && typeof v === 'object') {
        if (Array.isArray(v.richText)) {
          v = v.richText.map(t => t.text || '').join('')
        } else if (v.result !== undefined) {
          v = v.result
        } else if (v.text !== undefined) {
          v = v.text
        }
      }
      return v == null ? '' : String(v).trim().replace(/\s+/g, ' ')
    },

    parseCsvRows (csvText) {
      const lines = String(csvText || '').split(/\r?\n/)
      return lines.map((line) => {
        const result = []
        let cur = ''
        let inQuotes = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (ch === '"') {
            inQuotes = !inQuotes
          } else if (ch === ',' && !inQuotes) {
            result.push(cur.trim().replace(/\s+/g, ' '))
            cur = ''
          } else {
            cur += ch
          }
        }
        result.push(cur.trim().replace(/\s+/g, ' '))
        return result
      }).filter(row => row.some(Boolean))
    },

    async processRosterFile (file) {
      if (!file) { return }
      const fileName = file.name || ''
      const ext = fileName.split('.').pop().toLowerCase()
      if (!['xlsx', 'csv'].includes(ext)) {
        this.notify('請上傳 .xlsx 或 .csv 格式的分機表檔案', { type: 'warning' })
        return
      }

      this.rosterFileName = fileName
      this.rosterParsing = true
      this.rosterDiffItems = []
      this.rosterUnmatchedNames = []

      try {
        let rows2D = []
        if (ext === 'csv') {
          const text = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = e => resolve(e.target.result)
            reader.onerror = reject
            reader.readAsText(file, 'utf-8')
          })
          rows2D = this.parseCsvRows(text)
        } else {
          const ExcelJS = await this.getExcelJS()
          const arrayBuffer = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = e => resolve(e.target.result)
            reader.onerror = reject
            reader.readAsArrayBuffer(file)
          })
          const wb = new ExcelJS.Workbook()
          await wb.xlsx.load(arrayBuffer)
          const ws = wb.worksheets[0]
          if (!ws) {
            throw new Error('Excel 檔案中找不到工作表')
          }
          ws.eachRow({ includeEmpty: false }, (row) => {
            const cols = []
            const maxCol = Math.max(9, row.cellCount || 9)
            for (let c = 1; c <= maxCol; c++) {
              cols.push(this.extractCellString(row.getCell(c)))
            }
            if (cols.some(Boolean)) {
              rows2D.push(cols)
            }
          })
        }

        const parsedEntries = this.parseRosterRows(rows2D)
        this.rosterTotalParsed = parsedEntries.length

        if (parsedEntries.length === 0) {
          this.notify('未從檔案中識別出有效的人員職掌與分機資料，請確認檔案內容', { type: 'warning' })
          return
        }

        this.buildRosterDiffPreview(parsedEntries)
      } catch (err) {
        this.$utils.error(err)
        this.notify(`解析分機表失敗：${err.message || '檔案格式異常'}`, { type: 'danger' })
      } finally {
        this.rosterParsing = false
      }
    },

    parseRosterRows (rows2D) {
      const parsedMap = new Map()
      const nonPersonPattern = /(專線|傳真|總機|語音|簡訊|電話|一覽表|閱覽處|儀器室|會議室|諮詢室|閱覽室|梯廳|櫃檯|櫃台|工作站|志工|姓名|使用者姓名)/

      const addEntry = (rawName, rawWork, rawExt) => {
        const name = String(rawName || '').replace(/\s+/g, '')
        const work = String(rawWork || '').trim()
        const ext = this.normalizeRosterExt(rawExt)
        if (!name || name.length < 2 || name.length > 5) { return }
        if (nonPersonPattern.test(name)) { return }
        if (!work && !ext) { return }
        parsedMap.set(name, { name, work, ext })
      }

      // 檢查是否為一般平面表格（表頭同時含「姓名」與「分機 / 職掌 / 工作」）
      let flatHeaderIdx = -1
      let colNameIdx = -1
      let colWorkIdx = -1
      let colExtIdx = -1

      for (let r = 0; r < Math.min(5, rows2D.length); r++) {
        const row = rows2D[r]
        const nIdx = row.findIndex(c => /^(姓名|使用者姓名)$/.test(c))
        const wIdx = row.findIndex(c => /^(工作職掌|職掌|工作)$/.test(c))
        const eIdx = row.findIndex(c => /^(分機|分機號碼)$/.test(c))
        if (nIdx !== -1 && (wIdx !== -1 || eIdx !== -1)) {
          flatHeaderIdx = r
          colNameIdx = nIdx
          colWorkIdx = wIdx
          colExtIdx = eIdx
          break
        }
      }

      if (flatHeaderIdx !== -1) {
        for (let r = flatHeaderIdx + 1; r < rows2D.length; r++) {
          const row = rows2D[r]
          const n = colNameIdx !== -1 ? row[colNameIdx] : ''
          const w = colWorkIdx !== -1 ? row[colWorkIdx] : ''
          const e = colExtIdx !== -1 ? row[colExtIdx] : ''
          addEntry(n, w, e)
        }
        return Array.from(parsedMap.values())
      }

      // 解析「桃園地政事務所服務電話一覽表」三欄並排印表格式
      const lastWork = ['', '', '']
      const lastExt = ['', '', '']

      rows2D.forEach((cols) => {
        // 1. 掃描頂部或行內複合字串（如「主任：陳振南 分機:100」、「會計室助理:官鈺如」+「分機:399」）
        const uniqueCells = []
        cols.forEach((txt, idx) => {
          if (txt && (idx === 0 || txt !== cols[idx - 1])) {
            uniqueCells.push({ txt, idx })
          }
        })

        for (let i = 0; i < uniqueCells.length; i++) {
          const item = uniqueCells[i].txt
          if (/(專線|傳真|總機|語音|簡訊)/.test(item) && !/分機/.test(item)) {
            continue
          }
          const inlineMatch = item.match(/^([^\d:：,，\s]{2,8})\s*[:：]\s*([\u4E00-\u9FA5]{2,4})(?:.*?分機\s*[:：]?\s*(\d{3,4}))?/)
          if (inlineMatch) {
            const work = inlineMatch[1].trim()
            const name = inlineMatch[2].trim()
            let ext = inlineMatch[3] || ''
            if (!ext && i + 1 < uniqueCells.length) {
              const nextTxt = uniqueCells[i + 1].txt
              const extMatch = nextTxt.match(/分機\s*[:：]?\s*(\d{3,4})/)
              if (extMatch) { ext = extMatch[1] }
            }
            if (work && name && ext) {
              addEntry(name, work, ext)
            }
          }
        }

        // 2. 掃描三大直欄區塊：[0,1,2]、[3,4,5]、[6,7,8]
        for (let b = 0; b < 3; b++) {
          const c0 = cols[b * 3] || ''
          const c1 = cols[b * 3 + 1] || ''
          const c2 = cols[b * 3 + 2] || ''
          if (!c0 && !c1 && !c2) { continue }
          if (c0 === c1 && c1 === c2) { continue }
          if (/(專線|傳真|總機|語音|簡訊|一覽表)/.test(c0) || /(專線|傳真|總機|語音|簡訊|一覽表)/.test(c1)) {
            continue
          }

          // 處理「職掌-姓名」合併格（例如「市府便民工作站-蕭羽辰」+「3322101#6151」）
          const dashMatch = c0.match(/^(.+?)[-－—]([\u4E00-\u9FA5]{2,4})$/)
          if (dashMatch && (!c1 || c1 === c0)) {
            const w = dashMatch[1].trim()
            const n = dashMatch[2].trim()
            const e = this.normalizeRosterExt(c2)
            addEntry(n, w, e)
            continue
          }

          let w = c0
          const n = c1
          let e = c2

          if (w && !/[:：]/.test(w)) {
            lastWork[b] = w
          } else if (!w && lastWork[b]) {
            w = lastWork[b]
          }

          if (e) {
            lastExt[b] = e
          } else if (!e && n && w === lastWork[b]) {
            e = lastExt[b]
          }

          if (n && (w || e) && n !== w) {
            addEntry(n, w, e)
          }
        }
      })

      return Array.from(parsedMap.values())
    },

    buildRosterDiffPreview (parsedEntries) {
      const diffItems = []
      const unmatched = []

      // 建立姓名對應表（優先匹配在職人員）
      const userByName = {}
      this.users.forEach((u) => {
        const cleanName = String(u.name || '').replace(/\s+/g, '')
        if (!cleanName) { return }
        if (!userByName[cleanName] || this.isUserDisabled(userByName[cleanName])) {
          userByName[cleanName] = u
        }
      })

      parsedEntries.forEach((entry) => {
        const matchedUser = userByName[entry.name]
        if (!matchedUser) {
          unmatched.push(entry)
          return
        }

        const oldWork = String(matchedUser.work || '').trim()
        const oldExt = String(matchedUser.ext || '').trim()
        const newWork = entry.work !== '' ? entry.work : oldWork
        const newExt = entry.ext !== '' ? entry.ext : oldExt
        const hasDiff = (newWork !== oldWork) || (newExt !== oldExt)

        diffItems.push({
          id: matchedUser.id,
          name: matchedUser.name,
          unit: matchedUser.unit || '',
          title: matchedUser.title || '',
          oldWork,
          newWork,
          oldExt,
          newExt,
          selected: hasDiff,
          rawUser: matchedUser
        })
      })

      this.rosterDiffItems = diffItems
      this.rosterUnmatchedNames = unmatched
      this.rosterViewTab = this.rosterChangedItems.length > 0 ? 'changed' : 'unchanged'
      this.notify(`分機表解析完成：匹配 ${diffItems.length} 位同仁，其中 ${this.rosterChangedItems.length} 筆有職掌或分機異動`, {
        type: this.rosterChangedItems.length > 0 ? 'success' : 'info'
      })
    },

    isRosterWorkChanged (item) {
      return String(item.newWork || '').trim() !== String(item.oldWork || '').trim()
    },

    isRosterExtChanged (item) {
      return String(item.newExt || '').trim() !== String(item.oldExt || '').trim()
    },

    isRosterItemChanged (item) {
      const workDiff = this.rosterApplyWork && this.isRosterWorkChanged(item)
      const extDiff = this.rosterApplyExt && this.isRosterExtChanged(item)
      return Boolean(workDiff || extDiff)
    },

    syncRosterSelectionByDiff () {
      this.rosterDiffItems.forEach((item) => {
        item.selected = this.isRosterItemChanged(item)
      })
    },

    toggleSelectAllRoster (selectChanged) {
      this.rosterDiffItems.forEach((item) => {
        item.selected = selectChanged ? this.isRosterItemChanged(item) : false
      })
    },

    async executeRosterBatchUpdate () {
      const targets = this.rosterSelectedItems
      if (targets.length === 0) { return }

      // 驗證分機格式 (3 ~ 4 碼數字或空白)
      if (this.rosterApplyExt) {
        const invalidExtItem = targets.find(item => item.newExt && !/^\d{3,4}$/.test(item.newExt))
        if (invalidExtItem) {
          this.notify(`「${invalidExtItem.name}」的分機號碼 (${invalidExtItem.newExt}) 須為 3 ~ 4 碼數字`, { type: 'warning' })
          return
        }
      }

      this.rosterSaving = true
      this.rosterSaveProgress = 0
      let successCount = 0
      let failCount = 0

      try {
        for (const item of targets) {
          const payload = {
            ...item.rawUser,
            work: this.rosterApplyWork ? String(item.newWork || '').trim() : item.rawUser.work,
            ext: this.rosterApplyExt ? String(item.newExt || '').trim() : item.rawUser.ext
          }
          try {
            const { data } = await this.$axios.post(this.$consts.API.JSON.USER, {
              type: 'save_user_info',
              data: payload
            })
            if (this.$utils.statusCheck(data.status)) {
              successCount++
              this.update({
                id: item.id,
                work: payload.work,
                ext: payload.ext
              })
              this.markRowSaved(item.id)
              item.oldWork = payload.work
              item.oldExt = payload.ext
              item.rawUser = { ...item.rawUser, work: payload.work, ext: payload.ext }
              item.selected = false
            } else {
              failCount++
            }
          } catch (e) {
            failCount++
          }
          this.rosterSaveProgress++
        }

        this.removeCache('user_mapping')
        this.removeCache('user_names')

        if (failCount === 0) {
          this.notify(`🎉 批次更新完成！已成功更新 ${successCount} 位同仁的職掌與分機`, { type: 'success' })
          this.hideModalById('roster-import-modal')
        } else {
          this.notify(`更新完成：成功 ${successCount} 筆，失敗 ${failCount} 筆`, { type: 'warning' })
        }
      } finally {
        this.rosterSaving = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// =========================================================
// 1. lah-header 48px 高度規範
// =========================================================
.header-left-group {
  ::v-deep > .btn {
    height: 48px !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}
.header-right-group {
  ::v-deep .btn-group > .btn,
  ::v-deep > .btn {
    height: 48px !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

// =========================================================
// 2. 頂部智慧診斷指標卡 (Diagnostic KPI Cards)
// =========================================================
.kpi-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important;
  }

  &.kpi-active {
    border-width: 2px;
    background-color: #f8fafc;
  }
  &.kpi-primary { border-color: #007bff !important; background-color: #f0f7ff; }
  &.kpi-danger  { border-color: #dc3545 !important; background-color: #fff5f5; }
  &.kpi-warning { border-color: #f59e0b !important; background-color: #fffbeb; }
  &.kpi-info    { border-color: #17a2b8 !important; background-color: #f0fcff; }
  &.kpi-success { border-color: #28a745 !important; background-color: #f2fbf4; }
}

.text-warning-dark {
  color: #b45309 !important;
}

.bg-light-danger {
  background-color: #fff5f5 !important;
}

// =========================================================
// 3. 分組與現代化微卡片名牌 (Mini Profile Cards)
// =========================================================
.category-header {
  background-color: #f8f9fa;
  transition: background-color 0.15s ease;
  &:hover {
    background-color: #edf2f7;
  }
}

.user-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(265px, 1fr));
  gap: 0.6rem;
}

.user-mini-card {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.55rem 0.65rem 0.55rem 0.85rem;
  background-color: #ffffff;
  border: 1px solid #dee2e6;
  border-radius: 0.5rem;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
    border-color: #80bdff;

    .card-quick-actions {
      opacity: 1;
    }
  }

  &.card-disabled {
    background-color: #f1f3f5;
    opacity: 0.78;
  }

  &.card-alert {
    border-color: #f5c2c7;
    background-color: #fffdfd;
  }

  &.card-conflict {
    border-color: #ffecb5;
    background-color: #fffdf9;
  }
}

.card-accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
}

.bg-light-border {
  background-color: #cbd5e1;
}

.card-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.locked-badge {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #dc3545;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  box-shadow: 0 0 0 2px #fff;
}

.user-id-text {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #495057;
  font-size: 0.9rem;
}

.user-name-text {
  font-size: 0.98rem;
  color: #212529;
}

.ext-pill {
  font-weight: 600;
  color: #495057;
  border: 1px solid #dee2e6;
}

.role-mini-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.18em 0.45em;
}

.card-quick-actions {
  opacity: 0.35;
  transition: opacity 0.15s ease;
  display: inline-flex;
  align-items: center;

  ::v-deep .btn {
    border: none !important;
    box-shadow: none !important;
    text-decoration: none !important;
    line-height: 1;

    &:hover {
      color: #007bff !important;
    }
  }
}

// =========================================================
// 4. 網段 IP 佔用雷達 (Subnet IP Radar Grid)
// =========================================================
.ip-radar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.45rem;
}

.ip-radar-cell {
  padding: 0.4rem 0.55rem;
  border-radius: 0.4rem;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  font-size: 0.8rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  }

  &.radar-cell-free {
    background-color: #f8fff9;
    border-color: #c3e6cb;
    &:hover { border-color: #28a745; }
  }

  &.radar-cell-assigned {
    background-color: #f4f9ff;
    border-color: #b8daff;
    &:hover { border-color: #007bff; }
  }

  &.radar-cell-conflict {
    background-color: #fff5f5;
    border-color: #f5c6cb;
    &:hover { border-color: #dc3545; }
  }

  &.radar-cell-dynamic {
    background-color: #fffbeb;
    border-color: #fde68a;
  }
}

.radar-octet {
  font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
}

.radar-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;

  &.dot-free     { background-color: #28a745; }
  &.dot-assigned { background-color: #007bff; }
  &.dot-conflict { background-color: #dc3545; box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25); }
  &.dot-dynamic  { background-color: #f59e0b; }
}

.radar-subtext {
  font-size: 0.72rem;
}

// =========================================================
// 5. 分機表拖曳上傳區與異動高亮樣式
// =========================================================
.roster-dropzone {
  border: 2px dashed #86cfda;
  background-color: #f8fdfe;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &.drag-active {
    border-color: #28a745;
    background-color: #eefaf0;
  }
}

.bg-success-light {
  background-color: #f2fbf4 !important;
}

.bg-primary-light {
  background-color: #f0f7ff !important;
}

// =========================================================
// 6. 警示樣式與表格行內儲存動畫
// =========================================================
.ip-alert-style {
  color: #dc3545 !important;
  font-weight: 800 !important;
  letter-spacing: 0.3px;
}

.pointer {
  cursor: pointer;
}

.min-w-0 {
  min-width: 0;
}

::v-deep .row-saved-flash {
  animation: flashGreen 1.5s ease;
}

@keyframes flashGreen {
  0%   { background-color: #d4edda !important; }
  100% { background-color: transparent; }
}
</style>
