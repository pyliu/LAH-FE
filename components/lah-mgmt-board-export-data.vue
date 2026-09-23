<template lang="pug">
b-card(:class="{ 'board-expanded': working || links.length > 0 }")
  template(#header)
    .d-flex.w-100.justify-content-between.align-items-center.mb-0
      h6.my-auto.font-weight-bolder
        lah-fa-icon(icon="road" size="lg") 輸出地籍資料
      b-button-group.align-middle(size="sm" v-if="!working")
        lah-button.border-0.mr-1(
          icon="list-check",
          variant="outline-success",
          @click="openSectSelectModal",
          v-b-popover.top.hover.focus="'選取轄區段代碼'",
          title="選取轄區段代碼"
        )
        lah-button.border-0.mr-1(
          icon="layer-group",
          variant="outline-primary",
          @click="setPreset(['0182', '0184', '0142'])",
          v-b-popover.top.hover.focus="'中平市地重劃'",
          title="中平市地重劃"
        )
        lah-button.border-0.mr-1(
          icon="arrow-rotate-left",
          action="cycle-alt",
          variant="outline-secondary",
          @click="clean",
          title="重設",
          :disabled="tags.length === 0 && links.length === 0"
        )
        lah-button.border-0.mr-1(
          v-if="hasServerFiles",
          icon="trash-can",
          variant="outline-danger",
          @click="openCleanModal",
          v-b-popover.top.hover.focus="'清理後端已產出檔案'",
          title="清理後端已產出檔案",
          :disabled="working || clearing"
        )
        lah-button.border-0(
          icon="question",
          variant="outline-success",
          v-b-modal.export-data-help-modal,
          title="說明"
        )

  //- 說明彈出視窗
  b-modal#export-data-help-modal(
    title="地籍資料匯出功能提示",
    size="lg",
    hide-footer,
    scrollable
  )
    .modal-help-content
      h5.font-weight-bold.text-primary 地政局索取地籍資料備註
      p.mt-2.mb-1
        span.text-danger.font-weight-bold ※
        strong 系統管理子系統 / 資料轉入轉出
        span.text-muted  (共 14 個 txt 檔案，地/建號範圍從 00000000 ~ 99999999)
      .alert.alert-light.border.py-1.px-2.my-2
        small.text-muted 除標示為黃色部分須至地政系統 WEB 版作業，其餘皆由本功能產出下載。

      .pl-3.mb-3
        .font-weight-bold.text-secondary AI001-10
        ul.mb-2
          li AI00301 - 土地標示部
          li AI00401 - 土地所有權部
          li AI00601 - 管理者資料【土地、建物各做一次】
          li AI00701 - 建物標示部
          li AI00801 - 基地坐落
          li AI00901 - 建物分層及附屬
          li AI01001 - 主建物與共同使用部分
        .font-weight-bold.text-secondary AI011-20
        ul.mb-2
          li AI01101 - 建物所有權部
          li: span.bg-warning.px-1.rounded AI01901 - 土地各部別 (須至地政系統WEB版)
        .font-weight-bold.text-secondary AI021-40
        ul.mb-2
          li: span.bg-warning.px-1.rounded AI02101 - 土地他項權利部 (須至地政系統WEB版)
          li: span.bg-warning.px-1.rounded AI02201 - 建物他項權利部 (須至地政系統WEB版)
          li AI02901 - 各部別之其他登記事項【土地、建物各做一次】

      hr

      p.mb-1
        span.text-danger.font-weight-bold ※
        strong 測量子系統 / 測量資料管理 / 資料輸出入
      ul.pl-4.mb-3
        li 地籍圖轉出 (數值地籍)：輸出 DXF 圖檔【含控制點】及 NEC 重測輸出檔
        li 地籍圖轉出 (圖解數化)：同上兩種類皆輸出，並將【分幅管理者先接合】下選項皆勾選
        li 如無法產出 DXF 資料請選擇【整段輸出】(例如 0210 忠福段)
        li 請至地政系統WEB版產出
      hr

      p.mb-0
        span.text-danger.font-weight-bold ※
        span 登記子系統/列印/清冊報表/土地建物地籍整理清冊
        ul.pl-4.mb-3
          li 土地、建物各產一次存PDF
          li 請至地政系統WEB版產出

  //- 清理後端檔案彈出視窗
  b-modal#export-data-clean-modal(
    ref="cleanModal",
    size="lg",
    scrollable,
    no-close-on-backdrop
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon(icon="broom" size="lg" variant="danger")
        span.ml-2 清理後端已產出檔案

    //- 載入狀態
    .text-center.my-4(v-if="loadingServerFiles")
      lah-fa-icon(icon="spinner" spin size="2x" variant="primary")
      .mt-2.text-muted 正在讀取後端 export 目錄檔案清單...

    //- 無檔案狀態
    .text-center.my-4(v-else-if="serverFiles.length === 0")
      lah-fa-icon(icon="folder-open" size="2x" variant="secondary")
      .mt-2.text-secondary 後端目前無任何地籍產出檔案（.txt 或 .zip）可供清理。

    //- 檔案清單
    div(v-else)
      .d-flex.justify-content-between.align-items-center.mb-2.pb-2.border-bottom
        .d-flex.align-items-center
          b-form-checkbox(
            :checked="allSelected",
            :indeterminate="isIndeterminate",
            @change="toggleSelectAll",
            class="my-auto"
          )
          span.ml-2.font-weight-bold.text-secondary
            | 共 {{ serverFiles.length }} 個檔案 (已選 {{ selectedFilenames.length }} 個，總計 {{ totalSelectedSize }})
        .d-flex.align-items-center
          lah-button(
            icon="rotate",
            size="sm",
            variant="outline-secondary",
            @click="fetchServerFiles",
            :disabled="loadingServerFiles || clearing",
            title="重新整理清單"
          ) 重新整理
          lah-button.ml-1(
            icon="file-zipper",
            size="sm",
            variant="outline-success",
            @click="downloadModalZip",
            :disabled="loadingServerFiles || clearing || selectedFilenames.length === 0",
            title="將所選檔案打包成 ZIP 下載"
          )
            span(v-if="!modalZipping") 打包下載 (ZIP)
            span(v-else)
              lah-fa-icon(icon="spinner" spin)
              span.ml-1 打包中...

      .clean-modal-files-list
        .d-flex.align-items-center.justify-content-between.p-2.border-bottom.border-light(
          v-for="file in serverFiles"
          :key="file.filename"
          :class="{'bg-light': isSelected(file)}"
        )
          .d-flex.align-items-center.text-truncate.mr-2
            b-form-checkbox(
              :checked="isSelected(file)",
              @change="toggleFileSelection(file)",
              class="my-auto"
            )
            lah-fa-icon(
              :icon="file.type === 'zip' ? 'file-zipper' : 'file-lines'",
              :variant="file.type === 'zip' ? 'warning' : 'primary'",
              class="mx-2"
            )
            .text-truncate
              div.text-truncate.font-weight-bold.s-90 {{ file.filename }}
              small.text-muted.s-75 {{ file.size_formatted }} ｜ {{ file.mtime }}
          .d-flex.align-items-center.flex-shrink-0
            lah-button(
              icon="download",
              size="sm",
              variant="outline-primary",
              @click="downloadSingleServerFile(file)",
              title="下載此檔案",
              :disabled="clearing"
            ) 下載

    template(#modal-footer="{ cancel }")
      .d-flex.w-100.justify-content-between.align-items-center
        small.text-muted(v-if="serverFiles.length > 0")
          lah-fa-icon(icon="triangle-exclamation" variant="warning")
          span.ml-1 清理後檔案將從伺服器永久刪除，建議清掃前先點擊「下載」或「打包下載」。
        small(v-else)
        .d-flex
          b-button(
            variant="secondary",
            size="sm",
            @click="cancel",
            :disabled="clearing"
          ) 取消
          b-button.ml-2(
            variant="danger",
            size="sm",
            @click="doCleanServerFiles",
            :disabled="clearing || loadingServerFiles || selectedFilenames.length === 0"
          )
            lah-fa-icon(icon="spinner" spin v-if="clearing")
            span.ml-1(v-if="clearing") 清掃中...
            span(v-else)
              lah-fa-icon(icon="broom")
              span.ml-1 確認清掃 ({{ selectedFilenames.length }})

  //- 段代碼選取彈出視窗
  b-modal#export-data-sect-modal(
    ref="sectModal",
    size="lg",
    scrollable,
    no-close-on-backdrop
  )
    template(#modal-title)
      .d-flex.align-items-center
        lah-fa-icon(icon="map-location-dot", size="lg", variant="primary")
        span.ml-2 選取轄區段代碼
        b-badge.ml-2(v-if="sections.length > 0", variant="secondary", pill) 共 {{ sections.length }} 段

    //- 載入狀態
    .text-center.my-4(v-if="loadingSections")
      lah-fa-icon(icon="spinner", spin, size="2x", variant="primary")
      .mt-2.text-muted 正在讀取轄區段別資料...

    div(v-else)
      //- 搜尋與批次操作工具列
      .d-flex.justify-content-between.align-items-center.mb-2
        b-input-group.input-group-height-hack(size="sm", prepend="篩選", style="max-width: 300px;")
          b-form-input(
            v-model="sectFilter",
            placeholder="段代碼 (如 0001) 或段名稱...",
            title="篩選段代碼或段名稱",
            style="height: 33px;"
          )
          template(#append, v-if="sectFilter")
            lah-button(
              icon="xmark",
              variant="outline-secondary",
              @click="sectFilter = ''",
              title="清除篩選"
            )
        .d-flex.align-items-center
          lah-button.mr-1(
            icon="check-double",
            size="sm",
            variant="outline-primary",
            @click="toggleAllFilteredSects(true)",
            :disabled="filteredSections.length === 0",
            title="勾選目前符合篩選條件的段別"
          ) 全選篩選 ({{ filteredSections.length }})
          lah-button.mr-1(
            icon="xmark",
            size="sm",
            variant="outline-secondary",
            @click="toggleAllFilteredSects(false)",
            :disabled="filteredSections.length === 0",
            title="取消目前符合篩選條件的段別勾選"
          ) 取消篩選
          lah-button(
            icon="trash-can",
            size="sm",
            variant="outline-danger",
            @click="clearAllSelectedSects",
            :disabled="selectedSectCodes.length === 0",
            title="清除所有已選取的段代碼"
          ) 清空已選 ({{ selectedSectCodes.length }})

      //- 已選取的段標籤預覽區 (有選取時顯示)
      .selected-tags-box.p-2.mb-2.rounded.border.bg-light(v-if="selectedSectCodes.length > 0")
        .d-flex.justify-content-between.align-items-center.mb-1
          small.font-weight-bold.text-primary
            lah-fa-icon(icon="check")
            span.ml-1 已選取 {{ selectedSectCodes.length }} 個段別：
          small.text-muted 點擊標籤可快速移除
        .d-flex.flex-wrap.align-items-center
          b-badge.mr-1.mb-1.p-1.px-2.d-inline-flex.align-items-center(
            v-for="code in selectedSectCodes",
            :key="'sel_' + code",
            variant="primary",
            pill
          )
            span {{ getSectBadgeText(code) }}
            b-link.text-white.ml-1(@click.stop="removeSelectedSect(code)", title="移除"): lah-fa-icon(icon="xmark")

      //- 統計摘要提示
      .d-flex.justify-content-between.align-items-center.mb-2.small.text-muted
        span
          lah-fa-icon(icon="list-check")
          span.ml-1 點擊列表任一列即可切換勾選狀態
        span(v-if="sectFilter") 篩選顯示 {{ filteredSections.length }} / {{ sections.length }} 段

      //- 段小段清單表格
      .sect-modal-table-container.border.rounded
        b-table.text-center.mb-0(
          :items="filteredSections",
          :fields="sectFields",
          responsive="sm",
          striped,
          hover,
          small,
          bordered,
          head-variant="dark",
          show-empty,
          empty-text="查無符合篩選條件之段小段資料",
          :tbody-tr-class="sectRowClass",
          @row-clicked="toggleSectRow"
        )
          template(v-slot:head(選取))
            b-form-checkbox(
              :checked="allFilteredSelected",
              :indeterminate="isFilteredIndeterminate",
              @change="toggleAllFilteredSects",
              class="m-0",
              title="全選/取消全選目前篩選項目"
            )
          template(v-slot:cell(選取)="{ item }")
            b-form-checkbox(
              :checked="selectedSectCodes.includes(item.段代碼)",
              @change="toggleSectRow(item)",
              class="m-0",
              @click.native.stop
            )
          template(v-slot:cell(段代碼)="{ item }")
            span.font-weight-bold {{ item.段代碼 }}
          template(v-slot:cell(土地標示部筆數)="{ item }")
            span {{ format(item.土地標示部筆數) }} 筆
          template(v-slot:cell(面積)="{ item }")
            span(v-b-tooltip.hover="areaPing(item.面積)") {{ areaM2(item.面積) }}

    template(#modal-footer="{ cancel }")
      .d-flex.w-100.justify-content-between.align-items-center
        .small
          span.font-weight-bold 已勾選
          span.text-primary.font-weight-bolder {{ selectedSectCodes.length }}
          span  個段代碼
          span.text-muted(v-if="selectedSectCodes.length > 0")  (合計 {{ selectedTotalPlots }} 筆土地標示部資料)
        .d-flex
          b-button(
            variant="secondary",
            size="sm",
            @click="cancel"
          ) 取消
          b-button.ml-2(
            variant="primary",
            size="sm",
            @click="applySectSelection"
          )
            lah-fa-icon(icon="check")
            span.ml-1 確認帶入 ({{ selectedSectCodes.length }})

  //- 產製進度條
  .my-2(v-if="working")
    .d-flex.justify-content-between.align-items-center.mb-1
      small.text-muted: lah-fa-icon(icon="spinner" spin) 產製中...
      small.font-weight-bold.text-primary {{ currentTask }}
    b-progress(:max="max" show-progress animated)
      b-progress-bar(:value="iteration" :label="progressPercent")

  //- 段代碼輸入區
  b-input-group.input-group-height-hack(size="sm", prepend="段代碼", v-if="!working")
    b-form-input.no-cache(
      v-model="inputTag",
      :placeholder="inputPlaceholder",
      @keyup.enter="addTagFromInput",
      title="輸入段代碼後按 Enter 新增，或點右側「選取」按鈕開啟清單",
      style="height: 33px;"
    )
    template(#append)
      lah-button(
        v-if="inputTag",
        icon="xmark",
        variant="outline-secondary",
        @click="inputTag = ''",
        title="清除輸入文字"
      )
      lah-button(
        icon="list-check",
        variant="outline-success",
        @click="openSectSelectModal",
        title="開啟轄區段別選取視窗"
      )
        span(v-if="tags.length > 0") 選取 ({{ tags.length }})
        span(v-else) 選取
      lah-button(
        icon="file-export",
        action="move-fade-ltr",
        variant="outline-primary",
        @click="go",
        title="執行產製",
        :disabled="disabled"
      ) 執行

  //- 已選段代碼標籤管理區
  .mt-2(v-if="tags.length > 0 && !working")
    .d-flex.justify-content-between.align-items-center.mb-1
      small.text-muted
        lah-fa-icon(icon="tags")
        span.ml-1.font-weight-bold 已選段代碼 (共 {{ tags.length }} 個)：
      .d-flex.align-items-center
        b-link.small.mr-2(v-if="tags.length > 6", @click="tagsExpanded = !tagsExpanded")
          span(v-if="tagsExpanded") 收合 ▲
          span(v-else) 展開全部 ({{ tags.length }}) ▼
        b-link.small.text-danger(@click="cleanTags", title="清空所有已選段代碼") 清空
    .tags-display-container.p-2.rounded.border.bg-light(:class="{ 'tags-scrollable': tagsExpanded, 'tags-collapsed': !tagsExpanded && tags.length > 6 }")
      b-badge.mr-1.mb-1.p-1.px-2.d-inline-flex.align-items-center(
        v-for="tag in displayedTags",
        :key="'tag_' + tag",
        variant="primary",
        pill
      )
        span {{ getSectBadgeText(tag) }}
        b-link.text-white.ml-1(@click.stop="removeTag(tag)", title="移除"): lah-fa-icon(icon="xmark")
      b-badge.mr-1.mb-1.p-1.px-2.d-inline-flex.align-items-center.cursor-pointer(
        v-if="!tagsExpanded && tags.length > 6",
        variant="secondary",
        pill,
        @click="tagsExpanded = true",
        title="點擊展開所有已選段代碼"
      ) +{{ tags.length - 6 }} 個段別...

  //- 產製結果下載清單
  .mt-3(v-if="links.length > 0")
    .d-flex.justify-content-between.align-items-center.mb-1.border-bottom.pb-1
      small.font-weight-bold.text-secondary
        lah-fa-icon(icon="file-lines")
        span.ml-1 產製檔案清單 (共 {{ links.length }} 個)
      .d-flex.align-items-center
        lah-button(
          icon="file-zipper",
          variant="outline-success",
          size="sm",
          no-border,
          @click="downloadZip",
          :disabled="downloading || clearing",
          title="打包成 ZIP 下載"
        )
          span(v-if="!downloading") 全部下載 (ZIP)
          span(v-else)
            lah-fa-icon(icon="spinner" spin)
            span.ml-1 打包下載中...
        lah-button.ml-1(
          v-if="hasServerFiles",
          icon="trash-can",
          variant="outline-danger",
          size="sm",
          no-border,
          @click="openCleanModal",
          :disabled="downloading || clearing",
          title="清理後端已產出檔案"
        )
          lah-fa-icon(icon="spinner" spin v-if="clearing")
          span.ml-1(v-if="clearing") 清理中...
          span(v-else) 清理檔案

    .d-flex.flex-wrap.align-items-center.mt-1
      lah-button.m-1(
        v-for="(link, idx) in links"
        :key="idx"
        icon="download",
        action="move-fade-ttb",
        variant="outline-primary",
        size="sm",
        @click="download(link)",
        :title="'下載 ' + link.filename"
      ) {{ getDisplayName(link) }}
</template>

<script>
import FileSaver from 'file-saver'

const EXPORT_CODES = [
  { code: 'AI00301', name: '土地標示部' },
  { code: 'AI00401', name: '土地所有權部' },
  { code: 'AI00601_B', name: '土地管理者資料' },
  { code: 'AI00601_E', name: '建物管理者資料' },
  { code: 'AI00701', name: '建物標示部' },
  { code: 'AI00801', name: '基地座落資料' },
  { code: 'AI00901', name: '建物分層及附屬資料' },
  { code: 'AI01001', name: '主建物及共同使用部分資料' },
  { code: 'AI01101', name: '建物所有權部' },
  { code: 'AI02901_B', name: '土地各部別之其他登記事項' },
  { code: 'AI02901_E', name: '建物各部別之其他登記事項' }
]

export default {
  name: 'LahMgmtBoardExportData',
  data: () => ({
    tags: [],
    links: [],
    max: EXPORT_CODES.length,
    iteration: 0,
    working: false,
    currentTask: '',
    downloading: false,
    clearing: false,
    hasServerFiles: false,
    serverFiles: [],
    selectedFilenames: [],
    loadingServerFiles: false,
    modalZipping: false,
    inputTag: '',
    tagsExpanded: false,
    sections: [],
    loadingSections: false,
    selectedSectCodes: [],
    sectFilter: '',
    sectFields: [
      { key: '選取', label: '選取', sortable: false, thClass: 'text-center align-middle', tdClass: 'text-center align-middle' },
      { key: '區代碼', sortable: true, thClass: 'text-center align-middle', tdClass: 'text-center align-middle' },
      { key: '區名稱', sortable: true, thClass: 'text-center align-middle', tdClass: 'text-center align-middle' },
      { key: '段代碼', sortable: true, thClass: 'text-center align-middle', tdClass: 'text-center align-middle' },
      { key: '段名稱', sortable: true, thClass: 'align-middle', tdClass: 'align-middle' },
      { key: '土地標示部筆數', sortable: true, thClass: 'text-right align-middle', tdClass: 'text-right align-middle' },
      { key: '面積', sortable: true, thClass: 'text-right align-middle', tdClass: 'text-right align-middle' }
    ]
  }),
  computed: {
    disabled () {
      return this.tags.length === 0 || this.working
    },
    progressPercent () {
      if (this.max === 0) { return '0%' }
      return ((this.iteration / this.max) * 100).toFixed(1) + '%'
    },
    allSelected () {
      return this.serverFiles.length > 0 && this.selectedFilenames.length === this.serverFiles.length
    },
    isIndeterminate () {
      return this.selectedFilenames.length > 0 && this.selectedFilenames.length < this.serverFiles.length
    },
    totalSelectedSize () {
      if (this.selectedFilenames.length === 0) { return '0 B' }
      const selectedSet = new Set(this.selectedFilenames)
      const totalBytes = this.serverFiles
        .filter(f => selectedSet.has(f.filename))
        .reduce((sum, f) => sum + (f.size || 0), 0)
      return this.formatBytes(totalBytes)
    },
    filteredSections () {
      const kw = (this.sectFilter || '').trim().toLowerCase()
      if (!kw) {
        return this.sections
      }
      return this.sections.filter((s) => {
        return (
          (s.段代碼 && s.段代碼.toLowerCase().includes(kw)) ||
          (s.段名稱 && s.段名稱.toLowerCase().includes(kw)) ||
          (s.區名稱 && s.區名稱.toLowerCase().includes(kw)) ||
          (s.區代碼 && s.區代碼.toLowerCase().includes(kw))
        )
      })
    },
    allFilteredSelected () {
      if (this.filteredSections.length === 0) { return false }
      const selectedSet = new Set(this.selectedSectCodes)
      return this.filteredSections.every(s => selectedSet.has(s.段代碼))
    },
    isFilteredIndeterminate () {
      if (this.filteredSections.length === 0) { return false }
      const selectedSet = new Set(this.selectedSectCodes)
      const count = this.filteredSections.filter(s => selectedSet.has(s.段代碼)).length
      return count > 0 && count < this.filteredSections.length
    },
    selectedTotalPlots () {
      const codeSet = new Set(this.selectedSectCodes)
      const sum = this.sections
        .filter(s => codeSet.has(s.段代碼))
        .reduce((acc, cur) => acc + (parseInt(cur.土地標示部筆數, 10) || 0), 0)
      return this.format(sum)
    },
    inputPlaceholder () {
      if (this.tags.length === 0) {
        return '輸入段代碼後 Enter 新增 (例: 0001)'
      }
      return `已選 ${this.tags.length} 個段別 (輸入後 Enter 可再新增)`
    },
    displayedTags () {
      if (this.tagsExpanded || this.tags.length <= 6) {
        return this.tags
      }
      return this.tags.slice(0, 6)
    }
  },
  mounted () {
    this.checkServerFiles()
    this.loadSections()
  },
  methods: {
    validator (tag) {
      return (/^\d{3,4}$/i).test(tag?.trim())
    },
    setPreset (presetTags) {
      this.tags = [...presetTags]
    },
    clean () {
      this.tags = []
      this.links = []
      this.iteration = 0
      this.currentTask = ''
      this.inputTag = ''
      this.tagsExpanded = false
    },
    cleanTags () {
      this.tags = []
      this.inputTag = ''
      this.tagsExpanded = false
    },
    removeTag (tag) {
      const idx = this.tags.indexOf(tag)
      if (idx > -1) {
        this.tags.splice(idx, 1)
      }
    },
    addTagFromInput () {
      const val = (this.inputTag || '').trim()
      if (!val) { return }
      const parts = val.split(/[\s,;]+/).filter(Boolean)
      let addedCount = 0
      parts.forEach((p) => {
        if (this.validator(p) && !this.tags.includes(p)) {
          this.tags.push(p)
          addedCount++
        }
      })
      if (addedCount > 0) {
        this.inputTag = ''
      } else if (parts.some(p => !this.validator(p))) {
        this.warning('段代碼格式須為 3~4 碼數字 (例: 0001)')
      }
    },
    async go () {
      if (this.working) {
        this.warning('資料產製中，請稍候...')
        return
      }
      if (this.tags.length === 0) {
        this.warning('請先輸入或選擇段代碼！')
        return
      }

      const confirmed = await this.confirm(`請確認以段代碼【${this.tags.join(', ')}】產生地籍資料？`)
      if (!confirmed) { return }

      this.links = []
      this.working = true
      this.iteration = 0

      try {
        for (let i = 0; i < EXPORT_CODES.length; i++) {
          const item = EXPORT_CODES[i]
          this.currentTask = `正在產製 ${item.name} (${item.code})...`
          await this.query(item.code)
          this.iteration = i + 1
        }
        if (this.links.length > 0) {
          this.hasServerFiles = true
        }
        this.notify('地籍資料產製完成！', { type: 'success', title: '產製完成' })
      } catch (err) {
        this.$utils.error(err)
        this.warning(`產製過程中斷: ${err.message || err}`)
      } finally {
        this.working = false
        this.currentTask = ''
      }
    },
    async query (code) {
      try {
        const res = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
          type: 'file_data_export',
          code,
          section: this.tags
        })
        let data = res.data
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data.trim())
          } catch (e) {
            this.$utils.error('無法解析回應的 JSON 字串:', data)
          }
        }
        if (this.$utils.statusCheck(data.status)) {
          const filename = data.filename || data.data?.filename
          if (filename) {
            this.links.push({ code, filename })
          }
        } else {
          this.warning(data.message || `產製 ${code} 失敗`)
        }
      } catch (err) {
        this.$utils.error(err)
        this.warning(`產製 ${code} 發生錯誤: ${err.message || err}`)
      }
    },
    async download (link) {
      const url = `${this.$consts.API.FILE.DATA}?code=${encodeURIComponent(link.code)}&filename=${encodeURIComponent(link.filename)}`
      try {
        const res = await this.$axios.get(url, {
          responseType: 'blob'
        })
        FileSaver.saveAs(res.data, link.filename)
        this.notify(`${link.filename} 下載完成`, { type: 'success', title: '下載產製資料' })
      } catch (err) {
        this.$utils.error(err)
        // 備援下載方案：若 blob 請求異常則透過原生 a 標籤點擊下載
        const a = document.createElement('a')
        a.href = url
        a.download = link.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    },
    async downloadZip () {
      if (this.downloading || this.links.length === 0) { return }
      this.downloading = true
      const site = this.site || 'HA'
      const secStr = this.tags.join('_')
      const todayStr = this.$utils.today('tw') || this.$utils.today()
      const zipFilename = `${todayStr}_地籍資料_${site}${secStr ? '_' + secStr : ''}.zip`
      const filenames = this.links.map(item => item.filename)

      try {
        const res = await this.$axios.post(this.$consts.API.FILE.DATA, {
          type: 'zip',
          zip_filename: zipFilename,
          filenames
        }, {
          responseType: 'blob'
        })
        FileSaver.saveAs(res.data, zipFilename)
        this.notify(`${zipFilename} 下載完成`, { type: 'success', title: '全部下載 (ZIP)' })
      } catch (err) {
        this.$utils.error(err)
        // 備援下載方案：若 blob POST 請求異常則透過原生 a 標籤 GET 下載
        const params = new URLSearchParams()
        params.append('type', 'zip')
        params.append('zip_filename', zipFilename)
        params.append('filenames', filenames.join(','))
        const url = `${this.$consts.API.FILE.DATA}?${params.toString()}`
        const a = document.createElement('a')
        a.href = url
        a.download = zipFilename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } finally {
        this.downloading = false
      }
    },
    downloadAll () {
      return this.downloadZip()
    },
    formatBytes (bytes, precision = 1) {
      if (!bytes || bytes <= 0) { return '0 B' }
      const units = ['B', 'KB', 'MB', 'GB']
      const pow = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
      const value = bytes / Math.pow(1024, pow)
      return `${value.toFixed(precision)} ${units[pow]}`
    },
    openCleanModal () {
      if (this.working || this.clearing) { return }
      this.$bvModal.show('export-data-clean-modal')
      this.fetchServerFiles()
    },
    cleanServerFiles () {
      return this.openCleanModal()
    },
    cleanBackendFiles () {
      return this.openCleanModal()
    },
    async fetchServerFiles () {
      this.loadingServerFiles = true
      try {
        const res = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
          type: 'file_data_list'
        })
        let data = res.data
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data.trim())
          } catch (e) {
            this.$utils.error('無法解析回應的 JSON 字串:', data)
          }
        }
        if (this.$utils.statusCheck(data.status)) {
          this.serverFiles = data.data || []
          this.hasServerFiles = this.serverFiles.length > 0
          // 預設全選
          this.selectedFilenames = this.serverFiles.map(f => f.filename)
        } else {
          this.serverFiles = []
          this.hasServerFiles = false
          this.selectedFilenames = []
          this.warning(data.message || '無法取得後端檔案清單', { title: '查詢後端檔案' })
        }
      } catch (err) {
        this.$utils.error(err)
        this.serverFiles = []
        this.hasServerFiles = false
        this.selectedFilenames = []
        this.warning(`讀取後端檔案失敗: ${err.message || err}`, { title: '查詢後端檔案' })
      } finally {
        this.loadingServerFiles = false
      }
    },
    async checkServerFiles () {
      try {
        const res = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
          type: 'file_data_list'
        })
        let data = res.data
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data.trim())
          } catch (e) {
            this.$utils.error('無法解析回應的 JSON 字串:', data)
          }
        }
        if (this.$utils.statusCheck(data.status)) {
          const files = data.data || []
          this.hasServerFiles = files.length > 0
          this.serverFiles = files
        } else {
          this.hasServerFiles = false
        }
      } catch (err) {
        this.$utils.error(err)
        this.hasServerFiles = false
      }
    },
    getDisplayName (link) {
      if (link.code) {
        const found = EXPORT_CODES.find(item => item.code === link.code)
        if (found) { return found.name }
      }
      if (link.filename) {
        const pureName = link.filename.replace(/\.[^/.]+$/, '')
        const parts = pureName.split('_')
        const lastPart = parts[parts.length - 1]
        if (lastPart) { return lastPart }
      }
      return link.filename || link.code
    },
    isSelected (file) {
      return this.selectedFilenames.includes(file.filename)
    },
    toggleFileSelection (file) {
      const idx = this.selectedFilenames.indexOf(file.filename)
      if (idx > -1) {
        this.selectedFilenames.splice(idx, 1)
      } else {
        this.selectedFilenames.push(file.filename)
      }
    },
    toggleSelectAll (checked) {
      if (checked) {
        this.selectedFilenames = this.serverFiles.map(f => f.filename)
      } else {
        this.selectedFilenames = []
      }
    },
    async downloadSingleServerFile (file) {
      const url = `${this.$consts.API.FILE.DATA}?filename=${encodeURIComponent(file.filename)}`
      try {
        const res = await this.$axios.get(url, {
          responseType: 'blob'
        })
        FileSaver.saveAs(res.data, file.filename)
        this.notify(`${file.filename} 下載完成`, { type: 'success', title: '下載檔案' })
      } catch (err) {
        this.$utils.error(err)
        const a = document.createElement('a')
        a.href = url
        a.download = file.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    },
    async downloadModalZip () {
      if (this.modalZipping || this.selectedFilenames.length === 0) { return }
      this.modalZipping = true
      const site = this.site || 'HA'
      const todayStr = this.$utils.today('tw') || this.$utils.today()
      const zipFilename = `${todayStr}_地籍資料匯出_${site}.zip`
      const filenames = [...this.selectedFilenames]

      try {
        const res = await this.$axios.post(this.$consts.API.FILE.DATA, {
          type: 'zip',
          zip_filename: zipFilename,
          filenames
        }, {
          responseType: 'blob'
        })
        FileSaver.saveAs(res.data, zipFilename)
        this.notify(`${zipFilename} 下載完成`, { type: 'success', title: '全部下載 (ZIP)' })
      } catch (err) {
        this.$utils.error(err)
        const params = new URLSearchParams()
        params.append('type', 'zip')
        params.append('zip_filename', zipFilename)
        params.append('filenames', filenames.join(','))
        const url = `${this.$consts.API.FILE.DATA}?${params.toString()}`
        const a = document.createElement('a')
        a.href = url
        a.download = zipFilename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } finally {
        this.modalZipping = false
      }
    },
    async doCleanServerFiles () {
      if (this.clearing || this.selectedFilenames.length === 0) { return }
      const count = this.selectedFilenames.length

      const confirmed = await this.confirm(`確定要永久刪除後端 ${count} 個產出檔案嗎？此動作無法還原！`)
      if (!confirmed) { return }

      this.clearing = true
      try {
        const isAll = this.selectedFilenames.length === this.serverFiles.length
        const res = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
          type: 'file_data_clean',
          filenames: isAll ? [] : this.selectedFilenames,
          all: isAll
        })
        let data = res.data
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data.trim())
          } catch (e) {
            this.$utils.error('無法解析回應的 JSON 字串:', data)
          }
        }
        if (this.$utils.statusCheck(data.status)) {
          this.notify(data.message || `成功清理 ${count} 個後端檔案！`, { type: 'success', title: '清理檔案' })
          const deletedSet = new Set(data.deleted_files || this.selectedFilenames)
          this.links = this.links.filter(link => !deletedSet.has(link.filename))

          await this.fetchServerFiles()
          this.hasServerFiles = this.serverFiles.length > 0
          if (this.serverFiles.length === 0) {
            this.$bvModal.hide('export-data-clean-modal')
          }
        } else {
          this.warning(data.message || '清理失敗', { title: '清理檔案' })
        }
      } catch (err) {
        this.$utils.error(err)
        this.warning(`清理後端檔案發生錯誤: ${err.message || err}`, { title: '清理檔案' })
      } finally {
        this.clearing = false
      }
    },
    async deleteFile (link, idx) {
      if (this.clearing || this.working) { return }
      const confirmed = await this.confirm(`確定刪除後端檔案【${link.filename}】？`)
      if (!confirmed) { return }

      this.clearing = true
      try {
        const res = await this.$axios.post(this.$consts.API.FILE.EXPORT, {
          type: 'file_data_clean',
          filenames: [link.filename]
        })
        let data = res.data
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data.trim())
          } catch (e) {
            this.$utils.error('無法解析回應的 JSON 字串:', data)
          }
        }
        if (this.$utils.statusCheck(data.status)) {
          this.notify(`已刪除 ${link.filename}`, { type: 'success', title: '刪除檔案' })
          this.links.splice(idx, 1)
        } else {
          this.warning(data.message || '刪除失敗', { title: '刪除檔案' })
        }
      } catch (err) {
        this.$utils.error(err)
        this.warning(`刪除檔案失敗: ${err.message || err}`)
      } finally {
        this.clearing = false
      }
    },
    format (val) {
      return val ? String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0'
    },
    areaPing (val) {
      return val ? this.format((Number(val) * 3025 / 10000).toFixed(2)) + ' 坪' : '0 坪'
    },
    areaM2 (val) {
      return val ? this.format(Number(val).toFixed(2)) + ' ㎡' : '0 ㎡'
    },
    getSectBadgeText (code) {
      const found = this.sections.find(s => s.段代碼 === code)
      return found ? `${code} ${found.段名稱}` : code
    },
    async loadSections (force = false) {
      this.loadingSections = true
      try {
        if (!force) {
          const cached = await this.getCache('ralid_sections')
          if (cached && Array.isArray(cached) && cached.length > 0) {
            this.sections = cached
            return
          }
        }
        const { data } = await this.$axios.post(this.$consts.API.JSON.QUERY, {
          type: 'ralid'
        })
        if (this.$utils.statusCheck(data.status)) {
          this.sections = data.raw || []
          await this.setCache('ralid_sections', this.sections, 24 * 60 * 60 * 1000)
        } else {
          this.warning(data.message || '無法取得轄區段別資料')
        }
      } catch (err) {
        this.$utils.error(err)
        this.warning(`無法讀取轄區段別: ${err.message || err}`)
      } finally {
        this.loadingSections = false
      }
    },
    openSectSelectModal () {
      if (this.working) { return }
      this.selectedSectCodes = [...this.tags]
      this.sectFilter = ''
      this.$bvModal.show('export-data-sect-modal')
      if (this.sections.length === 0) {
        this.loadSections()
      }
    },
    applySectSelection () {
      this.tags = [...this.selectedSectCodes]
      this.$bvModal.hide('export-data-sect-modal')
    },
    toggleSectRow (item) {
      if (!item || !item.段代碼) { return }
      const code = item.段代碼
      const idx = this.selectedSectCodes.indexOf(code)
      if (idx > -1) {
        this.selectedSectCodes.splice(idx, 1)
      } else {
        this.selectedSectCodes.push(code)
      }
    },
    toggleAllFilteredSects (checked) {
      const currentSet = new Set(this.selectedSectCodes)
      if (checked) {
        this.filteredSections.forEach((s) => {
          if (s.段代碼) {
            currentSet.add(s.段代碼)
          }
        })
      } else {
        this.filteredSections.forEach((s) => {
          if (s.段代碼) {
            currentSet.delete(s.段代碼)
          }
        })
      }
      this.selectedSectCodes = Array.from(currentSet)
    },
    clearAllSelectedSects () {
      this.selectedSectCodes = []
    },
    removeSelectedSect (code) {
      const idx = this.selectedSectCodes.indexOf(code)
      if (idx > -1) {
        this.selectedSectCodes.splice(idx, 1)
      }
    },
    sectRowClass (item) {
      if (!item || !item.段代碼) { return 'cursor-pointer' }
      return this.selectedSectCodes.includes(item.段代碼) ? 'table-primary font-weight-bold cursor-pointer' : 'cursor-pointer'
    }
  }
}
</script>

<style lang="scss" scoped>
.clean-modal-files-list {
  max-height: 380px;
  overflow-y: auto;
}
.sect-modal-table-container {
  max-height: 420px;
  overflow-y: auto;
}
.selected-tags-box {
  max-height: 110px;
  overflow-y: auto;
}
.tags-scrollable {
  max-height: 120px;
  overflow-y: auto;
}
.tags-collapsed {
  max-height: 72px;
  overflow: hidden;
}
.cursor-pointer {
  cursor: pointer;
}
.input-group-height-hack,
.input-group {
  align-items: stretch;

  &::v-deep .input-group-text,
  &::v-deep .form-control,
  &::v-deep .btn {
    height: 33px !important;
  }
}
</style>
