<template lang="pug">
.bookmark-dashboard.min-vh-100.d-flex.flex-column
  lah-header
    .d-flex.align-items-center.justify-content-between.w-100.my-auto.header-brand-bar
      //- 左側：Logo + 系統名稱與副標
      .d-flex.align-items-center.header-left-area
        .header-logo-box.mr-2.flex-shrink-0
          .ambient-glow
          lah-logo.header-logo
        .header-info
          .d-flex.align-items-center.flex-nowrap
            h3.header-title.font-weight-bold.text-dark.m-0.text-nowrap
              span.text-primary.header-title-prefix
                span.office-name {{ currentOfficeShortName }}
                span.office-suffix(v-if="!currentOfficeShortName.includes('局')") 地政
              span.text-dark.ml-1.header-title-main 所內書籤索引
            b-badge.py-1.px-2.align-items-center.header-badge-text.ml-2(
              pill
              variant="light"
              class="border text-primary font-weight-bold"
            )
              lah-fa-icon(icon="bookmark" regular size="xs").mr-1
              span 系統導航指南
          p.header-subtitle.text-muted.m-0.text-truncate
            | 常用公務系統 · 各課室專屬專區 · 輪值表快速預覽 · 個人自訂書籤

      //- 右側：搜尋列與快捷工具列 (操作 UI 高度一律對齊 lah-header 45px 規範)
      .d-flex.align-items-center
        .header-search-wrapper.mr-2.d-none.d-md-block
          b-input-group.header-search-input-group.shadow-none.border
            b-input-group-prepend(is-text)
              lah-fa-icon(icon="search" variant="muted")
            b-form-input(
              ref="searchInput"
              v-model="searchKeyword"
              placeholder="搜尋書籤、系統、網址或課室（按 / 鍵聚焦）..."
              autocomplete="off"
              @keydown.esc="searchKeyword = ''"
            )
            b-input-group-append(v-if="searchKeyword")
              b-button(variant="white" @click="searchKeyword = ''" title="清除搜尋")
                lah-fa-icon(icon="times" size="xs" variant="muted")
            b-input-group-append.header-search-count-append
              b-button(variant="primary" class="px-3 header-search-count-btn font-weight-bold" disabled)
                span 共 {{ filteredLinksCount }} 項

        //- 快捷操作按鈕群 (高度與 lah-header 45px 完全等高對齊)
        b-button-group.header-btn-group
          b-button.header-action-btn(
            variant="outline-primary"
            @click="openAddModal"
            title="新增個人自訂書籤"
          )
            lah-fa-icon(icon="plus")
            span.btn-label 新增書籤
          b-button.header-action-btn(
            variant="outline-secondary"
            @click="isTopDrawerOpen = !isTopDrawerOpen"
            title="熱門造訪排行榜"
          )
            lah-fa-icon(icon="fire" class="text-danger")
            span.btn-label 熱門排行
          b-button.header-action-btn(
            variant="outline-info"
            @click="isBackupModalOpen = true"
            title="備份與還原個人設定"
          )
            lah-fa-icon(icon="cloud-arrow-down")
            span.btn-label 備份還原
          b-button.header-action-btn(
            v-if="isAdmin"
            variant="outline-danger"
            @click="openAdminModal"
            title="管理所內各課室書籤 (管理員專用)"
          )
            lah-fa-icon(icon="sliders-h")
            span.btn-label 所內設定
          b-button.header-action-btn(
            variant="outline-success"
            @click="openInstructionModal(0)"
            title="頁面功能說明與八所自訂指引"
          )
            lah-fa-icon(icon="question-circle")
            span.btn-label 頁面說明

  //- 主體區域 (左右保留約 20px Margin，不再侷限於中央，UI 整體放大約 25%)
  .flex-grow-1.py-3.bookmark-main-wrapper
    b-container.bookmark-hub-container(fluid)

      //- 行動端搜尋列 (窄螢幕時顯示)
      .d-block.d-md-none.mb-3
        b-input-group.header-search-input-group.shadow-sm.border.bg-white
          b-input-group-prepend(is-text)
            lah-fa-icon(icon="search" variant="muted")
          b-form-input(
            v-model="searchKeyword"
            placeholder="搜尋書籤關鍵字..."
            autocomplete="off"
            @keydown.esc="searchKeyword = ''"
          )
          b-input-group-append(v-if="searchKeyword")
            b-button(variant="white" @click="searchKeyword = ''")
              lah-fa-icon(icon="times" size="xs" variant="muted")

      b-row
        //- 左側：分類選單導覽 (寬度適度舒展，字級與排版放大約 25%)
        b-col(cols="12" lg="3" xl="2" class="mb-3 mb-lg-0")
          .category-sidebar.sticky-top(style="top: 85px; z-index: 10;")
            b-card.border-0.shadow-sm.category-card(no-body)
              b-card-header.bg-white.border-bottom.py-3.px-3
                .d-flex.align-items-center.justify-content-between
                  span.font-weight-bold.text-dark.category-header-title 類別導覽
                  b-badge(variant="light" class="border text-muted category-header-badge") 共 {{ totalBookmarksCount }} 筆

              b-list-group(flush class="category-list-group")
                //- 1. 儀表板總覽
                b-list-group-item.category-item(
                  button
                  :active="selectedCategoryId === 'dashboard' && !searchKeyword"
                  @click="selectCategory('dashboard')"
                )
                  .d-flex.align-items-center.justify-content-between.w-100
                    .d-flex.align-items-center.min-w-0
                      lah-fa-icon(icon="table-columns").mr-2.category-icon
                      span.text-truncate 總覽全部
                    b-badge(pill variant="secondary" class="category-badge") {{ allLinksWithoutHidden.length }}

                //- 2. 我的最愛 (含個人自訂)
                b-list-group-item.category-item(
                  button
                  :active="selectedCategoryId === 'favorites' && !searchKeyword"
                  @click="selectCategory('favorites')"
                )
                  .d-flex.align-items-center.justify-content-between.w-100
                    .d-flex.align-items-center.min-w-0
                      lah-fa-icon(icon="star" class="text-warning").mr-2.category-icon
                      span.text-truncate 我的最愛
                    b-badge(pill variant="warning" class="text-dark category-badge") {{ favoriteLinks.length }}

                //- 分隔線
                .dropdown-divider.m-0

                //- 3. 各課室分類清單
                b-list-group-item.category-item(
                  v-for="cat in categories"
                  :key="cat.id"
                  button
                  :active="selectedCategoryId === cat.id && !searchKeyword"
                  @click="selectCategory(cat.id)"
                )
                  .d-flex.align-items-center.justify-content-between.w-100
                    .d-flex.align-items-center.min-w-0
                      lah-fa-icon(:icon="mapIcon(cat.icon)").mr-2.category-icon
                      span.text-truncate {{ cat.category }}
                    b-badge(pill variant="light" class="border category-badge") {{ getCategoryCount(cat) }}

        //- 右側：主要書籤內容卡片區 (全寬舒展，UI 元件放大約 25%)
        b-col(cols="12" lg="9" xl="10")
          //- 內容頂部狀態橫條
          .view-header.bg-white.rounded.p-3.mb-3.shadow-sm.border.d-flex.align-items-center.justify-content-between.flex-wrap.gap-2
            .d-flex.align-items-center
              .view-icon-box.mr-3.rounded.d-flex.align-items-center.justify-content-center.flex-shrink-0
                lah-fa-icon(:icon="currentViewIcon" variant="primary" class="view-main-icon")
              div
                .d-flex.align-items-center.flex-wrap
                  h3.font-weight-bold.text-dark.m-0.view-title {{ currentViewTitle }}
                  b-badge.py-1.px-2.ml-2.d-inline-flex.align-items-center(
                    v-if="isCustomOfficeBookmarks"
                    variant="success"
                    pill
                    title="此書籤設定已由本所管理者客製發布"
                  )
                    lah-fa-icon(icon="building-circle-check" size="xs").mr-1
                    span 本所專屬設定
                  b-badge.py-1.px-2.ml-2.d-inline-flex.align-items-center(
                    v-else
                    variant="light"
                    pill
                    class="border text-muted"
                    title="目前套用桃園所官方預設各課室書籤"
                  )
                    lah-fa-icon(icon="landmark" size="xs").mr-1
                    span 桃園所預設
                p.text-muted.m-0.view-subtitle(v-if="searchKeyword")
                  | 包含「{{ searchKeyword }}」的搜尋結果，共計 {{ filteredLinksCount }} 筆符合
                p.text-muted.m-0.view-subtitle(v-else)
                  | {{ currentViewSubtitle }}
            .d-flex.align-items-center.gap-2
              b-button(
                v-if="selectedCategoryId === 'favorites' || userBookmarks.length > 0"
                variant="outline-primary"
                class="view-header-add-btn"
                @click="openAddModal"
              )
                lah-fa-icon(icon="plus").mr-1
                span 新增自訂書籤

          //- 轉場容器 (視圖切換與卡片清單篩選轉場)
          transition(name="view-fade" mode="out-in")
            //- 情況 1：搜尋狀態下或單一分類視圖
            .bookmarks-content-area(
              v-if="searchKeyword || selectedCategoryId !== 'dashboard'"
              key="filtered-view"
            )
              transition-group.row.bookmark-grid-row(
                v-if="displayLinks.length > 0"
                name="bookmark-flip"
                tag="div"
              )
                b-col.bookmark-col(
                  v-for="link in displayLinks"
                  :key="link.id"
                  cols="12"
                  sm="6"
                  md="6"
                  lg="4"
                  xl="3"
                  class="mb-3"
                )
                  b-card.bookmark-card.h-100.border-0.shadow-sm.d-flex.flex-column.justify-content-between(no-body)
                    //- 卡片頂部功能列
                    .card-top-bar.d-flex.align-items-center.justify-content-between.px-3.py-2.border-bottom
                      .d-flex.align-items-center.min-w-0.flex-wrap
                        b-badge.card-tag-badge(
                          v-if="link.isCustom"
                          variant="warning"
                          class="mr-1 text-dark"
                          pill
                        ) 個人自訂
                        b-badge.card-tag-badge(
                          v-else-if="link.categoryName"
                          variant="light"
                          class="border mr-1 text-muted text-truncate"
                          style="max-width: 105px;"
                        ) {{ link.categoryName }}

                      //- 卡片右上角快捷操作
                      .card-actions.d-flex.align-items-center
                        //- 複製網址
                        b-button(
                          variant="link"
                          class="p-1 text-muted action-btn"
                          title="複製網址"
                          @click.stop="copyUrl(link.href)"
                        )
                          lah-fa-icon(icon="copy")

                        //- PDF 預覽按鈕
                        b-button(
                          v-if="isPdf(link.href)"
                          variant="link"
                          class="p-1 text-danger action-btn"
                          title="開啟 PDF 預覽視窗"
                          @click.stop="openPdfPreview(link.href, link.title)"
                        )
                          lah-fa-icon(icon="file-pdf")

                        //- 個人自訂書籤編輯/刪除
                        template(v-if="link.isCustom")
                          b-button(
                            variant="link"
                            class="p-1 text-primary action-btn"
                            title="編輯自訂書籤"
                            @click.stop="openEditModal(link)"
                          )
                            lah-fa-icon(icon="pencil-alt")
                          b-button(
                            variant="link"
                            class="p-1 text-danger action-btn"
                            title="刪除自訂書籤"
                            @click.stop="deleteBookmark(link.id)"
                          )
                            lah-fa-icon(icon="trash-alt")

                        //- 釘選最愛切換
                        b-button(
                          variant="link"
                          class="p-1 action-btn"
                          :class="isPinned(link.id) ? 'text-warning' : 'text-muted'"
                          :title="isPinned(link.id) ? '已釘選最愛（點擊取消）' : '釘選至我的最愛'"
                          @click.stop="togglePin(link)"
                        )
                          lah-fa-icon(
                            icon="star"
                            :regular="!isPinned(link.id)"
                          )

                    //- 卡片主要點擊連結區 (字級與頭像放大約 25%)
                    a.bookmark-card-body.p-3.d-flex.flex-column.align-items-center.text-center.text-decoration-none(
                      :href="link.href"
                      target="_blank"
                      rel="noopener noreferrer"
                      @click="handleCardClick($event, link)"
                    )
                      .icon-avatar.mb-3.rounded-circle.d-flex.align-items-center.justify-content-center(
                        :class="link.isCustom ? 'bg-warning-light text-warning' : 'bg-primary-light text-primary'"
                      )
                        lah-fa-icon(:icon="mapIcon(link.icon)" class="avatar-icon")

                      h5.bookmark-title.font-weight-bold.text-dark.mb-2.line-clamp-1(
                        v-html="highlightKeyword(link.title)"
                      )

                      .bookmark-desc.text-muted.mb-0.line-clamp-2
                        span(v-html="highlightKeyword(parseMarkdown(link.description))")
                        span.ml-1(v-if="link.nextMonthHtml" v-html="link.nextMonthHtml")

                    //- 卡片底欄網域資訊
                    .card-footer-bar.px-3.py-2.border-top.bg-light.d-flex.align-items-center.justify-content-between
                      span.text-muted.text-truncate.font-monospace.card-domain-text(style="max-width: 200px;" :title="link.href")
                        | {{ getDomain(link.href) }}
                      lah-fa-icon(icon="external-link-alt" variant="muted")

              //- 無符合結果提示 (改用明確的 v-if，杜絕與外層 v-else 衝突)
              .empty-state.text-center.py-5.bg-white.rounded.shadow-sm.border(
                v-if="displayLinks.length === 0"
              )
                lah-fa-icon(icon="magnifying-glass" size="3x" class="text-muted mb-3")
                h4.font-weight-bold.text-dark 查無符合條件的書籤
                p.text-muted 嘗試使用其他關鍵字，或確認網址與分類是否正確。
                b-button(variant="outline-primary" @click="searchKeyword = ''")
                  lah-fa-icon(icon="sync-alt").mr-1
                  span 清除搜尋過濾

            //- 情況 2：儀表板視圖 (分類分區展示，全寬展開)
            .dashboard-sections-area(v-else key="dashboard-view")
              .category-section.mb-4(
                v-for="cat in categories"
                :key="cat.id"
              )
                .section-heading.d-flex.align-items-center.justify-content-between.mb-3.pb-2.border-bottom
                  .d-flex.align-items-center
                    lah-fa-icon(:icon="mapIcon(cat.icon)" class="text-primary section-cat-icon").mr-2
                    h3.font-weight-bold.text-dark.m-0.section-cat-title {{ cat.category }}
                    b-badge(pill variant="light" class="border ml-2 section-cat-badge") {{ cat.links.length }}
                  b-button(variant="link" class="text-primary p-0 section-more-btn" @click="selectCategory(cat.id)")
                    span 瀏覽全部
                    lah-fa-icon(icon="chevron-right" size="xs").ml-1

                b-row
                  b-col(
                    v-for="link in cat.links.slice(0, 8)"
                    :key="link.id"
                    cols="12"
                    sm="6"
                    md="6"
                    lg="4"
                    xl="3"
                    class="mb-3"
                  )
                    b-card.bookmark-card.h-100.border-0.shadow-sm.d-flex.flex-column.justify-content-between(no-body)
                      //- 卡片頂部
                      .card-top-bar.d-flex.align-items-center.justify-content-between.px-3.py-2.border-bottom
                        .d-flex.align-items-center.min-w-0
                          b-badge.card-tag-badge(
                            v-if="link.isCustom"
                            variant="warning"
                            class="mr-1 text-dark"
                            pill
                          ) 個人自訂

                        .card-actions.d-flex.align-items-center
                          b-button(
                            variant="link"
                            class="p-1 text-muted action-btn"
                            title="複製網址"
                            @click.stop="copyUrl(link.href)"
                          )
                            lah-fa-icon(icon="copy")

                          b-button(
                            v-if="isPdf(link.href)"
                            variant="link"
                            class="p-1 text-danger action-btn"
                            title="開啟 PDF 預覽視窗"
                            @click.stop="openPdfPreview(link.href, link.title)"
                          )
                            lah-fa-icon(icon="file-pdf")

                          b-button(
                            variant="link"
                            class="p-1 action-btn"
                            :class="isPinned(link.id) ? 'text-warning' : 'text-muted'"
                            :title="isPinned(link.id) ? '已加入我的最愛' : '釘選至我的最愛'"
                            @click.stop="togglePin(link)"
                          )
                            lah-fa-icon(
                              icon="star"
                              :regular="!isPinned(link.id)"
                            )

                      //- 卡片連結 (放大 25%)
                      a.bookmark-card-body.p-3.d-flex.flex-column.align-items-center.text-center.text-decoration-none(
                        :href="link.href"
                        target="_blank"
                        rel="noopener noreferrer"
                        @click="handleCardClick($event, link)"
                      )
                        .icon-avatar.mb-3.rounded-circle.d-flex.align-items-center.justify-content-center.bg-primary-light.text-primary
                          lah-fa-icon(:icon="mapIcon(link.icon)" class="avatar-icon")

                        h5.bookmark-title.font-weight-bold.text-dark.mb-2.line-clamp-1 {{ link.title }}

                        .bookmark-desc.text-muted.mb-0.line-clamp-2
                          span(v-html="parseMarkdown(link.description)")
                          span.ml-1(v-if="link.nextMonthHtml" v-html="link.nextMonthHtml")

                      //- 卡片底欄
                      .card-footer-bar.px-3.py-2.border-top.bg-light.d-flex.align-items-center.justify-content-between
                        span.text-muted.text-truncate.font-monospace.card-domain-text(style="max-width: 200px;" :title="link.href")
                          | {{ getDomain(link.href) }}
                        lah-fa-icon(icon="external-link-alt" variant="muted")

  //- =========================================================================
  //- 彈窗與抽屜元件
  //- =========================================================================

  //- 1. 新增 / 編輯個人自訂書籤 Modal
  b-modal(
    v-model="isBookmarkModalOpen"
    :title="isEditMode ? '編輯個人自訂書籤' : '新增個人自訂書籤'"
    centered
    no-close-on-backdrop
    ok-title="確定"
    cancel-title="取消"
    @ok="saveBookmarkModal"
  )
    b-form
      b-form-group(label="書籤名稱：" label-for="bm-title" description="請輸入易辨識的系統或功能標題")
        b-form-input#bm-title(
          v-model="bookmarkForm.title"
          placeholder="例如：地政局內網入口、地籍異動即時通"
          required
        )

      b-form-group(label="連結網址 (URL)：" label-for="bm-href" description="支援 http:// 或 https:// 網址")
        b-form-input#bm-href(
          v-model="bookmarkForm.href"
          placeholder="http://220.1.34.18/..."
          required
        )

      b-form-group(label="備註說明：" label-for="bm-desc")
        b-form-textarea#bm-desc(
          v-model="bookmarkForm.description"
          placeholder="填寫常用說明、帳密提示或注意事項（支援 Markdown）"
          rows="2"
        )

      b-form-group(label="選擇卡片圖示：")
        .d-flex.flex-wrap
          lah-button(
            v-for="ico in presetIcons"
            :key="ico"
            :icon="ico"
            size="sm"
            no-icon-gutter
            :variant="bookmarkForm.icon === ico ? 'primary' : 'outline-secondary'"
            class="mr-2 mb-2 icon-select-btn"
            @click="bookmarkForm.icon = ico"
          )

  //- 2. 備份與還原 Modal
  b-modal(
    v-model="isBackupModalOpen"
    title="個人書籤與設定備份還原"
    centered
    hide-footer
  )
    .backup-modal-content
      p.text-muted.small
        | 本功能可將您在本機瀏覽器所儲存的「個人自訂書籤」、「我的最愛釘選清單」與「點擊紀錄」匯出保存，或於不同電腦之間匯入同步。

      .d-flex.flex-column.gap-3
        //- 匯出按鈕
        .p-3.border.rounded.bg-light.mb-3
          h6.font-weight-bold.text-dark.mb-1 匯出設定備份檔案
          p.text-muted.small.mb-2 下載目前本機所有自訂書籤與釘選資料為 JSON 檔案。
          b-button(variant="success" size="sm" @click="exportBackup")
            lah-fa-icon(icon="file-export").mr-1
            span 立即匯出備份 (.json)

        //- 匯入按鈕
        .p-3.border.rounded.bg-light.mb-3
          h6.font-weight-bold.text-dark.mb-1 匯入設定備份檔案
          p.text-muted.small.mb-2 讀取先前匯出的備份檔以還原書籤與釘選。
          b-form-file(
            ref="importFileRef"
            v-model="importFile"
            placeholder="請選擇 .json 備份檔案..."
            drop-placeholder="拖曳檔案至此..."
            accept=".json"
            size="sm"
            class="mb-2"
          )
          b-button(
            variant="primary"
            size="sm"
            :disabled="!importFile"
            @click="importBackup"
          )
            lah-fa-icon(icon="file-import").mr-1
            span 執行還原匯入

        //- 清除重設按鈕
        .p-3.border.rounded.border-danger.bg-white
          h6.font-weight-bold.text-danger.mb-1 重置本機所有書籤資料
          p.text-muted.small.mb-2 清除本機儲存的所有個人自訂書籤與最愛釘選（此操作無法復原）。
          b-button(variant="outline-danger" size="sm" @click="resetPersonalData")
            lah-fa-icon(icon="trash-can").mr-1
            span 清空本機資料

  //- 3. PDF 預覽視窗 Modal
  b-modal(
    v-model="isPdfModalOpen"
    :title="pdfModalTitle || 'PDF 檔案預覽'"
    size="xl"
    centered
    hide-footer
    body-class="p-0"
  )
    iframe.pdf-iframe(
      v-if="pdfModalUrl"
      :src="pdfModalUrl"
      width="100%"
      height="650px"
      frameborder="0"
    )

  //- 4. IFrame 視窗預覽 Modal (按住 Ctrl 點擊觸發)
  b-modal(
    v-model="isIframeModalOpen"
    :title="iframeModalTitle || '網頁預覽'"
    size="xl"
    centered
    hide-footer
    body-class="p-0"
  )
    iframe.preview-iframe(
      v-if="iframeModalUrl"
      :src="iframeModalUrl"
      width="100%"
      height="650px"
      frameborder="0"
    )

  //- 6. 管理者專用：所內各課室書籤設定 Modal
  b-modal(
    v-model="isAdminModalOpen"
    title="所內各課室書籤設定（管理員專屬）"
    size="lg"
    centered
    hide-footer
  )
    .admin-bookmark-modal-content
      .alert.alert-info.d-flex.align-items-center.justify-content-between.py-2.px-3.mb-3
        .d-flex.align-items-center
          lah-fa-icon(icon="info-circle" size="lg" class="mr-2")
          .small
            | 本功能提供桃園市八個地政事務所管理員自訂全所課室書籤。在此匯入更新後，全所同仁開啟本系統時將自動同步採用此設定。
        b-button(variant="outline-primary" size="sm" class="text-nowrap ml-2 flex-shrink-0" @click="openInstructionModal(0)")
          lah-fa-icon(icon="book-open").mr-1
          span 查看自訂作業指引

      //- 目前生效狀態
      .p-3.border.rounded.bg-light.mb-3.d-flex.align-items-center.justify-content-between.flex-wrap.gap-2
        div
          span.text-muted.small 目前狀態：
          span.font-weight-bold.text-success.ml-1(v-if="isCustomOfficeBookmarks") 已套用本所專屬課室書籤
          span.font-weight-bold.text-primary.ml-1(v-else) 使用桃園地所官方預設值
        .d-flex.gap-2
          b-button(variant="outline-secondary" size="sm" @click="exportCurrentOfficeBookmarks")
            lah-fa-icon(icon="download").mr-1
            span 匯出目前設定 JSON
          b-button(variant="outline-primary" size="sm" @click="exportDefaultTaoyuanTemplate")
            lah-fa-icon(icon="file-lines").mr-1
            span 下載桃園所標準範本

      //- 匯入覆蓋區塊
      .p-3.border.rounded.bg-white.mb-3
        h6.font-weight-bold.text-dark.mb-1 匯入新版全所書籤設定 (JSON)
        p.text-muted.small.mb-2 請選取經過編修的 bookmarks.json 檔案，系統將於驗證格式無誤後發布至全所。
        b-form-file(
          ref="adminFileRef"
          v-model="adminImportFile"
          placeholder="請選擇符合格式的 bookmarks.json 檔案..."
          drop-placeholder="拖曳檔案至此..."
          accept=".json"
          size="sm"
          class="mb-2"
          @input="handleAdminFileChange"
        )
        .alert.alert-danger.py-1.px-2.small.mb-2(v-if="adminImportError")
          lah-fa-icon(icon="exclamation-triangle").mr-1
          span {{ adminImportError }}
        .alert.alert-success.py-1.px-2.small.mb-2(v-if="adminImportSummary")
          lah-fa-icon(icon="check-circle").mr-1
          span {{ adminImportSummary }}

        b-button(
          variant="primary"
          size="sm"
          :disabled="!adminParsedBookmarks || Boolean(adminImportError)"
          @click="saveOfficeBookmarks"
        )
          lah-fa-icon(icon="cloud-arrow-up").mr-1
          span 儲存並發布至全所

      //- 還原為官方預設
      .p-3.border.rounded.border-danger.bg-white
        h6.font-weight-bold.text-danger.mb-1 還原為桃園所官方預設值
        p.text-muted.small.mb-2 若要廢棄目前所內的客製設定並恢復官方原始書籤，請點擊下方按鈕。
        b-button(variant="outline-danger" size="sm" @click="resetToDefaultTaoyuanBookmarks")
          lah-fa-icon(icon="rotate-left").mr-1
          span 還原為官方預設 (桃園所)

  //- 7. 頁面功能說明與八所自訂指引 Modal
  b-modal(
    v-model="isInstructionModalOpen"
    title="所內書籤索引 · 頁面說明與各所自訂指引"
    size="xl"
    centered
    scrollable
    ok-only
    ok-title="關閉說明"
  )
    .instruction-modal-content
      b-tabs(v-model="instructionTabIndex" pills card fill active-nav-item-class="font-weight-bold" content-class="mt-3")
        //- 分頁 1: 各所自訂書籤作業流程指引
        b-tab(title="各所自訂書籤作業流程" active)
          .alert.alert-info.d-flex.align-items-center.py-2.px-3.mb-3
            lah-fa-icon(icon="info-circle" size="lg" class="mr-2")
            .small
              strong 桃園市八個地政事務所通用架構：
              span 系統預設讀取桃園地政事務所官方版本。若其他事務所（中壢、大溪、楊梅、蘆竹、八德、平鎮、龜山）欲調整本所各課室專區與系統連結，請循以下 5 步驟由本所管理師進行自訂匯入。

          .workflow-steps.mb-4
            .step-card.p-3.border.rounded.mb-3.bg-light
              .d-flex.align-items-center.mb-2
                b-badge(variant="primary" pill class="px-2 py-1 mr-2") 步驟 1
                h6.font-weight-bold.m-0 確認具備管理者權限
              p.small.text-muted.mb-0
                span 僅具備系統管理人員（
                code authority.isAdmin
                span ）或資訊管理人員（
                code isInf
                span ）權限之同仁，畫面右上角工具列才會顯示
                strong.text-danger.mx-1 「所內設定」
                span 操作按鈕。

            .step-card.p-3.border.rounded.mb-3.bg-light
              .d-flex.align-items-center.mb-2
                b-badge(variant="primary" pill class="px-2 py-1 mr-2") 步驟 2
                h6.font-weight-bold.m-0 下載範本或匯出目前設定
              p.small.text-muted.mb-2 點擊右上角「所內設定」開啟管理視窗，可選擇以下兩種方式取得基準 JSON 檔案：
              .row
                .col-md-6.mb-2
                  .border.rounded.p-2.bg-white.h-100
                    strong.text-primary.small 下載桃園所標準範本：
                    p.small.text-muted.m-0 取得官方原始 bookmarks.json 作為基底進行大幅度增刪。
                .col-md-6.mb-2
                  .border.rounded.p-2.bg-white.h-100
                    strong.text-secondary.small 匯出目前設定 JSON：
                    p.small.text-muted.m-0 匯出目前正在線上運作中的課室設定，適合局部微調。

            .step-card.p-3.border.rounded.mb-3.bg-light
              .d-flex.align-items-center.mb-2
                b-badge(variant="primary" pill class="px-2 py-1 mr-2") 步驟 3
                h6.font-weight-bold.m-0 本地編修各課室與系統連結 (JSON)
              p.small.text-muted.mb-2 使用常見純文字編輯器（如 VS Code、Notepad++ 等）開啟檔案進行編輯。編輯重點包含：
              ul.small.text-muted.mb-0.pl-3
                li 各課室名稱（#[code category]）與識別碼（#[code id]）。
                li 該課室代表圖示（#[code icon]，支援 FontAwesome 圖示如 #[code file-contract]、#[code map-marked-alt]、#[code calculator] 等）。
                li 將公務系統網址（#[code href]）替換為各事務所內部的真實主機 IP 或網域名稱（例如登記主機、測量外業主機、內部 NAS 等）。

            .step-card.p-3.border.rounded.mb-3.bg-light
              .d-flex.align-items-center.mb-2
                b-badge(variant="primary" pill class="px-2 py-1 mr-2") 步驟 4
                h6.font-weight-bold.m-0 上傳檔案與前端即時校驗
              p.small.text-muted.mb-2 將編修完成的 #[code bookmarks.json] 拖曳或選取至「所內設定」視窗的檔案選取器中。
              p.small.text-muted.mb-0 系統內建前端校驗引擎，會自動驗證 JSON 語法、陣列結構、必填欄位（#[code category]、#[code links]、#[code title]、#[code href]），並即時顯示解析結果與連結統計。若格式有誤將出現紅色警示，確保錯誤檔案不會被發布。

            .step-card.p-3.border.rounded.mb-3.bg-light
              .d-flex.align-items-center.mb-2
                b-badge(variant="success" pill class="px-2 py-1 mr-2") 步驟 5
                h6.font-weight-bold.m-0 一鍵儲存發布（全所即時生效）
              p.small.text-muted.mb-0
                span 校驗通過後點擊
                strong.text-primary.mx-1 「儲存並發布至全所」
                span 按鈕。系統將設定透過後端儲存至該所 SQLite 資料庫（鍵值：
                code BOOKMARK_JSON
                span ）。該所全體同仁於開啟「所內書籤索引」時即刻同步載入最新設定。

          .p-3.border.border-warning.rounded.bg-light
            h6.font-weight-bold.text-dark.mb-2
              lah-fa-icon(icon="shield-alt" class="text-warning mr-1")
              span 安全機制與隨時還原保障
            ul.small.text-muted.mb-0.pl-3
              li
                strong 資料完全隔離：
                span 各所自訂設定儲存於各所獨立的伺服器資料庫中，完全不會影響其他事務所。
              li
                strong 官方預設永久保留：
                span 桃園地所官方預設值內嵌於系統核心，任何時候管理師皆可點擊「還原為官方預設 (桃園所)」一鍵重設。
              li
                strong 個人最愛與私房書籤不受影響：
                span 全所課室書籤更新時，個別同仁在本機瀏覽器收藏的「我的最愛」與「個人自訂書籤」均會完整保留並自動疊加。

        //- 分頁 2: JSON 規格與範例
        b-tab(title="JSON 結構規格與範例")
          .mb-3
            h6.font-weight-bold.text-dark 欄位架構說明
            .table-responsive
              table.table.table-sm.table-bordered.small.mb-0
                thead.thead-light
                  tr
                    th(style="width: 16%") 欄位名稱
                    th(style="width: 12%") 型別
                    th(style="width: 10%") 必填
                    th 說明與範例
                tbody
                  tr
                    td: code category
                    td 字串 (String)
                    td: b-badge(variant="danger" pill) 必填
                    td 課室或專區名稱，例：#[code 登記課專區]、#[code 測量課專區]、#[code 地價課專區]
                  tr
                    td: code id
                    td 字串 (String)
                    td: b-badge(variant="danger" pill) 必填
                    td 分類唯一英數識別代碼，例：#[code reg]、#[code sur]、#[code val]、#[code inf]
                  tr
                    td: code icon
                    td 字串 (String)
                    td: b-badge(variant="secondary" pill) 選填
                    td FontAwesome 圖示名稱，例：#[code file-contract]、#[code map-marked-alt]、#[code calculator]
                  tr
                    td: code links
                    td 陣列 (Array)
                    td: b-badge(variant="danger" pill) 必填
                    td 該課室收錄的公務連結陣列
                  tr
                    td: code links[].title
                    td 字串 (String)
                    td: b-badge(variant="danger" pill) 必填
                    td 系統或連結名稱，例：#[code 地政整合資訊系統 (WebAP)]
                  tr
                    td: code links[].href
                    td 字串 (String)
                    td: b-badge(variant="danger" pill) 必填
                    td 完整網址（含通訊協定），例：#[code http://220.1.35.123/land/login.jsp]
                  tr
                    td: code links[].description
                    td 字串 (String)
                    td: b-badge(variant="secondary" pill) 選填
                    td 系統功能簡述或作業說明，支援即時關鍵字模糊搜尋
                  tr
                    td: code links[].icon
                    td 字串 (String)
                    td: b-badge(variant="secondary" pill) 選填
                    td 該連結專屬的小圖示，例：#[code desktop]、#[code globe]、#[code coins]

          .p-3.border.rounded.bg-dark.text-light
            .d-flex.align-items-center.justify-content-between.mb-2
              .font-weight-bold.small
                lah-fa-icon(icon="code" class="text-info mr-1")
                span 標準 bookmarks.json 範例內容
              .d-flex.gap-2
                b-button(variant="outline-light" size="sm" @click="copySampleJson")
                  lah-fa-icon(icon="copy").mr-1
                  span 複製範例 JSON
                b-button(variant="outline-info" size="sm" @click="downloadSampleJson")
                  lah-fa-icon(icon="download").mr-1
                  span 下載範例檔案
            pre.text-light.small.m-0(style="max-height: 380px; overflow-y: auto; background-color: #1e1e1e; padding: 1rem; border-radius: 4px; font-family: Consolas, Monaco, monospace;")
              code {{ sampleJsonText }}

        //- 分頁 3: 常用功能操作手冊
        b-tab(title="全所同仁常用功能指南")
          .row
            .col-md-6.mb-3
              .p-3.border.rounded.h-100.bg-light
                h6.font-weight-bold.text-primary.mb-2
                  lah-fa-icon(icon="search" class="mr-1")
                  span 全域即時搜尋
                p.small.text-muted.mb-0
                  span 鍵盤按下 #[kbd /] 鍵可秒速聚焦搜尋框。支援系統名稱、網址關鍵字、備註說明與所屬課室即時過濾，按 #[kbd Esc] 鍵可一鍵清空並返回全覽視圖。
            .col-md-6.mb-3
              .p-3.border.rounded.h-100.bg-light
                h6.font-weight-bold.text-warning.mb-2
                  lah-fa-icon(icon="star" class="mr-1")
                  span 釘選我的最愛
                p.small.text-muted.mb-0
                  span 點擊任一書籤卡片右上角的星號即可釘選為「我的最愛」，並即時置頂展示於第一專區，方便日常高頻率公務系統一鍵點擊進入。
            .col-md-6.mb-3
              .p-3.border.rounded.h-100.bg-light
                h6.font-weight-bold.text-success.mb-2
                  lah-fa-icon(icon="plus-circle" class="mr-1")
                  span 個人自訂書籤 (CRUD)
                p.small.text-muted.mb-0
                  span 點擊頂部「新增書籤」可收錄同仁私房公務網址或辦公資源，具備獨立橘黃色標籤識別，並提供筆型按鈕隨時編輯與刪除。
            .col-md-6.mb-3
              .p-3.border.rounded.h-100.bg-light
                h6.font-weight-bold.text-info.mb-2
                  lah-fa-icon(icon="cloud-arrow-down" class="mr-1")
                  span 個人設定備份與跨機還原
                p.small.text-muted.mb-0
                  span 點擊「備份還原」可將個人釘選的最愛與私房書籤匯出為 JSON 備份檔。同仁更換辦公電腦或新開瀏覽器時，可直接匯入無痛接軌。
            .col-md-6.mb-3
              .p-3.border.rounded.h-100.bg-light
                h6.font-weight-bold.text-danger.mb-2
                  lah-fa-icon(icon="fire" class="mr-1")
                  span 熱門排行榜側邊抽屜
                p.small.text-muted.mb-0
                  span 點擊「熱門排行」按鈕可開啟側邊抽屜，系統依據同仁日常點擊紀錄自動統計點閱率最高的 10 項公務系統，快速直達常辦業務。
            .col-md-6.mb-3
              .p-3.border.rounded.h-100.bg-light
                h6.font-weight-bold.text-secondary.mb-2
                  lah-fa-icon(icon="file-pdf" class="mr-1")
                  span PDF 與內部視窗預覽
                p.small.text-muted.mb-0
                  span 點擊輪值表等 PDF 檔案可直接於全螢幕視窗預覽；按住 #[kbd Ctrl] 鍵點選公務網址可在不跳出本系統的狀態下以內嵌視窗開啟瀏覽。

  //- 5. 熱門排行榜側邊抽屜 (Sidebar Drawer)
  b-sidebar(
    v-model="isTopDrawerOpen"
    title="熱門造訪排行榜"
    right
    shadow
    backdrop
  )
    .px-3.py-2
      p.text-muted.small 統計本機點擊次數最高的 10 項公務系統與書籤：
      b-list-group(flush)
        b-list-group-item.px-2.py-2.border-0.mb-2.rounded.bg-light(
          v-for="(item, idx) in topVisitedLinks"
          :key="item.id"
        )
          .d-flex.align-items-center.justify-content-between
            .d-flex.align-items-center.min-w-0
              b-badge(
                pill
                :variant="idx < 3 ? 'danger' : 'secondary'"
                class="mr-2"
              ) {{ idx + 1 }}
              a.text-dark.font-weight-bold.text-truncate(
                :href="item.href"
                target="_blank"
                @click="recordVisit(item)"
              ) {{ item.title }}
            b-badge(variant="info" pill) {{ item.visits }} 次
      .text-center.mt-3(v-if="topVisitedLinks.length === 0")
        p.text-muted.small 尚未累積點擊紀錄
</template>

<script>
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import FileSaver from 'file-saver'

export default {
  data: () => ({
    categories: [],
    selectedCategoryId: 'dashboard',
    searchKeyword: '',
    pinnedIds: [],
    userBookmarks: [],
    clickCounts: {},
    recentLinks: [],

    // 彈窗與抽屜狀態
    isBookmarkModalOpen: false,
    isEditMode: false,
    editBookmarkId: null,
    bookmarkForm: {
      title: '',
      href: '',
      description: '',
      icon: 'bookmark'
    },
    presetIcons: [
      'bookmark',
      'globe',
      'star',
      'server',
      'desktop',
      'file-alt',
      'link',
      'database',
      'shield-alt',
      'folder',
      'paper-plane',
      'heart'
    ],

    isBackupModalOpen: false,
    importFile: null,

    isPdfModalOpen: false,
    pdfModalUrl: '',
    pdfModalTitle: '',

    isIframeModalOpen: false,
    iframeModalUrl: '',
    iframeModalTitle: '',

    isTopDrawerOpen: false,

    // 管理員所內客製書籤管理狀態
    isAdminModalOpen: false,
    adminImportFile: null,
    adminParsedBookmarks: null,
    adminImportError: '',
    adminImportSummary: '',
    isCustomOfficeBookmarks: false,

    // 頁面說明與八所自訂指引 Modal
    isInstructionModalOpen: false,
    instructionTabIndex: 0,
    sampleJsonText: JSON.stringify([
      {
        category: '登記課專區',
        id: 'reg',
        icon: 'file-contract',
        links: [
          {
            title: '地政整合資訊系統 (WebAP)',
            href: 'http://220.1.35.123/land/login.jsp',
            description: '土地與建物登記核心業務系統',
            icon: 'desktop'
          },
          {
            title: '跨縣市代收代辦地政系統',
            href: 'https://clir.land.moi.gov.tw/',
            description: '跨縣市案件收件與跨所代收系統',
            icon: 'globe'
          }
        ]
      },
      {
        category: '測量課專區',
        id: 'sur',
        icon: 'map-marked-alt',
        links: [
          {
            title: '數值地籍測量外業管理系統',
            href: 'http://220.1.35.123/survey/',
            description: '土地複丈、建物測量與圖根點管理',
            icon: 'compass'
          }
        ]
      },
      {
        category: '地價課專區',
        id: 'val',
        icon: 'calculator',
        links: [
          {
            title: '地價調查與實價登錄查核系統',
            href: 'http://220.1.35.123/price/',
            description: '公告土地現值、重新規定地價與實價申報',
            icon: 'coins'
          }
        ]
      },
      {
        category: '行政與資訊專區',
        id: 'adm',
        icon: 'building-columns',
        links: [
          {
            title: '地政智慧控管與監控系統 (LAH)',
            href: 'http://127.0.0.1:8080/',
            description: '全所智慧監控、排程與即時儀表板',
            icon: 'chart-line'
          }
        ]
      }
    ], null, 2),

    // 彩蛋解鎖狀態
    isKonamiUnlocked: false,
    secretCode: 'uuddlrlrba',
    keyBuffer: ''
  }),
  head () {
    return {
      title: `${this.currentOfficePrefix} 所內書籤索引 - 桃園市地政智慧控管系統`
    }
  },
  computed: {
    // 依據各所代碼動態取得簡稱 (例如：桃園、中壢、大溪、楊梅、蘆竹、八德、平鎮、龜山)
    currentOfficeShortName () {
      const name = (this.siteName || '').replace(/(所|地政事務所)/g, '').trim()
      return name || '桃園'
    },
    // 動態全銜前綴 (例如：桃園地政、中壢地政；若為局則直接顯示地政局)
    currentOfficePrefix () {
      if (this.currentOfficeShortName.includes('局')) {
        return this.currentOfficeShortName
      }
      return `${this.currentOfficeShortName}地政`
    },
    // 管理者權限判定 (管理者或資訊課同仁可自訂全所書籤)
    isAdmin () {
      return Boolean(this.authority && (this.authority.isAdmin || this.isInf))
    },
    // 總書籤數
    totalBookmarksCount () {
      return this.allLinksWithoutHidden.length
    },
    // 所有連結（包含自訂，若未解鎖彩蛋則排除隱藏項）
    allLinksWithoutHidden () {
      const list = []
      this.categories.forEach((cat) => {
        (cat.links || []).forEach((link) => {
          if (!link.isHidden || this.isKonamiUnlocked) {
            list.push(link)
          }
        })
      })
      this.userBookmarks.forEach((ub) => {
        list.push(ub)
      })
      return list
    },
    // 我的最愛清單
    favoriteLinks () {
      return this.allLinksWithoutHidden.filter(
        link => this.isPinned(link.id) || link.isCustom
      )
    },
    // 當前視圖要展示的連結
    displayLinks () {
      if (this.searchKeyword.trim()) {
        const q = this.searchKeyword.trim().toLowerCase()
        return this.allLinksWithoutHidden.filter((link) => {
          const title = (link.title || '').toLowerCase()
          const desc = (link.description || '').toLowerCase()
          const href = (link.href || '').toLowerCase()
          const cat = (link.categoryName || '').toLowerCase()
          return title.includes(q) || desc.includes(q) || href.includes(q) || cat.includes(q)
        })
      }
      if (this.selectedCategoryId === 'favorites') {
        return this.favoriteLinks
      }
      if (this.selectedCategoryId === 'dashboard') {
        return this.allLinksWithoutHidden
      }
      const found = this.categories.find(c => c.id === this.selectedCategoryId)
      if (found) {
        return (found.links || []).filter(l => !l.isHidden || this.isKonamiUnlocked)
      }
      return []
    },
    filteredLinksCount () {
      return this.displayLinks.length
    },
    // 當前視圖標題與副標
    currentViewTitle () {
      if (this.searchKeyword.trim()) {
        return '全域搜尋結果'
      }
      if (this.selectedCategoryId === 'dashboard') {
        return '所內書籤總覽'
      }
      if (this.selectedCategoryId === 'favorites') {
        return '⭐ 我的最愛'
      }
      const found = this.categories.find(c => c.id === this.selectedCategoryId)
      return found ? found.category : '書籤列表'
    },
    currentViewSubtitle () {
      if (this.selectedCategoryId === 'dashboard') {
        return '彙整各課室公務系統與常用網路服務'
      }
      if (this.selectedCategoryId === 'favorites') {
        return '已釘選的最愛項目與個人自訂專屬書籤'
      }
      const found = this.categories.find(c => c.id === this.selectedCategoryId)
      return found ? `專屬服務與表單清單（共 ${this.getCategoryCount(found)} 筆）` : ''
    },
    currentViewIcon () {
      if (this.searchKeyword.trim()) {
        return 'search'
      }
      if (this.selectedCategoryId === 'dashboard') {
        return 'table-columns'
      }
      if (this.selectedCategoryId === 'favorites') {
        return 'star'
      }
      const found = this.categories.find(c => c.id === this.selectedCategoryId)
      return found ? this.mapIcon(found.icon) : 'folder'
    },
    // 熱門造訪 Top 10
    topVisitedLinks () {
      const map = new Map()
      this.allLinksWithoutHidden.forEach((link) => {
        const visits = this.clickCounts[link.id] || 0
        if (visits > 0) {
          map.set(link.id, { ...link, visits })
        }
      })
      return Array.from(map.values())
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10)
    }
  },
  mounted () {
    this.initLocalStorageData()
    this.loadBookmarksData()
    window.addEventListener('keydown', this.handleGlobalKeyDown)
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.handleGlobalKeyDown)
  },
  methods: {
    // 載入本機 LocalStorage 資料
    initLocalStorageData () {
      if (process.client) {
        try {
          this.pinnedIds = JSON.parse(localStorage.getItem('lah_pinned_ids') || '[]')
          this.userBookmarks = JSON.parse(localStorage.getItem('lah_user_bookmarks') || '[]')
          this.clickCounts = JSON.parse(localStorage.getItem('clickCounts') || '{}')
          this.recentLinks = JSON.parse(localStorage.getItem('recentLinks') || '[]')
          const lastCat = localStorage.getItem('lastSelectedCategory')
          if (lastCat) {
            this.selectedCategoryId = lastCat
          }
        } catch (e) {
          this.$utils.warn('讀取 LocalStorage 書籤資料失敗:', e)
        }
      }
    },
    // 載入書籤核心資料 (優先讀取系統設定中之客製書籤，若無則回退預設 /json/bookmarks.json)
    async loadBookmarksData () {
      let raw = null
      this.isCustomOfficeBookmarks = false

      // 1. 優先嘗試由後端系統設定讀取本所專屬設定
      try {
        const configData = await this.post(this.$consts.API.JSON.QUERY, {
          type: 'configs'
        }, false)
        if (configData && configData.raw && configData.raw.BOOKMARK_JSON) {
          const parsed = JSON.parse(configData.raw.BOOKMARK_JSON)
          if (Array.isArray(parsed) && parsed.length > 0) {
            raw = parsed
            this.isCustomOfficeBookmarks = true
          }
        }
      } catch (err) {
        this.$utils.warn('查詢後端 BOOKMARK_JSON 失敗，回退官方預設:', err)
      }

      // 2. 若後端無客製設定，則讀取靜態官方預設檔案 (保留桃園所預設)
      if (!raw) {
        try {
          if (process.client) {
            const resp = await fetch('/json/bookmarks.json')
            if (resp.ok) {
              const res = await resp.json()
              if (Array.isArray(res) && res.length > 0) {
                raw = res
              }
            }
          }
        } catch (err) {
          this.$utils.warn('從本機讀取 /json/bookmarks.json 失敗:', err)
        }
      }

      // 3. API 伺服器 /json/ 路徑備援
      if (!raw) {
        try {
          const res = await this.$axios.$get('/json/bookmarks.json')
          if (Array.isArray(res) && res.length > 0) {
            raw = res
          }
        } catch (err) {
          // fallback
        }
      }

      // 4. API 伺服器專案路徑備援
      if (!raw && this.apiQueryUrl) {
        try {
          const res = await this.$axios.$get(`${this.apiQueryUrl}/project/bookmark/bookmarks.json`)
          if (Array.isArray(res) && res.length > 0) {
            raw = res
          }
        } catch (e) {
          this.$utils.warn('從 API 伺服器載入 bookmarks.json 失敗:', e)
        }
      }

      if (!raw || !Array.isArray(raw)) {
        raw = []
      }

      // 動態計算當月輪值表與唯一 ID
      const now = new Date()
      const rocYear = now.getFullYear() - 1911
      const currentMonth = now.getMonth() + 1

      const processed = raw.map((cat) => {
        return {
          ...cat,
          links: (cat.links || []).map((link, idx) => {
            const item = {
              ...link,
              id: `${cat.id}-${idx}`,
              categoryName: cat.category,
              nextMonthHtml: ''
            }
            if (item.linkId === 'main-gate-roster') {
              item.title = `${rocYear}年${currentMonth}月大門輪值表`
              item.href = `http://220.1.34.18/service/section/%E4%BA%BA%E4%BA%8B%E5%AE%A4/photogallery/%E8%BC%AA%E5%80%BC%E8%A1%A8/${rocYear}/${currentMonth}%E6%9C%88%E8%BC%AA%E5%80%BC%E8%A1%A8.pdf`
            } else if (item.linkId === 'inf-roster') {
              item.title = `資訊課${rocYear}年${currentMonth}月輪值表`
              item.href = 'http://220.1.34.18/service/section/%E8%B3%87%E8%A8%8A%E8%AA%B2/news/%E8%B3%87%E8%A8%8A%E8%AA%B2%E8%BC%AA%E5%80%BC%E8%A1%A8.pdf'
            }
            return item
          })
        }
      })

      this.categories = processed
      this.checkNextMonthRosters()
    },
    // 次月輪值表自動檢查探測
    async checkNextMonthRosters () {
      const now = new Date()
      const rocYear = now.getFullYear() - 1911
      let nextMonth = now.getMonth() + 2
      let nextMonthRocYear = rocYear
      if (nextMonth > 12) {
        nextMonth = 1
        nextMonthRocYear += 1
      }

      const filesCat = this.categories.find(c => c.id === 'files')
      const mainGate = filesCat?.links?.find(l => l.linkId === 'main-gate-roster')
      if (mainGate) {
        const nextUrl = `http://220.1.34.18/service/section/%E4%BA%BA%E4%BA%8B%E5%AE%A4/photogallery/%E8%BC%AA%E5%80%BC%E8%A1%A8/${nextMonthRocYear}/${nextMonth}%E6%9C%88%E8%BC%AA%E5%80%BC%E8%A1%A8.pdf`
        try {
          const resp = await fetch(nextUrl, { method: 'HEAD' })
          if (resp.ok) {
            mainGate.nextMonthHtml = ` | <a href="${nextUrl}" target="_blank" class="text-primary font-weight-bold">預覽${nextMonth}月</a>`
          }
        } catch (e) {}
      }

      const infCat = this.categories.find(c => c.id === 'inf')
      const infRoster = infCat?.links?.find(l => l.linkId === 'inf-roster')
      if (infRoster) {
        const nextUrl = 'http://220.1.34.18/service/section/%E8%B3%87%E8%A8%8A%E8%AA%B2/news/%E8%B3%87%E8%A8%8A%E8%AA%B2%E8%BC%AA%E5%80%BC%E8%A1%A8NEXT.pdf'
        try {
          const resp = await fetch(nextUrl, { method: 'HEAD' })
          if (resp.ok) {
            infRoster.nextMonthHtml = ` | <a href="${nextUrl}" target="_blank" class="text-primary font-weight-bold">預覽下月</a>`
          }
        } catch (e) {}
      }
    },
    // 圖示名稱映射 (Lucide -> FontAwesome)
    mapIcon (icon) {
      if (!icon) {
        return 'globe'
      }
      const iconMap = {
        'send-horizontal': 'paper-plane',
        'concierge-bell': 'bell',
        'file-signature': 'file-signature',
        ruler: 'ruler-combined',
        tags: 'tags',
        briefcase: 'briefcase',
        computer: 'desktop',
        users: 'users',
        calculator: 'calculator',
        'file-down': 'file-download',
        'layout-dashboard': 'table-columns',
        clock: 'clock',
        'book-marked': 'bookmark',
        cloud: 'cloud',
        'file-output': 'file-export',
        'image-play': 'images',
        'monitor-smartphone': 'desktop',
        mail: 'envelope',
        'server-cog': 'server',
        server: 'server',
        landmark: 'landmark',
        history: 'history',
        'settings-2': 'cog',
        'message-square-text': 'comment-dots',
        'layout-list': 'list-alt',
        download: 'download',
        'file-search': 'search',
        building: 'building',
        'folder-lock': 'folder',
        'spell-check': 'spell-check',
        'door-open': 'door-open',
        'user-x': 'user-times',
        files: 'copy',
        'file-plus-2': 'file-medical',
        'shield-check': 'shield-alt',
        'file-lock-2': 'file-contract',
        banknote: 'money-bill',
        map: 'map',
        'calendar-clock': 'calendar-alt',
        'file-text': 'file-alt',
        'file-check-2': 'clipboard-check',
        'file-json': 'file-code',
        'database-zap': 'database',
        'area-chart': 'chart-area',
        'file-scan': 'file-invoice',
        'message-square-more': 'comments',
        archive: 'archive',
        'map-pin': 'map-marker-alt',
        'file-archive': 'file-archive',
        tv: 'tv',
        'message-circle': 'comment',
        'message-circle-more': 'comments',
        monitor: 'desktop',
        'cloud-sun-rain': 'cloud-sun',
        smile: 'smile',
        'refresh-ccw-dot': 'sync-alt',
        printer: 'print',
        cat: 'cat',
        'bar-chart-2': 'chart-bar',
        'book-open': 'book-open',
        globe: 'globe',
        microchip: 'microchip',
        video: 'video',
        user: 'user',
        'file-pen': 'file-signature',
        fingerprint: 'fingerprint',
        'calendar-x': 'calendar-times',
        'user-cog': 'user-cog',
        'calendar-search': 'calendar-check',
        'calendar-plus': 'calendar-plus',
        plane: 'plane',
        gift: 'gift',
        'table-2': 'table',
        bug: 'bug',
        'arrow-right-left': 'exchange-alt',
        'phone-forwarded': 'phone-alt',
        'heart-pulse': 'heartbeat',
        flashlight: 'lightbulb'
      }
      return iconMap[icon] || icon
    },
    // 分類計數
    getCategoryCount (cat) {
      if (!cat || !cat.links) {
        return 0
      }
      return cat.links.filter(l => !l.isHidden || this.isKonamiUnlocked).length
    },
    // 切換分類
    selectCategory (catId) {
      this.selectedCategoryId = catId
      this.searchKeyword = ''
      if (process.client) {
        localStorage.setItem('lastSelectedCategory', catId)
      }
    },
    // 判斷是否為 PDF
    isPdf (url) {
      return (url || '').toLowerCase().split('?')[0].endsWith('.pdf')
    },
    // 取網域名稱
    getDomain (url) {
      try {
        const u = new URL(url, window.location.origin)
        return u.hostname + (u.port ? ':' + u.port : '')
      } catch (e) {
        return url || ''
      }
    },
    // Markdown 轉換
    parseMarkdown (text) {
      if (!text) {
        return ''
      }
      try {
        const html = marked.parseInline ? marked.parseInline(text) : marked(text)
        return DOMPurify.sanitize(html)
      } catch (e) {
        return text
      }
    },
    // 關鍵字高亮
    highlightKeyword (text) {
      if (!text || !this.searchKeyword || !this.searchKeyword.trim()) {
        return text || ''
      }
      const safeQuery = this.searchKeyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(${safeQuery})`, 'gi')
      return String(text).replace(regex, '<mark class="bg-warning text-dark px-1 rounded font-weight-bold">$1</mark>')
    },
    // 釘選判斷
    isPinned (id) {
      return this.pinnedIds.includes(id)
    },
    // 切換釘選
    togglePin (link) {
      const idx = this.pinnedIds.indexOf(link.id)
      if (idx > -1) {
        this.pinnedIds.splice(idx, 1)
        this.notify(`已取消釘選「${link.title}」`, { title: '我的最愛', variant: 'secondary' })
      } else {
        this.pinnedIds.push(link.id)
        this.notify(`已將「${link.title}」加入我的最愛！`, { title: '我的最愛', variant: 'success' })
      }
      if (process.client) {
        localStorage.setItem('lah_pinned_ids', JSON.stringify(this.pinnedIds))
      }
    },
    // 複製網址
    copyUrl (url) {
      this.copyToClipboard(url, '已複製網址至剪貼簿！')
    },
    // 卡片點擊事件 (支援 Ctrl + 點擊以 IFrame 預覽)
    handleCardClick (event, link) {
      if (event.ctrlKey) {
        event.preventDefault()
        this.iframeModalUrl = link.href
        this.iframeModalTitle = link.title
        this.isIframeModalOpen = true
      } else {
        this.recordVisit(link)
      }
    },
    // 記錄點擊次數與最近造訪
    recordVisit (link) {
      const current = this.clickCounts[link.id] || 0
      this.$set(this.clickCounts, link.id, current + 1)

      const idx = this.recentLinks.indexOf(link.id)
      if (idx > -1) {
        this.recentLinks.splice(idx, 1)
      }
      this.recentLinks.unshift(link.id)
      if (this.recentLinks.length > 20) {
        this.recentLinks.pop()
      }

      if (process.client) {
        localStorage.setItem('clickCounts', JSON.stringify(this.clickCounts))
        localStorage.setItem('recentLinks', JSON.stringify(this.recentLinks))
      }
    },
    // 開啟 PDF 預覽彈窗
    openPdfPreview (url, title) {
      this.pdfModalUrl = `${url}#view=FitH&toolbar=1&navpanes=1`
      this.pdfModalTitle = title || 'PDF 檔案預覽'
      this.isPdfModalOpen = true
    },
    // 自訂書籤 Modal 操作
    openAddModal () {
      this.isEditMode = false
      this.editBookmarkId = null
      this.bookmarkForm = {
        title: '',
        href: '',
        description: '',
        icon: 'bookmark'
      }
      this.isBookmarkModalOpen = true
    },
    openEditModal (link) {
      this.isEditMode = true
      this.editBookmarkId = link.id
      this.bookmarkForm = {
        title: link.title,
        href: link.href,
        description: link.description,
        icon: link.icon || 'bookmark'
      }
      this.isBookmarkModalOpen = true
    },
    saveBookmarkModal () {
      if (!this.bookmarkForm.title.trim()) {
        this.alert('請輸入書籤名稱！')
        return
      }
      let url = this.bookmarkForm.href.trim()
      if (!url) {
        this.alert('請輸入連結網址！')
        return
      }
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
        url = 'http://' + url
      }

      if (this.isEditMode) {
        const item = this.userBookmarks.find(b => b.id === this.editBookmarkId)
        if (item) {
          item.title = this.bookmarkForm.title.trim()
          item.href = url
          item.description = this.bookmarkForm.description.trim()
          item.icon = this.bookmarkForm.icon
          this.success('已成功更新個人自訂書籤！')
        }
      } else {
        const newId = 'custom-' + Date.now()
        this.userBookmarks.unshift({
          id: newId,
          title: this.bookmarkForm.title.trim(),
          href: url,
          description: this.bookmarkForm.description.trim(),
          icon: this.bookmarkForm.icon,
          isCustom: true,
          createdAt: Date.now()
        })
        if (!this.pinnedIds.includes(newId)) {
          this.pinnedIds.push(newId)
        }
        this.success('已新增個人書籤並加入我的最愛！')
      }

      if (process.client) {
        localStorage.setItem('lah_user_bookmarks', JSON.stringify(this.userBookmarks))
        localStorage.setItem('lah_pinned_ids', JSON.stringify(this.pinnedIds))
      }
      this.isBookmarkModalOpen = false
    },
    deleteBookmark (id) {
      this.confirm('確定要刪除這筆個人自訂書籤嗎？').then((ok) => {
        if (ok) {
          this.userBookmarks = this.userBookmarks.filter(b => b.id !== id)
          this.pinnedIds = this.pinnedIds.filter(pid => pid !== id)
          if (process.client) {
            localStorage.setItem('lah_user_bookmarks', JSON.stringify(this.userBookmarks))
            localStorage.setItem('lah_pinned_ids', JSON.stringify(this.pinnedIds))
          }
          this.notify('已刪除該自訂書籤', { title: '自訂書籤', variant: 'secondary' })
        }
      })
    },
    // 備份與還原
    exportBackup () {
      const payload = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        pinnedIds: this.pinnedIds,
        userBookmarks: this.userBookmarks,
        clickCounts: this.clickCounts,
        recentLinks: this.recentLinks
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const now = new Date()
      const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0')
      FileSaver.saveAs(blob, `lah_bookmarks_backup_${dateStr}.json`)
      this.success('已成功匯出個人備份檔案！')
    },
    importBackup () {
      if (!this.importFile) {
        this.alert('請先選擇要匯入的備份檔案 (.json)')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (data && typeof data === 'object') {
            if (Array.isArray(data.pinnedIds)) {
              this.pinnedIds = data.pinnedIds
            }
            if (Array.isArray(data.userBookmarks)) {
              this.userBookmarks = data.userBookmarks
            }
            if (data.clickCounts) {
              this.clickCounts = data.clickCounts
            }
            if (Array.isArray(data.recentLinks)) {
              this.recentLinks = data.recentLinks
            }

            if (process.client) {
              localStorage.setItem('lah_pinned_ids', JSON.stringify(this.pinnedIds))
              localStorage.setItem('lah_user_bookmarks', JSON.stringify(this.userBookmarks))
              localStorage.setItem('clickCounts', JSON.stringify(this.clickCounts))
              localStorage.setItem('recentLinks', JSON.stringify(this.recentLinks))
            }
            this.success('備份資料還原成功！')
            this.isBackupModalOpen = false
            this.importFile = null
          }
        } catch (err) {
          this.alert('備份檔格式不正確，無法解析')
        }
      }
      reader.readAsText(this.importFile)
    },
    resetPersonalData () {
      this.confirm('警告：這將會清除您所有的個人自訂書籤、釘選與造訪次數，確定要重置嗎？').then((ok) => {
        if (ok) {
          this.pinnedIds = []
          this.userBookmarks = []
          this.clickCounts = {}
          this.recentLinks = []
          if (process.client) {
            localStorage.removeItem('lah_pinned_ids')
            localStorage.removeItem('lah_user_bookmarks')
            localStorage.removeItem('clickCounts')
            localStorage.removeItem('recentLinks')
          }
          this.notify('已清除本機所有個人設定', { title: '重置完成', variant: 'warning' })
          this.isBackupModalOpen = false
        }
      })
    },
    // 全域鍵盤事件監聽 (快捷鍵 / 聚焦搜尋，彩蛋 Konami Code)
    handleGlobalKeyDown (e) {
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        if (this.$refs.searchInput) {
          this.$refs.searchInput.focus()
        }
        return
      }
      if (e.key === 'Escape') {
        if (this.isInstructionModalOpen) {
          this.isInstructionModalOpen = false
        }
        if (this.isAdminModalOpen) {
          this.isAdminModalOpen = false
        }
        if (this.isBookmarkModalOpen) {
          this.isBookmarkModalOpen = false
        }
        if (this.isBackupModalOpen) {
          this.isBackupModalOpen = false
        }
        if (this.isPdfModalOpen) {
          this.isPdfModalOpen = false
        }
        if (this.isIframeModalOpen) {
          this.isIframeModalOpen = false
        }
        if (this.isTopDrawerOpen) {
          this.isTopDrawerOpen = false
        }
        if (this.searchKeyword) {
          this.searchKeyword = ''
        }
        return
      }

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return
      }

      const keyMap = { arrowup: 'u', arrowdown: 'd', arrowleft: 'l', arrowright: 'r' }
      const key = e.key.toLowerCase()
      const mappedKey = keyMap[key] || key
      this.keyBuffer += mappedKey
      if (this.keyBuffer.length > this.secretCode.length) {
        this.keyBuffer = this.keyBuffer.slice(-this.secretCode.length)
      }
      if (this.keyBuffer === this.secretCode) {
        this.isKonamiUnlocked = true
        this.keyBuffer = ''
        this.success('🎉 已解鎖資訊課隱藏工具專區！')
      }
    },
    // 頁面說明與指引 Modal 操作
    openInstructionModal (tabIndex = 0) {
      this.instructionTabIndex = tabIndex
      this.isInstructionModalOpen = true
    },
    copySampleJson () {
      this.copyToClipboard(this.sampleJsonText, '已複製標準 JSON 規格範例至剪貼簿！')
    },
    downloadSampleJson () {
      const blob = new Blob([this.sampleJsonText], { type: 'application/json' })
      FileSaver.saveAs(blob, 'bookmarks_sample.json')
      this.success('已下載標準 bookmarks_sample.json 範例！')
    },
    // 管理員專區操作
    openAdminModal () {
      this.adminImportFile = null
      this.adminParsedBookmarks = null
      this.adminImportError = ''
      this.adminImportSummary = ''
      this.isAdminModalOpen = true
    },
    // 匯出目前生效的所內設定 (乾淨的 JSON 結構)
    exportCurrentOfficeBookmarks () {
      const cleanData = this.categories.map(cat => ({
        category: cat.category,
        id: cat.id,
        icon: cat.icon,
        links: (cat.links || []).map(l => ({
          title: l.title,
          href: l.href,
          description: l.description,
          icon: l.icon,
          ...(l.linkId ? { linkId: l.linkId } : {}),
          ...(l.isHidden ? { isHidden: true } : {})
        }))
      }))
      const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' })
      const now = new Date()
      const dateStr = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0')
      FileSaver.saveAs(blob, `office_bookmarks_${this.site || 'HA'}_${dateStr}.json`)
      this.success('已匯出目前所內課室書籤設定！')
    },
    // 下載桃園所標準原始範本 (支援 static/json/bookmarks.json 與後端備援)
    async exportDefaultTaoyuanTemplate () {
      try {
        let data = null
        // 1. 優先透過原生 fetch 讀取當前站台 static/json/bookmarks.json
        if (process.client) {
          try {
            const resp = await fetch('/json/bookmarks.json')
            if (resp.ok) {
              const json = await resp.json()
              if (Array.isArray(json) && json.length > 0) {
                data = json
              }
            }
          } catch (e) {
            // fallback
          }
        }
        // 2. 備援透過 $axios 讀取 /json/bookmarks.json
        if (!data) {
          try {
            const res = await this.$axios.$get('/json/bookmarks.json')
            if (Array.isArray(res) && res.length > 0) {
              data = res
            }
          } catch (e) {
            // fallback
          }
        }
        // 3. 備援透過 API 伺服器 project 目錄讀取
        if (!data && this.apiQueryUrl) {
          try {
            const res = await this.$axios.$get(`${this.apiQueryUrl}/project/bookmark/bookmarks.json`)
            if (Array.isArray(res) && res.length > 0) {
              data = res
            }
          } catch (e) {
            // fallback
          }
        }

        if (Array.isArray(data) && data.length > 0) {
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
          FileSaver.saveAs(blob, 'bookmarks_template_taoyuan.json')
          this.success('已下載桃園所標準 bookmarks.json 範本！')
        } else {
          throw new Error('未取得有效範本陣列')
        }
      } catch (err) {
        this.alert('取得官方範本失敗，請稍後再試：' + (err.message || ''))
      }
    },
    // 檢查管理員上傳之檔案格式
    handleAdminFileChange (file) {
      this.adminImportError = ''
      this.adminImportSummary = ''
      this.adminParsedBookmarks = null
      if (!file) {
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          let text = e.target.result || ''
          // 自動過濾單行 // 與多行 /* */ 註解，相容使用者手動編輯 JSON 時加入的註解
          text = text.replace(/("(?:\\.|[^"\\])*")|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (match, str) => str || '')
          let parsed = JSON.parse(text)
          // 若被二次字串化則自動還原
          if (typeof parsed === 'string') {
            try {
              parsed = JSON.parse(parsed)
            } catch (err) {}
          }
          // 容錯支援 { bookmarks: [...] }、{ data: [...] } 或 { categories: [...] } 包裹
          if (parsed && !Array.isArray(parsed) && typeof parsed === 'object') {
            if (Array.isArray(parsed.bookmarks)) {
              parsed = parsed.bookmarks
            } else if (Array.isArray(parsed.data)) {
              parsed = parsed.data
            } else if (Array.isArray(parsed.categories)) {
              parsed = parsed.categories
            }
          }
          if (!Array.isArray(parsed) || parsed.length === 0) {
            this.adminImportError = '檔案格式不符：最外層必須是包含分類物件的陣列。'
            return
          }
          let linkCount = 0
          for (let i = 0; i < parsed.length; i++) {
            const cat = parsed[i]
            if (!cat.category || !cat.id || !Array.isArray(cat.links)) {
              this.adminImportError = `第 ${i + 1} 個分類缺少必要欄位（category、id 或 links）。`
              return
            }
            linkCount += cat.links.length
          }
          this.adminParsedBookmarks = parsed
          this.adminImportSummary = `格式驗證通過！共解析出 ${parsed.length} 個課室分類、${linkCount} 筆書籤連結。`
        } catch (err) {
          this.adminImportError = 'JSON 解析失敗，請確認檔案格式是否為合法 JSON。'
        }
      }
      reader.readAsText(file)
    },
    // 儲存並發布客製書籤至後端系統設定
    async saveOfficeBookmarks () {
      if (!this.adminParsedBookmarks) {
        this.alert('請先選擇有效的 bookmarks.json 檔案！')
        return
      }
      const answer = await this.confirm('確定要發布此書籤設定至全所嗎？發布後全所同仁重新整理即可同步生效。')
      if (!answer) {
        return
      }
      try {
        const res = await this.post(this.$consts.API.JSON.QUERY, {
          type: 'update_configs',
          configs: {
            BOOKMARK_JSON: JSON.stringify(this.adminParsedBookmarks)
          }
        })
        if (this.$utils.statusCheck(res.status)) {
          this.success('已成功更新並發布全所各課室書籤！')
          this.isAdminModalOpen = false
          await this.loadBookmarksData()
        } else {
          this.alert(res.message || '更新失敗')
        }
      } catch (err) {
        this.alert('儲存失敗，請確認網路連線與後端權限')
      }
    },
    // 還原為官方預設 (桃園所)
    async resetToDefaultTaoyuanBookmarks () {
      const answer = await this.confirm('警告：確定要將全所課室書籤還原為【桃園所官方預設值】嗎？這將會清除後端自訂設定並對全所生效。')
      if (!answer) {
        return
      }
      try {
        const res = await this.post(this.$consts.API.JSON.QUERY, {
          type: 'update_configs',
          configs: {
            BOOKMARK_JSON: ''
          }
        })
        if (this.$utils.statusCheck(res.status)) {
          this.success('已成功還原為桃園所官方預設書籤！')
          this.isAdminModalOpen = false
          await this.loadBookmarksData()
        } else {
          this.alert(res.message || '還原失敗')
        }
      } catch (err) {
        this.alert('還原失敗，請稍後再試')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.bookmark-dashboard {
  background-color: #f8fafc;
}

// Header brand & search bar (與 reg/index.vue 及 lah-header 45px 操作 UI 規範完全一致)
.header-brand-bar {
  min-height: 52px;
}

.header-logo-box {
  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 54px;
  height: 54px;
  transition: all 0.25s ease;

  .ambient-glow {
    position: absolute;
    width: 64px;
    height: 64px;
    background: radial-gradient(circle, rgba(37, 99, 235, 0.35) 0%, rgba(14, 165, 233, 0.2) 45%, rgba(99, 102, 241, 0.1) 70%, transparent 80%);
    border-radius: 50%;
    filter: blur(10px);
    z-index: 0;
    pointer-events: none;
    animation: pulse-glow 4s ease-in-out infinite alternate;
  }

  .header-logo {
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.12));
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    &:hover {
      transform: scale(1.08);
    }
  }

  ::v-deep img {
    width: 46px !important;
    height: 46px !important;
    max-height: 46px !important;
    margin-bottom: 0 !important;
  }
}

@keyframes pulse-glow {
  0% { transform: scale(0.92); opacity: 0.7; }
  100% { transform: scale(1.15); opacity: 1; }
}

.header-title {
  font-size: 1.35rem;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.header-subtitle {
  font-size: 0.85rem;
  letter-spacing: 0.1px;
}

.header-badge-text {
  font-size: 0.8rem;
}

// Search inside header (高度嚴格對齊 lah-header 45px 規範)
.header-search-wrapper {
  max-width: 360px;
  min-width: 180px;
  transition: all 0.25s ease;
}

.header-search-input-group {
  height: 45px !important;
  border-radius: 26px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: #ffffff;
  transition: all 0.25s ease;
  display: flex;
  align-items: stretch;

  &:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
  }

  ::v-deep .input-group-prepend,
  ::v-deep .input-group-append,
  ::v-deep .input-group-text,
  ::v-deep .btn,
  ::v-deep input {
    height: 45px !important;
    display: inline-flex;
    align-items: center;
  }

  ::v-deep .input-group-text {
    background: transparent;
    border: none;
    padding-left: 0.9rem;
    padding-right: 0.4rem;
    font-size: 1.05rem;
  }

  input {
    border: none;
    box-shadow: none !important;
    padding: 0 0.5rem;
    font-size: 0.95rem;
  }

  .header-search-count-btn {
    border-radius: 0 26px 26px 0 !important;
    font-size: 0.9rem;
    font-weight: 600;
    padding-left: 0.85rem !important;
    padding-right: 0.85rem !important;
  }
}

// 快捷操作按鈕組 (高度嚴格對齊 lah-header 45px 規範，禁止直式折行)
.header-btn-group {
  height: 45px !important;

  ::v-deep .btn,
  .header-action-btn {
    height: 45px !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.85rem;
    font-size: 0.95rem;
    font-weight: 500;
    white-space: nowrap !important;
    flex-shrink: 0;

    .btn-label {
      margin-left: 0.35rem;
      white-space: nowrap !important;
    }
  }
}

// ============================================================================
// 響應式優化：防止 Viewport 縮小時 (例如 1200x960 px) 版面崩裂
// ============================================================================
@media (max-width: 1399.98px) {
  // 1400px 以下隱藏操作按鈕文字標籤，僅保留圖示（維持 45px 正方按鈕），徹底防止中文字直立折行
  .header-btn-group {
    .header-action-btn {
      padding: 0 0.75rem !important;

      .btn-label {
        display: none !important;
      }

      lah-fa-icon {
        margin-right: 0 !important;
      }
    }
  }

  // 1400px 以下隱藏導航指南徽章
  .header-badge-text {
    display: none !important;
  }
}

// 1250px 以下 (精確適配 1200x960 px 測試環境)
@media (max-width: 1250px) {
  .header-logo-box {
    width: 44px;
    height: 44px;

    .ambient-glow {
      width: 52px;
      height: 52px;
    }

    ::v-deep img {
      width: 36px !important;
      height: 36px !important;
      max-height: 36px !important;
    }
  }

  // 標題區縮減文字：副標題隱藏
  .header-subtitle {
    display: none !important;
  }

  .header-title {
    font-size: 1.25rem !important;
  }

  // 搜尋列緊湊化：隱藏「共 X 項」統計按鈕，大幅釋放橫向寬度
  .header-search-wrapper {
    min-width: 150px !important;
    max-width: 220px !important;
  }

  .header-search-count-append {
    display: none !important;
  }
}

@media (max-width: 991.98px) {
  .header-title {
    font-size: 1.15rem !important;
  }
}

// ============================================================================
// 篩選與切換轉場動畫效果 (Transition & FLIP animation)
// ============================================================================
.view-fade-enter-active,
.view-fade-leave-active {
  transition: opacity 0.28s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.28s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.view-fade-enter {
  opacity: 0;
  transform: translateY(12px);
}
.view-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.bookmark-grid-row {
  position: relative;
  min-height: 200px;
}

.bookmark-col {
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.bookmark-flip-enter-active {
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.bookmark-flip-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: absolute !important;
  z-index: 0;
  pointer-events: none;
}

.bookmark-flip-enter {
  opacity: 0;
  transform: scale(0.9) translateY(16px);
}

.bookmark-flip-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(16px);
}

.bookmark-flip-move {
  transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}

// ============================================================================
// 下方主要顯示區域 (字體縮小約 90%，排版更緊湊精緻)
// ============================================================================

.bookmark-main-wrapper {
  font-size: 0.9rem; // 主要顯示區字體縮小約 90%
  padding-left: 20px !important;
  padding-right: 20px !important;
}

.bookmark-hub-container {
  max-width: 100% !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

// 左側分類導覽
.category-card {
  border-radius: 12px !important;
  overflow: hidden;
}

.category-header-title {
  font-size: 1.02rem;
}

.category-header-badge {
  font-size: 0.85rem;
  padding: 0.3em 0.55em;
}

.category-item {
  padding: 0.75rem 0.95rem;
  font-size: 1.02rem;
  border-left: 4px solid transparent;
  transition: all 0.2s ease;

  .category-icon {
    font-size: 1.12rem;
  }

  .category-badge {
    font-size: 0.85rem;
    padding: 0.3em 0.55em;
  }

  &.active {
    background-color: #eff6ff !important;
    color: #1d4ed8 !important;
    border-left-color: #2563eb !important;
    font-weight: bold;

    .category-icon {
      color: #2563eb !important;
    }
  }

  &:hover:not(.active) {
    background-color: #f1f5f9;
  }
}

// 內容頂部狀態橫條
.view-header {
  border-radius: 12px !important;

  .view-icon-box {
    width: 48px;
    height: 48px;
    background-color: #eff6ff;

    .view-main-icon {
      font-size: 1.42rem;
    }
  }

  .view-title {
    font-size: 1.52rem;
  }

  .view-subtitle {
    font-size: 0.92rem;
  }

  .view-header-add-btn {
    height: 38px;
    display: inline-flex;
    align-items: center;
    font-size: 0.95rem;
    padding: 0 1rem;
  }
}

// 儀表板視圖的分區標題
.section-heading {
  .section-cat-icon {
    font-size: 1.28rem;
  }

  .section-cat-title {
    font-size: 1.42rem;
  }

  .section-cat-badge {
    font-size: 0.88rem;
    padding: 0.3em 0.6em;
  }

  .section-more-btn {
    font-size: 0.95rem;
  }
}

// 書籤卡片 (精緻比例，字體縮小約 90%)
.bookmark-card {
  border-radius: 12px !important;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  background-color: #ffffff;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04) !important;

    .icon-avatar {
      transform: scale(1.08);
    }

    .bookmark-title {
      color: #2563eb !important;
    }
  }

  .card-top-bar {
    background-color: #fafbfc;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;

    .card-tag-badge {
      font-size: 0.82rem;
      padding: 0.25em 0.5em;
    }

    .action-btn {
      font-size: 1rem;
      line-height: 1;
      padding: 0.25rem !important;
      transition: color 0.15s ease;

      &:hover {
        text-decoration: none;
      }
    }
  }

  .bookmark-card-body {
    padding: 1.1rem 0.9rem !important;
  }

  .icon-avatar {
    width: 52px;
    height: 52px;
    transition: transform 0.25s ease;

    .avatar-icon {
      font-size: 1.55rem;
    }
  }

  .bg-primary-light {
    background-color: #eff6ff;
  }

  .bg-warning-light {
    background-color: #fef9c3;
  }

  .bookmark-title {
    font-size: 1.15rem;
    line-height: 1.35;
    transition: color 0.2s ease;
  }

  .bookmark-desc {
    font-size: 0.9rem;
    line-height: 1.5;
  }

  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 2.7em;
  }

  .card-footer-bar {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;

    .card-domain-text {
      font-size: 0.82rem;
    }
  }
}

.pdf-iframe,
.preview-iframe {
  background-color: #525659;
}

// 圖示選取器按鈕 (正方形置中，消除 Gutter 偏斜)
.icon-select-btn {
  width: 42px;
  height: 42px;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;

  ::v-deep .svg-inline--fa {
    margin: 0 !important;
  }
}
</style>
